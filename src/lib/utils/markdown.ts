import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
type Data = object


const linkCard = (d: Data) => `<div class="unfurl bg-gray-700 border border-gray-800 border-opacity-40 bg-opacity-40 rounded-xl overflow-hidden">

			<div class="flex flex-wrap justify-stretch gap-4">
					<div class="flex-1 min-w-0 px-3 py-2">
						<p class="text-sm text-gray-400 leading-none mt-0 mb-1">${d.site_title} - ${d.date}</p>
						<p class="mt-1 mb-2 line-clamp-2 text-blue-400 leading-snug"><a href="https://${d.url}" class="title"><b class="font-bold text-blue-400 ">${d.title}</b></a></p>
						<p class="text-sm line-clamp-4 leading-tight my-0">${d.description}</p>
					</div>

						<div class="flex-shrink-0 max-w-40 h-full p-2">
				${d.images && d.images.length && `<img class="object-cover rounded-md w-full my-0 h-full" src="${d.images[0]}" alt="${d.description}">`}
			</div>
			</div>
					</div>
			`;

const previewLinks = async (html: string) => {
	if (import.meta.env.SSR) {
		// const parser 
	} else {
		const parser = new DOMParser()
	}

	return html
}

/** Render the markdown string to sanitized HTML, ready for display in the app. */
export function renderMarkdownSanitized(markdown: string) {
	const sanitized = sanitizeHtml(marked.parse(markdown) ?? '')
	return previewLinks(sanitized)
}
