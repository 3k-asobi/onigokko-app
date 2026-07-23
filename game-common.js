/* --- game-common.js (全ゲーム共通の便利機能) --- */

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function speak(text, customRate = 1.1, lang = 'ja-JP', onEndCallback = null) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = customRate;
        if (onEndCallback) {
            utterance.onend = onEndCallback;
        }
        window.speechSynthesis.speak(utterance);
    } else if (onEndCallback) {
        onEndCallback();
    }
}

function speakEnglishTimesUp() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Time's up!");
        utterance.lang = 'en-US';
        utterance.volume = 1.0;
        utterance.rate = 0.95;
        utterance.pitch = 1.25;
        window.speechSynthesis.speak(utterance);
    }
}

function playBeep(isHigh = false) {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHigh ? 1200 : 800, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playWhistle(callback) {
    const whistleAudio = new Audio('whistle.mp3');
    whistleAudio.volume = 1.0;

    whistleAudio.play()
        .then(() => {
            whistleAudio.onended = () => {
                callback();
            };
        })
        .catch((error) => {
            console.warn("ホイッスル音声の再生に失敗しました:", error);
            setTimeout(callback, 100);
        });
}

function playStartSequenceBeeps(callback) {
    initAudio();
    const now = audioCtx.currentTime;
    
    const beeps = [
        { time: 0.0, freq: 800 },
        { time: 0.7, freq: 800 },
        { time: 1.4, freq: 800 },
        { time: 2.1, freq: 1200, duration: 0.4 }
    ];

    beeps.forEach((beep) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(beep.freq, now + beep.time);
        
        const dur = beep.duration || 0.1;
        gain.gain.setValueAtTime(0.1, now + beep.time);
        gain.gain.linearRampToValueAtTime(0.01, now + beep.time + dur);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + beep.time);
        osc.stop(now + beep.time + dur);
    });

    setTimeout(callback, 2100);
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function closeResultModal() {
    document.getElementById('result-overlay').style.display = 'none';
}