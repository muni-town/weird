import { expect, test } from 'vitest';

import { WebLink, WebLinks } from "$lib/leaf/profile";

import { LinkVerifier } from './LinkVerifier';

test('filters verifiable origins', () => {
  const gitHubWebLink = new WebLink('https://github.com/EstebanBorai', 'GitHub');
  const newYorkTimesLink = new WebLink('https://www.nytimes.com/', 'The New York Times');
  const webLinks = new WebLinks([
    gitHubWebLink,
    newYorkTimesLink,
  ]);
  const linkVerifier = new LinkVerifier(webLinks);
  const filteredLinks = linkVerifier.links.map((webLink) => ({
    url: webLink.url,
    label: webLink.label,
  }));

  expect(filteredLinks.find(({ url }) => gitHubWebLink.url === url)).toBeTruthy();
  expect(filteredLinks.find(({ url }) => newYorkTimesLink.url === url)).toBeFalsy();
});
