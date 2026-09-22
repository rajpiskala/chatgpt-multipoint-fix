const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
    DEFAULT_CONFIG,
    closeRecord,
    createConstructorWrapper,
    createRecord,
    getButtonPalette,
    inspectRecord,
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

test('constructor wrapper preserves WebRTC construction and static APIs', () => {
    const created = [];
    const Wrapped = createConstructorWrapper(FakeRTCPeerConnection, (pc) => created.push(pc));
    const pc = new Wrapped({ bundlePolicy: 'max-bundle' });

    assert.equal(created.length, 1);
    assert.equal(created[0], pc);
    assert.equal(pc.configuration.bundlePolicy, 'max-bundle');
    assert.equal(pc instanceof FakeRTCPeerConnection, true);
    assert.equal(pc instanceof Wrapped, true);
    assert.equal(Wrapped.generateCertificate(), 'certificate');
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

test('userscript metadata requests early main-world Firefox injection', () => {
    const sourcePath = path.join(
        __dirname,
        '..',
        'src',
        'chatgpt-bluetooth-audio-fix.user.js',
    );
    const source = fs.readFileSync(sourcePath, 'utf8');

    assert.match(source, /@version\s+1\.2\.1/);
    assert.match(source, /@run-at\s+document-start/);
    assert.match(source, /@sandbox\s+raw/);
    assert.match(source, /@grant\s+GM_registerMenuCommand/);
    assert.match(source, /GM_registerMenuCommand\('Toggle debug status button'/);
});
