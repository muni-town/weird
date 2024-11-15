import { claimUsername, unsetUsername, listUsers } from '$lib/usernames';
import type { ServerLoad } from '@sveltejs/kit';
import type { Actions } from './$types';
import { base32Decode } from 'leaf-proto';
import { leafClient, subspace_link } from '$lib/leaf';

export const load: ServerLoad = async ({}) => {
	const users = [];
	for await (const user of listUsers()) users.push(user);
	return { users };
};

export const actions = {
	dump: async ({ request }) => {
		if (false) {
			return { error: 'err' };
		}

		const subspace = base32Decode('xbicffkhd5jkcz4bzwwcmtfxtyttvfagipnxcq25et7pzuj4euta');
		const oldUsers = subspace_link(subspace);

		const entities = await leafClient.list_entities(oldUsers);

		const usernames = entities.flatMap((x) => {
			if (
				x.path.length == 2 &&
				'String' in x.path[0] &&
				x.path[0].String == 'profiles' &&
				'String' in x.path[1]
			) {
				return [x.path[1].String];
			} else {
				return [];
			}
		});

		return {
			dump: JSON.stringify(
				{ length: usernames.length, usernames },
				// (key, value) => (typeof value === 'bigint' ? value.toString() + 'n' : value),
				null,
				'  '
			)
		};
	},
	do: async ({ request }) => {
		// return { success: `Username ${username} deleted.` };
	}
} satisfies Actions;
