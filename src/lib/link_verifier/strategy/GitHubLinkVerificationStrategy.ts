import { JSDOM } from 'jsdom';

import { LinkVerificationStrategy } from './LinkVerificationStrategy';

export class GitHubLinkVerificationStrategy extends LinkVerificationStrategy {
  constructor(dom: JSDOM) {
    super('GitHubLinkVerificationStrategy', dom);
  }
}
