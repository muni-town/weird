import type { WebLink, WebLinks } from "$lib/leaf/profile";

export const VERIFIABLE_ORIGINS: URL[] = [
  new URL('https://github.com'),
];

export function verifiableOriginFilter(webLink: WebLink): boolean {
  return VERIFIABLE_ORIGINS.findIndex((url) => new URL(webLink.url).origin === url.origin) !== -1;
}

export class LinkVerifier {
  private webLinks: WebLink[];

  constructor(links: WebLinks) {
    this.webLinks = links.value.filter(verifiableOriginFilter);
  }

  get links(): WebLink[] {
    return [...this.webLinks];
  }
}
