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
import { RCode } from 'dinodns/common/core/utils';

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
const VALID_DOMAIN_REGEX =
	/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/i;

const DNS_PORT = parseInt(env.DNS_PORT || '53');
const APP_IPS = env.APP_IPS.split(',');
const DNS_MASTER = env.DNS_SOA_MASTER;
const soaSplit = env.DNS_SOA_EMAIL.split('@');
const DNS_EMAIL = soaSplit[0].replace('.', '\\.') + '.' + soaSplit[1];
const DNS_NAMESERVERS = env.DNS_NAMESERVERS.split(',');
const ALLOWED_DOMAINS = env.DNS_ALLOWED_DOMAINS.toLowerCase().split(',');
const DNS_TTL = parseInt(env.DNS_TTL || '300');
const DNS_LOG_VERBOSE =
	!!env.DNS_LOG_VERBOSE && env.DNS_LOG_VERBOSE != '0' && env.DNS_LOG_VERBOSE != 'false';
const matchesAllowedDomains = (name: string): boolean => {
	const n = name.toLowerCase();
	for (const domain of ALLOWED_DOMAINS) {
		if (n == domain || n.endsWith(`.${domain}`)) return true;
	}

	return false;
};
const makeNsAnswers = (name: string): SupportedAnswer[] => {
	return DNS_NAMESERVERS.map(
		(ns) =>
			({
				name: name.split('.').slice(-2).join('.'),
				type: 'NS',
				data: ns,
				ttl: DNS_TTL
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

	const makeSoaAnswer = async (name: string): Promise<SoaAnswer> => {
		const serial = await redis.get('weird:dns:serial');
		return {
			name: name.split('.').slice(-2).join('.'),
			type: 'SOA',
			data: {
				mname: DNS_MASTER,
				rname: DNS_EMAIL,
				// TODO: find way to update DNS serial automatically every time DNS resolution may
				// change.
				serial: (serial && parseInt(serial)) || (Date.now() / 1000 / 60 / 60 / 24) * 99,
				refresh: DNS_TTL * 4,
				retry: DNS_TTL * 4,
				expire: 86400, // One day
				minimum: DNS_TTL * 4
			},
			ttl: DNS_TTL
		};
	};

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

	if (DNS_LOG_VERBOSE) {
		s.use(async (req, _res, next) => {
			console.log('DNS Request:', req.packet.questions);
			next();
		});
	}

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
	s.use(async (req, res, next) => {
		if (res.finished) return next();
		const question = req.packet.questions[0];

		if (question.name == pubenv.PUBLIC_DOMAIN.split(':')[0] && question.type == 'A') {
			res.answer(
				APP_IPS.map((ip) => ({
					name: question.name,
					type: 'A',
					data: ip,
					ttl: DNS_TTL
				}))
			);
		}

		next();
	});

	// Reject queries that are not valid domain names
	s.use(async (req, res, next) => {
		if (res.finished) return next();
		const name = req.packet.questions[0].name;
		if (!name.match(VALID_DOMAIN_REGEX)) {
			res.errors.refused();
		}
		next();
	});

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
			return res.answer(await makeSoaAnswer(question.name));
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
		const isApex = name.split('.').length == 2;

		const resolveFromRedis = async () => {
			// If there is not a CNAME record at for this domain, check for A records
			const redisKey = REDIS_DNS_RECORD_PREFIX + type + ':' + name.toLowerCase();
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
		};

		let record;
		// If this is an A record query, we also need to check for CNAME
		// records.
		if (type == 'A') {
			const redisKey = REDIS_DNS_RECORD_PREFIX + 'CNAME:' + name.toLowerCase();
			record = await redis.get(redisKey);
			if (record) {
				try {
					const parsed = redisDnsRecordSchema.parse(JSON.parse(record));
					// If this is an apex, do cname flattening by resolving it to A records
					if (isApex) {
						await Promise.all(
							parsed.map(
								(record) =>
									new Promise((done) => {
										dns.resolve(record.data, (err, addrs) => {
											if (err) {
												console.error('Error looking up A record for CNAME', record.data, err);
												return done(null);
											}
											res.packet.answers = [
												...req.packet.answers,
												...addrs.map(
													(ip) =>
														({
															name: question.name,
															type: 'A',
															data: ip,
															ttl: DNS_TTL
														}) as SupportedAnswer
												)
											];
											done(null);
										});
									})
							)
						);
						res.resolve();
						return next();

						// If this is not an apex
					} else {
						res.answer(
							parsed.map(
								(r) =>
									({
										name,
										type: 'CNAME',
										data: r.data,
										ttl: r.ttl
									}) as SupportedAnswer
							)
						);
						return next();
					}
				} catch (e) {
					console.warn('Error parsing DNS record from redis:', redisKey, record, e);
				}
			} else {
				resolveFromRedis();
			}
		} else {
			resolveFromRedis();
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
										ttl: DNS_TTL
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
													ttl: DNS_TTL
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
											ttl: DNS_TTL
										}
									]);
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
			if (filtered.length > 0) {
				res.answer(filtered);
			} else {
				res.errors.nxDomain();
			}

			next();
		});
	}

	// Return noerror if nothing else has responded yet.
	//
	// An earlier middleware will reject the record with an NXDOMAIN error if the domain doesn't match.
	s.use(async (req, res, next) => {
		if (res.finished) return next();

		const question = req.packet.questions[0];

		// If the response is not an error
		if (((res.packet.raw.flags || 0) & RCode.NO_ERROR) == RCode.NO_ERROR) {
			// If there are no answers
			if (res.packet.answers.length == 0) {
				// Comply with RFC 2308 Section 2.2 by returning an SOA record when there are no other
				// answers.
				res.packet.raw.authorities = [await makeSoaAnswer(question.name)];
				// If the answer should be supplemented with the NS authority records
			} else if (question.type != 'NS' && question.type != 'SOA') {
				res.packet.raw.authorities = makeNsAnswers(question.name);
			}
		}

		res.resolve();

		next();
	});

	if (DNS_LOG_VERBOSE) {
		s.use(async (req, res, next) => {
			const rcode = res.packet.flags & 0xf;
			let rcodeStr = 'UNKNOWN';
			switch (rcode) {
				case RCode.FORMAT_ERROR:
					rcodeStr = 'FORMAT_ERROR';
					break;
				case RCode.NO_ERROR:
					rcodeStr = 'NO_ERROR';
					break;
				case RCode.REFUSED:
					rcodeStr = 'REFUSED';
					break;
				case RCode.NX_DOMAIN:
					rcodeStr = 'NX_DOMAIN';
					break;
				case RCode.SERVER_FAILURE:
					rcodeStr = 'SERVER_FAILURE';
					break;
				case RCode.NOT_IMPLEMENTED:
					rcodeStr = 'NOT_IMPLEMENTED';
					break;
			}

			console.log('DNS Response:', {
				rcode: rcodeStr,
				questions: req.packet.questions,
				answers: res.packet.answers,
				authorities: res.packet.raw.authorities,
				additionals: res.packet.additionals
			});
			next();
		});
	}

	// Start the DNS server
	s.start(() => {
		console.log('Started weird dns server');
	});

	return redis;
}
