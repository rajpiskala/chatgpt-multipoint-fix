# How the ChatGPT Bluetooth audio fix works

## The observed failure

The distinctive failure pattern is:

1. Bluetooth multipoint headphones are connected to a computer and phone.
2. ChatGPT is open on the computer, but no audible ChatGPT audio or Voice Mode
   conversation is active.
3. Spotify, YouTube, podcasts, or other phone media pauses, stays silent, or
   immediately stops again.
4. Muting the ChatGPT tab does not release the headphones.
5. Closing every ChatGPT tab releases the headphones immediately.

This is narrower than a generic Bluetooth problem. The same symptoms can have
other causes, and this userscript intentionally does nothing unless a
ChatGPT-created WebRTC connection matches the stale pattern.

## The connection lifecycle

ChatGPT prepares real-time audio using WebRTC. In a normal negotiation, the
browser creates a local SDP offer and receives a remote SDP answer. OpenAI's
[Realtime API documentation](https://platform.openai.com/docs/api-reference/realtime?lang=javascript)
documents this offer-and-answer architecture for real-time WebRTC sessions,
although it does not document this specific ChatGPT web-app behavior.

In the observed failure mode, an audio-capable peer connection can remain at:

- local description: `offer`;
- remote description: absent;
- live sender track: absent; and
- visible ChatGPT Voice Mode: inactive.

The page is silent, but the browser and operating system may still treat the
computer as a meaningful audio source. Bluetooth multipoint firmware can then
refuse to hand playback to the phone or send a media-pause command back to it.

## What the userscript changes

The userscript runs at `document-start` in the page's main JavaScript world.
It wraps the native `RTCPeerConnection` constructor before ChatGPT creates
voice preconnections, then records each newly created connection.

Every second, it classifies those tracked connections. Automatic cleanup is
allowed only when all of these conditions remain true:

- the connection is not already closed;
- the local description is an SDP offer;
- the offer contains an audio media section;
- no remote description has arrived;
- no live sender track is attached;
- ChatGPT's Voice Mode interface is not active; and
- the offer has remained unanswered for at least 15 seconds.

An eligible connection is closed with the normal WebRTC `close()` method.
The userscript does not mute the tab, change the operating system's output
device, disconnect Bluetooth, or modify Spotify or YouTube.

## Why the script waits 15 seconds

An unanswered offer is not immediately stale. A slow network or a normal
ChatGPT startup path may need time to finish negotiation. The grace period
gives ChatGPT an opportunity to:

- apply the remote answer;
- attach a live audio sender; or
- enter visible Voice Mode.

Any of those changes protects the connection from cleanup.

## Why muting the tab may not help

Tab mute controls the audible output associated with a tab. It does not
necessarily close an underlying WebRTC peer connection or release every
browser/operating-system audio resource. The fix targets the stale connection
lifecycle rather than volume.

## Does an audio-capable connection mean ChatGPT is recording?

No. The presence of an audio media section or an open peer connection is not
proof that microphone audio is being captured or transmitted. Browser
microphone permission and the browser/operating-system recording indicator
are the relevant signals for microphone use.

## Runtime states

| State | Meaning |
| --- | --- |
| Clear | No tracked connection is currently eligible for release. |
| Warm | An unanswered audio offer is inside the grace period and can be released manually. |
| Released | The script recently closed at least one eligible connection. |
| Voice active | ChatGPT Voice Mode is visible, so cleanup is paused. |

The optional button is only a diagnostic display. Automatic cleanup continues
while the button is hidden.

## Diagnostic API

For local debugging, open the browser console on ChatGPT and inspect:

```javascript
window.__chatgptBoseAudio.getStatus()
```

Other available methods:

```javascript
window.__chatgptBoseAudio.log()
window.__chatgptBoseAudio.release('manual console check')
window.__chatgptBoseAudio.runAutomaticCheck()
window.__chatgptBoseAudio.setDebugButtonVisible(true)
```

Do not post unsanitized console output if it contains device names, URLs, or
other private information.

## Technical boundary

The script fixes one page-level cause. It cannot:

- change Bluetooth firmware arbitration;
- close audio streams owned by another application or browser tab;
- affect the native ChatGPT desktop application;
- repair pairing, codec, driver, or headset-call-profile problems; or
- guarantee support for untested hardware.

The implementation uses standard WebRTC properties documented by
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection).
