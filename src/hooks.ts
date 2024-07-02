import { env } from '$env/dynamic/public';
import type { Reroute } from '@sveltejs/kit';

const subdomainRegex = new RegExp(
	`(.*)\.${env.PUBLIC_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
);

export const reroute: Reroute = ({ url }) => {
	console.log(url.href)
	if (url.host === env.PUBLIC_DOMAIN) {
		return url.pathname;
	}

	let username = url.host.match(subdomainRegex)?.[1];
	if (!username) {
		throw 'Invalid domain';
	}

	return `/subsite/${username}`;
};
