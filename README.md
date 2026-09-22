<p align="center">
  <img src="assets/icon.svg" alt="ChatGPT Bluetooth Multipoint Audio Fix icon" width="112" height="112">
</p>

<h1 align="center">ChatGPT Bluetooth Multipoint Audio Fix</h1>

<p align="center"><strong>Stop a silent ChatGPT tab from keeping your headphones stuck on the computer.</strong></p>

<p align="center">
  <a href="https://github.com/rajpiskala/chatgpt-bluetooth-audio-fix/actions/workflows/ci.yml"><img alt="Build status" src="https://github.com/rajpiskala/chatgpt-bluetooth-audio-fix/actions/workflows/ci.yml/badge.svg?branch=main"></a>
  <img alt="Chrome and Firefox" src="https://img.shields.io/badge/browsers-Chrome%20%7C%20Firefox-1f6feb?style=flat-square">
  <img alt="Tampermonkey userscript" src="https://img.shields.io/badge/userscript-Tampermonkey-111827?style=flat-square">
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
  <a href="https://github.com/sponsors/rajpiskala"><img alt="Sponsor on GitHub" src="https://img.shields.io/github/sponsors/rajpiskala?logo=githubsponsors&amp;style=flat-square"></a>
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/rajpiskala/chatgpt-bluetooth-audio-fix/main/src/chatgpt-bluetooth-audio-fix.user.js"><img alt="Install ChatGPT Bluetooth Multipoint Audio Fix" src="https://img.shields.io/badge/Install_userscript-0f766e?style=for-the-badge&amp;logo=tampermonkey&amp;logoColor=white"></a>
</p>

<p align="center">
  <a href="#is-this-your-problem">Symptoms</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#how-it-works">How it works</a> ·
  <a href="#controls-and-status">Controls</a> ·
  <a href="#frequently-asked-questions">FAQ</a>
</p>

If Spotify, YouTube, podcasts, or other media on your phone pauses or stays
silent while ChatGPT is open on your computer—and closing every ChatGPT tab
immediately fixes it—this userscript targets that exact failure mode.

ChatGPT can leave an unanswered WebRTC audio preconnection open even when
Voice Mode is not active. The browser and operating system may continue
treating the computer as an audio source, preventing Bluetooth multipoint
headphones from switching back to the phone. This script waits through a safe
grace period, closes only connections that still match the stale pattern, and
leaves active Voice Mode sessions alone.

## Is this your problem?

This fix is intended for the following pattern:

- Your Bluetooth multipoint headphones are connected to a computer and phone.
- ChatGPT is open in a browser on the computer.
- No audible sound or active Voice Mode conversation is running in ChatGPT.
- Music or video on the phone pauses, stays silent, or immediately stops.
- Pausing or muting the browser tab does not release the headphones.
- Closing every ChatGPT tab immediately restores phone audio.

If closing ChatGPT does not release the headphones, another tab, application,
driver, or headset behavior is probably responsible. See
[troubleshooting](docs/troubleshooting.md).

## Installation

1. Install Tampermonkey for
   [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/) or
   [Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).
2. Click **[Install the userscript](https://raw.githubusercontent.com/rajpiskala/chatgpt-bluetooth-audio-fix/main/src/chatgpt-bluetooth-audio-fix.user.js)**.
3. Confirm the installation in Tampermonkey.
4. Reload every open ChatGPT tab.

The fix runs automatically. No button or settings window needs to remain open.

### Update an existing pre-repository copy

Open the install link above and let Tampermonkey replace the existing
**ChatGPT Bluetooth Multipoint Audio Fix** / **Release Bose Multipoint Audio
Lock** script. The version number should read **1.2.0**. Reload every ChatGPT
tab after saving.

## Compatibility

| Environment | Status | Evidence |
| --- | --- | --- |
| Firefox desktop on Windows + Tampermonkey | Working core | The original fix released Bose multipoint audio consistently in daily use. |
| Chrome 152 on Windows | Verified | Live ChatGPT test detected and closed real unanswered WebRTC audio offers, manually and automatically. |
| Bose QuietComfort Earbuds + Samsung Galaxy S25 Ultra | Confirmed symptom/fix | The hardware combination used to diagnose the lock. |
| Other multipoint headphones | Unverified | The mechanism is not Bose-specific, but hardware and firmware behavior varies. |
| Native ChatGPT desktop application | Unsupported | A browser userscript cannot inject into the desktop app. |
| ChatGPT mobile apps | Unsupported | The script runs only on `https://chatgpt.com/*` in a supported desktop browser. |

See the dated [testing record](docs/testing.md). Compatibility reports are
welcome through the repository's issue template.

## How it works

The userscript loads at `document-start` and wraps the page's native
`RTCPeerConnection` constructor before ChatGPT prepares real-time audio.
Each tracked connection is checked once per second.

Automatic cleanup occurs only when a connection:

- has a local SDP offer containing audio;
- still has no remote SDP answer;
- has no live sender track;
- is not already closed;
- has remained unanswered for at least 15 seconds; and
- is not present while ChatGPT's Voice Mode interface is active.

Eligible connections are closed using the standard WebRTC `close()` method.
The script does not mute ChatGPT, disconnect Bluetooth, reroute system audio,
or modify Spotify or YouTube.

Read the complete [technical explanation](docs/how-it-works.md).

## Safety behavior

- A 15-second grace period protects slow but valid connection setup.
- Receiving a remote answer immediately makes a connection ineligible.
- Attaching a live audio sender immediately makes it ineligible.
- Visible ChatGPT Voice Mode pauses cleanup.
- Closed connection records are retained briefly for diagnostics, then pruned.
- If the wrapper cannot install, ChatGPT continues loading normally.
- The script never requests microphone or camera permission.

An audio-capable WebRTC connection is not proof that microphone audio is being
captured or transmitted. Check the browser's microphone permission and
recording indicator separately.

## Controls and status

Automatic cleanup is always enabled while the userscript is enabled. The
optional debug button is hidden by default.

### Tampermonkey menu

| Command | Function |
| --- | --- |
| Toggle debug status button | Shows or hides the optional bottom-right status button. |
| Release audio now | Closes every connection currently eligible for manual release. |
| Log audio diagnostics | Prints the current classified connection state to the browser console. |

### Keyboard shortcuts

| Shortcut | Function |
| --- | --- |
| `Alt+Shift+B` | Release eligible ChatGPT audio preconnections now. |
| `Alt+Shift+D` | Toggle the optional debug status button. |

### Debug-button states

| State | Meaning |
| --- | --- |
| Audio clear | No releasable ChatGPT audio preconnection is present. |
| Release audio | An unanswered offer is inside the grace period and can be released manually. |
| Audio released | At least one eligible connection was recently closed. |
| Voice active | ChatGPT Voice Mode is visible, so cleanup is paused. |

The button follows ChatGPT's light or dark theme and stores only its visibility
preference in local browser storage.

## Verify the fix

1. Install or update the script and reload every ChatGPT tab.
2. Confirm the three commands appear in Tampermonkey's menu.
3. Confirm no project button appears by default.
4. Press `Alt+Shift+D` to show the debug button if you want visible status.
5. Reproduce the phone playback sequence that previously failed.
6. Confirm the phone keeps playing without closing ChatGPT.
7. Start a real Voice Mode session and confirm it remains protected.

For deeper diagnosis, select **Log audio diagnostics** or inspect:

```javascript
window.__chatgptBoseAudio.getStatus()
```

## Frequently asked questions

### Why does ChatGPT pause Spotify or YouTube on my phone?

In the observed failure mode, ChatGPT leaves an audio-capable WebRTC
connection in a preconnected state without an active Voice Mode conversation.
The laptop can remain meaningful to the headset's multipoint arbitration even
though you hear no laptop audio. The headset may then retain the laptop or
send a media-pause command to the phone.

### Why won't my Bose headphones switch from my laptop to my phone?

Bose multipoint normally expects one source to pause before the other starts.
A stale, silent computer audio path can make the laptop appear active longer
than expected. Bose owns the final headset arbitration, but the browser page
owns the stale WebRTC object this script can safely close.

### Why does closing every ChatGPT tab fix the problem?

Closing the tabs destroys their page-owned WebRTC connections. That releases
the browser-side resource that was keeping the computer relevant to the
headset. The userscript performs the narrower operation without requiring you
to lose your open conversations.

### Why doesn't muting the ChatGPT tab release the headphones?

Muting changes audible output. It does not guarantee that an underlying
WebRTC connection or operating-system audio path is closed. This script
targets connection state rather than volume.

### Is ChatGPT recording my microphone?

An open audio-capable connection is not evidence that microphone audio is
being captured or transmitted. Check the browser's microphone permission and
recording indicator separately. This userscript does not request microphone
access or read audio samples.

### Is this a ChatGPT bug, browser bug, or Bose bug?

The observed failure spans several layers:

- ChatGPT creates and retains the unanswered audio-capable connection.
- The browser and operating system expose the resulting audio activity.
- The headset decides which connected source wins.

The userscript fixes the page-level resource it can identify. It does not
prove that every similar lock has the same cause or assign exclusive blame to
one product.

### Does this work with Firefox and Chrome?

Yes for the tested web path. The cleanup core works in Firefox with
Tampermonkey and passed a live Chrome 152 document-start test using a real
WebRTC audio offer. Browser and userscript-manager updates can change
injection behavior, so compatibility reports remain useful.

### Does this work with Sony, Jabra, Sennheiser, or other headphones?

Possibly, but those combinations have not been verified. The stale browser
connection is not inherently Bose-specific; the visible outcome depends on
each headset's firmware and multipoint policy.

### Does this work in the official ChatGPT desktop application?

No. Tampermonkey runs inside supported web browsers and cannot modify the
native or Electron ChatGPT application.

### Will this break ChatGPT Voice Mode?

It is designed not to. The script pauses cleanup while the Voice Mode
interface is active and refuses to close answered connections or connections
with a live sender track. If Voice Mode behaves differently with the script
enabled, disable it, reload, and file a sanitized compatibility report.

### What does “Audio clear” mean?

It means the userscript does not currently see an unanswered ChatGPT audio
offer that can be released. It does not certify the state of every tab,
application, operating-system audio session, or Bluetooth device.

### Is there already another extension or userscript for this?

An audit on September 21, 2026 did not find an equivalent implementation
across GitHub, major userscript directories, Chrome Web Store, or Firefox
Add-ons. That is an absence finding, not a claim that this is the first or
only possible fix. See the [discovery report](docs/discovery-strategy.md).

## Privacy and permissions

The userscript:

- runs only on `https://chatgpt.com/*`;
- makes no userscript-owned network requests;
- contains no analytics, advertising, telemetry, or remote code;
- does not read conversation text;
- does not request microphone, camera, cookie, history, or cross-origin
  network access; and
- stores one local boolean for debug-button visibility.

The sole Tampermonkey grant, `GM_registerMenuCommand`, creates the three local
menu commands. Read the full [privacy policy](PRIVACY.md) and [security
model](SECURITY.md).

## Limitations

- The script addresses one ChatGPT web-app WebRTC failure mode, not every
  Bluetooth audio problem.
- Connections created before the userscript loads cannot be tracked; reload
  every existing ChatGPT tab after installation.
- ChatGPT interface or connection-lifecycle changes may require an update.
- The script cannot inspect Bose firmware decisions or operating-system audio
  sessions owned by other software.
- Native ChatGPT desktop and mobile applications are outside its scope.
- Non-Bose multipoint hardware needs real compatibility reports.

## Development

Requirements: Node.js 20 or newer and npm.

```console
git clone https://github.com/rajpiskala/chatgpt-bluetooth-audio-fix.git
cd chatgpt-bluetooth-audio-fix
npm ci
npm run check
```

The userscript is readable, dependency-free source. CI checks JavaScript
syntax, connection-classification tests, dark-mode UI behavior, permissions,
install URLs, and version consistency.

See [testing](docs/testing.md), [how it works](docs/how-it-works.md),
[troubleshooting](docs/troubleshooting.md), [contributing](CONTRIBUTING.md),
and the [changelog](CHANGELOG.md).

## Distribution

GitHub is the canonical source. Greasy Fork is the recommended next public
installation channel, followed by OpenUserJS. Browser extension stores should
wait until demand justifies a separate packaged extension and settings bridge.

See the complete [distribution strategy](docs/distribution.md) and
[Google/AI discovery research](docs/discovery-strategy.md).

## Support

If this project saved you some time, fixed something annoying, or made your
workflow a little better, you can [sponsor my open-source
work](https://github.com/sponsors/rajpiskala). Everything here stays free and
open source. 💗

## License

[MIT](LICENSE)

This is an independent project and is not produced, sponsored, or endorsed by
OpenAI, Bose, Google, Mozilla, Spotify, or YouTube. Product and company names
are used only to describe compatibility and the observed symptom.
