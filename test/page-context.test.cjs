const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../src/chatgpt-bluetooth-audio-fix.user.js'), 'utf8');

function makeBrowser({ sandbox = false, commonJs = false } = {}) {
    let now = 1000;
    const intervals = [];
    const events = new Map();
    const exports = [];
    const attributes = new Map();
    class PeerConnection {
        static generateCertificate() { return 'certificate'; }
        constructor() {
            this.signalingState = 'stable';
            this.connectionState = 'new';
            this.iceConnectionState = 'new';
            this.localDescription = null;
            this.remoteDescription = null;
            this.senders = [];
            this.transceivers = [];
            this.closeCalls = 0;
        }
        createOffer() {
            this.offerPromise = Promise.resolve({ type: 'offer', sdp: 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' });
            return this.offerPromise;
        }
        createAnswer() { return Promise.resolve({ type: 'answer', sdp: 'v=0' }); }
        setLocalDescription(description) { this.localDescription = description; return Promise.resolve(); }
        setRemoteDescription(description) { this.remoteDescription = description; return Promise.resolve(); }
        addTransceiver(kind) {
            const result = { receiver: { track: { kind, readyState: 'live' } }, sender: { track: null } };
            this.transceivers.push(result);
            return result;
        }
        addTrack(track) {
            if (track instanceof Error) throw track;
            const sender = { track };
            this.senders.push(sender);
            return sender;
        }
        getSenders() { return this.senders; }
        getTransceivers() { return this.transceivers; }
        addEventListener() {}
        close() { this.closeCalls++; this.signalingState = 'closed'; this.connectionState = 'closed'; }
    }
    const cachedConstructor = PeerConnection;
    const cachedConnection = new cachedConstructor();
    const document = {
        readyState: 'loading', hidden: false, body: null,
        documentElement: { setAttribute: (key, value) => attributes.set(key, value) },
        querySelector: () => null,
        getElementById: () => null,
        addEventListener: (name, callback) => events.set(name, callback),
    };
    const page = {
        RTCPeerConnection: PeerConnection,
        Object,
        localStorage: { getItem: () => null, setItem() {} },
        setInterval: callback => { intervals.push(callback); return intervals.length; },
        setTimeout() {},
        addEventListener: (name, callback) => events.set(name, callback),
    };
    const localWindow = sandbox ? Object.create(page) : page;
    if (sandbox) localWindow.wrappedJSObject = page;
    const context = {
        window: localWindow, unsafeWindow: page, document,
        console: { info() {}, warn() {}, error() {}, table() {} },
        Date: { now: () => now },
        GM_registerMenuCommand() {},
        exportFunction: (callback, scope) => { exports.push(scope); return callback; },
        cloneInto: value => structuredClone(value),
        ...(commonJs ? { module: { exports: {} } } : {}),
    };
    return {
        page, localWindow, cachedConstructor, cachedConnection, intervals, events, exports, attributes,
        advance: milliseconds => { now += milliseconds; },
        boot: () => vm.runInNewContext(source, context),
    };
}

test('installs tracking and readable diagnostics on the real page, not a sandbox shadow', async () => {
    const browser = makeBrowser({ sandbox: true });
    browser.boot();
    assert.ok(browser.page.__chatgptBoseAudio, 'page API must be visible outside the userscript sandbox');
    const pc = new browser.page.RTCPeerConnection();
    await pc.setLocalDescription(await pc.createOffer());
    assert.equal(browser.page.__chatgptBoseAudio.getStatus().trackedCount, 1);
    assert.ok(browser.exports.length > 0, 'Firefox functions must be explicitly exported to the page');
});

test('observes a cached constructor and an existing blank connection when they start audio', async () => {
    const browser = makeBrowser();
    browser.boot();
    const pc = browser.cachedConnection;
    await pc.setLocalDescription(await pc.createOffer());
    assert.equal(browser.page.__chatgptBoseAudio.getStatus().warmCount, 1);
    browser.advance(16000);
    browser.page.__chatgptBoseAudio.runAutomaticCheck();
    assert.equal(pc.closeCalls, 1);
    assert.equal(browser.page.RTCPeerConnection, browser.cachedConstructor, 'native constructor must stay intact');
    assert.equal(browser.page.RTCPeerConnection.generateCertificate(), 'certificate');
});

test('native promises and synchronous exceptions keep their identity', () => {
    const browser = makeBrowser();
    browser.boot();
    const pc = new browser.cachedConstructor();
    assert.equal(pc.createOffer(), pc.offerPromise);
    const failure = new Error('native addTrack failure');
    assert.throws(() => pc.addTrack(failure), error => error === failure);
});

test('tracks and automatically closes audio preparation that never reaches createOffer', () => {
    const browser = makeBrowser();
    browser.boot();
    const pc = browser.cachedConnection;
    pc.addTransceiver('audio');
    const status = browser.page.__chatgptBoseAudio.getStatus();
    assert.equal(status.trackedCount, 1);
    assert.equal(status.warmCount, 1);
    assert.equal(status.peerConnections[0].isPreOfferAudioConnection, true);
    browser.advance(16000);
    browser.intervals[0]();
    assert.equal(pc.closeCalls, 1);
    assert.equal(browser.page.__chatgptBoseAudio.getStatus().releasedCount, 1);
});

test('manual release closes a pre-offer audio connection exactly once', () => {
    const browser = makeBrowser();
    browser.boot();
    const pc = browser.cachedConnection;
    pc.addTransceiver('audio');
    assert.equal(browser.page.__chatgptBoseAudio.release('manual pre-offer test'), 1);
    assert.equal(browser.page.__chatgptBoseAudio.release('repeated release'), 0);
    assert.equal(pc.closeCalls, 1);
});

test('sandbox tracking preserves microphone and negotiated-session protections', async () => {
    const browser = makeBrowser({ sandbox: true });
    browser.boot();
    const microphone = new browser.cachedConstructor();
    microphone.addTrack({ kind: 'audio', readyState: 'live' });
    await microphone.setLocalDescription(await microphone.createOffer());
    const negotiated = new browser.cachedConstructor();
    await negotiated.setLocalDescription(await negotiated.createOffer());
    await negotiated.setRemoteDescription({ type: 'answer', sdp: 'v=0' });
    browser.page.__chatgptBoseAudio.getStatus();
    browser.advance(60000);
    browser.page.__chatgptBoseAudio.runAutomaticCheck();
    assert.equal(microphone.closeCalls, 0);
    assert.equal(negotiated.closeCalls, 0);
});

test('does not take the Node export branch merely because a web page defines module.exports', () => {
    const browser = makeBrowser({ commonJs: true });
    browser.boot();
    assert.ok(browser.page.__chatgptBoseAudio);
});

test('diagnostics report a replaced prototype hook instead of silently claiming healthy tracking', () => {
    const browser = makeBrowser();
    browser.boot();
    assert.equal(browser.page.__chatgptBoseAudio.getStatus().trackingHealthy, true);
    browser.page.RTCPeerConnection.prototype.createOffer = () => Promise.resolve({ type: 'offer', sdp: 'v=0' });
    assert.equal(browser.page.__chatgptBoseAudio.getStatus().trackingHealthy, false);
});

test('multiple setup calls register one PC and focus rechecks an expired offer', async () => {
    const browser = makeBrowser();
    browser.boot();
    const pc = new browser.cachedConstructor();
    pc.addTransceiver('audio');
    await pc.setLocalDescription(await pc.createOffer());
    assert.equal(browser.page.__chatgptBoseAudio.getStatus().trackedCount, 1);
    browser.advance(16000);
    browser.events.get('focus')();
    assert.equal(pc.closeCalls, 1);
});

test('a failed hook installation restores methods already changed', () => {
    const browser = makeBrowser();
    const prototype = browser.cachedConstructor.prototype;
    const originalCreateOffer = prototype.createOffer;
    Object.defineProperty(prototype, 'setLocalDescription', {
        value: prototype.setLocalDescription, writable: false, configurable: false,
    });
    assert.throws(() => browser.boot(), /redefine|read.only|configurable/i);
    assert.equal(prototype.createOffer, originalCreateOffer);
    assert.equal(browser.page.__chatgptBoseAudio, undefined);
});

test('page diagnostics expose no native handles, records or extension APIs', () => {
    const browser = makeBrowser({ sandbox: true });
    browser.boot();
    assert.deepEqual(Object.keys(browser.page.__chatgptBoseAudio).sort(), [
        'getStatus', 'log', 'release', 'runAutomaticCheck', 'setDebugButtonVisible',
        'toggleDebugButton', 'version',
    ]);
    assert.equal(browser.page.__chatgptBoseAudio.records, undefined);
    assert.equal(browser.page.__chatgptBoseAudio.GM_registerMenuCommand, undefined);
});
