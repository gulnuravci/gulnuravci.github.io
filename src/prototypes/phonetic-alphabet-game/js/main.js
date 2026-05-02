let currentLevel = 1;

function setLevel(n) {
    clearInterval(l1HintTimer);
    currentLevel = n;
    document.querySelectorAll('.level-btn').forEach((b, i) => b.classList.toggle('active', i === n - 1));
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

function spawnConfetti() {
    const colors = ['#ff69b4', '#ffff00', '#00e5ff', '#00ff99', '#ff5555', '#ffcc00'];
    for (let i = 0; i < 30; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.top = '-20px';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.animationDuration = (0.8 + Math.random() * 1.2) + 's';
        el.style.animationDelay = (Math.random() * 0.3) + 's';
        el.style.width = el.style.height = (6 + Math.random() * 8) + 'px';
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }
}

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

setLevel(1);
