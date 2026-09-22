# Discovery strategy

Research date: September 21, 2026

## Executive summary

People experiencing this problem rarely know to search for WebRTC, SDP, or
`RTCPeerConnection`. They describe the visible hardware behavior:

- headphones are stuck on the laptop;
- the computer is holding, claiming, owning, or stealing the audio;
- Spotify or YouTube on the phone immediately pauses;
- Bluetooth multipoint will not switch;
- the laptop appears active even though nothing is playing; or
- closing ChatGPT or the browser immediately fixes it.

The project should lead with that full symptom sequence, then explain the
technical cause. This is both more helpful and more discoverable than a page
that begins with protocol terminology.

As of the research date, searches across GitHub, Greasy Fork, OpenUserJS,
Chrome Web Store, Firefox Add-ons, and the general web did not find another
extension or userscript for this exact ChatGPT failure mode. The defensible
public wording is:

> I could not find another userscript or extension for this exact ChatGPT
> Bluetooth multipoint failure mode.

Do not claim the project is the first or only fix.

## Core diagnostic language

Repeat this concise diagnostic naturally near the top of public listings:

> Your headphones are connected to both your computer and phone. Nothing is
> audibly playing on the computer, but Spotify, YouTube, podcasts, or other
> phone media pauses or remains silent. Muting the ChatGPT tab does not help.
> Closing every ChatGPT tab immediately releases the headphones.

This separates the project from:

- poor Bluetooth sound quality;
- headset/call-profile switching;
- ChatGPT Voice playback failures;
- Read Aloud bugs;
- Bluetooth latency;
- generic multipoint firmware problems; and
- microphone-routing failures.

## Search-query map

These are intent-driven phrases based on live forum language and current
results, not paid keyword-volume estimates.

### Highest-intent symptom queries

- ChatGPT pauses Spotify on phone
- ChatGPT stops YouTube audio on phone
- ChatGPT tab blocks Bluetooth audio
- ChatGPT holding Bluetooth headphones
- ChatGPT keeps laptop audio active
- ChatGPT audio lock fix
- ChatGPT Bluetooth multipoint not switching
- Bose multipoint stuck on laptop ChatGPT
- Bose headphones will not switch from laptop to phone
- phone media pauses when ChatGPT is open
- closing ChatGPT fixes Bluetooth audio
- muting ChatGPT tab does not fix Bluetooth
- ChatGPT Firefox keeps audio active
- ChatGPT Chrome keeps audio active
- Bose QC Ultra ChatGPT multipoint fix

### Broader adjacent queries

- browser holding Bluetooth audio
- browser tab keeps audio session open
- Firefox keeping audio focus multipoint
- Chrome keeps Bluetooth audio active
- Bluetooth multipoint computer stealing audio
- headphones think laptop is playing audio
- multipoint headphones stuck on computer
- Bluetooth headphones won't switch to phone
- computer blocks phone audio even nothing playing
- muted browser still blocks headphones

### Technical queries

- ChatGPT stale RTCPeerConnection
- ChatGPT unanswered WebRTC audio offer
- RTCPeerConnection holding audio device
- WebRTC Bluetooth multipoint audio lock
- close idle RTCPeerConnection userscript
- browser active audio session no playback
- ChatGPT SDP offer no answer audio
- WebRTC audio path not released
- ChatGPT voice preconnection

## Likely AI-search prompts

The FAQ and troubleshooting guides should answer these questions directly:

- Why does closing all my ChatGPT tabs make my Bluetooth headphones work?
- ChatGPT is silent, so why do my headphones think the laptop is active?
- Is this a Bose bug, browser bug, or ChatGPT bug?
- Can I stop ChatGPT stealing multipoint audio without disabling multipoint?
- Is there a Tampermonkey script or Chrome extension for this problem?
- Why does muting the ChatGPT tab not release the headphones?
- Does an audio connection mean ChatGPT is recording my microphone?
- How can I identify which browser tab is holding my headphones?

## Repository metadata

### Product and repository name

- Product: **ChatGPT Bluetooth Multipoint Audio Fix**
- Repository: `chatgpt-bluetooth-audio-fix`

This contains the product, device category, symptom, and outcome without
incorrectly implying that only Bose hardware is affected.

### GitHub description

> Tampermonkey userscript that stops idle ChatGPT tabs from holding Bluetooth
> multipoint audio, tested with Bose headphones switching between a laptop and
> phone.

### GitHub topics

```text
chatgpt
openai
bluetooth
bluetooth-multipoint
multipoint
audio
audio-focus
headphones
bose
webrtc
rtcpeerconnection
tampermonkey
userscript
firefox
chrome
bugfix
```

GitHub recommends repository topics for related-project discovery in its
[topic documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics).
Avoid Spotify and YouTube as topics because the userscript does not modify
those products.

## README and documentation architecture

The public documentation should provide one crawlable, technically credible
source with:

1. the outcome and install button;
2. the exact symptom checklist;
3. tested hardware and browsers;
4. safety conditions;
5. controls and verification;
6. troubleshooting in ordinary language;
7. cautious root-cause details;
8. privacy and limitations; and
9. original test evidence.

Keep the README, technical explanation, and troubleshooting guide distinct.
Do not create nearly identical pages for every long-tail query.

Google's official [AI search optimization
guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)
says ordinary SEO fundamentals, useful first-hand content, crawlability, and
clear structure remain the basis for AI Overview and AI Mode visibility. It
does not require a special AI writing style, special schema, or `llms.txt`.

OpenAI's [publisher
guidance](https://help.openai.com/en/articles/12627856-publishers-and-developers-faq)
explains that public pages can appear in ChatGPT Search and that a separately
hosted site should allow `OAI-SearchBot`. GitHub already exposes public
repository content without a project-controlled robots file.

## Valuable original evidence

Maintain material an answer engine can cite rather than generic Bluetooth
advice:

- the exact trigger and release condition;
- before/after behavior;
- browser and operating-system versions;
- headset and second-device models;
- which peer-connection state is stale;
- how active Voice Mode sessions are protected;
- whether muting, suspending, or closing the tab changes the result; and
- real compatibility reports.

## Source observations

- A Firefox user described the browser as still
  [claiming audio on multipoint headphones](https://www.reddit.com/r/firefox/comments/rroik2/win10_ff_keeping_the_audio_focus_on_mulitpoint/)
  with no audible tab; closing Firefox released it.
- Bose explains that multipoint normally switches after pausing one source and
  starting another in its [multipoint
  guide](https://www.bose.com/stories/bluetooth-multipoint).
- A separate AliExpress Web Audio incident demonstrated that a silent webpage
  audio path can interfere with Bluetooth multipoint; its implementation was
  different from ChatGPT's WebRTC path. See the [technical
  investigation](https://blog.laserphile.com/2026/08/aliexpress-webpage-keeping-multipoint.html)
  and [Mozilla bug 1863193](https://bugzilla.mozilla.org/show_bug.cgi?id=1863193).
- The [Greasy Fork ChatGPT
  catalog](https://greasyfork.org/en/scripts/by-site/chatgpt.com?language=all)
  contained no Bluetooth, multipoint, or peer-connection equivalent during
  this audit.

## Measurement and maintenance

After launch:

1. watch GitHub referrers, clones, issues, and userscript-host statistics;
2. collect structured compatibility reports through the issue template;
3. keep a dated compatibility matrix;
4. rerun the equivalent-solution audit before any uniqueness claim;
5. revise ordinary-language troubleshooting from real reports; and
6. consider an extension only after repeated install-friction requests.
