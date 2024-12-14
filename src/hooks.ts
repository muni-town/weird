import { env } from '$env/dynamic/public';
import type { Reroute } from '@sveltejs/kit';

export const reroute: Reroute = ({ url }) => {
	// Check for cases where we route the URL without modification
	if (
		// When the host is the default public domain
		url.host == env.PUBLIC_DOMAIN
	) {
		return url.pathname;
	}

	// If this is a polar webhook.
	if (
		url.host == env.PUBLIC_POLAR_WEBHOOK_DOMAIN &&
		url.pathname == '/__internal__/polar-webhook'
	) {
		return '/__internal__/polar-webhook';
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

	// Route to a subsite page
	return `/subsite/${url.host}${url.pathname}`;
};
