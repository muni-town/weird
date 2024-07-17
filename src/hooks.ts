import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import type { Reroute } from '@sveltejs/kit';

const subdomainRegex = new RegExp(
	`(.*)\.${env.PUBLIC_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
);

export const reroute: Reroute = ({ url }) => {
	if (
		url.host == env.PUBLIC_DOMAIN ||
		url.pathname.startsWith('/dns-challenge') ||
		url.pathname.startsWith('/pubpage-auth-callback')
	) {
		return url.pathname;
	}

	if (url.host == env.PUBLIC_TRAEFIK_CONFIG_HOST) {
		return '/traefik-config';
	}

	if (url.pathname == '/' || url.pathname == '') {
		let usernameSubdomain = url.host.match(subdomainRegex)?.[1];
		const subsite = usernameSubdomain ? usernameSubdomain : url.host;
		return `/subsite/${subsite}`;
	} else if (url.pathname.startsWith(`/u/`)) {
		return url.pathname;
	}

	throw 'Invalid domain';
};
