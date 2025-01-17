import { browser, building, dev } from '$app/environment';
import { env } from '$env/dynamic/public';

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
	social_links?: { url: string; label?: string }[];
	links?: { url: string; label?: string }[];
	pages?: { slug: string; name?: string }[];
};

export function render(
	profileData: Omit<ProfileData, 'instance_info'>,
	themeData: Uint8Array
): string {
	const profileDataJson = JSON.stringify({
		...profileData,
		...{ instance_info: { url: env.PUBLIC_URL } }
	} as ProfileData);
	const profileDataJsonBinary = encoder.encode(profileDataJson);
	const profileDataJsonBinaryLen = profileDataJsonBinary.length;
	const profileDataJsonPtr = wasm.wasm_alloc(profileDataJsonBinaryLen, 1);

	const themeDataLen = themeData.length;
	const themeDataPtr = wasm.wasm_alloc(themeDataLen, 1);

	const view = new Uint8Array(wasm.memory.buffer);
	view.set(profileDataJsonBinary, profileDataJsonPtr);
	view.set(themeData, themeDataPtr);

	wasm.wasm_render(profileDataJsonPtr, profileDataJsonBinaryLen, themeDataPtr, themeDataLen);
	const [renderedPtr, renderedLen] = getOutputPtrLen();

	const renderedData = wasm.memory.buffer.slice(renderedPtr, renderedPtr + renderedLen);
	const renderedString = decoder.decode(renderedData);

	wasm.drop_output();

	wasm.wasm_dealloc(themeDataPtr, themeDataLen, 1);
	wasm.wasm_dealloc(profileDataJsonPtr, profileDataJsonBinaryLen, 1);

	return renderedString;
}
