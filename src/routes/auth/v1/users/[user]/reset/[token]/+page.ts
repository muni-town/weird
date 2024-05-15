import type { PageLoad } from './$types';

export const load: PageLoad = ({ params, url }) => {
	// const resetInitResp = fetch(RAUTHY_URL + '')

	return { params, url };
};
