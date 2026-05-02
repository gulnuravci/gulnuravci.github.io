let l3Plate = '', l3Score = 0, l3Attempts = 0, l3Streak = 0, l3Answered = false;

function nextL3() {
    let newPlate;
    do { newPlate = generatePlate(); } while (newPlate === l3Plate);
    l3Plate = newPlate;
    l3Answered = false;

    const plateEl = document.getElementById('plate-number');
    plateEl.textContent = l3Plate;
    plateEl.classList.remove('shake');
    plateEl.classList.add('pop');
    plateEl.addEventListener('animationend', () => plateEl.classList.remove('pop'), { once: true });

    const tokens = plateToPhonetic(l3Plate);
    document.getElementById('plate-example').textContent = `e.g. "${tokens.join(' ')}"`;

    document.getElementById('answer-l3').value = '';
    document.getElementById('answer-l3').disabled = false;
    document.getElementById('answer-l3').focus();
    document.getElementById('feedback-l3').textContent = '';
    document.getElementById('feedback-l3').className = 'feedback';
    document.getElementById('token-row-l3').innerHTML = '';
    document.getElementById('next-btn-l3').style.display = 'none';
    document.getElementById('submit-btn-l3').disabled = false;
}

function submitL3() {
    if (l3Answered) return;
    const input = document.getElementById('answer-l3').value.trim();
    if (!input) return;

    l3Answered = true;
    l3Attempts++;
    const expected = plateToPhonetic(l3Plate);
    const given = input.trim().split(/\s+/);
    const feedback = document.getElementById('feedback-l3');
    const tokenRow = document.getElementById('token-row-l3');
    tokenRow.innerHTML = '';

    let correct = 0;
    expected.forEach((exp, i) => {
        const got = (given[i] || '').toLowerCase();
        const isOk = got === exp.toLowerCase();
        if (isOk) correct++;
        const span = document.createElement('span');
        span.className = `token ${isOk ? 'ok' : 'wrong'}`;
        span.textContent = isOk ? exp : `${got || '?'} (${exp})`;
        tokenRow.appendChild(span);
    });

    for (let i = expected.length; i < given.length; i++) {
        const span = document.createElement('span');
        span.className = 'token wrong';
        span.textContent = `"${given[i]}" extra`;
        tokenRow.appendChild(span);
    }

    const allCorrect = correct === expected.length && given.length === expected.length;

    if (allCorrect) {
        l3Score++;
        l3Streak++;
        feedback.textContent = 'Readback correct. Cleared for takeoff.';
        feedback.className = 'feedback correct';
        spawnConfetti();
    } else {
        l3Streak = 0;
        feedback.textContent = `Say again. ${correct}/${expected.length} correct — check tokens.`;
        feedback.className = 'feedback incorrect';
        const plateEl = document.getElementById('plate-number');
        plateEl.classList.add('shake');
        plateEl.addEventListener('animationend', () => plateEl.classList.remove('shake'), { once: true });
    }

    document.getElementById('streak-l3').textContent = l3Streak >= 3 ? `🔥 ${l3Streak} in a row!` : '';
    document.getElementById('score-val-3').textContent = l3Score;
    document.getElementById('attempts-val-3').textContent = l3Attempts;
    document.getElementById('answer-l3').disabled = true;
    document.getElementById('submit-btn-l3').disabled = true;
    document.getElementById('next-btn-l3').style.display = 'inline-block';
}
