import { browser, building, dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import {
	getSocialMediaDetails,
	getSocialMediaDetailsWithFallbackFaviconUrl
} from '$lib/utils/social-links';
import { buildIcon, loadIcon } from '@iconify/svelte';

type RendererExports = {
	memory: WebAssembly.Memory;
	OUTPUT: WebAssembly.Global<'i32'>;
	drop_output(): void;
	wasm_alloc(size: number, align: number): number;
	wasm_dealloc(ptr: number, size: number, align: number): void;
	wasm_render_profile(
		profile_data_json_ptr: number,
		profile_data_json_len: number,
		theme_data_ptr: number,
		theme_data_len: number
	): void;
	wasm_render_page(
		profile_data_json_ptr: number,
		profile_data_json_len: number,
		theme_data_ptr: number,
		theme_data_len: number
	): void;
};

let wasm: RendererExports;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const wasmImports = {
	console: {
		error(ptr: number, len: number) {
			console.error(decoder.decode(wasm.memory.buffer.slice(ptr, ptr + len)));
		}
	}
};
if (!building) {
	if (browser) {
		const resp = fetch('/renderers/minijinja.wasm');
		wasm = (await WebAssembly.instantiateStreaming(resp, wasmImports)).instance
			.exports as RendererExports;
	} else {
		const filePath = dev
			? './static/renderers/minijinja.wasm'
			: './client/renderers/minijinja.wasm';
		const wasmData = await (await import('fs')).promises.readFile(filePath);
		wasm = (await WebAssembly.instantiate(wasmData, wasmImports)).instance
			.exports as RendererExports;
	}
}

const getOutputPtrLen = () => {
	const wasmDataView = new DataView(
		wasm.memory.buffer.slice(wasm.OUTPUT.value, wasm.OUTPUT.value + 8)
	);
	return [wasmDataView.getInt32(0, true), wasmDataView.getInt32(4, true)];
};

export type InstanceInfo = {
	url: string;
};

export type ProfileData = {
	handle: string;
	display_name?: string;
	bio?: string;
	tags?: string[];
	social_links?: { url: string; label?: string; platform_name?: string }[];
	links?: { url: string; label?: string }[];
	pages?: { slug: string; name?: string }[];
};
export type PageData = {
	profile: ProfileData;
	title: string;
	slug: string;
	markdown: string;
};

export type ProfileRenderInput = {
	instance_info: InstanceInfo;
} & ProfileData;

export type PageRenderInput = {
	instance_info: InstanceInfo;
} & PageData;

/**
 * For now, to keep things simple, we have the theme data split into profile and page templates.
 * They are both stored in the theme data, separated by a null byte. If there is no null byte, the
 * it is assumed the page template has not been set, from a previous version of the theme data.
 */
export function parseThemeDataBytes(themeData: Uint8Array): {
	profile: Uint8Array;
	page?: Uint8Array;
} {
	const splitIdx = themeData.findIndex((x) => x == 0);
	if (splitIdx == -1) {
		return { profile: themeData };
	} else {
		const profileData = themeData.slice(0, splitIdx);
		const pageData = themeData.slice(splitIdx + 1);
		return { profile: profileData, page: pageData };
	}
}

export function parseThemeData(themeData: Uint8Array): { profile: string; page?: string } {
	const decoder = new TextDecoder();
	const { profile, page } = parseThemeDataBytes(themeData);
	return { profile: decoder.decode(profile), page: page && decoder.decode(page) };
}

export function createThemeData(profile: string, page: string): Uint8Array {
	const encoder = new TextEncoder();
	const profileData = encoder.encode(profile);
	const pageData = encoder.encode(page);
	const out = new Uint8Array(profileData.length + pageData.length + 1);
	out.set(profileData, 0);
	out.set(pageData, profileData.length + 1);
	return out;
}

export async function renderProfile(profile: ProfileData, themeData: Uint8Array): Promise<string> {
	const data: ProfileRenderInput = {
		handle: profile.handle,
		bio: profile.bio,
		display_name: profile.display_name,
		links: profile.links,
		pages: profile.pages,
		social_links: await Promise.all(
			profile.social_links?.map(async (x) => {
				const details = await getSocialMediaDetailsWithFallbackFaviconUrl(x.url);
				let icon;
				if (details.fallbackIcon) {
					icon = details.fallbackIcon;
				} else {
					const i = buildIcon(await loadIcon(details.icon));
					const svg = `<svg xmlns="http://www.w3.org/2000/svg" ${Object.entries(i.attributes)
						.map(([k, v]) => `${k}="${v}"`)
						.join(' ')} >${i.body}</svg>`;
					icon = `data:image/svg+xml;base64,${btoa(svg)}`;
				}
				return {
					url: x.url,
					label: x.label,
					platform_name: details.name.toLocaleLowerCase(),
					icon,
					icon_name: details.icon
				};
			}) || []
		),
		tags: profile.tags,
		instance_info: { url: env.PUBLIC_URL }
	};
	const pageDataJson = JSON.stringify(data);
	const pageDataJsonBinary = encoder.encode(pageDataJson);
	const pageDataJsonBinaryLen = pageDataJsonBinary.length;
	const pageDataJsonPtr = wasm.wasm_alloc(pageDataJsonBinaryLen, 1);

	const { profile: profileThemeData } = parseThemeDataBytes(themeData);

	const profileThemeDataLen = profileThemeData.length;
	const profileThemeDataPtr = wasm.wasm_alloc(profileThemeDataLen, 1);

	const view = new Uint8Array(wasm.memory.buffer);
	view.set(pageDataJsonBinary, pageDataJsonPtr);
	view.set(profileThemeData, profileThemeDataPtr);

	wasm.wasm_render_profile(
		pageDataJsonPtr,
		pageDataJsonBinaryLen,
		profileThemeDataPtr,
		profileThemeDataLen
	);
	const [renderedPtr, renderedLen] = getOutputPtrLen();

	const renderedData = wasm.memory.buffer.slice(renderedPtr, renderedPtr + renderedLen);
	const renderedString = decoder.decode(renderedData);

	wasm.drop_output();

	wasm.wasm_dealloc(profileThemeDataPtr, profileThemeDataLen, 1);
	wasm.wasm_dealloc(pageDataJsonPtr, pageDataJsonBinaryLen, 1);

	return renderedString;
}

export async function renderPage(
	profile: ProfileData,
	page: Omit<PageData, 'profile'>,
	themeData: Uint8Array
): Promise<string> {
	const profileData: ProfileData = {
		handle: profile.handle,
		bio: profile.bio,
		display_name: profile.display_name,
		links: profile.links,
		pages: profile.pages,
		social_links: await Promise.all(
			profile.social_links?.map(async (x) => {
				const details = getSocialMediaDetails(x.url);
				const i = buildIcon(await loadIcon(details.icon));
				return {
					url: x.url,
					label: x.label,
					platform_name: details.name.toLocaleLowerCase(),
					icon: `<svg ${Object.entries(i.attributes)
						.map(([k, v]) => `${k}="${v}"`)
						.join(' ')} >${i.body}</svg>`,
					icon_name: details.icon
				};
			}) || []
		),
		tags: profile.tags
	};
	const pageData: PageRenderInput = {
		profile: profileData,
		title: page.title,
		slug: page.slug,
		markdown: page.markdown,
		instance_info: { url: env.PUBLIC_URL }
	};
	const pageDataJson = JSON.stringify(pageData);
	const pageDataJsonBinary = encoder.encode(pageDataJson);
	const pageDataJsonBinaryLen = pageDataJsonBinary.length;
	const pageDataJsonPtr = wasm.wasm_alloc(pageDataJsonBinaryLen, 1);

	const { page: pageThemeData } = parseThemeDataBytes(themeData);

	if (!pageThemeData) throw 'Page theme missing';

	const pageThemeDataLen = pageThemeData.length;
	const pageThemeDataPtr = wasm.wasm_alloc(pageThemeDataLen, 1);

	const view = new Uint8Array(wasm.memory.buffer);
	view.set(pageDataJsonBinary, pageDataJsonPtr);
	view.set(pageThemeData, pageThemeDataPtr);

	wasm.wasm_render_page(pageDataJsonPtr, pageDataJsonBinaryLen, pageThemeDataPtr, pageThemeDataLen);
	const [renderedPtr, renderedLen] = getOutputPtrLen();

	const renderedData = wasm.memory.buffer.slice(renderedPtr, renderedPtr + renderedLen);
	const renderedString = decoder.decode(renderedData);

	wasm.drop_output();

	wasm.wasm_dealloc(pageThemeDataPtr, pageThemeDataLen, 1);
	wasm.wasm_dealloc(pageDataJsonPtr, pageDataJsonBinaryLen, 1);

	return renderedString;
}
