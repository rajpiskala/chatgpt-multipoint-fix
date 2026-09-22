// ==UserScript==
// @name         ChatGPT - Release Bose Multipoint Audio Lock
// @name:en      ChatGPT Bluetooth Multipoint Audio Fix
// @namespace    https://github.com/rajpiskala/scripts
// @version      1.2.0
// @description  Stops stale ChatGPT voice preconnections from blocking Bluetooth multipoint audio handoff.
// @author       Raj Piskala
// @match        https://chatgpt.com/*
// @homepageURL  https://github.com/rajpiskala/chatgpt-bluetooth-audio-fix
// @supportURL   https://github.com/rajpiskala/chatgpt-bluetooth-audio-fix/issues
// @updateURL    https://raw.githubusercontent.com/rajpiskala/chatgpt-bluetooth-audio-fix/main/src/chatgpt-bluetooth-audio-fix.user.js
// @downloadURL  https://raw.githubusercontent.com/rajpiskala/chatgpt-bluetooth-audio-fix/main/src/chatgpt-bluetooth-audio-fix.user.js
// @license      MIT
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @sandbox      raw
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    /*
     * PURPOSE
     * -------
     * ChatGPT can leave an unanswered WebRTC audio offer open before voice
     * mode starts. On some Bluetooth multipoint headphones, that silent
     * laptop stream can keep ownership of the headset and repeatedly pause
     * media playing from a phone. This script closes only stale, unanswered
     * audio offers; it leaves active ChatGPT voice sessions alone.
     *
     * STATES
     * ------
     * CLEAR:        no releasable ChatGPT audio preconnection is present.
     * WARM:         an unanswered audio offer is inside the 15-second grace
     *               period and can be released manually.
     * RELEASED:     the script recently closed at least one stale connection.
     * VOICE ACTIVE: ChatGPT voice mode is visible, so cleanup is paused.
     *
     * CONTROLS
     * --------
     * Tampermonkey menu:
     *   - Toggle debug status button
     *   - Release audio now
     *   - Log audio diagnostics
     *
     * Keyboard:
     *   - Alt+Shift+B releases eligible audio preconnections now.
     *   - Alt+Shift+D toggles the optional debug status button.
     *
     * The debug button is hidden by default. Its visibility is stored in
     * ChatGPT's local browser storage. Automatic cleanup remains enabled
     * whether the button is visible or hidden.
     */

    const VERSION = '1.2.0';
    const INSTANCE_KEY = '__chatgpt_bose_audio_release_v1__';
    const API_KEY = '__chatgptBoseAudio';
    const UI_ID = 'chatgpt-bose-audio-release';
    const DEBUG_BUTTON_STORAGE_KEY = 'chatgpt-bose-audio-debug-button-visible';
    const LOG_PREFIX = '[ChatGPT Bose Release]';

    const DEFAULT_CONFIG = Object.freeze({
        autoReleaseGraceMs: 15_000,
        checkIntervalMs: 1_000,
        releasedLabelDurationMs: 10_000,
        closedRecordRetentionMs: 5 * 60_000,
        debugButtonVisibleDefault: false,
    });

    function safeCall(fallback, callback) {
        try {
            return callback();
        } catch {
            return fallback;
        }
    }

    function getTransceivers(pc) {
        return safeCall([], () => Array.from(pc.getTransceivers?.() || []));
    }

    function getSenders(pc) {
        return safeCall([], () => Array.from(pc.getSenders?.() || []));
    }

    function hasAudioMediaSection(description, transceivers) {
        const sdp = description?.sdp || '';
        if (/^m=audio(?:\s|$)/m.test(sdp)) return true;

        return transceivers.some((transceiver) => {
            return transceiver?.receiver?.track?.kind === 'audio'
                || transceiver?.sender?.track?.kind === 'audio';
        });
    }

    function hasLiveSenderTrack(senders) {
        return senders.some((sender) => {
            const track = sender?.track;
            return Boolean(track && track.readyState !== 'ended');
        });
    }

    function createRecord(pc, id, now, creationStack = '') {
        return {
            id,
            pc,
            createdAt: now,
            offerSeenAt: null,
            closedAt: null,
            closedByScript: false,
            closeReason: '',
            creationStack,
        };
    }

    function inspectRecord(record, now, voiceUiActive, config = DEFAULT_CONFIG) {
        const { pc } = record;
        const signalingState = safeCall('unknown', () => pc.signalingState);
        const connectionState = safeCall('unknown', () => pc.connectionState);
        const iceConnectionState = safeCall('unknown', () => pc.iceConnectionState);
        const localDescription = safeCall(null, () => pc.localDescription);
        const remoteDescription = safeCall(null, () => pc.remoteDescription);
        const transceivers = getTransceivers(pc);
        const senders = getSenders(pc);
        const hasAudio = hasAudioMediaSection(localDescription, transceivers);
        const hasLiveSender = hasLiveSenderTrack(senders);
        const isClosed = signalingState === 'closed' || connectionState === 'closed';
        const isUnansweredAudioOffer = !isClosed
            && localDescription?.type === 'offer'
            && remoteDescription == null
            && hasAudio;

        if (isUnansweredAudioOffer && record.offerSeenAt == null) {
            record.offerSeenAt = now;
        }

        const offerAgeMs = record.offerSeenAt == null ? null : Math.max(0, now - record.offerSeenAt);
        const manualReleaseEligible = isUnansweredAudioOffer
            && !hasLiveSender
            && !voiceUiActive;
        const autoReleaseEligible = manualReleaseEligible
            && offerAgeMs >= config.autoReleaseGraceMs;

        return {
            id: record.id,
            ageMs: Math.max(0, now - record.createdAt),
            offerAgeMs,
            signalingState,
            connectionState,
            iceConnectionState,
            hasAudio,
            hasLiveSender,
            hasRemoteDescription: remoteDescription != null,
            isClosed,
            isUnansweredAudioOffer,
            voiceUiActive,
            manualReleaseEligible,
            autoReleaseEligible,
            closedByScript: record.closedByScript,
            closeReason: record.closeReason,
        };
    }

    function closeRecord(record, reason, now) {
        if (safeCall(false, () => record.pc.signalingState === 'closed')) return false;

        record.closedAt = now;
        record.closedByScript = true;
        record.closeReason = reason;

        try {
            record.pc.close();
            return true;
        } catch (error) {
            record.closeReason = `${reason}; close failed: ${String(error)}`;
            return false;
        }
    }

    function createConstructorWrapper(NativeRTCPeerConnection, onCreated) {
        function TrackedRTCPeerConnection(...args) {
            if (!new.target) {
                return Reflect.apply(NativeRTCPeerConnection, this, args);
            }

            const newTarget = new.target === TrackedRTCPeerConnection
                ? NativeRTCPeerConnection
                : new.target;
            const pc = Reflect.construct(NativeRTCPeerConnection, args, newTarget);

            try {
                onCreated(pc);
            } catch (error) {
                console.warn(LOG_PREFIX, 'Failed to track a peer connection', error);
            }

            return pc;
        }

        Object.setPrototypeOf(TrackedRTCPeerConnection, NativeRTCPeerConnection);
        TrackedRTCPeerConnection.prototype = NativeRTCPeerConnection.prototype;

        safeCall(undefined, () => {
            Object.defineProperty(TrackedRTCPeerConnection, 'name', {
                configurable: true,
                value: NativeRTCPeerConnection.name,
            });
        });

        return TrackedRTCPeerConnection;
    }

    function isVoiceUiActive(documentObject) {
        return Boolean(documentObject.querySelector('[aria-label="End voice mode"]'));
    }

    function formatDuration(milliseconds) {
        if (milliseconds == null) return 'unknown';
        if (milliseconds < 1_000) return `${Math.round(milliseconds)} ms`;
        return `${Math.round(milliseconds / 1_000)} s`;
    }

    function detectDarkMode(documentObject, pageWindow) {
        const root = documentObject.documentElement;
        const body = documentObject.body;

        if (root?.classList?.contains('dark') || body?.classList?.contains('dark')) return true;
        if (root?.classList?.contains('light') || body?.classList?.contains('light')) return false;
        if (root?.dataset?.theme === 'dark' || body?.dataset?.theme === 'dark') return true;
        if (root?.dataset?.theme === 'light' || body?.dataset?.theme === 'light') return false;

        const colorScheme = safeCall('', () => pageWindow.getComputedStyle(root).colorScheme || '');
        if (/\bdark\b/i.test(colorScheme) && !/\blight\b/i.test(colorScheme)) return true;
        if (/\blight\b/i.test(colorScheme) && !/\bdark\b/i.test(colorScheme)) return false;

        return safeCall(false, () => pageWindow.matchMedia('(prefers-color-scheme: dark)').matches);
    }

    function getButtonPalette(buttonState, darkMode) {
        const palettes = darkMode
            ? {
                clear: { background: '#2f2f2f', color: '#f4f4f5' },
                released: { background: '#052e16', color: '#bbf7d0' },
                voice: { background: '#172554', color: '#bfdbfe' },
                warm: { background: '#451a03', color: '#fde68a' },
            }
            : {
                clear: { background: '#f3f4f6', color: '#374151' },
                released: { background: '#dcfce7', color: '#14532d' },
                voice: { background: '#dbeafe', color: '#1e3a8a' },
                warm: { background: '#fef3c7', color: '#78350f' },
            };

        return {
            ...palettes[buttonState],
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.18)',
            boxShadow: darkMode
                ? '0 2px 10px rgba(0, 0, 0, 0.45)'
                : '0 2px 8px rgba(0, 0, 0, 0.16)',
        };
    }

    function install(pageWindow, documentObject, config = DEFAULT_CONFIG) {
        const NativeRTCPeerConnection = pageWindow.RTCPeerConnection;
        if (typeof NativeRTCPeerConnection !== 'function') return null;

        const records = new Map();
        const state = {
            nextId: 1,
            lastReleaseAt: 0,
            releasedCount: 0,
            checkTimer: 0,
            debugButtonVisible: safeCall(config.debugButtonVisibleDefault, () => {
                const storedValue = pageWindow.localStorage.getItem(DEBUG_BUTTON_STORAGE_KEY);
                return storedValue == null
                    ? config.debugButtonVisibleDefault
                    : storedValue === 'true';
            }),
        };

        function snapshots(now = Date.now()) {
            const voiceActive = isVoiceUiActive(documentObject);
            return Array.from(records.values(), (record) => {
                return inspectRecord(record, now, voiceActive, config);
            });
        }

        function pruneRecords(now) {
            for (const [pc, record] of records) {
                if (record.closedAt != null
                    && now - record.closedAt > config.closedRecordRetentionMs) {
                    records.delete(pc);
                }
            }
        }

        function status(now = Date.now()) {
            const peerConnections = snapshots(now);
            const warmConnections = peerConnections.filter((item) => item.manualReleaseEligible);
            const staleConnections = peerConnections.filter((item) => item.autoReleaseEligible);

            return {
                version: VERSION,
                trackedCount: peerConnections.filter((item) => !item.isClosed).length,
                warmCount: warmConnections.length,
                staleCount: staleConnections.length,
                voiceUiActive: isVoiceUiActive(documentObject),
                releasedCount: state.releasedCount,
                lastReleaseAt: state.lastReleaseAt || null,
                debugButtonVisible: state.debugButtonVisible,
                peerConnections,
            };
        }

        function removeButton() {
            documentObject.getElementById(UI_ID)?.remove();
        }

        function ensureButton() {
            if (!state.debugButtonVisible) {
                removeButton();
                return null;
            }

            let button = documentObject.getElementById(UI_ID);
            if (button || !documentObject.body) return button;

            button = documentObject.createElement('button');
            button.id = UI_ID;
            button.type = 'button';
            button.setAttribute('aria-live', 'polite');
            Object.assign(button.style, {
                position: 'fixed',
                right: '14px',
                bottom: '14px',
                zIndex: '2147483647',
                minWidth: '112px',
                height: '36px',
                padding: '0 12px',
                border: '1px solid',
                borderRadius: '6px',
                font: '600 13px/1 system-ui, sans-serif',
                letterSpacing: '0',
                cursor: 'pointer',
            });
            button.addEventListener('click', () => release('manual button'));
            documentObject.body.append(button);
            return button;
        }

        function updateButton(now = Date.now()) {
            const button = ensureButton();
            if (!button) return;

            const current = status(now);
            const warmConnection = current.peerConnections.find((item) => item.manualReleaseEligible);
            const justReleased = state.lastReleaseAt > 0
                && now - state.lastReleaseAt < config.releasedLabelDurationMs;

            button.disabled = current.voiceUiActive;
            let buttonState = 'clear';

            if (current.voiceUiActive) {
                button.textContent = 'Voice active';
                buttonState = 'voice';
                button.style.cursor = 'not-allowed';
            } else if (current.warmCount > 0) {
                button.textContent = current.warmCount === 1 ? 'Release audio' : `Release audio (${current.warmCount})`;
                buttonState = 'warm';
                button.style.cursor = 'pointer';
            } else if (justReleased) {
                button.textContent = 'Audio released';
                buttonState = 'released';
                button.style.cursor = 'pointer';
            } else {
                button.textContent = 'Audio clear';
                button.style.cursor = 'pointer';
            }

            Object.assign(
                button.style,
                getButtonPalette(buttonState, detectDarkMode(documentObject, pageWindow)),
            );

            const remainingMs = warmConnection?.offerAgeMs == null
                ? null
                : Math.max(0, config.autoReleaseGraceMs - warmConnection.offerAgeMs);
            const automaticText = remainingMs == null
                ? ''
                : ` Auto-release in ${formatDuration(remainingMs)}.`;
            button.title = current.voiceUiActive
                ? 'ChatGPT voice mode is active; cleanup is paused.'
                : `${current.warmCount} unanswered ChatGPT audio preconnection(s).${automaticText} ${state.releasedCount} released this page load.`;
        }

        function setDebugButtonVisible(visible) {
            state.debugButtonVisible = Boolean(visible);
            safeCall(undefined, () => {
                pageWindow.localStorage.setItem(
                    DEBUG_BUTTON_STORAGE_KEY,
                    String(state.debugButtonVisible),
                );
            });

            if (state.debugButtonVisible) updateButton();
            else removeButton();

            console.info(
                LOG_PREFIX,
                `Debug status button ${state.debugButtonVisible ? 'shown' : 'hidden'}`,
            );
            return state.debugButtonVisible;
        }

        function toggleDebugButton() {
            return setDebugButtonVisible(!state.debugButtonVisible);
        }

        function release(reason = 'manual') {
            const now = Date.now();
            const voiceActive = isVoiceUiActive(documentObject);
            let released = 0;

            for (const record of records.values()) {
                const snapshot = inspectRecord(record, now, voiceActive, config);
                if (!snapshot.manualReleaseEligible) continue;
                if (closeRecord(record, reason, now)) released += 1;
            }

            if (released > 0) {
                state.lastReleaseAt = now;
                state.releasedCount += released;
                console.info(LOG_PREFIX, `Released ${released} unanswered audio preconnection(s): ${reason}`);
            }

            updateButton(now);
            return released;
        }

        function automaticCheck() {
            const now = Date.now();
            const voiceActive = isVoiceUiActive(documentObject);
            let released = 0;

            for (const record of records.values()) {
                const snapshot = inspectRecord(record, now, voiceActive, config);
                if (!snapshot.autoReleaseEligible) continue;
                if (closeRecord(record, 'automatic stale preconnection cleanup', now)) released += 1;
            }

            if (released > 0) {
                state.lastReleaseAt = now;
                state.releasedCount += released;
                console.info(LOG_PREFIX, `Automatically released ${released} stale audio preconnection(s)`);
            }

            pruneRecords(now);
            updateButton(now);
            return released;
        }

        function logDiagnostics() {
            const current = status();
            console.info(LOG_PREFIX, current);
            console.table(current.peerConnections);
            return current;
        }

        function onPeerConnectionCreated(pc) {
            const record = createRecord(
                pc,
                state.nextId++,
                Date.now(),
                safeCall('', () => new Error('RTCPeerConnection created').stack || ''),
            );
            records.set(pc, record);

            for (const eventName of [
                'connectionstatechange',
                'iceconnectionstatechange',
                'signalingstatechange',
            ]) {
                safeCall(undefined, () => pc.addEventListener(eventName, () => updateButton()));
            }

            updateButton();
        }

        const WrappedRTCPeerConnection = createConstructorWrapper(
            NativeRTCPeerConnection,
            onPeerConnectionCreated,
        );
        pageWindow.RTCPeerConnection = WrappedRTCPeerConnection;

        const api = Object.freeze({
            version: VERSION,
            getStatus: status,
            log: logDiagnostics,
            release,
            runAutomaticCheck: automaticCheck,
            setDebugButtonVisible,
            toggleDebugButton,
        });
        pageWindow[API_KEY] = api;

        if (typeof GM_registerMenuCommand === 'function') {
            GM_registerMenuCommand('Toggle debug status button', toggleDebugButton);
            GM_registerMenuCommand('Release audio now', () => release('Tampermonkey menu'));
            GM_registerMenuCommand('Log audio diagnostics', logDiagnostics);
        }

        documentObject.addEventListener('keydown', (event) => {
            if (event.altKey && event.shiftKey && event.code === 'KeyB') {
                event.preventDefault();
                release('Alt+Shift+B');
            }
            if (event.altKey && event.shiftKey && event.code === 'KeyD') {
                event.preventDefault();
                toggleDebugButton();
            }
        }, true);

        if (documentObject.readyState === 'loading') {
            documentObject.addEventListener('DOMContentLoaded', () => updateButton(), { once: true });
        } else {
            updateButton();
        }

        state.checkTimer = pageWindow.setInterval(automaticCheck, config.checkIntervalMs);
        console.info(LOG_PREFIX, `Installed v${VERSION}; stale grace period is ${formatDuration(config.autoReleaseGraceMs)}`);

        return {
            api,
            nativeConstructor: NativeRTCPeerConnection,
            records,
            wrappedConstructor: WrappedRTCPeerConnection,
        };
    }

    const testExports = {
        DEFAULT_CONFIG,
        closeRecord,
        createConstructorWrapper,
        createRecord,
        detectDarkMode,
        getButtonPalette,
        hasAudioMediaSection,
        hasLiveSenderTrack,
        inspectRecord,
        install,
    };

    if (typeof module === 'object' && module.exports) {
        module.exports = testExports;
        return;
    }

    function boot() {
        if (window[INSTANCE_KEY]) return;

        const instance = install(window, document);
        if (instance) {
            window[INSTANCE_KEY] = instance;
            return;
        }

        window.setTimeout(boot, 10);
    }

    boot();
}());
