# Payment link generator for Revolut

A static, independent utility for creating personal Revolut.me links with a currency, optional amount and message. Includes a live preview, copy/open actions, downloadable SVG QR codes, named presets, restored last form and a clear-data action. All generation and storage happen in the browser. No analytics, account connection, API calls or remote QR services.

Published site: https://alessrsen.github.io/revolut-link-creator/

## Develop and publish

Requires Node.js 22+ for tests and Python 3 for the local preview. No install or build step.

```sh
npm test
npm run dev
```

Open http://localhost:4173. The publishable site is entirely in `docs/`. GitHub Pages publishes `master` → `/docs`; `.nojekyll` bypasses Jekyll. All asset URLs are relative so the repository subpath works. Serve over HTTP(S); browser ES modules do not work reliably with `file://` URLs.

Local storage uses the key `revolut-link-creator.v1`. Data is device/browser-specific and is lost when site storage is cleared. Storage errors leave link generation available and display a notice. Generated links and QR codes contain the entered payment details; share them intentionally.

Open tabs keep their preset lists current, and clearing saved data also clears the form in other open tabs.

## SEO

The page targets “Revolut payment link generator” with a descriptive title, relevant H1/intro, canonical HTTPS URL, Open Graph/Twitter metadata, static usage questions, primary-source references and WebApplication JSON-LD. The JSON-LD describes the visible tool without invented reviews or affiliation. The help text is available in HTML without JavaScript, including answers inside native disclosure controls. The strict content security policy is retained.

The sitemap is [sitemap.xml](https://alessrsen.github.io/revolut-link-creator/sitemap.xml). It includes only the canonical page, not duplicate `index.html` or query-string URLs. Update its `lastmod` only when the page changes meaningfully.

Audit on 2026-10-18: the live site returned HTTP 200 over HTTPS without an indexing restriction in its HTTP headers or HTML. A rendered-browser audit checked for injected schema as well as static markup. The missing canonical, sitemap, social metadata and explanatory content were addressed. Existing strengths are static HTML, semantic form labels, a mobile layout, local assets and no third-party runtime requests.

GitHub Pages hosts this project below `/revolut-link-creator/`. Crawlers read robots.txt at the host root (`https://alessrsen.github.io/robots.txt`), where the audit received HTTP 404. A 404 does not block crawling. Adding `docs/robots.txt` would publish an ineffective subdirectory robots file, so none is added. Host-wide crawler rules require a separate owner-site change and must account for other projects. See [Google’s robots.txt documentation](https://developers.google.com/search/docs/crawling-indexing/robots/intro).

Next: verify the URL-prefix property `https://alessrsen.github.io/revolut-link-creator/` in Google Search Console, submit the sitemap and inspect the homepage URL. No Search Console account access or verification token was supplied, so submission, index coverage, field Core Web Vitals and search performance have not been checked. No ranking or AI-citation uplift is claimed. See [Google’s canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) and [AI search guidance](https://developers.google.com/search/docs/appearance/ai-features).

Programmatic keyword pages and speculative AI discovery files are omitted: this is one working utility whose useful content is already directly readable. There is no invented traffic baseline, keyword-volume data or evidence of existing rankings.

## Link format and limits

```text
https://revolut.me/REVTag?currency=EUR&amount=1234&note=Lunch
```

`amount=1234` means EUR 12.34, or JPY 1234. Decimal conversion uses integer string arithmetic and `BigInt`, never floating-point rounding. Both decimal dot and comma are accepted, without grouping separators. Blank amount and message parameters are omitted. Zero, negative amounts, excess precision and amounts above 99,999,999,999 minor units are rejected. Messages are limited to 64 UTF-16 code units, matching Revolut’s current client. Revtags use 3–16 ASCII letters/digits; an optional leading `@` is accepted.

Verified against Revolut’s browser payment page on 2026-10-18. The query format is observed behavior, not a documented stable API. The currency list is the 22 returned for one public recipient; another account may support fewer. Unavailable currencies can cause Revolut to reset the supplied amount/currency. Check the recipient and details on Revolut before paying. No payment was submitted and native mobile-app handoff has not been verified.

Primary sources:

- [Official Revtag rules](https://help.revolut.com/en-CZ/help/profile-and-plan/profile-plan/profile-settings/how-do-i-update-my-revtag/)
- [Official personal payment-link help](https://help.revolut.com/en-IT/help/transfers/payment-links/revolut-me-link/)
- [Current recipient currency endpoint](https://revolut.me/api/web-profile/vrana/card-pay/currencies)
- [Revolut browser client inspected during verification](https://revolut.me/static/js/index.7c08b775.js)

## Design and bundled assets

The project’s design-taste skill dealt **The product performs**, seed **2119037770**, with Albert Sans and the Three stones palette. The live payment receipt is the visual centerpiece: editing a Revtag, amount or message changes the link and QR immediately. The accepted compact-utility brief takes precedence over marketing sections, decorative photographs, long whitespace and cropped interface fragments. Motion respects reduced-motion preferences.

No direction redraws. Visual review: design 6.5, usability 8, creativity 7, content 8; weighted score 7.2/10. The photography cap is retained honestly: this utility has no photographs. The signature receipt entrance uses scale/translation instead of an image shutter. The design inspector reports no failures with the documented `few-pictures` exception; no-footage and restrained-motion warnings are intentional. Mobile output follows the form and requires scrolling. Desktop, tablet and phone screenshots were reviewed, including filled forms at 1440, 768, 390 and 320px. Browser checks cover presets, restoration, clear data, clipboard success/fallback, SVG download, invalid amounts, corrupt/full storage and zero external requests.

- [Albert Sans](https://github.com/usted/Albert-Sans), by the Albert Sans Project Authors: bundled variable font from Google Fonts, SIL Open Font License in `docs/fonts/OFL.txt`.
- [qrcode-generator 2.0.4](https://github.com/kazuhikoarase/qrcode-generator), by Kazuhiko Arase: unmodified ES module from the pinned npm package; MIT license in `docs/vendor/LICENSE`.

No sample recipient or payment is preloaded. “Friday lunch” is only a preset-name placeholder.
