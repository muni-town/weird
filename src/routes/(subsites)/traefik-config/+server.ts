import { env } from '$env/dynamic/private';
import { listDomains } from '$lib/leaf/profile';
import { json, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
	try {
		const customDomains: string[] = await listDomains();

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
		console.error('Error loading usernames domains while creating traefik config', e);
		return json({});
	}
};
