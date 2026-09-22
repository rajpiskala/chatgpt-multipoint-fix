# Distribution strategy

GitHub is the canonical source. Every other channel should publish the same
readable userscript rather than developing an independent copy.

## Recommended channels

| Priority | Channel | Role | Recommendation |
| --- | --- | --- | --- |
| 1 | GitHub | Canonical source, documentation, issues, releases | Publish now |
| 1 | Greasy Fork | Searchable one-click install and updates | Publish after Firefox smoke test |
| 2 | OpenUserJS | Secondary userscript directory | Mirror after Greasy Fork |
| 2 | Relevant community posts | Reach people reporting the exact symptom | Post selectively |
| 3 | GitHub Pages | Search landing page and technical article | Add if discovery warrants it |
| 3 | Chrome Web Store | Easier install for mainstream Chromium users | Package after demonstrated demand |
| 3 | Firefox Add-ons | Native Firefox install path | Package with a later extension |
| 4 | Microsoft Edge Add-ons | Additional Chromium reach | Reuse a later Chromium package |

## GitHub

Use GitHub for:

- the authoritative source;
- version history and signed tags/releases;
- documentation and technical evidence;
- public issues and structured compatibility reports; and
- the raw `.user.js` installation URL.

Account-wide GitHub Sponsors configuration supplies the repository Sponsor
button. The README includes a small optional Support section.

## Greasy Fork

Greasy Fork should be the primary userscript directory because users actively
search it for site-specific fixes.

Listing name:

> ChatGPT Bluetooth Multipoint Audio Fix

Short description:

> Stops idle ChatGPT tabs from holding Bluetooth multipoint audio and blocking
> playback on a connected phone.

The long description should reuse the exact symptom checklist, tested-device
table, safety rules, and troubleshooting links without keyword stuffing.

Greasy Fork requires the primary implementation to remain visible,
non-obfuscated, accurately described, and free of unrelated behavior. See its
[script rules](https://greasyfork.org/en/help/code-rules) and [metadata
guidance](https://greasyfork.org/en/help/meta-keys).

Greasy Fork strips external update/download metadata from its hosted copy so
installations from Greasy Fork update through Greasy Fork. Keep GitHub
canonical and synchronize each release deliberately.

## OpenUserJS and userscript indexes

[OpenUserJS](https://openuserjs.org/about) is a reasonable secondary directory
for lightweight browser userscripts.

[Userscript.Zone](https://www.userscript.zone/) indexes scripts from GitHub,
Greasy Fork, OpenUserJS, and other sources. Publishing through the canonical
channels may provide discovery there without creating another independently
maintained source.

## Community launch

Useful communities include:

- r/bose;
- r/ChatGPT;
- r/firefox;
- r/chrome;
- r/bluetooth;
- r/userscripts; and
- relevant OpenAI Community or manufacturer threads.

A good post title is:

> Fix for ChatGPT tabs silently holding Bluetooth multipoint audio and blocking phone playback

Every post should disclose the author's relationship to the script, state the
tested hardware and browsers, explain the narrow mechanism, and avoid claiming
to solve every multipoint problem.

## GitHub Pages or a technical article

A crawlable landing page becomes worthwhile if the project receives search
traffic or needs a cleaner one-click-install experience. It can reuse the
repository's original technical evidence while adding a concise page title,
meta description, canonical URL, and install call to action.

A strong technical article angle is:

> ChatGPT can silently hold Bluetooth multipoint audio—how a stale WebRTC connection blocked my phone and how I fixed it

Do not conflate this WebRTC path with other silent-browser-audio incidents
that used Web Audio. The hardware symptom is similar; the implementation is
not.

## Browser extension stores

An extension would reduce installation friction for people unfamiliar with
userscript managers, but it adds:

- Chrome, Firefox, and Edge store review;
- privacy declarations;
- packaging and release automation;
- manifest differences;
- a main-world injection/settings bridge;
- multiple update channels; and
- greater support expectations.

The userscript should establish demand first. A later extension can use a
`document_start`, main-world content script for the connection wrapper and a
separate isolated extension context for settings and the toolbar popup.

## Release checklist

1. Update the package, metadata, and runtime version together.
2. Run `npm ci` and `npm run check`.
3. Smoke-test Firefox and Chrome.
4. Review privacy, permissions, and network behavior.
5. Commit and tag the exact source.
6. Push GitHub and verify the raw install URL.
7. Update Greasy Fork from the same source.
8. Update OpenUserJS from the same source.
9. Record the compatibility result in the README or testing guide.
10. Announce only after every public install link works.
