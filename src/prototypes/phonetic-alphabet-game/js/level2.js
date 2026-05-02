let l2Current = '', l2Score = 0, l2Attempts = 0, l2Streak = 0, l2Answered = false;

function nextCard() {
    let pick;
    do { pick = letters[Math.floor(Math.random() * letters.length)]; } while (pick === l2Current);
    l2Current = pick;

    const card = document.getElementById('card-l2');
    card.textContent = l2Current;
    card.classList.remove('shake');
    card.classList.add('pop');
    card.addEventListener('animationend', () => card.classList.remove('pop'), { once: true });

    document.getElementById('answer-l2').value = '';
    document.getElementById('feedback-l2').textContent = '';
    document.getElementById('feedback-l2').className = 'feedback';
    document.getElementById('next-btn-l2').style.display = 'none';
    document.getElementById('answer-l2').disabled = false;
    document.getElementById('submit-btn-l2').disabled = false;
    document.getElementById('answer-l2').focus();
    l2Answered = false;
}

function checkAnswer() {
    if (l2Answered) return;
    const input = document.getElementById('answer-l2').value.trim();
    if (!input) return;

    l2Answered = true;
    l2Attempts++;
    const correct = phonetic[l2Current];
    const feedback = document.getElementById('feedback-l2');
    const card = document.getElementById('card-l2');

    if (input.toLowerCase() === correct.toLowerCase()) {
        l2Score++;
        l2Streak++;
        feedback.textContent = `Readback correct. ${l2Current} = ${correct}`;
        feedback.className = 'feedback correct';
        spawnConfetti();
    } else {
        l2Streak = 0;
        feedback.textContent = `Negative. ${l2Current} = ${correct}`;
        feedback.className = 'feedback incorrect';
        card.classList.add('shake');
        card.addEventListener('animationend', () => card.classList.remove('shake'), { once: true });
    }

    document.getElementById('streak-l2').textContent = l2Streak >= 3 ? `🔥 ${l2Streak} in a row!` : '';
    document.getElementById('score-val-2').textContent = l2Score;
    document.getElementById('attempts-val-2').textContent = l2Attempts;
    document.getElementById('answer-l2').disabled = true;
    document.getElementById('submit-btn-l2').disabled = true;
    document.getElementById('next-btn-l2').style.display = 'inline-block';
}
