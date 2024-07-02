import { env } from '$env/dynamic/public';
import type { Reroute } from '@sveltejs/kit';

const subdomainRegex = new RegExp(
	`(.*)\.${env.PUBLIC_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
);

export const reroute: Reroute = ({ url }) => {
	if (url.host === env.PUBLIC_DOMAIN) {
		return url.pathname;
	}

	if (url.host == env.PUBLIC_TRAEFIK_CONFIG_HOST) {
		return '/traefik-config';
	}

	let username = url.host.match(subdomainRegex)?.[1];
	if (!username) {
		throw 'Invalid domain';
	}

	if (url.pathname == '/' || url.pathname == '') {
		return `/subsite/${username}`;
	} else if (url.pathname.startsWith(`/u/${username}`)) {
		return url.pathname;
	}
};
