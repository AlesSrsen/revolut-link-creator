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
