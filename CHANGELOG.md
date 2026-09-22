# Changelog

All notable changes to ChatGPT Bluetooth Multipoint Audio Fix are documented
here.

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
