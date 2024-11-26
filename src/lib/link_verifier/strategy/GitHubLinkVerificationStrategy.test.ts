import { JSDOM } from 'jsdom';
import { expect, test } from 'vitest';

import { GitHubLinkVerificationStrategy } from './GitHubLinkVerificationStrategy';

const GITHUB_PROFILE_SNIPPET = `
  <ul class="vcard-details">
    <li class="vcard-detail pt-1 hide-sm hide-md" itemprop="worksFor" show_title="false" aria-label="Organization: @InfinyOn">
      <svg class="octicon octicon-organization" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
        <path d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75Zm-.25-1.75c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75Zm4 3A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z"></path>
      </svg>
      <span class="p-org">
        <div>
          <a class="user-mention notranslate" data-hovercard-type="organization" data-hovercard-url="/orgs/infinyon/hovercard" data-octo-click="hovercard-link-click" data-octo-dimensions="link_type:self" href="https://github.com/infinyon">@infinyon</a>
        </div>
      </span>
    </li>
    <li class="vcard-detail pt-1 hide-sm hide-md" itemprop="homeLocation" show_title="false" aria-label="Home location: South America">
      <svg class="octicon octicon-location" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
        <path d="m12.596 11.596-3.535 3.536a1.5 1.5 0 0 1-2.122 0l-3.535-3.536a6.5 6.5 0 1 1 9.192-9.193 6.5 6.5 0 0 1 0 9.193Zm-1.06-8.132v-.001a5 5 0 1 0-7.072 7.072L8 14.07l3.536-3.534a5 5 0 0 0 0-7.072ZM8 9a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 9Z"></path>
      </svg>
      <span class="p-label">South America</span>
    </li>
    <li class="vcard-detail pt-1 hide-sm hide-md" itemprop="localTime" show_title="false">
      <svg class="octicon octicon-clock" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"></path>
      </svg>
      <span class="p-label"> 17:19 <profile-timezone class="color-fg-muted d-inline" data-hours-ahead-of-utc="-3.0">(UTC -03:00)</profile-timezone>
      </span>
    </li>
    <li itemprop="url" data-test-selector="profile-website-url" class="vcard-detail pt-1 ">
      <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-link">
        <path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path>
      </svg>
      <a rel="nofollow me" class="Link--primary" href="http://estebanborai.com">estebanborai.com</a>
    </li>
    <li itemprop="social" class="vcard-detail pt-1 ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" role="img" aria-labelledby="ab6v1n8cltt02px7qrfhoka0p9v1ua1l" class="octicon">
        <title id="ab6v1n8cltt02px7qrfhoka0p9v1ua1l">LinkedIn</title>
        <g clip-path="url(#clip0_202_91845)">
          <path d="M14.5455 0H1.45455C0.650909 0 0 0.650909 0 1.45455V14.5455C0 15.3491 0.650909 16 1.45455 16H14.5455C15.3491 16 16 15.3491 16 14.5455V1.45455C16 0.650909 15.3491 0 14.5455 0ZM5.05746 13.0909H2.912V6.18764H5.05746V13.0909ZM3.96291 5.20073C3.27127 5.20073 2.712 4.64 2.712 3.94982C2.712 3.25964 3.272 2.69964 3.96291 2.69964C4.65236 2.69964 5.21309 3.26036 5.21309 3.94982C5.21309 4.64 4.65236 5.20073 3.96291 5.20073ZM13.0938 13.0909H10.9498V9.73382C10.9498 8.93309 10.9353 7.90327 9.83491 7.90327C8.71855 7.90327 8.54691 8.77527 8.54691 9.67564V13.0909H6.40291V6.18764H8.46109V7.13091H8.49018C8.77673 6.58836 9.47636 6.016 10.52 6.016C12.6924 6.016 13.0938 7.44582 13.0938 9.30473V13.0909V13.0909Z" fill="currentColor"></path>
        </g>
      </svg>
      <a rel="nofollow me" class="Link--primary" style="overflow-wrap: anywhere" href="https://www.linkedin.com/in/EstebanBorai">in/EstebanBorai</a>
    </li>
    <li itemprop="social" class="vcard-detail pt-1 ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" role="img" aria-labelledby="am3ma7hv8m093zb2pwtmu7owqyvtdwtj" class="octicon">
        <title id="am3ma7hv8m093zb2pwtmu7owqyvtdwtj">Mastodon</title>
        <path d="M8.29202 0.000202252C6.27825 0.00837918 4.27877 0.264357 3.23839 0.744626C3.23839 0.744626 1 1.76482 1 5.23985C1 9.37638 0.997 14.5711 4.70851 15.5757C6.12991 15.9582 7.35227 16.0405 8.33499 15.9838C10.1184 15.883 11.0005 15.3359 11.0005 15.3359L10.9406 14.0165C10.9406 14.0165 9.78462 14.4244 8.35322 14.3776C6.93515 14.3276 5.44121 14.221 5.20853 12.4481C5.1872 12.2832 5.17662 12.1163 5.17728 11.9501C8.18209 12.697 10.7444 12.2754 11.4497 12.19C13.4191 11.9503 15.1336 10.7139 15.3522 9.58385C15.6949 7.80294 15.6661 5.23985 15.6661 5.23985C15.6661 1.76482 13.4316 0.744626 13.4316 0.744626C12.3345 0.231649 10.3058 -0.00797468 8.29202 0.000202252ZM6.13696 2.65066C6.82691 2.66919 7.5087 2.97824 7.92872 3.63106L8.33499 4.32203L8.73995 3.63106C9.58333 2.31808 11.4736 2.40001 12.3729 3.41595C13.2023 4.3825 13.0175 5.00632 13.0175 9.32441V9.32571H11.3859V5.56839C11.3859 3.80952 9.14622 3.74159 9.14622 5.81219V7.9894H7.52505V5.81219C7.52505 3.74159 5.28666 3.80821 5.28666 5.56709V9.32441H3.65117C3.65117 5.00298 3.46969 4.37515 4.29573 3.41595C4.74875 2.90464 5.44701 2.63214 6.13696 2.65066Z" fill="currentColor"></path>
      </svg>
      <a rel="nofollow me" class="Link--primary" style="overflow-wrap: anywhere" href="https://hachyderm.io/@EstebanBorai">@EstebanBorai@hachyderm.io</a>
    </li>
    <li itemprop="social" class="vcard-detail pt-1 ">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none" role="img" aria-labelledby="aob29rbl76akhjw5unvvywv571sus8yw" class="octicon">
        <title id="aob29rbl76akhjw5unvvywv571sus8yw">Reddit</title>
        <path d="M9.42117 1C8.30163 1 7.46615 1.91456 7.46615 2.95502V4.75573C5.9979 4.83364 4.65515 5.2251 3.58321 5.83907C3.17013 5.4424 2.61701 5.26625 2.08071 5.26664C1.49925 5.26707 0.904821 5.46856 0.494798 5.92979L0.485414 5.94021L0.47603 5.95064C0.0827037 6.44221 -0.0730397 7.10072 0.0318487 7.75447C0.127638 8.35152 0.473426 8.95088 1.07453 9.34352C1.07059 9.4098 1.05993 9.47469 1.05993 9.54163C1.05993 12.1906 4.17335 14.3463 8 14.3463C11.8266 14.3463 14.9401 12.1906 14.9401 9.54163C14.9401 9.47469 14.9294 9.4098 14.9255 9.34352C15.5266 8.95088 15.8724 8.35152 15.9682 7.75447C16.073 7.10072 15.9173 6.44221 15.524 5.95064L15.5146 5.94021L15.5052 5.92979C15.0951 5.4685 14.5008 5.26707 13.9193 5.26664C13.3829 5.26625 12.8297 5.44225 12.4168 5.83907C11.3449 5.2251 10.0021 4.83364 8.53385 4.75573V2.95502C8.53385 2.43237 8.83559 2.0677 9.42117 2.0677C9.69914 2.0677 10.0378 2.20699 10.5681 2.39302C11.0165 2.55028 11.5999 2.70923 12.3459 2.75691C12.5243 3.2844 13.0197 3.66926 13.6054 3.66926C14.3395 3.66926 14.9401 3.06868 14.9401 2.33463C14.9401 1.60058 14.3395 1 13.6054 1C13.1043 1 12.6699 1.28317 12.4418 1.69442C11.8041 1.65911 11.3356 1.53103 10.9216 1.38579C10.4391 1.21654 9.99576 1 9.42117 1ZM2.08071 6.33435C2.29166 6.33419 2.49208 6.38955 2.65731 6.47928C2.06795 6.97122 1.62078 7.54599 1.35084 8.17363C1.20751 7.99671 1.12113 7.79807 1.08704 7.58556C1.02951 7.22698 1.13682 6.85424 1.30704 6.63359C1.46791 6.46045 1.76166 6.33458 2.08071 6.33435ZM13.9182 6.33435C14.2374 6.33458 14.5321 6.4605 14.693 6.63359C14.8632 6.85424 14.9705 7.22698 14.913 7.58556C14.8789 7.79807 14.7925 7.99671 14.6492 8.17363C14.3792 7.54599 13.9321 6.97122 13.3427 6.47928C13.5075 6.38965 13.7074 6.33419 13.9182 6.33435ZM5.33074 7.40622C5.92065 7.40622 6.39845 7.88402 6.39845 8.47392C6.39845 9.06383 5.92065 9.54163 5.33074 9.54163C4.74084 9.54163 4.26304 9.06383 4.26304 8.47392C4.26304 7.88402 4.74084 7.40622 5.33074 7.40622ZM10.6693 7.40622C11.2592 7.40622 11.737 7.88402 11.737 8.47392C11.737 9.06383 11.2592 9.54163 10.6693 9.54163C10.0794 9.54163 9.60155 9.06383 9.60155 8.47392C9.60155 7.88402 10.0794 7.40622 10.6693 7.40622ZM10.7965 10.3601C10.4553 11.3568 9.36452 12.2109 8 12.2109C6.63548 12.2109 5.54467 11.3572 5.20354 10.4321C5.81746 10.9302 6.84047 11.286 8 11.286C9.15953 11.286 10.1825 10.9297 10.7965 10.3601Z" fill="currentColor"></path>
      </svg>
      <a rel="nofollow me" class="Link--primary" style="overflow-wrap: anywhere" href="https://www.reddit.com/user/estebanborai">u/estebanborai</a>
    </li>
    <li itemprop="social" class="vcard-detail pt-1 ">
      <svg title="Social account" aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" data-view-component="true" class="octicon octicon-link">
        <path d="m7.775 3.275 1.25-1.25a3.5 3.5 0 1 1 4.95 4.95l-2.5 2.5a3.5 3.5 0 0 1-4.95 0 .751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018 1.998 1.998 0 0 0 2.83 0l2.5-2.5a2.002 2.002 0 0 0-2.83-2.83l-1.25 1.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042Zm-4.69 9.64a1.998 1.998 0 0 0 2.83 0l1.25-1.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042l-1.25 1.25a3.5 3.5 0 1 1-4.95-4.95l2.5-2.5a3.5 3.5 0 0 1 4.95 0 .751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018 1.998 1.998 0 0 0-2.83 0l-2.5 2.5a1.998 1.998 0 0 0 0 2.83Z"></path>
      </svg>
      <a rel="nofollow me" class="Link--primary" style="overflow-wrap: anywhere" href="https://a.weird.one/estebanborai">https://a.weird.one/estebanborai</a>
    </li>
  </ul>`;

test('verifies an owned githubs link', async () => {
	const dom = new JSDOM(GITHUB_PROFILE_SNIPPET);
	const gitHubLinkVerificationStrategy = new GitHubLinkVerificationStrategy(dom);
	const isOwner = await gitHubLinkVerificationStrategy.verify('https://a.weird.one/estebanborai');

	expect(isOwner).toStrictEqual(true);
});

test('invalidates a non owners github link', async () => {
	const dom = new JSDOM(GITHUB_PROFILE_SNIPPET);
	const gitHubLinkVerificationStrategy = new GitHubLinkVerificationStrategy(dom);
	const isOwner = await gitHubLinkVerificationStrategy.verify('https://a.weird.one/zicklag');

	expect(isOwner).toStrictEqual(false);
});
