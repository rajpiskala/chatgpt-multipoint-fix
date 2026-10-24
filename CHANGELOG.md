# Changelog

All notable changes to ChatGPT Multipoint Fix are documented
here.

## 1.3.0 - 2026-10-23

- Target the actual page WebRTC prototype through `unsafeWindow`, using
  Firefox's `exportFunction` and `cloneInto` bridge when available.
- Observe offer, description and track operations without replacing the native
  constructor, including when ChatGPT cached a constructor or blank connection.
- Publish readable page-context diagnostics and hook-health status. Show
  `Tracking lost` when another script replaces a hook, not a false clear state.
- Rename the idle debug label to `No stale offers`; it does not claim the OS or
  headset has released audio.
- Recheck on focus, visibility changes and page restoration. Keep the existing
  microphone, negotiated-session and Voice Mode protections.
- Add sandbox, cached-constructor, native-return and lifecycle regression tests.
- This update does not automatically close negotiated silent Dot connections.

## 1.2.1 — 2026-09-21

- Rename the public project and repository to ChatGPT Multipoint Fix.
- Rewrite the README in a warmer, more conversational voice and add section
  emojis inspired by Marvin Pilot.
- Keep the legacy userscript filename and internal identity so existing
  installations continue receiving updates after the rename.

## 1.2.0 — 2026-09-21

- Launch the script as a dedicated, documented open-source project.
- Add direct GitHub installation and update metadata.
- Rename the public project around the broader Bluetooth multipoint symptom.
- Document states, controls, shortcuts, privacy, troubleshooting, and safety
  behavior.
- Verify the cleanup path on Chrome 152 in addition to real-world Firefox use.

## 1.1.0 — 2026-09-21

- Hide the optional debug status button by default.
- Add Tampermonkey menu commands for the debug button, manual release, and
  diagnostics.
- Add dark-mode colors for every debug-button state.
- Persist the debug-button preference locally.

## 1.0.0 — 2026-09-21

- Detect ChatGPT audio-capable WebRTC offers that remain unanswered.
- Close stale offers automatically after a 15-second grace period.
- Protect active Voice Mode sessions and connections with live sender tracks.
- Add manual release, diagnostics, and regression tests.
