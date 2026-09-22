# Testing

## Automated checks

Run:

```console
npm ci
npm run check
```

The suite verifies:

- constructor wrapping preserves normal WebRTC construction and static APIs;
- blank constructor-cache connections are ignored;
- unanswered audio offers respect the automatic grace period;
- live microphone sender tracks are protected;
- connections with a remote answer are protected;
- cleanup pauses while Voice Mode is visible;
- a selected stale connection closes exactly once;
- the debug button defaults to hidden and has a dark-mode palette; and
- metadata requests document-start, main-world userscript execution.

The metadata verifier also keeps the package, header, runtime, install URL,
permissions, and version in sync.

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
