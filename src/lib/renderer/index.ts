import { browser, building, dev } from '$app/environment';
import { env } from '$env/dynamic/public';
import { getSocialMediaDetails } from '$lib/utils/social-links';
import { buildIcon, loadIcon } from '@iconify/svelte';

type RendererExports = {
	memory: WebAssembly.Memory;
	OUTPUT: WebAssembly.Global<'i32'>;
	drop_output(): void;
	wasm_alloc(size: number, align: number): number;
	wasm_dealloc(ptr: number, size: number, align: number): void;
	wasm_render(
		profile_data_json_ptr: number,
		profile_data_json_len: number,
		theme_data_ptr: number,
		theme_data_len: number
	): [number, number];
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

export type ProfileData = {
	instance_info: {
		url: string;
	};
	handle: string;
	display_name?: string;
	bio?: string;
	tags?: string[];
	social_links?: { url: string; label?: string; platform_name?: string }[];
	links?: { url: string; label?: string }[];
	pages?: { slug: string; name?: string }[];
};
export type PageData = {
	instance_info: {
		url: string;
	};
	handle: string;
	display_name?: string;
	markdown: string;
	title: string;
	slug: string;
};

export async function renderProfile(
	profile: Omit<ProfileData, 'instance_info'>,
	themeData: Uint8Array
): Promise<string> {
	const data: ProfileData = {
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
		tags: profile.tags,
		instance_info: { url: env.PUBLIC_URL }
	};
	const pageDataJson = JSON.stringify(data);
	const pageDataJsonBinary = encoder.encode(pageDataJson);
	const pageDataJsonBinaryLen = pageDataJsonBinary.length;
	const pageDataJsonPtr = wasm.wasm_alloc(pageDataJsonBinaryLen, 1);

	const themeDataLen = themeData.length;
	const themeDataPtr = wasm.wasm_alloc(themeDataLen, 1);

	const view = new Uint8Array(wasm.memory.buffer);
	view.set(pageDataJsonBinary, pageDataJsonPtr);
	view.set(themeData, themeDataPtr);

	wasm.wasm_render(pageDataJsonPtr, pageDataJsonBinaryLen, themeDataPtr, themeDataLen);
	const [renderedPtr, renderedLen] = getOutputPtrLen();

	const renderedData = wasm.memory.buffer.slice(renderedPtr, renderedPtr + renderedLen);
	const renderedString = decoder.decode(renderedData);

	wasm.drop_output();

	wasm.wasm_dealloc(themeDataPtr, themeDataLen, 1);
	wasm.wasm_dealloc(pageDataJsonPtr, pageDataJsonBinaryLen, 1);

	return renderedString;
}

export async function renderPage(
	page: Omit<PageData, 'instance_info'>,
	themeData: Uint8Array
): Promise<string> {
	const data: PageData = {
		handle: page.handle,
		display_name: page.display_name,
		markdown: page.markdown,
		slug: page.slug,
		title: page.title,
		instance_info: { url: env.PUBLIC_URL }
	};
	const pageDataJson = JSON.stringify(data);
	const pageDataJsonBinary = encoder.encode(pageDataJson);
	const pageDataJsonBinaryLen = pageDataJsonBinary.length;
	const pageDataJsonPtr = wasm.wasm_alloc(pageDataJsonBinaryLen, 1);

	const themeDataLen = themeData.length;
	const themeDataPtr = wasm.wasm_alloc(themeDataLen, 1);

	const view = new Uint8Array(wasm.memory.buffer);
	view.set(pageDataJsonBinary, pageDataJsonPtr);
	view.set(themeData, themeDataPtr);

	wasm.wasm_render(pageDataJsonPtr, pageDataJsonBinaryLen, themeDataPtr, themeDataLen);
	const [renderedPtr, renderedLen] = getOutputPtrLen();

	const renderedData = wasm.memory.buffer.slice(renderedPtr, renderedPtr + renderedLen);
	const renderedString = decoder.decode(renderedData);

	wasm.drop_output();

	wasm.wasm_dealloc(themeDataPtr, themeDataLen, 1);
	wasm.wasm_dealloc(pageDataJsonPtr, pageDataJsonBinaryLen, 1);

	return renderedString;
}
