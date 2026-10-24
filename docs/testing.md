# Testing

## Automated checks

Run:

```console
npm ci
npm run check
```

The suite verifies:

- the native constructor and its static APIs remain intact;
- sandbox execution targets the real page and exports readable diagnostics;
- cached constructors and blank connections are observed on later setup calls;
- native promise and exception identities are preserved;
- changed hooks are reported as unhealthy;
- blank constructor-cache connections are ignored;
- unanswered audio offers respect the automatic grace period;
- audio transceivers stalled before any offer respect their own grace period;
- a new offer does not inherit the earlier preparation's elapsed time;
- live microphone sender tracks are protected;
- connections with a remote answer are protected;
- cleanup pauses while Voice Mode is visible;
- a selected stale connection closes exactly once;
- the debug button defaults to hidden and has a dark-mode palette; and
- metadata requests document-start, main-world userscript execution.

The metadata verifier also keeps the package, header, runtime, install URL,
permissions, and version in sync.

## October 24 Windows comparison

The [dated comparison](browser-comparison-2026-10-24.md) separates genuine
ChatGPT navigation from controlled native WebRTC tests. Chrome 155 did not
reproduce a Bose audio block in these checks. Isolated Firefox 156 did open a
running sampled-silent headset stream from a bare audio transceiver on a blank
page, before an SDP offer existed. Version 1.3.0 neither auto-released nor
manually released that tracked pre-offer state. It did release unanswered offers
after the grace period in both browsers.

Version 1.3.1 then passed the real Firefox pre-offer test: automatic closure
returned the Bose render session to inactive while the test context remained
open. It also closed a genuine Dot prewarm offer in Chrome 155. The suite has
23 automated tests, including manual pre-offer release and fresh grace periods
after a local-offer retry or rollback.

These are direct page-script tests, not verification of the installed Firefox
Tampermonkey sandbox or the user's overnight session. Phone Spotify continued
streaming during the tests; an end-to-end phone block was not reproduced.

## Chrome compatibility result

On September 21, 2026, version 1.1.0's runtime—the same cleanup and UI core
shipped in 1.2.0—was injected at document start into a live ChatGPT page in
Chrome 152 on Windows.

| Check | Result |
| --- | --- |
| Runtime API installed | Pass |
| Native `RTCPeerConnection` wrapped | Pass |
| Debug button hidden by default | Pass |
| Real receive-only audio offer detected | Pass |
| Manual release closed the connection | Pass |
| 15-second automatic release closed the connection | Pass |
| Debug preference persisted locally | Pass |
| Dark-mode clear state used the expected palette | Pass |
| Userscript-originated console errors | None |

The test created a real local WebRTC audio offer in the page, confirmed that
the userscript classified it as warm, then observed the connection close. It
did not request microphone permission or send audio.

## Firefox status

Version 1.3.0 adds VM regression tests for the sandbox/page distinction and
cached constructors. These tests model Firefox's bridge but are not a substitute
for a live Tampermonkey deployment test. The October 23 incident had an enabled
1.2.1 script and a visible button while the page-context diagnostic API was
absent, both before and after reload; two unanswered ChatGPT audio offers
persisted. A negotiated silent Dot connection was also captured and remains
outside automatic cleanup's safety boundary.

An isolated Firefox 156 smoke test also passed with the actual native WebRTC
constructor cached before installation. A data-channel-only offer was tracked
without replacing the constructor or closing the connection. No native audio
track was created during that test. A separate mock-audio fixture in Firefox
verified automatic cleanup after the real 15-second grace period, readable page
diagnostics, the release label and the forced hook-loss warning. The Firefox
userscript sandbox bridge itself is covered by VM tests, not yet by a live
Tampermonkey deployment test of 1.3.0.

The original cleanup core was reproduced and confirmed in daily Firefox use
on Windows with Bose QuietComfort Earbuds and a Samsung Galaxy S25 Ultra. The
public 1.2.0 package adds documentation, update metadata, Tampermonkey menu
controls, and theme-aware optional diagnostics around that same core.

Because the project's automation host could not connect to the existing
Firefox/Tampermonkey window during packaging, the exact public install should
receive a fresh manual Firefox smoke test before the first hosted-directory
release.

## Manual Firefox and Chrome smoke test

1. Install the canonical userscript and reload every ChatGPT tab.
2. Confirm the Tampermonkey menu lists the three project commands.
3. Confirm no project button is visible by default.
4. Press `Alt+Shift+D`; confirm the status button appears.
5. Change ChatGPT between light and dark themes and confirm the button remains
   legible.
6. Press `Alt+Shift+D` again to hide it.
7. With headphones connected to the computer and phone, reproduce the
   previously failing phone playback sequence.
8. Confirm phone media continues instead of pausing.
9. Start a real ChatGPT Voice Mode session and confirm the script reports
   Voice active rather than closing that session.

Record the browser, operating system, userscript manager, headset, second
device, and script version in any compatibility report.
