import { leafClient } from '$lib/leaf';
import { WeirdWikiPage } from '$lib/leaf/profile';
import { BorshSchema, Component, type ExactLink } from 'leaf-proto';
import { CommonMark, Name } from 'leaf-proto/components';
import { LoroDoc } from 'loro-crdt';
import { toByteArray as decodeBase64 } from 'base64-js';
import type { PageData } from './types';
export * from './types';

class LoroCommonMark extends Component {
	value: Uint8Array;
	constructor(snapshot: Uint8Array) {
		super();
		this.value = snapshot;
	}
	static componentName(): string {
		return 'LoroCommonMark';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.Vec(BorshSchema.u8);
	}
	static specification(): Component[] {
		return [
			new CommonMark(`A [Loro](https://loro.dev) document that should contain a single \`content\` field that is a text type
and contains markdown following the CommonMark specification.`)
		];
	}
}

async function get(link: ExactLink): Promise<PageData | undefined> {
	const ent = await leafClient.get_components(link, CommonMark, Name, WeirdWikiPage);
	if (!ent) return;

	let name = ent.get(Name)?.value;
	const wiki = !!ent.get(WeirdWikiPage);
	const markdown = ent.get(CommonMark)?.value || '';
	return {
		name: name || 'Untitled',
		wiki,
		markdown
	};
}

async function getLoroSnapshot(link: ExactLink): Promise<Uint8Array | undefined> {
	const ent = await leafClient.get_components(link, LoroCommonMark);
	const v = ent?.get(LoroCommonMark)?.value;
	return v ? new Uint8Array(v) : undefined;
}

async function save(
	link: ExactLink,
	data: Omit<PageData, 'markdown'> & { loroSnapshot: string | Uint8Array }
) {
	let newSnapshot: Uint8Array | undefined;
	if (typeof data.loroSnapshot == 'string') {
		newSnapshot = decodeBase64(data.loroSnapshot);
	} else if (data.loroSnapshot instanceof Uint8Array) {
		newSnapshot = data.loroSnapshot;
	}
	if (!newSnapshot) throw 'Invalid type for loroSnapshot';
	const snapshots = [newSnapshot];
	const existingSnapshot = await getLoroSnapshot(link);
	if (existingSnapshot) snapshots.push(existingSnapshot);

	const doc = new LoroDoc();
	doc.importBatch(snapshots);

	console.log('changes', doc.changeCount());
	const content = doc.getText('content');
	console.log(content.toString());
	const markdown = content.toString();

	await leafClient.update_components(link, [
		new Name(data.name),
		data.wiki ? new WeirdWikiPage() : WeirdWikiPage,
		new CommonMark(markdown),
		new LoroCommonMark(doc.export({ mode: 'snapshot' }))
	]);
}

export const pages = { LoroCommonMark, get, getLoroSnapshot, save };
