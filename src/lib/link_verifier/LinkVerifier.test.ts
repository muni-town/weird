import { expect, test } from 'vitest';

import { LinkVerifier } from './LinkVerifier';

test('filters verifiable origins', () => {
	const webLinks = [
		{
			url: 'https://github.com/EstebanBorai',
			label: 'GitHub'
		},
		{
			url: 'https://www.nytimes.com/',
			label: 'The New York Times'
		}
	];
	const linkVerifier = new LinkVerifier(webLinks, 'username');
	const filteredLinks = linkVerifier.links.map((webLink) => ({
		url: webLink.url,
		label: webLink.label
	}));

	expect(filteredLinks.find(({ url }) => webLinks[0].url === url)).toBeTruthy();
	expect(filteredLinks.find(({ url }) => webLinks[1].url === url)).toBeFalsy();
});
