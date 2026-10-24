# Changelog

All notable changes to ChatGPT Multipoint Fix are documented
here.

## 1.3.1 - 2026-10-24

- Release stale audio preparation even when it never reaches a local SDP offer.
  Firefox on Windows can open a silent render stream at `addTransceiver('audio')`.
  Version 1.3.0 tracked this state but could not release it, even manually.
- Restrict the new case to no local or remote description, stable signaling,
  new connection/ICE states, no live sender and no active Voice Mode interface.
- Give a newly created offer its own 15-second grace period rather than inheriting
  the age of earlier audio preparation.
- Expose pre-offer and effective release ages in diagnostics. Rename the optional
  idle label to `Nothing to release` to cover both preparation stages without
  claiming that the operating system has released audio.
- Add classification and page-runtime regressions, plus a dated Chrome/Firefox
  comparison. This does not prove the latest overnight incident had this cause
  or expand cleanup to negotiated silent sessions.

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
