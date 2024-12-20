import { env } from '$env/dynamic/private';
import { env as pubenv } from '$env/dynamic/public';
import { usernames } from '$lib/usernames/index';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const domains: Set<string> = new Set();
		domains.add('*.' + pubenv.PUBLIC_USER_DOMAIN_PARENT);
		for await (const user of usernames.list()) {
			if (user.username) {
				if (!user.username.endsWith(pubenv.PUBLIC_USER_DOMAIN_PARENT)) {
					domains.add(user.username);
				}
			}
		}

		const routers: {
			[key: string]: { rule: string; tls?: { certResolver: string }; service: string };
		} = {};
		for (const domain of domains) {
			const routerName = `${env.TRAEFIK_CONFIG_NAMESPACE}-rtr-${domain.replaceAll(/[^a-zA-Z0-9]/g, '-')}`;
			routers[routerName] = {
				rule: `Host(\`${domain}\`)`,
				service: env.TRAEFIK_CONFIG_SERVICE_NAME,
				tls: {
					certResolver: 'letsencrypt'
				}
			};
		}

		return json({
			http: {
				routers
			}
		});
	} catch (e) {
		console.error('Error loading usernames domains while creating traefik config', e);
		return json({});
	}
};
