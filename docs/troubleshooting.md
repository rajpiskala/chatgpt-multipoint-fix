# Troubleshooting

## Closing every ChatGPT tab does not release the headphones

This probably is not the failure mode this script targets. Check for another
browser tab, communications app, game, media player, virtual audio device, or
operating-system sound holding the headset.

The strongest diagnostic for this project is that closing all ChatGPT tabs
immediately restores phone playback.

## Muting ChatGPT does not release the headphones

That behavior is expected for the targeted bug. Muting changes volume but may
leave the underlying WebRTC connection and system audio path open. The script
closes only the stale connection.

## The script appears enabled but nothing changes

1. Reload every open ChatGPT tab after installing or updating.
2. Confirm the active URL begins with `https://chatgpt.com/`.
3. Open Tampermonkey's page menu and confirm the project commands appear.
4. Select **Log audio diagnostics** and inspect the browser console.
5. Confirm the installed version matches the latest release.
6. Temporarily disable other ChatGPT userscripts and retest for conflicts.

## The debug button is missing

That is the default. The button is optional debugging UI; automatic cleanup is
still active.

Show it through **Toggle debug status button** in Tampermonkey's menu or press
`Alt+Shift+D`.

## The button appears but the page diagnostic API is missing

This can indicate that an older version installed its tracking code in a
userscript sandbox rather than the page's own JavaScript world. Update to 1.3.0
and reload all existing ChatGPT tabs. The script now explicitly bridges to the
page and exposes `trackingHealthy` in `getStatus()`.

## The button says "Tracking lost"

Another script replaced an observed WebRTC method, or the page constructor now
uses an uninstrumented prototype. Tracking is not verified. Reload the page and
compare with other WebRTC-modifying scripts disabled; do not treat this state
as a successful Bluetooth release.

## The button says “Voice active”

The script detected ChatGPT's active Voice Mode interface and paused cleanup
to protect the conversation. End Voice Mode before manually releasing stale
connections.

## The button says “Release audio”

An unanswered audio offer is inside the grace period. Wait for automatic
cleanup or click the button / press `Alt+Shift+B` to release it immediately.

## Does this work in the ChatGPT desktop application?

No. Tampermonkey runs in supported web browsers. It cannot inject into
OpenAI's native or Electron desktop application.

## Does this work with non-Bose headphones?

The mechanism is not inherently Bose-specific, but compatibility depends on
the browser, operating system, headset firmware, and exact cause of the audio
lock. Please report verified results instead of assuming support.

## ChatGPT Voice Mode stopped working

Disable the userscript and reload ChatGPT to compare behavior. If the problem
occurs only with the script:

1. record the browser and version;
2. record whether the Voice Mode interface was visible;
3. use **Log audio diagnostics**;
4. sanitize the output; and
5. open a bug report.

The script is designed not to close answered connections, connections with a
live sender track, or connections while Voice Mode is visible.
