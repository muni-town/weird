import { RequestHandler, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	return json({
		associatedApplications: [
			{
				applicationId: env.MICROSOFT_APPLICATION_ID
			}
		]
	});
};
