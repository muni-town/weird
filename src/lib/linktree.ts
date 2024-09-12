import * as cheerio from 'cheerio';

export const ICONS_MAP: { [key: string]: string } = {
	FACEBOOK: 'mingcute:facebook-line',
	TWITTER: 'mingcute:twitter-line',
	INSTAGRAM: 'mdi:instagram',
	GITHUB: 'mdi:github',
	EMAIL_ADDRESS: 'material-symbols:mail-outline',
	YOUTUBE: 'mingcute:youtube-line'
};

export type LinktreeLink = {
	id: number;
	type: 'HEADER' | 'CLASSIC' | 'EXTENSION' | 'YOUTUBE_VIDEO';
	title: string;
	position: number;
	url?: string;
	modifiers?: {
		thumbnailUrl?: string;
	};
};

export type LinktreeSocialLink = {
	type: string;
	url: string;
	position: number;
};
export type LinktreeAccount = {
	id: number;
	uuid: number;
	username: string;
	isActive: boolean;
	status?: string;
	profilePictureUrl?: string;
	pageTitle: string;
	description: string;
	socialLinksPosition: 'TOP' | 'BOTTOM';
	createdAt: number;
	updatedAt: number;
	links: LinktreeLink[];
	socialLinks: LinktreeSocialLink[];
};
export type LinktreeResp = {
	props: {
		pageProps: {
			statusCode?: number;
			account?: LinktreeAccount;
		};
	};
};

export async function scrapeLinktreeProfile(username: string) {
	const url = `https://linktr.ee/${username}`;
	try {
		// Fetch the Linktree profile page
		const resp = await fetch(url);
		const data = await resp.text();

		// Load the HTML into cheerio
		const $ = cheerio.load(data);

		const scriptContent = $('#__NEXT_DATA__').html();

		if (scriptContent) {
			// Parse the JSON content from the script tag
			const jsonData = JSON.parse(scriptContent) as LinktreeResp;
			return jsonData.props.pageProps.account;
		}
		return null;
	} catch (error: any) {
		console.error(`Error fetching profile: ${error.message}`);
	}
}
