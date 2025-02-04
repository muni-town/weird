import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const rule = /^<https:\/\/([^>\s]+)>[\n|$]/;
const unfurl = {
	name: 'unfurl',
	level: 'block',
	start: (src: string) => src.indexOf('\n<https'),
	tokenizer(src: string, tokens) {
		const match = rule.exec(src);
		if (match) {
			console.log(match)
			return {
				type: 'unfurl',
				raw: match[0],
				text: match[1],
				tokens: [],
			}
		}
	},
	renderer(token: { raw: string, type: 'unfurl', text: string, tokens: [] }) {
		const l = {
			images: ['https://developer.okta.com/assets-jekyll/blog/illustrated-guide-to-oauth-and-oidc/illustrated-guide-to-oauth-and-oidc-8c49845cf913736d664af17ff174b8db58b77c5fdabe3d22f4f5886e73b43267.jpg'] as string[],
			title: 'An Ilustrated Guide to Oauth and OpenID Connect An Ilustrated Guide to Oauth and OpenID Connect and OpenID Connect and OpenID Connect and OpenID Connect and OpenID Connect and OpenID Connect',
			description: 'An Ilustrated Guide to Oauth and OpenID Connect In Tailwind CSS, you can control the line-height using the leading- utility. To reduce the line-height, use smaller values like leading-tight, leading-snug, or specific numeric values.',
			site_title: 'Okta Developers',
			date: '19 Oct 24'
		};
		return `<div class="unfurl bg-gray-700 border border-gray-800 border-opacity-40 bg-opacity-40 rounded-xl overflow-hidden">

			<div class="flex flex-wrap justify-stretch gap-4">
					<div class="flex-1 min-w-0 px-3 py-2">
						<p class="text-sm text-gray-400 leading-none mt-0 mb-1">${l.site_title} - ${l.date}</p>
						<p class="mt-1 mb-2 line-clamp-2 text-blue-400 leading-snug"><a href="https://${token.text}" class="title"><b class="font-bold text-blue-400 ">${l.title}</b></a></p>
						<p class="text-sm line-clamp-4 leading-tight my-0">${l.description}</p>
					</div>

						<div class="flex-shrink-0 max-w-40 h-full p-2">
				${l.images && l.images.length && `<img class="object-cover rounded-md w-full my-0 h-full" src="${l.images[0]}" alt="${l.description}">`}
			</div>
			</div>
					</div>
			`;
	}
}

/** Render the markdown string to sanitized HTML, ready for display in the app. */
export function renderMarkdownSanitized(markdown: string): string {
	marked.use({ extensions: [unfurl] })
	return marked.parse(markdown)
	return sanitizeHtml(marked.parse(markdown) as string, {
		allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
		allowedClasses: {
			'div': ['unfurl', 'w-full', 'mt-1', 'flex', 'flex-row'],
			'a': ['unfurl', 'w-full', 'mt-1', 'flex', 'flex-row']
		}
		// allowedAttributes: sanitizeHtml.defaults.allowedAttributes.concat(['img']),
	});
}
