import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import '$lib/websocket-polyfill';
import {
	RpcClient,
	type Digest,
	base32Decode,
	base32Encode,
	type ExactLink,
	type SubspaceId,
	type IntoPathSegment,
	intoPathSegment
} from 'leaf-proto';
import { CommonMark, Description, Name } from 'leaf-proto/components';
import {
	Tags,
	WebLinks,
	WeirdCustomDomain,
	WeirdTheme,
	WeirdWikiPage,
	WeirdWikiRevisionAuthor
} from './profile';

/** The Leaf RPC client used to connect to our backend data server. */
export let leafClient: RpcClient = null as any;

/** The communal namespace that all Weird instances live in. */
export const WEIRD_NAMESPACE_SECRET: Digest = new Uint8Array([
	171, 39, 207, 135, 254, 196, 186, 126, 16, 39, 48, 101, 89, 153, 23, 201, 145, 112, 90, 137, 31,
	215, 183, 175, 201, 167, 198, 156, 23, 195, 217, 7
]);

export let WEIRD_NAMESPACE: Digest = null as any;

export let INSTANCE_SUBSPACE: Digest = null as any;

/** Create an ExactLink from a path in this Weird instance. */
export function instance_link(...path: IntoPathSegment[]): ExactLink {
	return {
		namespace: WEIRD_NAMESPACE,
		subspace: INSTANCE_SUBSPACE,
		path: path.map(intoPathSegment)
	};
}

export function subspace_link(subspace: SubspaceId, ...path: IntoPathSegment[]): ExactLink {
	return {
		namespace: WEIRD_NAMESPACE,
		subspace,
		path: path.map(intoPathSegment)
	};
}

if (!building) {
	leafClient = new RpcClient(env.BACKEND_URL, env.BACKEND_SECRET);
	WEIRD_NAMESPACE = await leafClient.import_namespace_secret(WEIRD_NAMESPACE_SECRET);

	let secret: string | undefined = env.INSTANCE_SUBSPACE_SECRET;

	if (!secret) {
		INSTANCE_SUBSPACE = await leafClient.create_subspace();
		console.warn(
			`INSTANCE_SUBSPACE_SECRET env variable not set, generating a secret.
Set the env var to: ${base32Encode((await leafClient.get_subspace_secret(INSTANCE_SUBSPACE))!)}`
		);
	} else {
		INSTANCE_SUBSPACE = await leafClient.import_subspace_secret(base32Decode(secret));
	}

	console.log(`Leaf client initialized:
    Weird Namespace ID        : ${base32Encode(WEIRD_NAMESPACE)}
    Weird Instance Subspace ID: ${base32Encode(INSTANCE_SUBSPACE)}`);
}

export type KnownComponents = {
	name?: Name['value'];
	description?: Description['value'];
	tags?: Tags['value'];
	webLinks?: WebLinks['value'];
	weirdCustomDomain?: WeirdCustomDomain['value'];
	commonmark?: CommonMark['value'];
	weirdWikiPage?: WeirdWikiPage['value'];
	weirdWikiRevisionAuthor?: WeirdWikiRevisionAuthor['value'];
	weirdTheme?: WeirdTheme['value'];
};

export async function loadKnownComponents(link: ExactLink): Promise<KnownComponents | undefined> {
	const ent = await leafClient.get_components(
		link,
		Name,
		Description,
		Tags,
		WebLinks,
		WeirdCustomDomain,
		CommonMark,
		WeirdWikiPage,
		WeirdWikiRevisionAuthor,
		WeirdTheme
	);

	if (ent) {
		let weirdTheme = ent.get(WeirdTheme)?.value;
		if (weirdTheme) {
			// work around the fact that borsh deserializes Uint8Arrays as number[] 🙁
			weirdTheme = { data: new Uint8Array(weirdTheme.data) };
		}
		return {
			name: ent.get(Name)?.value,
			description: ent.get(Description)?.value,
			tags: ent.get(Tags)?.value,
			webLinks: ent.get(WebLinks)?.value,
			weirdCustomDomain: ent.get(WeirdCustomDomain)?.value,
			commonmark: ent.get(CommonMark)?.value,
			weirdWikiPage: ent.get(WeirdWikiPage)?.value,
			weirdWikiRevisionAuthor: ent.get(WeirdWikiRevisionAuthor)?.value,
			weirdTheme
		};
	} else {
		return;
	}
}
