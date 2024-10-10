import { leafClient } from '$lib/leaf';
import { getSession } from '$lib/rauthy/server';
import { error, type RequestHandler } from '@sveltejs/kit';
import { borshSerialize, DatabaseDumpSchema } from 'leaf-proto';
import { env } from '$env/dynamic/public';
import _ from 'underscore';

export const POST: RequestHandler = async ({ fetch, request }) => {
	let { sessionInfo } = await getSession(fetch, request);
	if (!sessionInfo?.roles?.includes('admin')) {
		return error(403, 'Access denied');
	}

	let dump = await leafClient.create_database_dump();
	const dumpData = borshSerialize(DatabaseDumpSchema, dump);

	const date = new Date();
	const filename = `weird-database-dump-${env.PUBLIC_DOMAIN}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}.bin`;

	return new Response(dumpData, {
		headers: [['Content-Disposition', `attachment; filename="${filename}"`]]
	});
};
