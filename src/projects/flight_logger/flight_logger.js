(() => {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

    const svgEl = (tag, attrs, parent) => {
        const el = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        if (parent) parent.appendChild(el);
        return el;
    };

    // Section progress: 0 when the section top hits the viewport top, 1 when its bottom hits the viewport bottom
    const pinnedProgress = (section) => {
        const rect = section.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        if (travel <= 0) return 0;
        return Math.min(1, Math.max(0, -rect.top / travel));
    };

    // Replays the line-drawing transition on a figure container
    const drawFigure = (el) => {
        el.classList.remove('drawn');
        void el.offsetWidth;
        el.classList.add('drawn');
    };

    /* ---------- Nav: hide on scroll down, show on scroll up ---------- */

    const nav = document.getElementById('nav');
    let lastY = window.scrollY;

    /* ---------- Drawer ---------- */

    const toggle = document.getElementById('menu-toggle');
    const drawer = document.getElementById('drawer');
    const label = toggle.querySelector('.nav-menu-label');

    const setDrawer = (open) => {
        drawer.classList.toggle('open', open);
        document.body.classList.toggle('drawer-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        drawer.setAttribute('aria-hidden', String(!open));
        label.textContent = open ? 'Close' : 'Menu';
    };

    toggle.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
    drawer.addEventListener('click', (e) => {
        if (e.target.closest('a') || e.target === drawer) setDrawer(false);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setDrawer(false);
    });

    /* ---------- Hero: simulated readout, downwind for runway 24 ---------- */

    const hud = {
        alt: document.getElementById('hud-alt'),
        gs: document.getElementById('hud-gs'),
        hdg: document.getElementById('hud-hdg'),
    };
    let t = 0;
    if (!reduceMotion) {
        setInterval(() => {
            t += 0.1;
            const alt = 3500 + Math.round((Math.sin(t * 0.7) * 30 + Math.sin(t * 2.3) * 8) / 10) * 10;
            const gs = 98 + Math.round(Math.sin(t * 0.5) * 2 + Math.sin(t * 1.7));
            const hdg = (240 + Math.round(Math.sin(t * 0.3) * 3) + 360) % 360;
            hud.alt.textContent = alt.toLocaleString('en-US');
            hud.gs.textContent = gs;
            hud.hdg.textContent = String(hdg).padStart(3, '0');
        }, 100);
    }

    /* ---------- Statements: word-by-word reveal ---------- */

    const statements = Array.from(document.querySelectorAll('[data-reveal-words]')).map((el) => {
        const words = el.textContent.trim().split(/\s+/);
        el.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(' ');
        return { el, words: el.querySelectorAll('.w') };
    });

    const updateStatements = () => {
        const vh = window.innerHeight;
        statements.forEach(({ el, words }) => {
            const rect = el.getBoundingClientRect();
            // Start lighting words as the paragraph enters, finish when its bottom reaches 45% of the viewport
            const start = vh * 0.9;
            const end = vh * 0.45;
            const p = Math.min(1, Math.max(0, (start - rect.top) / (start - end + rect.height)));
            const lit = Math.round(p * words.length);
            words.forEach((w, i) => w.classList.toggle('on', i < lit));
        });
    };

    /* ---------- Stats: count up on first view ---------- */

    const counters = document.querySelectorAll('[data-count]');
    const countObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            countObserver.unobserve(entry.target);
            const el = entry.target;
            const target = Number(el.dataset.count);
            if (reduceMotion || target === 0) return;
            const t0 = performance.now();
            const dur = 1400;
            const tick = (now) => {
                const k = Math.min(1, (now - t0) / dur);
                const eased = 1 - Math.pow(1 - k, 3);
                el.textContent = Math.round(target * eased);
                if (k < 1) requestAnimationFrame(tick);
            };
            el.textContent = '0';
            requestAnimationFrame(tick);
        });
    }, { threshold: 0.6 });
    counters.forEach((el) => countObserver.observe(el));

    /* ---------- How it works: pinned steps ---------- */

    const features = document.querySelector('.features');
    const panels = features.querySelectorAll('.panel');
    const steps = features.querySelectorAll('.step');
    const ticks = features.querySelectorAll('.features-progress span');
    const stepCount = steps.length;
    let activeStep = 0;

    const setStep = (i) => {
        if (i === activeStep) return;
        activeStep = i;
        panels.forEach((el, n) => el.classList.toggle('active', n === i));
        steps.forEach((el, n) => el.classList.toggle('active', n === i));
        ticks.forEach((el, n) => el.classList.toggle('active', n === i));
    };

    // Without pinning (small screens), rotate through the steps on a timer
    setInterval(() => {
        if (isMobile()) setStep((activeStep + 1) % stepCount);
    }, 5000);

    /* ---------- Band: compass rose ticks ---------- */

    const roseTicks = document.querySelector('.rose-ticks');
    for (let deg = 0; deg < 360; deg += 5) {
        const major = deg % 30 === 0;
        const r1 = 280;
        const r2 = major ? 256 : 268;
        const a = (deg * Math.PI) / 180;
        svgEl('line', {
            x1: (Math.sin(a) * r1).toFixed(1), y1: (-Math.cos(a) * r1).toFixed(1),
            x2: (Math.sin(a) * r2).toFixed(1), y2: (-Math.cos(a) * r2).toFixed(1),
            class: major ? 'major' : '',
        }, roseTicks);
    }

    /* ---------- Debrief: tabs ---------- */

    const tabs = Array.from(document.querySelectorAll('.tech-tabs [role="tab"]'));
    const tabPanels = Array.from(document.querySelectorAll('.tech-panel'));
    const techDots = document.querySelectorAll('.tech-dots span');
    let debriefSeen = false;

    const selectTab = (i, focus) => {
        tabs.forEach((tab, n) => {
            const on = n === i;
            tab.setAttribute('aria-selected', String(on));
            tab.tabIndex = on ? 0 : -1;
            tabPanels[n].hidden = !on;
            tabPanels[n].classList.toggle('active', on);
            techDots[n].classList.toggle('active', on);
        });
        if (focus) tabs[i].focus();
        if (debriefSeen) drawFigure(tabPanels[i]);
    };

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => selectTab(i));
        tab.addEventListener('keydown', (e) => {
            const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
            if (!dir) return;
            e.preventDefault();
            selectTab((i + dir + tabs.length) % tabs.length, true);
        });
    });

    new IntersectionObserver((entries, obs) => {
        if (!entries[0].isIntersecting) return;
        debriefSeen = true;
        drawFigure(tabPanels.find((p) => !p.hidden));
        obs.disconnect();
    }, { threshold: 0.3 }).observe(document.querySelector('.tech-grid'));

    /* ---------- Engineering: draw figure and tables on first view ---------- */

    const drawOnce = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            drawFigure(entry.target);
            drawOnce.unobserve(entry.target);
        });
    }, { threshold: 0.25 });
    document.querySelectorAll('.eng-figure, .eng-cols').forEach((el) => drawOnce.observe(el));

    /* ---------- Roadmap: pinned timeline ---------- */

    const timeline = document.querySelector('.timeline');
    const tlYears = timeline.querySelectorAll('.timeline-years li');
    const tlList = timeline.querySelector('.timeline-years ol');
    const tlCopy = timeline.querySelectorAll('.timeline-copy article');
    let tlActive = 0;

    const setMilestone = (i) => {
        if (i === tlActive) return;
        tlActive = i;
        tlYears.forEach((el, n) => el.classList.toggle('active', n === i));
        tlCopy.forEach((el, n) => el.classList.toggle('active', n === i));
        tlList.style.transform = `translateY(${-i * 40}px)`;
    };

    /* ---------- Fade-in on view ---------- */

    const fadeEls = document.querySelectorAll('.band-content, .stats, .rule-label, .section-title, .not-cols, .gap-row');
    fadeEls.forEach((el) => el.setAttribute('data-fade', ''));
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in');
                fadeObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    fadeEls.forEach((el) => fadeObserver.observe(el));

    /* ---------- Scroll loop ---------- */

    let ticking = false;
    const onScroll = () => {
        const y = window.scrollY;
        if (!document.body.classList.contains('drawer-open')) {
            nav.classList.toggle('hidden', y > lastY && y > 200);
        }
        lastY = y;

        updateStatements();

        if (!isMobile()) {
            setStep(Math.min(stepCount - 1, Math.floor(pinnedProgress(features) * stepCount)));
        }
        setMilestone(Math.min(tlYears.length - 1, Math.floor(pinnedProgress(timeline) * tlYears.length)));
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(onScroll);
        }
    }, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
})();
