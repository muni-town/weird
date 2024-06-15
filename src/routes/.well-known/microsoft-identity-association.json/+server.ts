import { RequestHandler } from '@sveltejs/kit';
import { env } from "$env/dynamic/private"

export const GET: RequestHandler = async () => {
	return new Response(
		JSON.stringify({
			associatedApplications: [
				{
					applicationId: env.MICROSOFT_APPLICATION_ID
				}
			]
		})
	);
};
