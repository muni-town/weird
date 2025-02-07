import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// Embed Service types https://github.com/Lantern-chat/embed-service/blob/master/embed-sdk/index.d.ts
type Data = object

/** conditional render */
const cr = (value: string | undefined, seperator = ''): string => value !== undefined ? ` ${seperator} ${value}` : ''
const linkCardTemplate = ({ data: d, url }: { data: Data, url: string }) => `
<div class="flex flex-col flex-wrap justify-stretch gap-4 min-[500px]:flex-row">
	<div class="min-w-0 flex-1 px-3 py-2">
		<p class="mb-1 mt-0 text-sm leading-none opacity-70">${cr(d.p?.n)} ${cr(d.au?.n, '-')}</p>
		<p class="mb-1 mt-1 line-clamp-2 leading-snug text-blue-400"
			><a href="https://${url}" class="title"
				><b class="font-bold text-blue-400">${d.t}</b></a
		></p>
		<p class="my-0 line-clamp-4 text-sm leading-tight">${cr(d.d)}</p>
		${d.footer ? `<p class="mt-2 mb-0 text-sm">${d.footer.t}</p>` : ''}
	</div>
	${d.imgs && d.imgs.length ? `
	<div class=" w-full flex-shrink-0 p-2 min-[500px]:max-w-40">
		<img class="my-0 h-full w-full rounded object-cover" src=${d.imgs[0].u}>
	</div>` : ''}
	${d.vid ? `
	<div class=" w-full flex-shrink-0 p-2 min-[500px]:max-w-40">
		<video class="my-0 h-full w-full rounded object-cover" poster="${d.thumb?.u}" src="${d.vid.u}" ></video>
	</div>` : ''}
</div>
`;

export const previewLinks = async (html: string) => {
	let document: Document
	if (import.meta.env.SSR) {
		const { parseHTML } = await import('linkedom')
		const dom = parseHTML(html, 'text/html')
		document = dom.document
	} else {
		document = new DOMParser().parseFromString(html, 'text/html')
	}
	const fragment = document.createDocumentFragment()

	const links: Array<HTMLAnchorElement> = []
	document.childNodes.forEach((node, i) => {
		fragment.append(node)
		if ('tagName' in node && node.tagName === 'P') {
			// get a list of all anchor tags in their own paragraph with the href as inner
			// should be equivalent to \n\n<markdown-link>\n\n
			const child = node.firstChild
			if (child
				&& node.childNodes.length === 1
				&& child.nodeName === 'A'
				&& 'href' in child
				&& child.href === child?.innerHTML) {
				links.push(child)
			}
		}
	})

	// cache data for identical url within the same request
	const cache = new Map<string, Data>()
	return Promise.all(
		links.map(async (a) => {
			let data = cache.get(a.href)
			if (!data) {
				try {
					const res = await fetch('https://embed.internal.weird.one?lang=en', {
						method: 'POST',
						headers: {
							'Content-Type': 'text/plain',
						},
						body: a.href
					})
					if (!res.ok)
						console.error(`${res.status} ${res.statusText}: for url ${a.href}`)
					const json = await res.json()
					data = cache.set(a.href, json[1]).get(a.href)

				} catch (err) {
					if (err instanceof TypeError)
						console.error(`${err.message}. ${err.cause}`)
					else throw err
				}
			}
			if (!data) return
			const linkCard = document.createElement('div')
			linkCard.className = "unfurl overflow-hidden rounded-r border-l-4 border-gray-200 bg-gray-200 bg-opacity-10"
			linkCard.innerHTML = linkCardTemplate({ data, url: a.href })
			a.replaceWith(linkCard)
		})
	).then(() => {
		const container = document.createElement('div')
		container.appendChild(fragment.cloneNode(true))
		return container.innerHTML
	})
}

/** Render the markdown string to sanitized HTML, ready for display in the app. */
export function renderMarkdownSanitized(markdown: string) {
	return sanitizeHtml(marked.parse(markdown) as string)
}
