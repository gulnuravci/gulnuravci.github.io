let l1Current = '', l1Score = 0, l1Attempts = 0, l1Streak = 0;
let l1Revealed = [], l1HintTimer = null, l1Answered = false;
const L1_HINT_INTERVAL = 2000;

function nextL1() {
    clearInterval(l1HintTimer);
    let pick;
    do { pick = letters[Math.floor(Math.random() * letters.length)]; } while (pick === l1Current);
    l1Current = pick;
    l1Answered = false;
    l1Revealed = [];

    const card = document.getElementById('card-l1');
    card.textContent = l1Current;
    card.classList.remove('shake');
    card.classList.add('pop');
    card.addEventListener('animationend', () => card.classList.remove('pop'), { once: true });

    document.getElementById('answer-l1').value = '';
    document.getElementById('answer-l1').disabled = false;
    document.getElementById('answer-l1').focus();
    document.getElementById('feedback-l1').textContent = '';
    document.getElementById('feedback-l1').className = 'feedback';
    document.getElementById('next-btn-l1').style.display = 'none';
    document.getElementById('submit-btn-l1').disabled = false;
    document.getElementById('hint-label').textContent = 'Hints revealing in 2s...';

    renderBlanks();
    l1HintTimer = setInterval(revealHint, L1_HINT_INTERVAL);
}

function renderBlanks() {
    const word = phonetic[l1Current].toUpperCase();
    document.getElementById('blanks').innerHTML = word.split('').map((ch, i) => {
        if (ch === '-' || ch === ' ') return `<span>${ch}</span>`;
        if (l1Revealed.includes(i)) return `<span class="revealed">${ch}</span>`;
        return `<span>_</span>`;
    }).join(' ');
}

function revealHint() {
    if (l1Answered) { clearInterval(l1HintTimer); return; }
    const word = phonetic[l1Current].toUpperCase();
    const unrevealed = word.split('').map((_, i) => i)
        .filter(i => word[i] !== '-' && word[i] !== ' ' && !l1Revealed.includes(i));

    if (unrevealed.length === 0) { clearInterval(l1HintTimer); timeUpL1(); return; }

    const pick = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    l1Revealed.push(pick);
    renderBlanks();

    const remaining = unrevealed.length - 1;
    if (remaining === 0) {
        clearInterval(l1HintTimer);
        timeUpL1();
    } else {
        document.getElementById('hint-label').textContent =
            `${remaining} letter${remaining > 1 ? 's' : ''} hidden — next hint in 2s`;
    }
}

function timeUpL1() {
    l1Answered = true;
    l1Attempts++;
    l1Streak = 0;
    const correct = phonetic[l1Current];
    document.getElementById('feedback-l1').textContent = `TRANSMISSION LOST — ${l1Current} = ${correct}`;
    document.getElementById('feedback-l1').className = 'feedback incorrect';
    document.getElementById('answer-l1').disabled = true;
    document.getElementById('submit-btn-l1').disabled = true;
    document.getElementById('hint-label').textContent = '';
    document.getElementById('streak-l1').textContent = '';
    document.getElementById('attempts-val-1').textContent = l1Attempts;
    document.getElementById('next-btn-l1').style.display = 'inline-block';
}

function submitL1() {
    if (l1Answered) return;
    const input = document.getElementById('answer-l1').value.trim();
    if (!input) return;

    clearInterval(l1HintTimer);
    l1Answered = true;
    l1Attempts++;
    const correct = phonetic[l1Current];
    const feedback = document.getElementById('feedback-l1');
    const card = document.getElementById('card-l1');

    if (input.toLowerCase() === correct.toLowerCase()) {
        l1Score++;
        l1Streak++;
        feedback.textContent = `Readback correct. ${l1Current} = ${correct}`;
        feedback.className = 'feedback correct';
        spawnConfetti();
    } else {
        l1Streak = 0;
        feedback.textContent = `Negative. ${l1Current} = ${correct}`;
        feedback.className = 'feedback incorrect';
        card.classList.add('shake');
        card.addEventListener('animationend', () => card.classList.remove('shake'), { once: true });
    }

    document.getElementById('hint-label').textContent = '';
    document.getElementById('streak-l1').textContent = l1Streak >= 3 ? `🔥 ${l1Streak} in a row!` : '';
    document.getElementById('score-val-1').textContent = l1Score;
    document.getElementById('attempts-val-1').textContent = l1Attempts;
    document.getElementById('answer-l1').disabled = true;
    document.getElementById('submit-btn-l1').disabled = true;
    document.getElementById('next-btn-l1').style.display = 'inline-block';
}
