let currentLevel = 1;

function setLevel(n) {
    clearInterval(l1HintTimer);
    currentLevel = n;
    document.querySelectorAll('.level-btn').forEach(b => b.classList.toggle('active', b.dataset.level === String(n)));
    document.getElementById('level1-area').style.display = n === 1 ? 'block' : 'none';
    document.getElementById('level2-area').style.display = n === 2 ? 'block' : 'none';
    document.getElementById('level3-area').style.display = n === 3 ? 'block' : 'none';
    document.getElementById('level4-area').style.display = n === 4 ? 'block' : 'none';

    if (n === 1) {
        l1Score = 0; l1Attempts = 0; l1Streak = 0;
        document.getElementById('score-val-1').textContent = '0';
        document.getElementById('attempts-val-1').textContent = '0';
        nextL1();
    } else if (n === 2) {
        l2Score = 0; l2Attempts = 0; l2Streak = 0;
        document.getElementById('score-val-2').textContent = '0';
        document.getElementById('attempts-val-2').textContent = '0';
        document.getElementById('streak-l2').textContent = '';
        nextCard();
    } else if (n === 3) {
        l3Score = 0; l3Attempts = 0; l3Streak = 0;
        document.getElementById('score-val-3').textContent = '0';
        document.getElementById('attempts-val-3').textContent = '0';
        nextL3();
    } else {
        l4Score = 0; l4Attempts = 0; l4Streak = 0;
        document.getElementById('score-val-4').textContent = '0';
        document.getElementById('attempts-val-4').textContent = '0';
        nextL4();
    }
}

function animateAircraft(el, name) {
    el.classList.remove('arrive', 'depart', 'shake');
    void el.offsetWidth; // restart the animation
    el.classList.add(name);
    // "depart" stays on, so the airplane stays off screen until the next one arrives.
    if (name !== 'depart') {
        el.addEventListener('animationend', () => el.classList.remove(name), { once: true });
    }
}

// ── Sound: a short radio squelch, made with Web Audio ──
let audioCtx = null;
let soundOn = localStorage.getItem('phonetic-sound') !== 'off';

function getAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!audioCtx) audioCtx = new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

function playSquelch() {
    if (!soundOn) return;
    const ctx = getAudio();
    if (!ctx) return;
    const t = ctx.currentTime;
    const len = 0.22;

    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1800;
    band.Q.value = 0.7;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + len);

    noise.connect(band).connect(gain).connect(ctx.destination);
    noise.start(t);
    noise.stop(t + len);
}

function renderSoundBtn() {
    document.getElementById('sound-btn').textContent = soundOn ? 'Sound on' : 'Sound off';
}

function toggleSound() {
    soundOn = !soundOn;
    localStorage.setItem('phonetic-sound', soundOn ? 'on' : 'off');
    renderSoundBtn();
}

// Browsers only allow audio after a user gesture. Level 4 plays the sound
// from a speech callback, so unlock audio on the first tap or key press.
['pointerdown', 'keydown'].forEach(type =>
    document.addEventListener(type, () => { if (soundOn) getAudio(); }, { once: true }));

document.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    if (currentLevel === 1) {
        if (l1Answered) nextL1(); else submitL1();
    } else if (currentLevel === 2) {
        if (l2Answered) nextCard(); else checkAnswer();
    } else if (currentLevel === 3) {
        if (l3Answered) nextL3(); else submitL3();
    } else {
        if (l4Answered) nextL4();
    }
});

renderSoundBtn();
// Open on Voice, the most fun level. Browsers without speech input (e.g. Firefox) open on Tail numbers.
const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
setLevel(speechSupported ? 4 : 3);
