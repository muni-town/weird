export async function limitedFetch(
	options: { timeout: number; maxSize: number },
	...fetchArgs: Parameters<typeof fetch>
): Promise<Response> {
	const signal = AbortSignal.timeout(options.timeout);
	const resp = await fetch(fetchArgs[0], { ...fetchArgs[1], signal });

	const reader = resp.body?.getReader();
	if (!reader) return resp;

	let bytesSoFar = 0;
	const stream = new ReadableStream({
		start(controller) {
			return pump();
			async function pump(): Promise<typeof pump | undefined> {
				const { done, value } = await reader!.read();
				// When no more data needs to be consumed, close the stream
				if (done) {
					controller.close();
					return;
				}
				bytesSoFar += value?.length;
				if (bytesSoFar > options.maxSize) {
					throw new Error(
						`Could not fetch URL ( ${fetchArgs[0]} ) because returned number of \
bytes exceeded limit of ${options.maxSize} bytes.`
					);
				}
				// Enqueue the next data chunk into our target stream
				controller.enqueue(value);
				return pump();
			}
		}
	});

	return new Response(stream, {
		headers: resp.headers,
		status: resp.status,
		statusText: resp.statusText
	});
}
