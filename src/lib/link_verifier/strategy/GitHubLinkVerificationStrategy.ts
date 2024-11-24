import { JSDOM } from 'jsdom';

import { LinkVerificationStrategy } from './LinkVerificationStrategy';

export class GitHubLinkVerificationStrategy extends LinkVerificationStrategy {
  constructor(dom: JSDOM) {
    super('GitHubLinkVerificationStrategy', dom);
  }

  async verify(target: string): Promise<boolean> {
    const document = this.dom.window.document;
    const nodes = Array.from(document.querySelectorAll('a[rel="nofollow me"]'));
    return !!nodes.find((node) => node.getAttribute('href') === `https://a.weird.one/${target}`);
  }
}
