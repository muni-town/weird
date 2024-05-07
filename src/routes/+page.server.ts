import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const key_info = JSON.parse(
		await (
			await fetch(`${env.RAUTHY_URL}/auth/v1/api_keys/dev_key/test`, {
				headers: new Headers({ Authorization: `API-Key dev_key$${env.RAUTHY_TOKEN}` })
			})
		).text()
	);

	return { key_info };
};
