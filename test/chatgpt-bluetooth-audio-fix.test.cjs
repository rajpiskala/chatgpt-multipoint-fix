const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    DEFAULT_CONFIG,
    closeRecord,
    createRecord,
    getButtonPalette,
    inspectRecord,
    resolvePageWindow,
} = require('../src/chatgpt-bluetooth-audio-fix.user.js');

class FakeRTCPeerConnection {
    static generateCertificate() {
        return 'certificate';
    }

    constructor(configuration) {
        this.configuration = configuration;
        this.signalingState = 'new';
        this.connectionState = 'new';
        this.iceConnectionState = 'new';
        this.localDescription = null;
        this.remoteDescription = null;
        this.transceivers = [];
        this.senders = [];
        this.closeCalls = 0;
    }

    getTransceivers() {
        return this.transceivers;
    }

    getSenders() {
        return this.senders;
    }

    close() {
        this.closeCalls += 1;
        this.signalingState = 'closed';
        this.connectionState = 'closed';
    }
}

function makeWarmConnection() {
    const pc = new FakeRTCPeerConnection();
    pc.signalingState = 'have-local-offer';
    pc.localDescription = {
        type: 'offer',
        sdp: [
            'v=0',
            'm=audio 9 UDP/TLS/RTP/SAVPF 111',
            'a=sendrecv',
            'm=video 9 UDP/TLS/RTP/SAVPF 96',
            'a=sendonly',
        ].join('\r\n'),
    };
    pc.transceivers = [{
        receiver: { track: { kind: 'audio', readyState: 'live' } },
        sender: { track: null },
    }];
    pc.senders = [{ track: null }];
    return pc;
}

function makePreOfferConnection() {
    const pc = makeWarmConnection();
    pc.signalingState = 'stable';
    pc.localDescription = null;
    return pc;
}

test('resolves Firefox page objects rather than a userscript window shadow', () => {
    const page = { RTCPeerConnection: FakeRTCPeerConnection };
    const sandbox = { wrappedJSObject: page };
    assert.equal(resolvePageWindow(sandbox), page);
    assert.equal(resolvePageWindow({}, sandbox), page);
    assert.equal(resolvePageWindow(page), page);
});

test('ignores the blank peer connection ChatGPT keeps as a constructor cache', () => {
    const record = createRecord(new FakeRTCPeerConnection(), 1, 0);
    const snapshot = inspectRecord(record, 30_000, false);

    assert.equal(snapshot.hasAudio, false);
    assert.equal(snapshot.isUnansweredAudioOffer, false);
    assert.equal(snapshot.manualReleaseEligible, false);
    assert.equal(snapshot.autoReleaseEligible, false);
});

test('releases an unanswered audio offer only after the automatic grace period', () => {
    const record = createRecord(makeWarmConnection(), 1, 0);

    const first = inspectRecord(record, 1_000, false);
    assert.equal(first.manualReleaseEligible, true);
    assert.equal(first.autoReleaseEligible, false);

    const stale = inspectRecord(
        record,
        1_000 + DEFAULT_CONFIG.autoReleaseGraceMs,
        false,
    );
    assert.equal(stale.autoReleaseEligible, true);
});

test('releases a stale audio transceiver even before a local offer exists', () => {
    const record = createRecord(makePreOfferConnection(), 1, 0);
    const first = inspectRecord(record, 1_000, false);
    assert.equal(first.isPreOfferAudioConnection, true);
    assert.equal(first.isUnansweredAudioOffer, false);
    assert.equal(first.manualReleaseEligible, true);
    assert.equal(first.autoReleaseEligible, false);
    assert.equal(first.releaseAgeMs, 0);

    const stale = inspectRecord(record, 1_000 + DEFAULT_CONFIG.autoReleaseGraceMs, false);
    assert.equal(stale.offerAgeMs, null);
    assert.equal(stale.preOfferAgeMs, DEFAULT_CONFIG.autoReleaseGraceMs);
    assert.equal(stale.autoReleaseEligible, true);
});

test('a new local offer receives its own grace period after pre-offer preparation', () => {
    const pc = makePreOfferConnection();
    const record = createRecord(pc, 1, 0);
    inspectRecord(record, 0, false);
    pc.localDescription = { type: 'offer', sdp: 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' };
    pc.signalingState = 'have-local-offer';
    const offer = inspectRecord(record, 14_000, false);
    assert.equal(offer.isPreOfferAudioConnection, false);
    assert.equal(offer.releaseAgeMs, 0);
    assert.equal(inspectRecord(record, 16_000, false).autoReleaseEligible, false);
    assert.equal(inspectRecord(record, 29_000, false).autoReleaseEligible, true);

    pc.localDescription = null;
    pc.signalingState = 'stable';
    const rollback = inspectRecord(record, 30_000, false);
    assert.equal(rollback.preOfferAgeMs, 0);
    assert.equal(rollback.autoReleaseEligible, false);

    pc.localDescription = { type: 'offer', sdp: 'v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n' };
    pc.signalingState = 'have-local-offer';
    const retry = inspectRecord(record, 44_000, false);
    assert.equal(retry.offerAgeMs, 0);
    assert.equal(retry.autoReleaseEligible, false);
    assert.equal(inspectRecord(record, 46_000, false).autoReleaseEligible, false);
    assert.equal(inspectRecord(record, 59_000, false).autoReleaseEligible, true);
});

test('pre-offer cleanup retains voice, sender and negotiation protections', () => {
    const cases = [
        { name: 'live microphone', change: pc => { pc.senders = [{ track: { kind: 'audio', readyState: 'live' } }]; } },
        { name: 'remote offer', change: pc => { pc.remoteDescription = { type: 'offer', sdp: 'v=0' }; } },
        { name: 'connected transport', change: pc => { pc.connectionState = 'connected'; } },
        { name: 'ICE checking', change: pc => { pc.iceConnectionState = 'checking'; } },
        { name: 'unknown signaling', change: pc => { pc.signalingState = 'unknown'; } },
        { name: 'voice interface', voice: true, change() {} },
        { name: 'video only', change: pc => { pc.transceivers[0].receiver.track.kind = 'video'; } },
    ];
    for (const item of cases) {
        const pc = makePreOfferConnection();
        item.change(pc);
        const record = createRecord(pc, 1, 0);
        inspectRecord(record, 0, Boolean(item.voice));
        const snapshot = inspectRecord(record, 60_000, Boolean(item.voice));
        assert.equal(snapshot.manualReleaseEligible, false, item.name);
        assert.equal(snapshot.autoReleaseEligible, false, item.name);
    }
});

test('protects a voice connection once a live microphone sender is attached', () => {
    const pc = makeWarmConnection();
    pc.senders = [{ track: { kind: 'audio', readyState: 'live' } }];
    const record = createRecord(pc, 1, 0);

    const snapshot = inspectRecord(record, 60_000, false);
    assert.equal(snapshot.hasLiveSender, true);
    assert.equal(snapshot.manualReleaseEligible, false);
    assert.equal(snapshot.autoReleaseEligible, false);
});

test('protects a connection after ChatGPT applies the server answer', () => {
    const pc = makeWarmConnection();
    pc.remoteDescription = { type: 'answer', sdp: 'v=0' };
    pc.signalingState = 'stable';
    const record = createRecord(pc, 1, 0);

    const snapshot = inspectRecord(record, 60_000, false);
    assert.equal(snapshot.hasRemoteDescription, true);
    assert.equal(snapshot.isUnansweredAudioOffer, false);
    assert.equal(snapshot.manualReleaseEligible, false);
});

test('pauses cleanup while ChatGPT displays active voice mode', () => {
    const record = createRecord(makeWarmConnection(), 1, 0);
    inspectRecord(record, 0, true);

    const snapshot = inspectRecord(record, 60_000, true);
    assert.equal(snapshot.voiceUiActive, true);
    assert.equal(snapshot.manualReleaseEligible, false);
    assert.equal(snapshot.autoReleaseEligible, false);
});

test('marks and closes a selected preconnection exactly once', () => {
    const pc = makeWarmConnection();
    const record = createRecord(pc, 1, 0);

    assert.equal(closeRecord(record, 'test cleanup', 20_000), true);
    assert.equal(pc.closeCalls, 1);
    assert.equal(record.closedByScript, true);
    assert.equal(record.closeReason, 'test cleanup');
    assert.equal(closeRecord(record, 'duplicate cleanup', 21_000), false);
    assert.equal(pc.closeCalls, 1);
});

test('debug status button defaults to hidden and has a dark-mode palette', () => {
    const darkClear = getButtonPalette('clear', true);

    assert.equal(DEFAULT_CONFIG.debugButtonVisibleDefault, false);
    assert.equal(darkClear.background, '#2f2f2f');
    assert.equal(darkClear.color, '#f4f4f5');
    assert.equal(darkClear.borderColor, 'rgba(255, 255, 255, 0.18)');
});

test('userscript metadata requests early injection with explicit page-world access', () => {
    const sourcePath = path.join(
        __dirname,
        '..',
        'src',
        'chatgpt-bluetooth-audio-fix.user.js',
    );
    const source = fs.readFileSync(sourcePath, 'utf8');

    assert.match(source, /@version\s+1\.3\.1/);
    assert.match(source, /@run-at\s+document-start/);
    assert.match(source, /@sandbox\s+JavaScript/);
    assert.match(source, /@grant\s+unsafeWindow/);
    assert.match(source, /@grant\s+GM_registerMenuCommand/);
    assert.match(source, /GM_registerMenuCommand\('Toggle debug status button'/);
});
