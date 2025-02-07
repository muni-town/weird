import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

// Embed Service types https://github.com/Lantern-chat/embed-service/blob/master/embed-sdk/index.d.ts
type Data = object

const linkCardTemplate = ({ data: d, url }: { data: Data, url: string }) => `
<div class="flex flex-wrap justify-stretch gap-4">
	<div class="flex-1 min-w-0 px-3 py-2">
		<p class="text-sm text-gray-400 leading-none mt-0 mb-1">${d.p?.n} - ${d.ac}</p>
		<p class="mt-1 mb-2 line-clamp-2 text-blue-400 leading-snug">
			<a href="https://${url}" class="title"><b class="font-bold text-blue-400 ">${d.t}</b></a>
		</p>
		<p class="text-sm line-clamp-4 leading-tight my-0">${d.d}</p>
	</div>
	<div class="flex-shrink-0 max-w-40 h-full p-2">
		${d.imgs && d.imgs.length &&
	`<img class="object-cover rounded-md w-full my-0 h-full" src="${d.imgs[0].u}" alt="">`}
	</div>
</div>
`;

const previewLinks = async (html: string) => {
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
	document.children.forEach((el, i) => {
		fragment.append(el)
		if ('tagName' in el && el.tagName === 'P') {
			// get a list of all anchor tags in their own paragraph with the href as inner
			// should be equivalent to \n\n<markdown-link>\n\n
			const child = el.firstElementChild
			if (child
				&& el.childNodes.length === 1
				&& child.tagName === 'A'
				&& 'href' in child
				&& child.href === child?.innerHTML) {
				links.push(child)
			}
		}
	})

	return Promise.all(
		links.map(async (a) => {
			try {
				const res = await fetch('https://embed.internal.weird.one?lang=en', {
					method: 'POST',
					headers: {
						'Content-Type': 'text/plain',
					},
					body: a.href
				})
				if (res.ok) {
					const data = await res.json()
					const linkCard = document.createElement('div')
					linkCard.className = "unfurl bg-gray-700 border border-gray-800 border-opacity-40 bg-opacity-40 rounded-xl overflow-hidden"
					linkCard.innerHTML = linkCardTemplate({ data: data[1], url: a.href })
					a.replaceWith(linkCard)
				} else {
					console.error(`${res.status} ${res.statusText}: for url ${a.href}`)
				}
			} catch (err) {
				if (err instanceof TypeError && err.message === 'fetch failed') {
					console.error(err)
				}
				console.log(err)
			}
		})
	).then(() => {
		const container = document.createElement('div')
		container.appendChild(fragment.cloneNode(true))
		return container.innerHTML
	})
}

/** Render the markdown string to sanitized HTML, ready for display in the app. */
export function renderMarkdownSanitized(markdown: string) {
	const sanitized = sanitizeHtml(marked.parse(markdown) as string)
	return previewLinks(sanitized)
}
