let l4Plate = '', l4Score = 0, l4Attempts = 0, l4Streak = 0, l4Answered = false;
let l4Listening = false, l4LastTranscript = '';
let l4HardStopTimer = null, recognition = null;
const L4_MAX_SECONDS = 15;

const aliases = {
    'alfa': 'alpha', 'juliet': 'juliet', 'niner': '9', 'nine': '9',
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8',
    'x-ray': 'x-ray', 'xray': 'x-ray', 'ex-ray': 'x-ray', 'x ray': 'x-ray',
    'vermont': 'victor', 'viktor': 'victor', 'vick': 'victor', 'vicker': 'victor',
    'november': 'november', 'noviembre': 'november',
    'kilo': 'kilo', 'kilowatt': 'kilo',
    'whisky': 'whiskey', 'yanky': 'yankee', 'juliette': 'juliet',
};

function normalise(word) {
    const w = word.toLowerCase().trim();
    return aliases[w] || w;
}

function nextL4() {
    let newPlate;
    do { newPlate = generatePlate(); } while (newPlate === l4Plate);
    l4Plate = newPlate;
    l4Answered = false;

    const plateEl = document.getElementById('plate-number-l4');
    plateEl.textContent = l4Plate;
    plateEl.classList.remove('shake');
    plateEl.classList.add('pop');
    plateEl.addEventListener('animationend', () => plateEl.classList.remove('pop'), { once: true });

    const tokens = plateToPhonetic(l4Plate);
    document.getElementById('plate-example-l4').textContent = `Say: "${tokens.join(' ')}"`;

    clearTimeout(l4HardStopTimer);
    l4Listening = false;
    l4LastTranscript = '';
    document.getElementById('transcript-box').textContent = '';
    document.getElementById('feedback-l4').textContent = '';
    document.getElementById('feedback-l4').className = 'feedback';
    document.getElementById('token-row-l4').innerHTML = '';
    document.getElementById('next-btn-l4').style.display = 'none';
    document.getElementById('mic-btn').disabled = false;
    document.getElementById('mic-btn').classList.remove('listening');
    document.getElementById('mic-label').textContent = 'Tap to Transmit';
    document.getElementById('mic-status').textContent = 'Tap to begin transmission';
}

function initRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = 'en-US';
    r.onresult = e => {
        const transcript = Array.from(e.results).map(res => res[0].transcript).join(' ');
        l4LastTranscript = transcript;
        document.getElementById('transcript-box').textContent = transcript;
    };
    r.onerror = e => {
        document.getElementById('mic-status').textContent = `Error: ${e.error}`;
        document.getElementById('mic-btn').classList.remove('listening');
    };
    r.onend = () => {
        l4Listening = false;
        document.getElementById('mic-btn').classList.remove('listening');
        document.getElementById('mic-label').textContent = 'Tap to Transmit';
        if (!l4Answered && l4LastTranscript) gradeL4(l4LastTranscript);
    };
    return r;
}

function toggleListening() {
    if (l4Answered) return;
    if (l4Listening) {
        clearTimeout(l4HardStopTimer);
        l4Listening = false;
        document.getElementById('mic-btn').classList.remove('listening');
        document.getElementById('mic-label').textContent = 'Tap to Transmit';
        document.getElementById('mic-status').textContent = 'Processing...';
        setTimeout(() => { if (recognition) try { recognition.stop(); } catch(e) {} }, 700);
    } else {
        if (!recognition) recognition = initRecognition();
        if (!recognition) {
            document.getElementById('mic-status').textContent = 'Speech not supported in this browser';
            return;
        }
        l4Listening = true;
        l4LastTranscript = '';
        document.getElementById('mic-btn').classList.add('listening');
        document.getElementById('mic-label').textContent = 'Tap to Stop';
        document.getElementById('mic-status').textContent = '🔴 Transmitting...';
        document.getElementById('transcript-box').textContent = '';
        try { recognition.start(); } catch(e) {}

        l4HardStopTimer = setTimeout(() => {
            if (l4Listening) {
                document.getElementById('mic-status').textContent = 'Max transmission time reached.';
                toggleListening();
            }
        }, L4_MAX_SECONDS * 1000);
    }
}

function gradeL4(transcript) {
    if (l4Answered) return;
    l4Answered = true;
    l4Attempts++;

    const expected = plateToPhonetic(l4Plate);
    const rawTokens = transcript.trim().split(/\s+/);
    const expanded = [];
    rawTokens.forEach(t => {
        if (/^\d+$/.test(t)) { t.split('').forEach(d => expanded.push(d)); }
        else { expanded.push(t); }
    });
    const given = expanded.map(normalise);
    const expNorm = expected.map(normalise);

    // greedy alignment — tolerates phantom digits from speech API
    const results = [];
    let gi = 0;
    for (let ei = 0; ei < expNorm.length; ei++) {
        let found = -1;
        for (let look = gi; look < Math.min(gi + 3, given.length); look++) {
            if (given[look] === expNorm[ei]) { found = look; break; }
        }
        if (found !== -1) {
            results.push({ exp: expected[ei], got: given[found], ok: true });
            gi = found + 1;
        } else {
            results.push({ exp: expected[ei], got: given[gi] || null, ok: false });
            if (gi < given.length) gi++;
        }
    }

    const correct = results.filter(r => r.ok).length;
    const tokenRow = document.getElementById('token-row-l4');
    tokenRow.innerHTML = '';
    results.forEach(r => {
        const span = document.createElement('span');
        span.className = `token ${r.ok ? 'ok' : 'wrong'}`;
        span.textContent = r.ok ? r.exp : `${r.got || '?'} (${r.exp})`;
        tokenRow.appendChild(span);
    });

    const allCorrect = correct === expNorm.length;
    const feedback = document.getElementById('feedback-l4');

    if (allCorrect) {
        l4Score++;
        l4Streak++;
        feedback.textContent = 'Readback correct. Cleared for takeoff.';
        feedback.className = 'feedback correct';
        spawnConfetti();
    } else {
        l4Streak = 0;
        feedback.textContent = `Say again. ${correct}/${expNorm.length} correct — check tokens.`;
        feedback.className = 'feedback incorrect';
        const plateEl = document.getElementById('plate-number-l4');
        plateEl.classList.add('shake');
        plateEl.addEventListener('animationend', () => plateEl.classList.remove('shake'), { once: true });
    }

    document.getElementById('streak-l4').textContent = l4Streak >= 3 ? `🔥 ${l4Streak} in a row!` : '';
    document.getElementById('score-val-4').textContent = l4Score;
    document.getElementById('attempts-val-4').textContent = l4Attempts;
    document.getElementById('mic-btn').disabled = true;
    document.getElementById('mic-status').textContent = '';
    document.getElementById('next-btn-l4').style.display = 'inline-block';
}
