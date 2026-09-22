# Privacy

Effective: September 21, 2026

ChatGPT Bluetooth Multipoint Audio Fix has no analytics, advertising,
telemetry, tracking, or maintainer-operated server. The maintainer does not
receive your conversations, microphone data, browsing activity, settings, or
usage information.

## Data the userscript handles

The userscript runs only on pages under `https://chatgpt.com/*`. It observes
the state of WebRTC peer connections created after the script loads and checks
whether ChatGPT is visibly in Voice Mode. It does not read conversation text.

The script does not request microphone access, capture an audio track, record
audio, or inspect the contents of any audio stream. An audio-capable WebRTC
offer is not by itself evidence that microphone audio is being captured or
transmitted.

## Data stored on your device

One local preference records whether the optional debug status button is
visible. It is stored in ChatGPT's browser-local storage under:

`chatgpt-bose-audio-debug-button-visible`

The preference remains on that browser profile until you hide the button,
clear ChatGPT site data, or remove it through browser developer tools.

## Network activity

The userscript makes no network requests. ChatGPT continues to make its normal
requests under OpenAI's own privacy terms.

## Permissions

`GM_registerMenuCommand` is used only to add local commands to Tampermonkey's
menu. No broad website, cookie, browsing-history, clipboard, download, or
cross-origin network permission is requested.

## Contact

Report privacy questions through the repository's issue tracker without
including conversation text or private browser logs. Report sensitive
security issues through the private channel described in [SECURITY.md](SECURITY.md).
