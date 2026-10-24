# Chrome and Firefox audio comparison, October 24, 2026

## Scope

Investigate the report that an overnight ChatGPT tab still blocked phone
Spotify after updating the userscript. Use the signed-in Chrome automation
profile to inspect actual ChatGPT code, then compare native WebRTC behavior.

Windows Bose render-session state was measured independently of page UI.
"Sampled-silent" means all measured peaks were zero; it is not a recording or
proof that every PCM sample between observations was zero. A running stream is
a multipoint risk, not direct proof of a particular headset arbitration decision.

## Results

| Test | Browser | Result |
| --- | --- | --- |
| Ordinary ChatGPT home and existing conversation, no fix | Chrome 155 | Blank cached peer connection, no audio transceiver or system render stream. |
| Same conversation with temporary recent-voice-use preference | Chrome 155 | Still only a blank cache. Preference restored exactly to absent. No microphone permission granted. |
| Actual Your dot page with v1.3.0 injected at document start | Chrome 155 | App created an unanswered audio prewarm offer; script automatically closed it after about 15 seconds. No negotiated stream observed in this run. |
| Controlled unanswered audio/video offer, no fix | Chrome 155 | Offer remained open for 30 seconds without an active Chrome render session on any inspected output. |
| Controlled unanswered offer, v1.3.0 | Chrome 155 and isolated Firefox 156 | Tracked and automatically closed after the grace period. Firefox's Bose session returned to inactive. |
| Blank peer connection plus data channel | Isolated Firefox 156 | No active Bose render stream. |
| Add audio transceiver, no offer or description | Isolated Firefox 156 | Immediate active Bose render session, zero sampled peaks; no microphone sender or RTP reports. Closing the connection returned the session to inactive. |
| Same pre-offer state, v1.3.0 running | Isolated Firefox 156 | Tracking healthy, trackedCount=1, warmCount=0 after 18 seconds, manual release=0. Stream remained active until the test context closed. |
| Same pre-offer state, v1.3.1 running | Isolated Firefox 156 | Tracked as warm, automatically closed after about 15 seconds. Native Bose stream returned to inactive before the test page/context was closed. |
| Actual Your dot page with v1.3.1 injected | Chrome 155 | Real app prewarm offer automatically closed; no remote description or negotiated stream observed. |

Phone Spotify reported PLAYING and Bose Streaming=true during these checks.
No full end-to-end phone block was reproduced in this run. The browser-level
stream mechanism and the pre-offer cleanup blind spot were reproduced.

The user's everyday Firefox was 158; the isolated test browser was 156. Do not
claim this test alone establishes every detail of the current 158 incident.

## Minimal Firefox mechanism reproduction

On a blank test page, with the headset selected as the Windows default output:

```javascript
window.multipointRepro = new RTCPeerConnection();
window.multipointRepro.addTransceiver('audio');
```

Inspect native render sessions, not just the tab's speaker icon. The observed
Firefox stream was active before `createOffer` or `setLocalDescription`, with
both descriptions null. No microphone acquisition was needed.

Cleanup:

```javascript
window.multipointRepro.close();
delete window.multipointRepro;
```

Repeat in Chrome as a control. The observed Chrome 155 setup did not open a
render stream from this preparation. Do not run this in a page with active
voice calls or confuse a synthetic connection with one created by ChatGPT.

## Actual ChatGPT sources inspected

Loaded assets, not inferred API documentation:

- `https://chatgpt.com/cdn/assets/async/89655.18d7fae0d7.js`: cached peer
  connection/certificate prewarming, audio/video transceiver preparation and
  local-offer creation; instant-connect eligibility and four-hour cache TTL.
- `https://chatgpt.com/cdn/assets/async/586788.401e6630fd.js`: instant-connect
  controller, prior-voice/new-user/microphone-permission eligibility and idle work.
- Dot's captured creation stack also pointed into
  `982651.d1de81031c.js`, `204542.8e2b8524b1.js` and
  `async/83482.c182a38aea.js` through a `prewarm` call.

Only code, lifecycle events and sanitized connection/statistic summaries were
inspected. No microphone or camera permission was changed, and no audio samples,
SDP credentials or conversation text were included in the evidence.

## What this changes

The laptop can originate silence without Spotify generating it: Firefox creates
the native audio resource for a receive-capable WebRTC transceiver before a
remote peer, microphone or audible media exists. ChatGPT preparation can trigger
that behavior; Bose firmware then decides how to arbitrate its connected devices.

Version 1.3.0's release predicate began too late in the lifecycle. Version 1.3.1
also recognizes stale pre-offer audio preparation, restricted to stable signaling,
new connection/ICE states, absent local/remote descriptions, no live sender and
no active Voice Mode interface. Actual offers receive their own grace period.

## What remains unresolved

- The overnight tab's exact connection state was not captured before it was
  closed; the pre-offer finding is not proof of that incident's precise cause.
- Direct script injection does not validate Tampermonkey's real Firefox sandbox.
- Negotiated silent streams remain protected; the earlier negotiated Dot case
  was not reproduced by simply opening Dot in Chrome during this run.
- An overnight sleep/background/freeze transition was not simulated by changing
  clocks. A short browser test cannot establish overnight behavior.
- No browser, headset or OpenAI bug report was submitted automatically.

The upstream-browser report can use the blank-page reproduction. A ChatGPT
report can describe unnecessary background audio prewarming. Both reports should
keep the browser behavior, web-app trigger and headset decision distinct.
