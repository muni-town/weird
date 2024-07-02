import { env as pubenv } from '$env/dynamic/public';
import {env as privenv } from "$env/dynamic/private";
import type { Reroute } from '@sveltejs/kit';

const subdomainRegex = new RegExp(
	`(.*)\.${pubenv.PUBLIC_DOMAIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
);

export const reroute: Reroute = ({ url }) => {
	if (url.host === pubenv.PUBLIC_DOMAIN) {
		return url.pathname;
	}

	if (url.host == privenv.TRAEFIK_CONFIG_HOST) {
		return '/traefik-config'
	}

	let username = url.host.match(subdomainRegex)?.[1];
	if (!username) {
		throw 'Invalid domain';
	}

	return `/subsite/${username}`;
};
