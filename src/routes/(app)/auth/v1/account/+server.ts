import type { RequestEvent } from './$types';

export async function POST(event: RequestEvent) {
	const formData = await event.request.formData();
	const username = formData.get('username') as string;
	if (!username) return new Response(null);

	const repoResp = await fetch(
		`https://raw.githubusercontent.com/${username}/${username}/main/README.md`
	);
	const profile = await repoResp.text();
	return new Response(profile);
}
