import { limitedFetch } from '$lib/limited-fetch';
import { parseHTML } from 'linkedom';
import { fromByteArray as encodeBase64 } from 'base64-js';
import { browser } from '$app/environment';

type SocialMediaConfigEntry = {
	icon: string;
	class: string;
	name: string;
};

const featuredSocialMediaConfig: Record<string, SocialMediaConfigEntry> = {
	'facebook.com': { icon: 'mdi:facebook', class: 'button-facebook', name: 'Facebook' },
	'twitter.com': { icon: 'mdi:twitter', class: 'button-twitter', name: 'Twitter' },
	'x.com': { icon: 'mdi:twitter', class: 'button-twitter', name: 'Twitter' },
	'linkedin.com': { icon: 'mdi:linkedin', class: 'button-linkedin', name: 'LinkedIn' },
	'instagram.com': { icon: 'mdi:instagram', class: 'button-instagram', name: 'Instagram' },
	'youtube.com': { icon: 'mdi:youtube', class: 'button-youtube', name: 'YouTube' },
	'github.com': { icon: 'mdi:github', class: 'button-github', name: 'GitHub' },
	'tiktok.com': { icon: 'mdi:tiktok', class: 'button-tiktok', name: 'TikTok' },
	'reddit.com': { icon: 'mdi:reddit', class: 'button-reddit', name: 'Reddit' },
	'pinterest.com': { icon: 'mdi:pinterest', class: 'button-pinterest', name: 'Pinterest' },
	'bsky.app': { icon: 'fa6-brands:bluesky', class: 'button-bluesky', name: 'Bluesky' }
};

export const socialMediaConfig: Record<string, SocialMediaConfigEntry> = {
	...featuredSocialMediaConfig,
	'snapchat.com': { icon: 'mdi:snapchat', class: 'button-snapchat', name: 'Snapchat' },
	'tumblr.com': { icon: 'mdi:tumblr', class: 'button-tumblr', name: 'Tumblr' },
	'flickr.com': { icon: 'mdi:flickr', class: 'button-flickr', name: 'Flickr' },
	'whatsapp.com': { icon: 'mdi:whatsapp', class: 'button-whatsapp', name: 'WhatsApp' },
	'wechat.com': { icon: 'mdi:wechat', class: 'button-wechat', name: 'WeChat' },
	'qq.com': { icon: 'mdi:qqchat', class: 'button-qq', name: 'QQ' },
	'twitch.tv': { icon: 'mdi:twitch', class: 'button-twitch', name: 'Twitch' },
	'discord.com': { icon: 'mdi:discord', class: 'button-discord', name: 'Discord' },
	'vimeo.com': { icon: 'mdi:vimeo', class: 'button-vimeo', name: 'Vimeo' },
	'dribbble.com': { icon: 'mdi:dribbble', class: 'button-dribbble', name: 'Dribbble' },
	'behance.net': { icon: 'mdi:behance', class: 'button-behance', name: 'Behance' },
	'medium.com': { icon: 'mdi:medium', class: 'button-medium', name: 'Medium' },
	'quora.com': { icon: 'mdi:quora', class: 'button-quora', name: 'Quora' },
	'telegram.org': { icon: 'mdi:telegram', class: 'button-telegram', name: 'Telegram' },
	'skype.com': { icon: 'mdi:skype', class: 'button-skype', name: 'Skype' },
	'stackoverflow.com': {
		icon: 'mdi:stack-overflow',
		class: 'button-stackoverflow',
		name: 'Stack Overflow'
	},
	'producthunt.com': { icon: 'mdi:producthunt', class: 'button-producthunt', name: 'Product Hunt' },
	'rss.com': { icon: 'mdi:rss', class: 'button-rss', name: 'RSS' },
	'goodreads.com': { icon: 'mdi:goodreads', class: 'button-goodreads', name: 'Goodreads' },
	'tripadvisor.com': { icon: 'mdi:tripadvisor', class: 'button-tripadvisor', name: 'TripAdvisor' },
	'soundcloud.com': { icon: 'mdi:soundcloud', class: 'button-soundcloud', name: 'SoundCloud' }
};

export function getDomain(url: string): string {
	try {
		return new URL(url).hostname.replace('www.', '');
	} catch (error) {
		return 'invalid.url'; // Return null if the URL is invalid
	}
}

export function getSocialMediaDetails(url: string): SocialMediaConfigEntry {
	const domain = getDomain(url);
	const socialMedia = domain ? socialMediaConfig[domain] : null;

	return (
		socialMedia ?? {
			icon: 'mdi:web',
			class: 'button-default',
			name: domain
		}
	);
}

export async function getSocialMediaDetailsWithFallbackFaviconUrl(
	url: string
): Promise<SocialMediaConfigEntry & { fallbackIcon?: string }> {
	const details = getSocialMediaDetails(url);
	let fallbackIcon;
	// If this is the generic fallback icon
	if (details.icon == 'mdi:web') {
		if (browser) {
			fallbackIcon = await clientGetFaviconDataUri(url);
		} else {
			fallbackIcon = await getFaviconDataUri(url);
		}
	}
	return { ...details, fallbackIcon };
}

const toDataUri = async (blob: Blob): Promise<string> => {
	return `data:${blob.type};base64,${encodeBase64(await blob.bytes())}`;
};
export async function getFaviconDataUri(url: string): Promise<string | undefined> {
	try {
		const timeout = { timeout: 3000, maxSize: 1024 * 1024 * 3 };
		type Link = { href: string; type?: string; size?: [number, number] };
		const rootUrl = new URL(url);
		rootUrl.pathname = '/';
		const resp = await limitedFetch(timeout, rootUrl, { redirect: 'follow' });
		if (!resp.ok) return;
		const html = await resp.text();
		const htmlParsed = parseHTML(html);
		const icons: Link[] = [];
		for await (const link of htmlParsed.document.querySelectorAll('link[rel=icon]').values()) {
			const type = link.attributes.getNamedItem('type')?.value;
			let href = link.attributes.getNamedItem('href')?.value;
			const sizes = link.attributes.getNamedItem('sizes')?.value;
			const parsedSizes = sizes
				? sizes.split(' ').map((x) => x.split('x').map((x) => parseInt(x)))
				: undefined;
			parsedSizes?.sort((a, b) => a[0] - b[0]);
			if (!href) continue;
			try {
				new URL(href);
			} catch (_) {
				const hrefUrl = new URL(rootUrl);
				hrefUrl.pathname = href;
				href = hrefUrl.href;
			}
			icons.push({
				href,
				size: parsedSizes?.[0] as [number, number] | undefined,
				type
			});
		}
		const goodType = (x: Link) => x.type?.includes('svg');
		const goodSize = (x: Link) => x.size?.[0] && x.size?.[0] < 64;
		icons.sort((a, b) => {
			if (goodType(a) && !goodType(b)) {
				return 1;
			} else if (goodType(b) && !goodType(a)) {
				return -1;
			} else if (goodSize(a) && !goodSize(b)) {
				return 1;
			} else if (goodSize(b) && !goodSize(a)) {
				return -1;
			} else if (goodSize(a) && goodSize(b)) {
				return (a.size?.[0] || 0) - (b.size?.[0] || 0);
			} else {
				return -1;
			}
		});
		const icon = icons[icons.length - 1];
		if (!icon) return;
		const iconResp = await limitedFetch(timeout, icon.href);
		return toDataUri(await iconResp.blob());
	} catch (e) {
		console.log(e);
	}
}
export async function clientGetFaviconDataUri(url: string): Promise<string | undefined> {
	try {
		const resp = await fetch(`/__internal__/favicon/${encodeURIComponent(url)}`);
		return await resp.text();
	} catch (e) {
		console.error(e);
	}
}

export function getFeaturedSocialMediaDetails(url: string): SocialMediaConfigEntry | null {
	const domain = getDomain(url);
	const socialMedia = domain ? featuredSocialMediaConfig[domain] : null;
	return socialMedia;
}
