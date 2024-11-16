import { claimUsername, unsetUsername, listUsers, userSubspaceByRauthyId } from '$lib/usernames';
import { fail, type ServerLoad } from '@sveltejs/kit';
import type { Actions } from './$types';
import {
	DatabaseDumpSchema,
	base32Decode,
	borshDeserialize,
	type DatabaseDump,
	type SubspaceId,
	type DatabaseDumpDocument,
	type DatabaseDumpSubspace,
	formatEntityPath,
	type ExactLink,
	Component,
	BorshSchema
} from 'leaf-proto';
import { WEIRD_NAMESPACE, leafClient, subspace_link } from '$lib/leaf';
import _ from 'underscore';
import { CommonMark, RawImage } from 'leaf-proto/components';
import { WeirdCustomDomain, setAvatar } from '$lib/leaf/profile';

import { createAvatar } from '@dicebear/core';
import { glass } from '@dicebear/collection';

export const load: ServerLoad = async ({}) => {
	const users = [];
	for await (const user of listUsers()) users.push(user);
	return { users };
};

class Username extends Component {
	value: string = '';
	constructor(s: string) {
		super();
		this.value = s;
	}
	static componentName(): string {
		return 'Username';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.String;
	}
	static specification(): Component[] {
		return [new CommonMark('The username of the user represented by this entity.')];
	}
}

export const actions = {
	migrate: async ({ request }) => {
		const formData = await request.formData();
		const subspaceIdStr = formData.get('subspaceId');
		if (!subspaceIdStr)
			return fail(400, {
				error: 'You must provide the weird instance subspace ID to import from.'
			});
		let subspaceId: SubspaceId;
		try {
			subspaceId = base32Decode(subspaceIdStr.toString());
		} catch (_) {
			return fail(400, { error: 'Could not parse subspace ID.' });
		}
		const dumpFormData = formData.get('dump');
		if (!dumpFormData) return fail(400, { error: 'You must provide database dump file.' });
		const dumpData = new Uint8Array(await (dumpFormData as File).arrayBuffer());
		const dump: DatabaseDump = borshDeserialize(DatabaseDumpSchema, dumpData);

		let doc: DatabaseDumpDocument | undefined;
		if (dump.documents.size != 1) return fail(400, { error: 'Dump has multiple namespaces' });
		for (const [namespace, document] of dump.documents) {
			const n = new Uint8Array(namespace);
			if (_.isEqual(n, WEIRD_NAMESPACE)) {
				doc = document;
				break;
			}
		}
		if (doc === undefined) {
			return fail(400, { error: 'Dump is missing weird namespace' });
		}

		let subspace: DatabaseDumpSubspace | undefined;
		for (const [id, ss] of doc.subspaces) {
			const i = new Uint8Array(id);
			if (_.isEqual(subspaceId, i)) {
				subspace = ss;
				break;
			}
		}
		if (subspace === undefined) {
			return fail(400, { error: 'could not find specified subspace in dump' });
		}

		for (const [path, entity] of subspace) {
			if (_.isEqual(path[0], { String: 'profiles' })) {
				if ('String' in path[1]) {
					const rauthyId = path[1].String;
					const subspace = await userSubspaceByRauthyId(rauthyId);

					// User profile
					let newLink: ExactLink;
					const isProfile = path.length == 2;
					if (isProfile) {
						newLink = subspace_link(subspace, null);
					} else {
						newLink = subspace_link(subspace, ...path.slice(2));
					}

					const components = [];
					let username: string | undefined;
					let customDomain: string | undefined;
					let hasAvatar = false;
					for (const [schema, componentDatas] of entity.components) {
						const s = new Uint8Array(schema);
						if (_.isEqual(Username.schemaId(), s)) {
							username = Username.deserialize(new Uint8Array(componentDatas[0])) as any;
							username = username?.split('@')[0].toLowerCase().replace('.', '-');
							continue;
						}
						if (_.isEqual(WeirdCustomDomain.schemaId(), s)) {
							customDomain = WeirdCustomDomain.deserialize(
								new Uint8Array(componentDatas[0])
							) as any;
							continue;
						}
						if (_.isEqual(s, RawImage.schemaId())) {
							hasAvatar = true;
						}
						for (const data of componentDatas) {
							console;
							components.push({ schema: new Uint8Array(schema), data: new Uint8Array(data) });
						}
					}
					if (customDomain) {
						await claimUsername({ domain: customDomain, skipDomainCheck: true }, rauthyId);
					} else if (username) {
						await claimUsername({ username }, rauthyId);
					}
					await leafClient.add_components(newLink, components);

					if (isProfile && !hasAvatar) {
						const avatar = createAvatar(glass, { seed: rauthyId, radius: 50 });
						await setAvatar(
							newLink,
							new RawImage('image/svg+xml', new TextEncoder().encode(avatar.toString()))
						);
					}
				}
			}
		}

		return { dump: `${JSON.stringify(dump, null, '  ')}` };
	}
} satisfies Actions;
