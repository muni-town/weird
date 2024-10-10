import { leafClient } from '$lib/leaf';
import { getSession } from '$lib/rauthy/server';
import { DatabaseDumpSchema, borshDeserialize, type DatabaseDump } from 'leaf-proto';
import type { Actions } from './$types';
import { error, fail } from '@sveltejs/kit';

export const actions = {
	restore: async ({ request, fetch }) => {
		let { sessionInfo } = await getSession(fetch, request);
		if (!sessionInfo?.roles?.includes('admin')) {
			return error(403, 'Access denied');
		}

		try {
			const formData = await request.formData();
			const dumpFormData = formData.get('dump');
			if (!dumpFormData) return fail(400, { error: 'You must provide database dump file.' });
			const dumpData = new Uint8Array(await (dumpFormData as File).arrayBuffer());
			const dump: DatabaseDump = borshDeserialize(DatabaseDumpSchema, dumpData);
			await leafClient.restore_database_dump(dump);
		} catch (e) {
			return fail(400, { error: `Error restoring database dump: ${e}` });
		}

		return { message: 'Successfully restored database dump.' };
	}
} satisfies Actions;
