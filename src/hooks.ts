import { env } from '$env/dynamic/public';
import type { Reroute } from '@sveltejs/kit';

const subdomainRegex = new RegExp(
	`(.*)\.${env.PUBLIC_USER_DOMAIN_PARENT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
);

/** This is a regular expression that will match on anything in the format of `/[username]/avatar`
 * and is used to allow requests to avatars through on user pubpages without going cross-origin. */
const avatarRegexp = new RegExp(/\/([^\/]*)\/avatar/);

export const reroute: Reroute = ({ url }) => {
	if (
		url.host == env.PUBLIC_DOMAIN ||
		url.pathname.startsWith('/__internal__/dns-challenge')
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
	} else if (url.pathname.match(avatarRegexp)) {
		return url.pathname;
	}

	throw 'Invalid domain';
};
