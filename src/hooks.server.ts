import { setGlobalDispatcher, EnvHttpProxyAgent } from 'undici';
import { client_login as discord_bot_login } from './lib/discord-bot';
import { ProxyAgent } from 'proxy-agent';
import https from 'https';
import http from 'http';
import { startDnsServer } from '$lib/dns/server';

// Configure global http proxy if proxy environment variables are set.
if (process.env['HTTP_PROXY'] || process.env['HTTPS_PROXY'] || process.env['NO_PROXY']) {
	const agent = new ProxyAgent();
	https.globalAgent = agent;
	http.globalAgent = agent;
	setGlobalDispatcher(new EnvHttpProxyAgent());
}

startDnsServer();
discord_bot_login();
