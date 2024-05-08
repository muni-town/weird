// import { env } from '$env/dynamic/private';
// import type { Handle } from '@sveltejs/kit';

// export const handle: Handle = async ({ event, resolve }) => {
//     // console.log(event);
// 	// if (event.url.pathname.startsWith('/auth')) {
// 	// 	const rauthyUrl = new URL(env.RAUTHY_URL);
// 	// 	const url = new URL(event.request.url);
// 	// 	url.host = rauthyUrl.host;
// 	// 	url.protocol = rauthyUrl.protocol;
//     //     console.log(url);

// 	// 	const resp = await fetch(url, {
// 	// 		body: event.request.body,
// 	// 		method: event.request.method,
// 	// 		headers: event.request.headers
// 	// 	});
// 	// 	return resp;
// 	// }

// 	const response = await resolve(event);
// 	return response;
// };
