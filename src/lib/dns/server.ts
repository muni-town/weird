import { env } from '$env/dynamic/private';
import { env as pubenv } from '$env/dynamic/public';
import { createClient } from 'redis';
import dns, { type AnyRecord } from 'node:dns';

import * as server from 'dinodns/common/server';
import * as network from 'dinodns/common/network';
import type { SupportedAnswer } from 'dinodns/types/dns';
import { DefaultStore } from 'dinodns/plugins/storage';
import { dev } from '$app/environment';
import { AUTHORITATIVE_ANSWER, type SoaAnswer } from 'dns-packet';
import { z } from 'zod';

const REDIS_USER_PREFIX = 'weird:users:';
const REDIS_DNS_RECORD_PREFIX = 'weird:dns:records:';

const redisDnsRecordSchema = z.array(
	z.object({
		ttl: z.optional(z.number().int().min(0)),
		data: z.string()
	})
);

/** Helper function to escape a string so we can put it literally into a regex without some
 * of it's characters being interpreted as regex special characters. */
const escapeStringForEmbeddingInRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const WEIRD_HOST_TXT_RECORD_REGEX = new RegExp(
	`^_weird\\.([^\\.]*)\\.${escapeStringForEmbeddingInRegex(pubenv.PUBLIC_USER_DOMAIN_PARENT.split(':')[0])}$`
);
const WEIRD_HOST_A_RECORD_REGEX = new RegExp(
	`^([^\\.]*)\\.${escapeStringForEmbeddingInRegex(pubenv.PUBLIC_USER_DOMAIN_PARENT.split(':')[0])}$`
);

const DNS_PORT = parseInt(env.DNS_PORT || '53');
const APP_IPS = env.APP_IPS.split(',');
const DNS_MASTER = env.DNS_SOA_MASTER;
const soaSplit = env.DNS_SOA_EMAIL.split('@');
const DNS_EMAIL = soaSplit[0].replace('.', '\\.') + '.' + soaSplit[1];
const DNS_NAMESERVERS = env.DNS_NAMESERVERS.split(',');
const ALLOWED_DOMAINS = env.DNS_ALLOWED_DOMAINS.split(',');
const matchesAllowedDomains = (name: string): boolean => {
	for (const domain of ALLOWED_DOMAINS) {
		if (name == domain || name.endsWith(`.${domain}`)) return true;
	}

	return false;
};
const makeSoaAnswer = (name: string): SoaAnswer => {
	return {
		name: name.split('.').slice(-2).join('.'),
		type: 'SOA',
		data: {
			mname: DNS_MASTER,
			rname: DNS_EMAIL,
			serial: 1
		}
	};
};
const makeNsAnswers = (name: string): SupportedAnswer[] => {
	return DNS_NAMESERVERS.map(
		(ns) =>
			({
				name: name.split('.').slice(-2).join('.'),
				type: 'NS',
				data: ns
			}) as SupportedAnswer
	);
};

/**
 * Start the Weird DNS server and return the `Redis` store with the mapping from username
 */
export async function startDnsServer() {
	const redis = await createClient({ url: env.REDIS_URL })
		.on('error', (err) => console.error('Redis client error', err))
		.connect();

	const s = new server.DefaultServer({
		networks: [
			new network.DNSOverTCP('0.0.0.0', DNS_PORT),
			new network.DNSOverUDP('0.0.0.0', DNS_PORT)
		]
	});

	// Set all answers to authoritative by default
	s.use(async (_req, res, next) => {
		if (res.finished) return next();

		res.packet.flags = res.packet.flags | AUTHORITATIVE_ANSWER;
		next();
	});

	// Return a not-implemented error if there are more than one question in the request.
	s.use(async (req, res, next) => {
		if (res.finished) return next();

		if (req.packet.questions.length > 1) {
			console.warn('Returning not implemented for DNS queries with multiple questions.');
			res.errors.notImplemented();
		} else {
			next();
		}
	});

	// Add an A record that will direct web traffic to the app
	const staticRecords = new DefaultStore();
	const appDomain = pubenv.PUBLIC_DOMAIN.split(':')[0];
	staticRecords.set(appDomain, 'A', APP_IPS);
	s.use(staticRecords.handler);

	// Reject queries for non-allowed domains ( when not in development )
	s.use(async (req, res, next) => {
		if (res.finished) return next();
		const name = req.packet.questions[0].name;
		if (!dev) {
			if (!matchesAllowedDomains(name)) res.errors.nxDomain();
		}
		next();
	});

	// Return SOA responses
	s.use(async (req, res, next) => {
		if (res.finished) return next();

		const question = req.packet.questions[0];
		if (question.type == 'SOA') {
			res.packet.flags = res.packet.flags;
			return res.answer(makeSoaAnswer(question.name));
		}

		next();
	});

	// Return NS responses
	s.use(async (req, res, next) => {
		if (res.finished) return next();

		const question = req.packet.questions[0];
		if (question.type == 'NS') {
			res.packet.flags = res.packet.flags;
			return res.answer(makeNsAnswers(question.name));
		}

		next();
	});

	// Resolve records stored in Redis
	s.use(async (req, res, next) => {
		if (res.finished) return next();

		const question = req.packet.questions[0];
		const { type, name } = question;
		let record;
		// If this is an A record query, we also need to check for CNAME
		// records.
		if (type == 'A') {
			const redisKey = REDIS_DNS_RECORD_PREFIX + 'CNAME:' + name;
			record = await redis.get(redisKey);
			if (record) {
				try {
					const parsed = redisDnsRecordSchema.parse(JSON.parse(record));
					req.packet.answers = [
						...req.packet.answers,
						...parsed.map(
							(r) =>
								({
									name,
									type: 'CNAME',
									data: r.data,
									ttl: r.ttl
								}) as SupportedAnswer
						)
					];
					await Promise.all(
						parsed.map(
							(record) =>
								new Promise((done) => {
									dns.resolve(record.data, (err, addrs) => {
										console.error('Error looking up A record for cname', record.data, err);
										if (err) return done(null);
										res.packet.answers = [
											...req.packet.answers,
											...addrs.map(
												(ip) =>
													({
														name: record.data,
														type: 'A',
														data: ip
													}) as SupportedAnswer
											)
										];
										done(null);
									});
								})
						)
					);
					res.resolve();
				} catch (e) {
					console.warn('Error parsing DNS record from redis:', redisKey, record, e);
				}
			} else {
				// If there is not a CNAME record at for this domain, check for A records
				const redisKey = REDIS_DNS_RECORD_PREFIX + type + ':' + name;
				record = await redis.get(redisKey);
				if (record) {
					try {
						const parsed = redisDnsRecordSchema.parse(JSON.parse(record));
						res.answer(
							parsed.map(
								(record) =>
									({
										name,
										type,
										data: record.data,
										ttl: record.ttl
									}) as SupportedAnswer
							)
						);
					} catch (e) {
						console.warn('Error parsing DNS record from redis:', redisKey, record, e);
					}
				}
			}
		}

		next();
	});

	// Resolve records for registered users
	s.use(async (req, res, next) => {
		if (res.finished) return next();

		const results = (await Promise.all(
			req.packet.questions.map(
				(question) =>
					new Promise(async (ret) => {
						const returnAnswers = (v: any) => {
							res.packet.flags = res.packet.flags | AUTHORITATIVE_ANSWER;
							ret(v);
						};
						const { type, name } = question;
						switch (type) {
							case 'TXT':
								const txtUsername = name.match(WEIRD_HOST_TXT_RECORD_REGEX)?.[1];
								if (!txtUsername) return returnAnswers(null);
								const pubkey = await redis.get(REDIS_USER_PREFIX + txtUsername);
								if (!pubkey) return returnAnswers(null);
								returnAnswers([
									{
										name,
										type,
										data: pubkey,
										ttl: 0
									}
								]);
								break;
							case 'A':
								const aUsername = name.match(WEIRD_HOST_A_RECORD_REGEX)?.[1];
								if (!aUsername) return returnAnswers(null);

								// TODO: eventually we only want to return records for users that exist
								// const exists = await redis.exists(REDIS_USER_PREFIX + aUsername);
								// if (!exists) return returnAnswers(null);

								returnAnswers(
									APP_IPS.map((ip) => ({
										name,
										type,
										data: ip,
										ttl: 300
									}))
								);
								break;
							default:
								returnAnswers(null);
						}
					})
			)
		)) as (SupportedAnswer[] | null)[];

		// Return answers
		const filtered = results
			.filter((x) => !!x)
			.map((x) => x as unknown as SupportedAnswer)
			.flat();
		if (filtered.length > 0) res.answer(filtered);

		next();
	});

	// If we're in development, we want to set ourselves as the DNS server for everything and
	// forward all questions we don't have an answer for to the default DNS servers.
	if (dev) {
		const defaultDnsServers = dns.getServers();
		const localServer = `127.0.0.1:${DNS_PORT}`;
		dns.setServers([localServer]);

		// Add middleware that will respond with forwarded requests
		s.use(async (req, res, next) => {
			// If there's already an answer, continue
			if (res.finished) return next();

			const resolver = new dns.Resolver();
			resolver.setServers(defaultDnsServers);

			// Collect answers asynchronously
			const results = (await Promise.all(
				req.packet.questions.map(
					(question) =>
						new Promise((returnAnswers) => {
							const { type, name } = question;
							switch (type) {
								case 'TXT':
								case 'A':
									resolver.resolve(name, type, (err, ans) => {
										if (!err) {
											returnAnswers(
												(ans as AnyRecord[]).map((answer) => ({
													name,
													type,
													data: answer,
													ttl: 300
												}))
											);
										} else {
											returnAnswers([]);
										}
									});
									break;
								case 'NS':
									// Pretend to be the authoritative nameserver for everything so that resolving users
									// by the authoritative namerserver always resolves locally during dev.
									returnAnswers([
										{
											name,
											type,
											data: localServer,
											ttl: 300
										}
									]);
								default:
									returnAnswers(null);
							}
						})
				)
			)) as (SupportedAnswer[] | null)[];

			// Return answers
			res.answer(
				results
					.filter((x) => !!x)
					.map((x) => x as unknown as SupportedAnswer)
					.flat()
			);

			next();
		});
	}

	// Return noerror if nothing else has responded yet.
	//
	// An earlier middleware will reject the record with an NXDOMAIN error if the domain doesn't match.
	s.use(async (req, res, next) => {
		const question = req.packet.questions[0];
		if (res.packet.answers.length == 0) {
			// Comply with RFC 2308 Section 2.2 by returning an SOA record when there are no other
			// answers.
			res.packet.raw.authorities = [makeSoaAnswer(question.name)];
		} else if (question.type != 'NS' && question.type != 'SOA') {
			res.packet.raw.authorities = makeNsAnswers(question.name);
		}

		if (!res.finished) {
			res.resolve();
		}
		next();
	});

	// Start the DNS server
	s.start(() => {
		console.log('Started weird dns server');
	});

	return redis;
}
