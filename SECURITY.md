# Security policy

## Reporting a vulnerability

Please use [GitHub's private vulnerability
report](https://github.com/rajpiskala/chatgpt-bluetooth-audio-fix/security/advisories/new)
for a permission bypass, unintended connection closure, private-data exposure,
or another sensitive issue.

Do not post ChatGPT conversations, authentication data, private browser
profiles, or identifying diagnostic logs in a public issue.

## Design constraints

- Run only on `https://chatgpt.com/*`.
- Execute at document start so the original `RTCPeerConnection` constructor
  can be wrapped before ChatGPT creates voice preconnections.
- Make no userscript-owned network requests.
- Request no microphone, camera, cookie, history, or cross-origin permissions.
- Never close a connection that has a remote description.
- Never close a connection with a live sender track.
- Pause cleanup while the ChatGPT Voice Mode interface is active.
- Wait through a 15-second grace period before automatic cleanup.
- Keep manual controls local to the page and Tampermonkey.
- Fail open: an internal script error must not prevent ChatGPT from loading.

## Supported versions

Security fixes are applied to the latest released userscript version. Install
from the canonical raw GitHub URL so Tampermonkey can check for updates.
