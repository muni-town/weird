import { getProfile, listChildren } from '$lib/leaf/profile';
import { error, redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from '../$types';
import { getSession } from '$lib/rauthy/server';
import { leafClient, subspace_link } from '$lib/leaf';
import { Name } from 'leaf-proto/components';
import { env } from '$env/dynamic/public';
import { usernames } from '$lib/usernames/index';
import { base32Encode } from 'leaf-proto';
import { billing, type UserSubscriptionInfo } from '$lib/billing';

export const load: LayoutServerLoad = async ({ fetch, params, request }) => {
	if (params.username?.endsWith('.' + env.PUBLIC_USER_DOMAIN_PARENT)) {
		return redirect(302, `/${params.username.split('.' + env.PUBLIC_USER_DOMAIN_PARENT)[0]}`);
	}

	const fullUsername = params.username!.includes('.')
		? params.username!
		: `${params.username}.${env.PUBLIC_USER_DOMAIN_PARENT}`;

	let profileMatchesUserSession = false;

	const subspace = await usernames.getSubspace(fullUsername);
	if (!subspace) return error(404, `User not found: ${fullUsername}`);

	const profile = (await getProfile(subspace_link(subspace, null))) || { tags: [], links: [] };

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

	return {
		profile,
		profileMatchesUserSession,
		pages,
		username: fullUsername,
		subspace: base32Encode(subspace),
		subscriptionInfo,
		pendingDomainVerification
	};
};
