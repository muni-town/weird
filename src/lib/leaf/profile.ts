import { BorshSchema, Component, intoPathSegment } from 'leaf-proto';
import { CommonMark, Description, RawImage, Name } from 'leaf-proto/components';
import _ from 'underscore';

import { usernames } from '$lib/usernames/index';
import { resolveUserSubspaceFromDNS } from '$lib/dns/resolve';
import { leafClient, subspace_link } from '.';

import type { ExactLink, IntoPathSegment, Unit } from 'leaf-proto';
import type { Benefit } from '$lib/billing';
import { verifiedLinks } from '$lib/verifiedLinks';

/** A "complete" profile loaded from multiple components. */
export interface Profile {
	// custom_domain?: string;
	display_name?: string;
	tags: string[];
	bio?: string;
	social_links: { label?: string; url: string }[];
	links: { label?: string; url: string }[];
	mastodon_profile?: {
		username: string;
		server: string;
	};
}

export class Tags extends Component {
	value: string[] = [];
	constructor(tags: string[]) {
		super();
		this.value = tags;
	}
	static componentName(): string {
		return 'Tags';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.Vec(BorshSchema.String);
	}
	static specification(): Component[] {
		return [
			new CommonMark(`A list of string tags associated to the entity.

There is no restriction on the format of the tag. Any valid UTF-8 is accepted.

An example use would be hashtags or some equivalent.`)
		];
	}
}

export class WeirdWikiPage extends Component {
	value: Unit;
	constructor() {
		super();
		this.value = {};
	}
	static componentName(): string {
		return 'WeirdWikiPage';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.Unit;
	}
	static specification(): Component[] {
		return [
			new CommonMark(`Marker component that indicates that a page is a Weird wiki page and \
should be editable by everybody.`)
		];
	}
}

export class WeirdTheme extends Component {
	value: {
		data: Uint8Array;
	};
	constructor(data: Uint8Array) {
		super();
		this.value = { data: data };
	}
	static componentName(): string {
		return 'WeirdTheme';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.Struct({
			data: BorshSchema.Vec(BorshSchema.u8)
		});
	}
	static specification(): Component[] {
		return [new CommonMark(`The weird theme to render a user's site with.`)];
	}
}

export class WeirdWikiRevisionAuthor extends Component {
	value: string;
	constructor(userId: string) {
		super();
		this.value = userId;
	}
	static componentName(): string {
		return 'WeirdWikiRevisionAuthor';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.String;
	}
	static specification(): Component[] {
		return [
			new CommonMark(`Component containing the Weird user ID of the author that created
a revision on a wiki page.`)
		];
	}
}

export class WebLink {
	label?: string;
	url: string;
	constructor(url: string, label?: string) {
		this.label = label;
		this.url = url;
	}
}
export const WebLinkSchema = BorshSchema.Struct({
	label: BorshSchema.Option(BorshSchema.String),
	url: BorshSchema.String
});

export class WebLinks extends Component {
	value: WebLink[];
	constructor(links: WebLink[]) {
		super();
		this.value = links;
	}
	static componentName(): string {
		return 'WebLinks';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.Vec(WebLinkSchema);
	}
	static specification(): Component[] {
		return [
			new CommonMark(`A list of web links associated to the entity.

Each link has an optional label and a URL, which must be a valid URL`)
		];
	}
}

export class SocialLinks extends Component {
	value: WebLink[];
	constructor(links: WebLink[]) {
		super();
		this.value = links;
	}
	static componentName(): string {
		return 'SocialLinks';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.Vec(WebLinkSchema);
	}
	static specification(): Component[] {
		return [
			new CommonMark(`A list of social links associated to the entity.

These links are to social profiles that represent the same identity as this entity.`)
		];
	}
}

export class MastodonProfile extends Component {
	value: {
		username: string;
		server: string;
	};
	constructor(profile: { username: string; server: string }) {
		super();
		this.value = profile;
	}
	static componentName(): string {
		return 'MastodonProfile';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.Struct({
			username: BorshSchema.String,
			server: BorshSchema.String
		});
	}
	static specification(): Component[] {
		return [
			new CommonMark(
				`The username and server URL of the mastodon profile associated to this entity.`
			)
		];
	}
}

export class AtprotoDid extends Component {
	value: string = '';
	constructor(s: string) {
		super();
		this.value = s;
	}
	static componentName(): string {
		return 'AtProtoDid';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.String;
	}
	static specification(): Component[] {
		return [new CommonMark(`The DID associated to the user's AtProto / Bluesky account.`)];
	}
}

export class WeirdCustomDomain extends Component {
	value: string;
	constructor(s: string) {
		super();
		this.value = s;
	}
	static componentName(): string {
		return 'WeirdCustomDomain';
	}
	static borshSchema(): BorshSchema {
		return BorshSchema.String;
	}
	static specification(): Component[] {
		return [new CommonMark(`An optional custom domain for the user's pubpage.`)];
	}
}

/**
 * Append a string subpath to the provided link
 */
export function appendSubpath(link: ExactLink, ...pathSegments: IntoPathSegment[]): ExactLink {
	return {
		namespace: link.namespace,
		subspace: link.subspace,
		path: [...link.path, ...pathSegments.map(intoPathSegment)]
	};
}

export async function profileLinkById(rauthyId: string): Promise<ExactLink> {
	const subspace = await usernames.subspaceByRauthyId(rauthyId);
	return subspace_link(subspace, null);
}
export async function profileLinkByUsername(username: string): Promise<ExactLink | undefined> {
	const subspace = await usernames.getSubspace(username);
	if (!subspace) return;
	return subspace_link(subspace, null);
}
export async function profileLinkByDomain(domain: string): Promise<ExactLink | undefined> {
	const resolved = await resolveUserSubspaceFromDNS(domain);
	if (!resolved) return;
	return subspace_link(resolved.subspace, null);
}

export async function getProfile(link: ExactLink): Promise<Profile | undefined> {
	let ent = await leafClient.get_components(
		link,
		Name,
		Description,
		Tags,
		WeirdCustomDomain,
		MastodonProfile,
		WebLinks,
		SocialLinks
	);
	return (
		(ent && {
			display_name: ent.get(Name)?.value,
			bio: ent.get(Description)?.value,
			tags: ent.get(Tags)?.value || [],
			// custom_domain: ent.get(WeirdCustomDomain)?.value,
			social_links: ent.get(SocialLinks)?.value || [],
			links: ent.get(WebLinks)?.value || [],
			mastodon_profile: ent.get(MastodonProfile)?.value
		}) ||
		undefined
	);
}

/**
 * Sets the profile data. Usually you want to call `setProfileById` instead, since it will also
 * update the profile's verified links. */
export async function setRawProfile(link: ExactLink, profile: Profile) {
	await leafClient.update_components(link, [
		profile.display_name ? new Name(profile.display_name) : Name,
		profile.bio ? new Description(profile.bio) : Description,
		profile.mastodon_profile ? new MastodonProfile(profile.mastodon_profile) : MastodonProfile,
		profile.links ? new WebLinks(profile.links) : WebLinks,
		profile.social_links ? new SocialLinks(profile.social_links) : SocialLinks,
		profile.tags ? new Tags(profile.tags) : Tags
	]);
}

export async function setAtprotoDid(link: ExactLink, did?: string): Promise<void> {
	await leafClient.update_components(link, [did ? new AtprotoDid(did) : AtprotoDid]);
}

export async function getAtProtoDid(link: ExactLink): Promise<string | undefined> {
	return (await leafClient.get_components(link, AtprotoDid))?.get(AtprotoDid)?.value;
}

export async function setCustomDomain(userId: string, domain?: string): Promise<void> {
	const link = await profileLinkById(userId);

	if (!link) throw `User '${userId}' does not exist.`;

	if (domain) {
		const existingProfileWithDomain = await profileLinkByDomain(domain);
		if (existingProfileWithDomain && !_.isEqual(link, existingProfileWithDomain)) {
			throw `Domain already taken by another user: ${domain}`;
		}

		await leafClient.add_components(link, [new WeirdCustomDomain(domain)]);
	} else {
		await leafClient.del_components(link, [WeirdCustomDomain]);
	}
}
export async function setAvatar(link: ExactLink, avatar: RawImage): Promise<void> {
	await leafClient.add_components(link, [avatar]);
}
export async function getAvatar(link: ExactLink): Promise<RawImage | undefined> {
	const ent = await leafClient.get_components(link, RawImage);
	return ent?.get(RawImage);
}
export async function setTheme(link: ExactLink, theme: { data: Uint8Array } | undefined) {
	await leafClient.update_components(link, [theme ? new WeirdTheme(theme.data) : WeirdTheme]);
}
export async function getTheme(link: ExactLink): Promise<{ data: Uint8Array } | undefined> {
	const ent = await leafClient.get_components(link, WeirdTheme);
	const comp = ent?.get(WeirdTheme);
	if (comp) {
		return { data: new Uint8Array(comp.value.data) };
	}
}

export async function getAvatarById(rauthyId: string): Promise<RawImage | undefined> {
	const id = await profileLinkById(rauthyId);
	if (!id) return;
	return await getAvatar(id);
}
export async function setAvatarById(rauthyId: string, avatar: RawImage): Promise<void> {
	const id = await profileLinkById(rauthyId);
	if (!id) return;
	return await setAvatar(id, avatar);
}
export async function getAvatarByUsername(username: string): Promise<RawImage | undefined> {
	const link = await profileLinkByUsername(username);
	if (!link) return;
	return await getAvatar(link);
}

export async function getProfileById(rauthyId: string): Promise<Profile | undefined> {
	const link = await profileLinkById(rauthyId);
	if (!link) return;
	return await getProfile(link);
}
export async function getProfileByUsername(username: string): Promise<Profile | undefined> {
	const link = await profileLinkByUsername(username);
	if (!link) return;
	return await getProfile(link);
}
export async function getProfileByDomain(domain: string): Promise<Profile | undefined> {
	const link = await profileLinkByDomain(domain);
	if (!link) return;
	return await getProfile(link);
}
export async function setProfileById(rauthyId: string, profile: Profile): Promise<void> {
	let link = await profileLinkById(rauthyId);
	if (!link) throw `user has not yet claimed a username.`;

	// Update the user's verified links
	const username = await usernames.getByRauthyId(rauthyId);
	if (username) {
		await verifiedLinks.verify(username, [
			...new Set([...profile.links, ...profile.social_links].map((x) => x.url)).values()
		]);
	}

	await setRawProfile(link, profile);
}
export async function deleteAllProfileDataById(rauthyId: string) {
	const subspace = await usernames.subspaceByRauthyId(rauthyId);
	const ents = await leafClient.list_entities(subspace_link(subspace));
	for (const ent of ents) {
		await leafClient.del_entity(ent);
	}
}

export async function getProfiles(): Promise<
	{ link: ExactLink; profile: Profile; username?: string }[]
> {
	const profiles: { link: ExactLink; profile: Profile; username?: string }[] = [];
	for await (const user of usernames.list()) {
		const link = subspace_link(user.subspace, null);
		const profile = await getProfile(link);
		if (!profile) continue;
		profiles.push({ link, profile, username: user.username });
	}
	return profiles;
}

/**
 * Apply any changes necessary to the user's data since they have been unsubscribed.
 *
 * This may include changing their handle because they are no longer allowed to use their custom
 * domain or non-number-suffixed username.
 *
 * @param rauthyId The user's rauthy ID
 */
export async function applyProfileBenefits(rauthyId: string, benefits: Set<Benefit>) {
	// When a user loses their subscription, we have to reset their username to a free one.
	const currentUsername = await usernames.getByRauthyId(rauthyId);
	if (!currentUsername) return;

	const split = usernames.splitPublicSuffix(currentUsername);
	if (split) {
		if (!benefits.has('non_numbered_username')) {
			if (split.prefix.match(usernames.validUnsubscribedUsernameRegex)) {
				// Nothing to do if their username is already valid for an unsubscribed user.
				return;
			} else {
				// Revert the user back to their initial username
				await usernames.setUsernameToInitialUsername(rauthyId);
			}
		}
	} else {
		if (!benefits.has('custom_domain')) {
			// Revert the user back to their initial username
			await usernames.setUsernameToInitialUsername(rauthyId);
		}
	}
}

/**
 * List the entities, one level deep, with a string path segment below the provided `link`.
 *
 * @param link The link to the entity/path to list the children of.
 * @returns A list of entities that are one string path segment deeper than the `link`.
 */
export async function listChildren(link: ExactLink): Promise<string[]> {
	const entities = await leafClient.list_entities(link);
	const paths: string[] = [];

	for (const childLink of entities) {
		if (childLink.path.length == link.path.length + 1) {
			const lastSegment = childLink.path[childLink.path.length - 1];
			if ('String' in lastSegment) {
				paths.push(lastSegment.String);
			}
		}
	}
	return paths;
}

/** Save the markdown content to the given link. The `Name` of the entity will also be set to the
 * string in the last path segment in the link.
 *
 * This will delete the page entity if `markdown` is not set. */
export async function setMarkdownPage(pageLink: ExactLink, markdown?: string) {
	if (markdown) {
		let lastSegment = pageLink.path[pageLink.path.length - 1];
		if (!('String' in lastSegment)) {
			throw 'Only string final segments supported right now.';
		}

		await leafClient.add_components(pageLink, [
			new Name(lastSegment.String),
			new CommonMark(markdown)
		]);
	} else {
		await leafClient.del_entity(pageLink);
	}
}

/** Get the content for a markdown page at the given link */
export async function getMarkdownPage(link: ExactLink): Promise<string | undefined> {
	return (await leafClient.get_components(link, CommonMark))?.get(CommonMark)?.value;
}
