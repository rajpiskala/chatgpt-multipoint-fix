import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));
const source = fs.readFileSync(
  new URL('../src/chatgpt-bluetooth-audio-fix.user.js', import.meta.url),
  'utf8',
);

const requiredMetadata = [
  '// @name         ChatGPT - Release Bose Multipoint Audio Lock',
  '// @name:en      ChatGPT Bluetooth Multipoint Audio Fix',
  '// @namespace    https://github.com/rajpiskala/scripts',
  '// @match        https://chatgpt.com/*',
  '// @grant        GM_registerMenuCommand',
  '// @run-at       document-start',
  '// @sandbox      raw',
  '// @noframes',
  '// @license      MIT',
  'raw.githubusercontent.com/rajpiskala/chatgpt-bluetooth-audio-fix/main/',
];

for (const entry of requiredMetadata) {
  if (!source.includes(entry)) {
    throw new Error('Missing required userscript metadata: ' + entry);
  }
}

const metadataVersion = source.match(/^\/\/ @version\s+(\S+)$/m)?.[1];
const runtimeVersion = source.match(/^\s*const VERSION = '(\S+)';$/m)?.[1];

if (metadataVersion !== packageJson.version || runtimeVersion !== packageJson.version) {
  throw new Error(
    'Version mismatch: package=' + packageJson.version
      + ', metadata=' + metadataVersion
      + ', runtime=' + runtimeVersion,
  );
}

console.log('Verified userscript metadata and version ' + packageJson.version + '.');
