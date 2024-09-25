import { env } from '$env/dynamic/public';
import type { Reroute } from '@sveltejs/kit';

/** Regex that will match on any subdomain of the PUBLIC_USER_DOMAIN_PARENT */
const subdomainRegex = new RegExp(
	// The first section `(.*)\.` just matches anything followed by a dot. That section will be the
	// subodmain and the dot after it.
	//
	// The second section inserts the public user domain, but it replaces any of the regex special
	// characters, such as the periods between domain sections, with a regex escape sequence so that
	// it is taken literally. Basically we need to escape the environment variable so that we can
	// stick it in a regex to match literally, without accidentally injecting regex control
	// characters.
	`(.*)\.${env.PUBLIC_USER_DOMAIN_PARENT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
);

export const reroute: Reroute = ({ url }) => {
	// Check for cases where we route the URL without modification
	if (
		// When the host is the default public domain
		url.host == env.PUBLIC_DOMAIN ||
		// When request is a DNS challenge
		url.pathname.startsWith('/__internal__/dns-challenge')
	) {
		return url.pathname;
	}

	// If the host is our traefik config host
	if (url.host == env.PUBLIC_TRAEFIK_CONFIG_HOST) {
		// If it is a request to the root
		if (url.pathname == '/') {
			// Return our traefik config
			return '/__internal__/traefik-config';
		} else {
			// Otherwise route to a page that doesn't exist to create a 404 response
			return '/__internal__/page/does/not/exist/404';
		}
	}

	// If this is a page on any other host, then assume it is a user subsite / custom domain.
	let usernameSubdomain = url.host.match(subdomainRegex)?.[1];
	const subsite = usernameSubdomain ? usernameSubdomain : url.host;

	// Route to a subsite page
	return `/subsite/${subsite}${url.pathname}`;
};
