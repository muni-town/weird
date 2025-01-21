import { getAtProtoDid, getProfile, listChildren } from '$lib/leaf/profile';
import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from '../$types';
import { getSession, getUserInfoFromSession } from '$lib/rauthy/server';
import { leafClient, subspace_link } from '$lib/leaf';
import { Name } from 'leaf-proto/components';
import { usernames } from '$lib/usernames/index';
import { base32Encode } from 'leaf-proto';
import { billing, type UserSubscriptionInfo } from '$lib/billing';
import { verifiedLinks } from '$lib/verifiedLinks';
import { getProviders } from '$lib/rauthy/client';

export const load: LayoutServerLoad = async ({ fetch, params, request, url }) => {
	const username = usernames.shortNameOrDomain(params.username!);
	if (username != params.username) {
		return redirect(302, `/${username}/${url.pathname.split('/').slice(2).join('/')}`);
	}

	const fullUsername = usernames.fullDomain(params.username!);

	let profileMatchesUserSession = false;

	const subspace = await usernames.getSubspace(fullUsername);
	if (!subspace) return error(404, `User not found: ${fullUsername}`);

	const profileLink = subspace_link(subspace, null);
	const profile = (await getProfile(profileLink)) || {
		tags: [],
		links: [],
		social_links: []
	};

	const { sessionInfo } = await getSession(fetch, request);
	if (sessionInfo && sessionInfo.user_id == (await usernames.getRauthyId(fullUsername))) {
		profileMatchesUserSession = true;
	}

	const pageSlugs = await listChildren(subspace_link(subspace));
	const pages = (
		await Promise.all(
			pageSlugs.map(async (slug) => {
				const link = subspace_link(subspace, slug);
				const ent = await leafClient.get_components(link, Name);
				if (!ent) return undefined;
				return { slug, name: ent.get(Name)?.value };
			})
		)
	).filter((x) => x) as { slug: string; name?: string }[];

	const subscriptionInfo =
		(sessionInfo && (await billing.getSubscriptionInfo(sessionInfo.user_id))) ||
		({
			rauthyId: sessionInfo?.user_id,
			benefits: new Set()
		} as UserSubscriptionInfo);

	const pendingDomainVerification =
		profileMatchesUserSession && sessionInfo
			? await usernames.getDomainVerificationJob(sessionInfo.user_id)
			: undefined;

	let providers = await getProviders(fetch);

	const userInfo = sessionInfo
		? await getUserInfoFromSession(fetch, request, sessionInfo)
		: undefined;

	const atprotoDid = await getAtProtoDid(profileLink);

	return {
		userInfo,
		atprotoDid,
		providers,
		profile,
		verifiedLinks: await verifiedLinks.get(fullUsername),
		profileMatchesUserSession,
		pages,
		username: fullUsername,
		subspace: base32Encode(subspace),
		subscriptionInfo,
		pendingDomainVerification
	};
};
