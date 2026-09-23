<p align="center">
  <img src="assets/icon.svg" alt="ChatGPT Multipoint Fix icon" width="112" height="112">
</p>

<h1 align="center">ChatGPT Multipoint Fix</h1>

<p align="center"><strong>Stop a silent ChatGPT tab from keeping your headphones stuck on your computer.</strong></p>

<p align="center">
  <a href="https://github.com/rajpiskala/chatgpt-multipoint-fix/actions/workflows/ci.yml"><img alt="Build status" src="https://github.com/rajpiskala/chatgpt-multipoint-fix/actions/workflows/ci.yml/badge.svg?branch=main"></a>
  <img alt="Chrome and Firefox" src="https://img.shields.io/badge/browsers-Chrome%20%7C%20Firefox-1f6feb?style=flat-square">
  <img alt="Tampermonkey userscript" src="https://img.shields.io/badge/userscript-Tampermonkey-111827?style=flat-square">
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square"></a>
  <a href="https://github.com/sponsors/rajpiskala"><img alt="Sponsor on GitHub" src="https://img.shields.io/github/sponsors/rajpiskala?logo=githubsponsors&amp;style=flat-square"></a>
</p>

<p align="center">
  <a href="https://raw.githubusercontent.com/rajpiskala/chatgpt-multipoint-fix/main/src/chatgpt-bluetooth-audio-fix.user.js"><img alt="Install ChatGPT Multipoint Fix" src="https://img.shields.io/badge/Install_userscript-0f766e?style=for-the-badge&amp;logo=tampermonkey&amp;logoColor=white"></a>
</p>

Bluetooth multipoint is great when it works: my Bose earbuds can stay connected to both my laptop and phone, then follow whichever one is playing audio. But whenever I had ChatGPT open on my laptop, it was highly frustrating because that handoff would break. When I say it breaks: Spotify, YouTube, or a podcast on my phone would pause immediately and there would be no way of unpausing it even tapping it. This is even though ChatGPT wasn't playing anything and I wasn't using Voice Mode. The only reliable fix was closing every ChatGPT tab.

That was the clue. ChatGPT could leave a silent WebRTC audio connection waiting in the background, which was enough to keep the laptop relevant to the headphones' multipoint connection. This userscript closes that stale connection for you while leaving real Voice Mode calls alone.

Install it once, reload ChatGPT, and it works automatically. There isn't a button you need to keep pressing.

## 🎧 Does this sound like your problem?

This is probably the right fix if:

- Your Bluetooth headphones are connected to both your computer and phone.
- ChatGPT is open on the computer, but it isn't making any sound.
- Audio on your phone pauses, stays silent, or stops as soon as you try to play it.
- Muting the ChatGPT tab doesn't help.
- Closing every ChatGPT tab immediately lets the phone play again.

That last point is the important one. If closing ChatGPT doesn't release your headphones, something else may be holding the audio connection. The [troubleshooting guide](docs/troubleshooting.md) walks through the other likely causes.

## 🚀 Install

1. Install Tampermonkey for [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/) or [Chrome](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).
2. Click **[Install the userscript](https://raw.githubusercontent.com/rajpiskala/chatgpt-multipoint-fix/main/src/chatgpt-bluetooth-audio-fix.user.js)**.
3. Confirm the installation in Tampermonkey.
4. Reload every ChatGPT tab you already had open.

That's it. The fix runs quietly in the background.

If you installed an earlier copy called **Release Bose Multipoint Audio Lock**, open the same install link and let Tampermonkey update it. The current version is **1.2.1**.

## 🔧 What it actually does

ChatGPT uses WebRTC for real-time voice features. In the failure I ran into, the page created an audio-capable connection but never finished setting it up. Nothing audible was happening, yet the browser and operating system could still make the laptop look active enough that my headphones refused to hand audio back to my phone.

The userscript watches only ChatGPT's WebRTC connections. If one has been sitting unanswered for 15 seconds, has no live audio track, and isn't part of an active Voice Mode session, the script closes it. It doesn't touch Spotify, YouTube, your Bluetooth settings, or system audio.

This also explains why closing ChatGPT fixes the problem: closing the tab destroys the same page-owned connection. The script just performs the smaller cleanup without making you lose your open conversations.

If you want the implementation details, see [how it works](docs/how-it-works.md).

## 🎙️ What about ChatGPT Voice Mode?

Protecting real Voice Mode sessions is the main safety constraint. The script won't automatically close a connection that has received an answer, has a live sender track, or exists while ChatGPT's Voice Mode interface is visible. It also waits 15 seconds before doing anything so a slow but valid connection has time to finish.

I tested the cleanup against real WebRTC audio offers in both Firefox and Chrome. That said, ChatGPT can change its interface and connection flow over time. If Voice Mode behaves differently after installing the script, disable it, reload ChatGPT, and open a compatibility report with the details you can safely share.

## 🧰 Controls and debugging

You shouldn't need the controls during normal use. The debug button is hidden by default because seeing “Audio clear” in the corner all day wasn't useful once the automatic fix proved reliable.

Tampermonkey adds three menu commands:

| Command | What it does |
| --- | --- |
| Toggle debug status button | Shows or hides the small status button in the bottom-right corner. |
| Release audio now | Immediately closes any ChatGPT connection that is currently safe to release. |
| Log audio diagnostics | Prints the classified connection state in the browser console. |

There are also two shortcuts:

| Shortcut | What it does |
| --- | --- |
| `Alt+Shift+B` | Release eligible ChatGPT audio connections now. |
| `Alt+Shift+D` | Show or hide the debug status button. |

If you turn the button on, these are the states you'll see:

| Status | Meaning |
| --- | --- |
| Audio clear | The script doesn't see a ChatGPT audio connection it can release. |
| Release audio | A new unanswered connection is still inside the 15-second grace period. You can release it manually. |
| Audio released | The script recently closed an eligible connection. |
| Voice active | ChatGPT Voice Mode is visible, so automatic cleanup is paused. |

The button follows ChatGPT's light or dark theme. Its visibility is the only preference the script saves.

For a deeper look, choose **Log audio diagnostics** or run this in the browser console:

```javascript
window.__chatgptBoseAudio.getStatus()
```

## ✅ Tested so far

| Environment | Result |
| --- | --- |
| Firefox on Windows with Tampermonkey | The original daily-use setup. It consistently released my Bose multipoint lock. |
| Chrome 152 on Windows | Verified with real unanswered WebRTC audio offers, both manually and automatically. |
| Bose QuietComfort Earbuds + Samsung Galaxy S25 Ultra | The hardware combination I used to diagnose and confirm the fix. |
| Other multipoint headphones | The mechanism may apply, but I haven't personally verified other brands and firmware. |
| Native ChatGPT desktop app | Not supported. A browser userscript can't inject into the desktop app. |
| ChatGPT mobile apps | Not supported. The script only runs on `https://chatgpt.com/*` in a desktop browser. |

The dated test notes are in [docs/testing.md](docs/testing.md). If this fixes the same issue with Sony, Jabra, Sennheiser, another Bose model, macOS, or Linux, I'd genuinely appreciate a compatibility report.

## 🧩 So whose bug is this?

Probably not one company's bug in isolation. In the case I observed:

- ChatGPT left an unanswered audio-capable connection open.
- The browser and operating system continued exposing enough audio activity for the laptop to matter.
- The headphones made the final decision about which connected device should own playback.

The script fixes the first part because that's the part a page-level userscript can safely identify and close. It doesn't prove every Bluetooth multipoint lock has the same cause, and it doesn't mean Spotify was doing anything wrong.

An audio-capable WebRTC connection also isn't proof that ChatGPT is recording your microphone. Browser permission and recording indicators are the right places to check that. This script never asks for microphone access and never reads audio samples.

## 🔒 Privacy

The userscript runs only on `https://chatgpt.com/*`. It doesn't read your conversations, send analytics, load remote code, make its own network requests, or ask for access to your microphone, camera, cookies, or browsing history.

Its only Tampermonkey permission is `GM_registerMenuCommand`, which creates the three local menu commands above. It stores one local true/false preference for whether the debug button is visible.

You can read the full [privacy policy](PRIVACY.md) and [security model](SECURITY.md).

## ⚠️ A few honest limitations

- This fixes one specific ChatGPT web-app failure mode, not every Bluetooth audio problem.
- It can't see connections created before it loaded, which is why you need to reload existing ChatGPT tabs after installation.
- ChatGPT interface or WebRTC changes may require an update.
- It can't inspect headset firmware decisions or audio sessions owned by other applications.
- It doesn't work inside the native ChatGPT desktop or mobile apps.

## 🧑‍💻 Development

You'll need Node.js 20 or newer and npm.

```console
git clone https://github.com/rajpiskala/chatgpt-multipoint-fix.git
cd chatgpt-multipoint-fix
npm ci
npm run check
```

The userscript is readable, dependency-free source. CI checks its JavaScript syntax, connection-classification behavior, dark-mode UI, permissions, install links, and version consistency.

More project details are available in [testing](docs/testing.md), [how it works](docs/how-it-works.md), [troubleshooting](docs/troubleshooting.md), [contributing](CONTRIBUTING.md), and the [changelog](CHANGELOG.md).

GitHub is the canonical source. The longer-term [distribution plan](docs/distribution.md) covers userscript directories and when a packaged browser extension might make sense. There's also a separate [search and discovery report](docs/discovery-strategy.md) for the phrases people are likely to use when they run into this problem.

## 💖 Support

If this project saved you some time, fixed something annoying, or made your workflow a little better, you can [sponsor my open-source work](https://github.com/sponsors/rajpiskala). Everything here stays free and open source. 💗

## 📄 License

[MIT](LICENSE)

This is an independent project and is not produced, sponsored, or endorsed by OpenAI, Bose, Google, Mozilla, Spotify, or YouTube. Product and company names are used only to describe compatibility and the observed symptom.
