# Contributing

Bug reports, compatibility reports, and focused pull requests are welcome.

## Report a compatibility result

Please include:

- headset manufacturer and exact model;
- computer operating system;
- browser and browser version;
- userscript manager and version;
- second paired device;
- whether phone playback pauses, stays silent, or never starts;
- whether closing every ChatGPT tab immediately releases the headphones;
- whether muting the ChatGPT tab helps;
- whether ChatGPT Voice Mode was active; and
- userscript version.

Remove conversation text, account information, device names, and other private
details from screenshots or logs.

## Development

Requirements: Node.js 20 or newer and npm.

```console
npm ci
npm run check
```

Changes to connection classification or release behavior should include a
regression test. Changes to permissions, storage, or network behavior must
also update `PRIVACY.md`, `SECURITY.md`, and the README.

Keep the userscript readable and self-contained. Do not add remote executable
code, analytics, telemetry, or unrelated functionality.
