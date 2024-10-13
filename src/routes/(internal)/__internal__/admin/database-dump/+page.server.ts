import { leafClient } from '$lib/leaf';
import { DatabaseDumpSchema, borshDeserialize, type DatabaseDump } from 'leaf-proto';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions = {
	restore: async ({ request }) => {
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
