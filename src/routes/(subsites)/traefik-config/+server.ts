import { env } from '$env/dynamic/private';
import { env as pubenv } from '$env/dynamic/public';
// import { backendFetch } from '$lib/backend';
import { checkResponse } from '$lib/utils';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const resp = await backendFetch(fetch, '/domains');
		await checkResponse(resp);
		const customDomains: string[] = await resp.json();

		const routers: {
			[key: string]: { rule: string; tls?: { certResolver: string }; service: string };
		} = {};
		for (const domain of customDomains) {
			const routerName = `${env.TRAEFIK_CONFIG_NAMESPACE}-rtr-${domain.replaceAll('.', '-')}`;
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
		console.error('Error loading usernames while creating traefik config', e);
		return json({});
	}
};
