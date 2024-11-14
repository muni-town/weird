type SocialMediaConfigEntry = {
	icon: string;
	class: string;
	name: string;
};

export const socialMediaConfig: Record<string, SocialMediaConfigEntry> = {
	'facebook.com': { icon: 'mdi:facebook', class: 'button-facebook', name: 'Facebook' },
	'twitter.com': { icon: 'mdi:twitter', class: 'button-twitter', name: 'Twitter' },
	'x.com': { icon: 'mdi:twitter', class: 'button-twitter', name: 'Twitter' },
	'linkedin.com': { icon: 'mdi:linkedin', class: 'button-linkedin', name: 'LinkedIn' },
	'instagram.com': { icon: 'mdi:instagram', class: 'button-instagram', name: 'Instagram' },
	'youtube.com': { icon: 'mdi:youtube', class: 'button-youtube', name: 'YouTube' },
	'tiktok.com': { icon: 'mdi:tiktok', class: 'button-tiktok', name: 'TikTok' },
	'pinterest.com': { icon: 'mdi:pinterest', class: 'button-pinterest', name: 'Pinterest' },
	'snapchat.com': { icon: 'mdi:snapchat', class: 'button-snapchat', name: 'Snapchat' },
	'reddit.com': { icon: 'mdi:reddit', class: 'button-reddit', name: 'Reddit' },
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
	'github.com': { icon: 'mdi:github', class: 'button-github', name: 'GitHub' },
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

export function getDomain(url: string) {
	try {
		return new URL(url).hostname.replace('www.', '');
	} catch (error) {
		return null; // Return null if the URL is invalid
	}
}

export function getSocialMediaDetails(url: string) {
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
