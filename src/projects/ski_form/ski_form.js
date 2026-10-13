// Ski Form: temporary project page.
// All visuals are illustrative and drawn with generated data, not real runs.

const SVG_NS = 'http://www.w3.org/2000/svg';
const INK = '#0d0c11';
const LIME = '#c8ff2e';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function svgEl(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
}

function svgText(parent, x, y, text, attrs = {}) {
    const node = svgEl('text', {
        x, y,
        'font-family': 'Geist Mono, ui-monospace, monospace',
        'font-size': 10,
        'letter-spacing': '0.06em',
        fill: INK,
        ...attrs,
    }, parent);
    node.textContent = text;
    return node;
}

function seeded(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Skeleton ---------- */

// Generic front-view skier, carving to one side. Coordinates are in a 100x100 box.
const POSE_LEFT = {
    head: [46, 12], neck: [47, 22],
    ls: [39, 25], rs: [56, 26],
    le: [32, 37], re: [65, 37],
    lw: [27, 47], rw: [70, 45],
    lh: [41, 53], rh: [53, 54],
    lk: [40, 68], rk: [52, 69],
    la: [50, 85], ra: [62, 86],
};
const SWAP = {
    head: 'head', neck: 'neck', ls: 'rs', rs: 'ls', le: 're', re: 'le', lw: 'rw', rw: 'lw',
    lh: 'rh', rh: 'lh', lk: 'rk', rk: 'lk', la: 'ra', ra: 'la',
};
const POSE_RIGHT = Object.fromEntries(
    Object.keys(POSE_LEFT).map(k => [k, [100 - POSE_LEFT[SWAP[k]][0], POSE_LEFT[SWAP[k]][1]]])
);
const BONES = [
    ['neck', 'head'], ['neck', 'ls'], ['neck', 'rs'], ['ls', 'le'], ['le', 'lw'], ['rs', 're'], ['re', 'rw'],
    ['ls', 'lh'], ['rs', 'rh'], ['lh', 'rh'], ['lh', 'lk'], ['lk', 'la'], ['rh', 'rk'], ['rk', 'ra'],
];
const JOINTS = Object.keys(POSE_LEFT).filter(k => k !== 'head');

// phase moves the skier from one turn to the next: 0 = left, PI = right.
function poseAt(phase) {
    const t = 0.5 - 0.5 * Math.cos(phase);
    // Skiers extend between turns and flex in the middle of a turn.
    const extend = Math.sin(phase) ** 2;
    const pose = {};
    for (const k in POSE_LEFT) {
        const y = lerp(POSE_LEFT[k][1], POSE_RIGHT[k][1], t);
        pose[k] = [lerp(POSE_LEFT[k][0], POSE_RIGHT[k][0], t), y - (85 - y) * 0.06 * extend];
    }
    return pose;
}

function createSkeleton(parent, opts = {}) {
    const o = { stroke: INK, joint: LIME, headFill: 'none', width: 1.6, r: 1.9, opacity: 1, ...opts };
    const g = svgEl('g', { opacity: o.opacity }, parent);
    const line = w => svgEl('line', { stroke: o.stroke, 'stroke-width': w, 'stroke-linecap': 'round' }, g);
    const skis = [line(o.width * 1.5), line(o.width * 1.5)];
    const poles = [line(o.width * 0.55), line(o.width * 0.55)];
    const bones = BONES.map(() => line(o.width));
    const head = svgEl('circle', { r: 4.4, fill: o.headFill, stroke: o.stroke, 'stroke-width': o.width }, g);
    const joints = JOINTS.map(() => svgEl('circle', { r: o.r, fill: o.joint, stroke: o.stroke, 'stroke-width': o.width * 0.5 }, g));

    function setLine(node, a, b) {
        node.setAttribute('x1', a[0]); node.setAttribute('y1', a[1]);
        node.setAttribute('x2', b[0]); node.setAttribute('y2', b[1]);
    }

    return {
        g,
        set(p) {
            const hipX = (p.lh[0] + p.rh[0]) / 2;
            ['la', 'ra'].forEach((k, i) => setLine(skis[i], [p[k][0] - 15, p[k][1] + 4], [p[k][0] + 15, p[k][1] + 2]));
            ['lw', 'rw'].forEach((k, i) => {
                const w = p[k];
                setLine(poles[i], w, [w[0] + (w[0] - hipX) * 0.2, p.la[1] + 3]);
            });
            BONES.forEach(([a, b], i) => setLine(bones[i], p[a], p[b]));
            head.setAttribute('cx', p.head[0]);
            head.setAttribute('cy', p.head[1]);
            JOINTS.forEach((k, i) => {
                joints[i].setAttribute('cx', p[k][0]);
                joints[i].setAttribute('cy', p[k][1]);
            });
        },
    };
}

function poseBounds(p) {
    const xs = Object.values(p).map(v => v[0]);
    const ys = Object.values(p).map(v => v[1]);
    return { x0: Math.min(...xs) - 16, x1: Math.max(...xs) + 16, y0: Math.min(...ys) - 6, y1: Math.max(...ys) + 6 };
}

function cornerBrackets(parent, attrs) {
    return [0, 1, 2, 3].map(() => svgEl('path', { fill: 'none', 'stroke-width': 2, ...attrs }, parent));
}

function setBrackets(paths, x0, y0, x1, y1, len) {
    const d = [
        `M${x0} ${y0 + len} V${y0} H${x0 + len}`,
        `M${x1 - len} ${y0} H${x1} V${y0 + len}`,
        `M${x1} ${y1 - len} V${y1} H${x1 - len}`,
        `M${x0 + len} ${y1} H${x0} V${y1 - len}`,
    ];
    paths.forEach((p, i) => p.setAttribute('d', d[i]));
}

/* ---------- Visuals ---------- */

const visuals = {
    capture(svg) {
        const grid = svgEl('g', { stroke: '#ffffff', 'stroke-opacity': 0.18, fill: 'none' }, svg);
        for (let i = 0; i <= 8; i++) {
            const y = 30 + i * 45;
            const bend = (y - 210) * 0.18;
            svgEl('path', { d: `M0 ${y} Q300 ${y + bend} 600 ${y}` }, grid);
        }
        for (let i = 0; i <= 12; i++) {
            const x = i * 50;
            const bend = (x - 300) * 0.08;
            svgEl('path', { d: `M${x} 0 Q${x - bend} 210 ${x} 420` }, grid);
        }
        svgEl('path', { d: 'M0 300 Q300 250 600 300 L600 420 L0 420 Z', fill: '#ffffff', 'fill-opacity': 0.14 }, svg);

        const trail = svgEl('polyline', { fill: 'none', stroke: LIME, 'stroke-width': 2, 'stroke-opacity': 0.8, 'stroke-dasharray': '2 5' }, svg);
        const skierG = svgEl('g', {}, svg);
        const skier = createSkeleton(skierG, { headFill: '#3e6a85', width: 2.2, r: 2.4 });
        const box = cornerBrackets(svg, { stroke: LIME });
        const label = svgEl('g', {}, svg);
        const labelBg = svgEl('rect', { height: 18, width: 104, rx: 2, fill: LIME }, label);
        const labelText = svgText(label, 6, 12.5, 'SKIER', { 'font-size': 9.5 });
        svgText(svg, 14, 24, '360° · EQUIRECT', { fill: '#ffffff', 'fill-opacity': 0.8 });
        const frame = svgText(svg, 586, 24, '', { fill: '#ffffff', 'fill-opacity': 0.8, 'text-anchor': 'end' });

        const history = [];
        return t => {
            const phase = t * 1.6;
            const s = 1.15;
            const x = 300 + 165 * Math.sin(phase) - 50 * s;
            const y = 150 + 18 * Math.cos(phase * 2);
            const p = poseAt(phase + Math.PI / 2);
            skierG.setAttribute('transform', `translate(${x} ${y}) scale(${s})`);
            skier.set(p);

            const b = poseBounds(p);
            const x0 = x + b.x0 * s, x1 = x + b.x1 * s, y0 = y + b.y0 * s, y1 = y + b.y1 * s;
            setBrackets(box, x0, y0, x1, y1, 12);
            label.setAttribute('transform', `translate(${x0} ${y0 - 24})`);
            labelText.textContent = `SKIER · ${(0.95 + 0.03 * Math.sin(t * 7)).toFixed(2)}`;
            labelBg.setAttribute('width', 98);

            history.push(`${(x0 + x1) / 2},${y1 - 2}`);
            if (history.length > 70) history.shift();
            trail.setAttribute('points', history.join(' '));
            frame.textContent = `FRM ${String(Math.floor(t * 30) % 100000).padStart(6, '0')}`;
        };
    },

    pose(svg) {
        const s = 3.7, ox = 115, oy = 30;
        const wrap = svgEl('g', { transform: `translate(${ox} ${oy}) scale(${s})` }, svg);
        const ghosts = [
            createSkeleton(wrap, { width: 0.7, r: 1, opacity: 0.14, joint: INK }),
            createSkeleton(wrap, { width: 0.7, r: 1, opacity: 0.28, joint: INK }),
        ];
        const main = createSkeleton(wrap, { headFill: '#9aa8b6', width: 0.9, r: 1.35 });
        const com = svgEl('g', {}, wrap);
        svgEl('circle', { r: 4, fill: 'none', stroke: INK, 'stroke-width': 0.5, 'stroke-dasharray': '1 1' }, com);
        svgEl('circle', { r: 1.6, fill: INK }, com);

        const tags = [
            { key: 'head', dx: 60, dy: -10, name: 'HEAD' },
            { key: 'rh', dx: 70, dy: 4, name: 'HIP' },
            { key: 'lk', dx: -80, dy: 10, name: 'KNEE' },
            { key: 'ra', dx: 60, dy: 22, name: 'ANKLE' },
        ].map(tag => {
            const lead = svgEl('line', { stroke: INK, 'stroke-width': 1, 'stroke-opacity': 0.5 }, svg);
            const text = svgText(svg, 0, 0, '', { 'text-anchor': tag.dx < 0 ? 'end' : 'start' });
            return { ...tag, lead, text };
        });
        svgText(svg, 14, 24, 'KEYPOINTS · PER FRAME');
        svgText(svg, 586, 24, '● CENTER OF MASS', { 'text-anchor': 'end' });

        return t => {
            const phase = t * 1.3;
            ghosts[0].set(poseAt(phase - 0.5));
            ghosts[1].set(poseAt(phase - 0.25));
            const p = poseAt(phase);
            main.set(p);
            com.setAttribute('transform', `translate(${(p.lh[0] + p.rh[0]) / 2} ${(p.lh[1] + p.rh[1]) / 2 + 2})`);

            tags.forEach((tag, i) => {
                const jx = ox + p[tag.key][0] * s, jy = oy + p[tag.key][1] * s;
                const tx = jx + tag.dx, ty = jy + tag.dy;
                tag.lead.setAttribute('x1', jx); tag.lead.setAttribute('y1', jy);
                tag.lead.setAttribute('x2', tx); tag.lead.setAttribute('y2', ty - 3);
                tag.text.setAttribute('x', tx + (tag.dx < 0 ? -4 : 4));
                tag.text.setAttribute('y', ty);
                tag.text.textContent = `${tag.name} ${(0.9 + 0.08 * Math.abs(Math.sin(t * 3 + i * 1.7))).toFixed(2)}`;
            });
        };
    },

    segment(svg) {
        const rand = seeded(7);
        const n = 360, x0 = 50, x1 = 570, mid = 230, amp = 105;
        const clean = [], raw = [];
        for (let i = 0; i < n; i++) {
            const u = i / (n - 1);
            const a = 0.75 + 0.25 * Math.sin(u * 9.1);
            clean.push(a * Math.sin(u * Math.PI * 7 + 0.35));
            raw.push(clean[i] + (rand() - 0.5) * 0.55);
        }
        // Gaussian smoothing of the raw signal.
        const k = [];
        for (let j = -12; j <= 12; j++) k.push(Math.exp(-(j * j) / 40));
        const kSum = k.reduce((a, b) => a + b, 0);
        const smooth = raw.map((_, i) => {
            let acc = 0;
            k.forEach((w, j) => { acc += w * raw[clamp(i + j - 12, 0, n - 1)]; });
            return acc / kSum;
        });
        const X = i => x0 + (i / (n - 1)) * (x1 - x0);
        const Y = v => mid - v * amp;
        const pathOf = arr => 'M' + arr.map((v, i) => `${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' L');

        const cuts = [];
        for (let i = 1; i < n; i++) {
            if (Math.sign(smooth[i]) !== Math.sign(smooth[i - 1]) && (!cuts.length || i - cuts[cuts.length - 1] > 15)) cuts.push(i);
        }

        const clipId = 'seg-clip';
        const clipRect = svgEl('rect', { x: 0, y: 0, height: 420, width: 0 }, svgEl('clipPath', { id: clipId }, svgEl('defs', {}, svg)));

        svgEl('line', { x1: x0, x2: x1, y1: mid, y2: mid, stroke: INK, 'stroke-opacity': 0.25, 'stroke-dasharray': '3 4' }, svg);
        svgText(svg, 14, 24, '— RAW', { 'fill-opacity': 0.5 });
        svgText(svg, 74, 24, '— SMOOTHED');
        svgText(svg, 586, 24, 'LATERAL COM', { 'text-anchor': 'end' });
        svgText(svg, x1, 392, 'TIME →', { 'text-anchor': 'end', 'fill-opacity': 0.6 });

        const plot = svgEl('g', { 'clip-path': `url(#${clipId})` }, svg);
        svgEl('path', { d: pathOf(raw), fill: 'none', stroke: INK, 'stroke-opacity': 0.3, 'stroke-width': 1 }, plot);
        svgEl('path', { d: pathOf(smooth), fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, plot);

        const bounds = [0, ...cuts, n - 1];
        const turnTags = [];
        for (let i = 0; i < bounds.length - 1; i++) {
            if (i > 0) svgEl('line', { x1: X(bounds[i]), x2: X(bounds[i]), y1: 70, y2: 360, stroke: '#e2551b', 'stroke-width': 1.2, 'stroke-dasharray': '4 4' }, plot);
            const cx = (X(bounds[i]) + X(bounds[i + 1])) / 2;
            const g = svgEl('g', { transform: `translate(${cx} 58)`, opacity: 0 }, svg);
            svgEl('rect', { x: -15, y: -11, width: 30, height: 18, rx: 2, fill: INK }, g);
            svgText(g, 0, 2, `T${i + 1}`, { fill: '#ffffff', 'text-anchor': 'middle', 'font-size': 9.5 });
            turnTags.push({ g, at: cx });
        }
        const head = svgEl('line', { y1: 40, y2: 380, stroke: '#e2551b', 'stroke-width': 1.5 }, svg);

        const sweep = 7, hold = 2;
        return t => {
            const u = reduceMotion ? 1 : clamp((t % (sweep + hold)) / sweep, 0, 1);
            const hx = x0 + u * (x1 - x0);
            clipRect.setAttribute('width', hx);
            head.setAttribute('x1', hx); head.setAttribute('x2', hx);
            head.setAttribute('opacity', u < 1 ? 1 : 0);
            turnTags.forEach(tag => tag.g.setAttribute('opacity', hx > tag.at ? 1 : 0));
        };
    },

    score(svg) {
        const rand = seeded(11);
        const scores = [72, 81, 64, 88, 77, 91, 69, 84];
        const rows = scores.map(v => [0, 1, 2, 3, 4].map(() => clamp(Math.round((v - 45) / 10 + rand() * 2 - 1), 1, 5)));
        const base = 350, top = 110, bx = 40, bw = 30, gap = 13;

        svgText(svg, 14, 24, 'SCORE PER TURN');
        const bars = scores.map((v, i) => {
            const x = bx + i * (bw + gap);
            const h = ((v - 40) / 60) * (base - top);
            const rect = svgEl('rect', { x, width: bw, y: base, height: 0, rx: 2, fill: INK }, svg);
            const num = svgText(svg, x + bw / 2, base - h - 8, String(v), { 'text-anchor': 'middle', opacity: 0 });
            svgText(svg, x + bw / 2, base + 18, `T${i + 1}`, { 'text-anchor': 'middle', 'fill-opacity': 0.6 });
            return { rect, num, h, x };
        });
        svgEl('line', { x1: bx - 6, x2: bx + scores.length * (bw + gap) - gap + 6, y1: base, y2: base, stroke: INK, 'stroke-opacity': 0.4 }, svg);

        // Breakdown panel. Metric names and weights stay hidden on purpose.
        const px = 398, py = 56, pw = 180, ph = 322;
        svgEl('rect', { x: px, y: py, width: pw, height: ph, rx: 4, fill: INK }, svg);
        const turnLabel = svgText(svg, px + 14, py + 24, '', { fill: '#8b8a93' });
        const big = svgText(svg, px + 12, py + 92, '', { fill: '#ffffff', 'font-family': 'Inter Tight, sans-serif', 'font-size': 62, 'letter-spacing': '-0.04em' });
        svgText(svg, px + 14, py + 128, 'BREAKDOWN', { fill: '#8b8a93' });

        const hatchId = 'redact-hatch';
        const pattern = svgEl('pattern', { id: hatchId, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, svgEl('defs', {}, svg));
        svgEl('rect', { width: 6, height: 6, fill: '#2a2930' }, pattern);
        svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#3d3c45', 'stroke-width': 3 }, pattern);

        const meters = [0, 1, 2, 3, 4].map(r => {
            const y = py + 150 + r * 30;
            svgEl('rect', { x: px + 14, y, width: 58 + ((r * 23) % 30), height: 12, rx: 2, fill: `url(#${hatchId})` }, svg);
            return [0, 1, 2, 3, 4].map(c => svgEl('rect', { x: px + 104 + c * 13, y, width: 10, height: 12, rx: 1.5, fill: '#2a2930' }, svg));
        });
        svgText(svg, px + 14, py + ph - 14, '■ DETAILS REDACTED', { fill: '#5d5c66', 'font-size': 9 });

        let shown = -1;
        return t => {
            const grow = reduceMotion ? 1 : clamp(t / 1.2, 0, 1);
            const ease = 1 - (1 - grow) ** 3;
            const active = reduceMotion ? 5 : Math.floor(t / 1.6) % scores.length;
            bars.forEach((b, i) => {
                const h = b.h * ease;
                b.rect.setAttribute('y', base - h);
                b.rect.setAttribute('height', h);
                b.rect.setAttribute('fill', i === active ? LIME : INK);
                b.rect.setAttribute('stroke', i === active ? INK : 'none');
                b.num.setAttribute('opacity', grow === 1 ? 1 : 0);
            });
            if (active !== shown) {
                shown = active;
                turnLabel.textContent = `TURN ${String(active + 1).padStart(2, '0')}`;
                big.textContent = scores[active];
                meters.forEach((cells, r) => cells.forEach((cell, c) => cell.setAttribute('fill', c < rows[active][r] ? LIME : '#2a2930')));
            }
        };
    },

    review(svg) {
        const rand = seeded(3);
        svgEl('rect', { x: 26, y: 26, width: 548, height: 368, rx: 6, fill: INK }, svg);
        [0, 1, 2].forEach(i => svgEl('circle', { cx: 44 + i * 12, cy: 42, r: 3.5, fill: '#3a3940' }, svg));
        svgEl('rect', { x: 230, y: 34, width: 140, height: 16, rx: 3, fill: '#1c1b21' }, svg);
        svgText(svg, 300, 45.5, 'runs / run-04', { fill: '#8b8a93', 'text-anchor': 'middle', 'font-size': 9 });

        // Run library
        svgText(svg, 42, 78, 'RUN LIBRARY', { fill: '#8b8a93', 'font-size': 9 });
        const runScores = [78, 74, 81, 83, 79];
        runScores.forEach((v, i) => {
            const y = 90 + i * 40;
            const active = i === 3;
            svgEl('rect', { x: 36, y, width: 148, height: 34, rx: 3, fill: active ? '#1f1e25' : 'transparent' }, svg);
            if (active) svgEl('rect', { x: 36, y, width: 2.5, height: 34, fill: LIME }, svg);
            svgText(svg, 46, y + 15, `Run 0${i + 1}`, { fill: '#f2f2ee', 'font-family': 'Inter Tight, sans-serif', 'font-size': 12, 'letter-spacing': 0 });
            svgText(svg, 46, y + 27, `${10 + Math.floor(rand() * 8)} TURNS`, { fill: '#6e6d76', 'font-size': 8 });
            svgEl('rect', { x: 148, y: y + 9, width: 28, height: 16, rx: 2, fill: active ? LIME : '#2a2930' }, svg);
            svgText(svg, 162, y + 20.5, String(v), { fill: active ? INK : '#c9c8cf', 'text-anchor': 'middle', 'font-size': 9 });
        });

        // Annotated video
        const vx = 196, vy = 64, vw = 366, vh = 196;
        const grad = svgEl('linearGradient', { id: 'vid-grad', x1: 0, y1: 0, x2: 1, y2: 1 }, svgEl('defs', {}, svg));
        svgEl('stop', { offset: 0, 'stop-color': '#55616c' }, grad);
        svgEl('stop', { offset: 1, 'stop-color': '#c4ced5' }, grad);
        svgEl('rect', { x: vx, y: vy, width: vw, height: vh, rx: 3, fill: 'url(#vid-grad)' }, svg);
        svgEl('path', { d: `M${vx} ${vy + 120} L${vx + vw} ${vy + 60} L${vx + vw} ${vy + vh} L${vx} ${vy + vh} Z`, fill: '#ffffff', 'fill-opacity': 0.25 }, svg);
        const skierG = svgEl('g', {}, svg);
        const skier = createSkeleton(skierG, { headFill: '#8796a2', width: 1.6, r: 1.9 });
        const box = cornerBrackets(svg, { stroke: LIME, 'stroke-width': 1.5 });
        const hud = svgText(svg, vx + 10, vy + 18, '', { fill: '#ffffff', 'font-size': 9 });
        svgEl('rect', { x: vx + vw - 58, y: vy + 8, width: 50, height: 16, rx: 2, fill: INK, 'fill-opacity': 0.7 }, svg);
        svgText(svg, vx + vw - 33, vy + 19.5, '● REC', { fill: LIME, 'text-anchor': 'middle', 'font-size': 8.5 });

        // Turn timeline
        const ty = 272, turnScores = [74, 86, 62, 88, 79, 91, 70, 84, 77, 82, 68, 87];
        const tw = vw / turnScores.length;
        turnScores.forEach((v, i) => {
            const fill = v >= 85 ? LIME : v >= 72 ? '#5a5962' : '#e2551b';
            svgEl('rect', { x: vx + i * tw + 1, y: ty, width: tw - 2, height: 14, rx: 1.5, fill }, svg);
        });
        const playhead = svgEl('rect', { y: ty - 4, width: 2, height: 22, fill: '#ffffff' }, svg);

        // Trend across runs
        svgText(svg, vx, 318, 'TREND · LAST 10 RUNS', { fill: '#8b8a93', 'font-size': 8.5 });
        const trend = [66, 70, 68, 73, 72, 76, 74, 79, 78, 83];
        const tx = i => vx + (i / (trend.length - 1)) * vw;
        const tyv = v => 382 - ((v - 60) / 30) * 52;
        svgEl('polyline', { points: trend.map((v, i) => `${tx(i)},${tyv(v)}`).join(' '), fill: 'none', stroke: LIME, 'stroke-width': 1.8 }, svg);
        trend.forEach((v, i) => svgEl('circle', { cx: tx(i), cy: tyv(v), r: 2, fill: INK, stroke: LIME, 'stroke-width': 1.2 }, svg));

        return t => {
            const u = (t / 14) % 1;
            const turn = Math.floor(u * turnScores.length);
            const phase = u * turnScores.length * Math.PI;
            const s = 1.3;
            const x = vx + vw / 2 - 65 + 70 * Math.sin(phase - Math.PI / 2);
            const y = vy + 40;
            const p = poseAt(phase);
            skierG.setAttribute('transform', `translate(${x} ${y}) scale(${s})`);
            skier.set(p);
            const b = poseBounds(p);
            setBrackets(box, x + b.x0 * s, y + b.y0 * s, x + b.x1 * s, y + b.y1 * s, 8);
            hud.textContent = `TURN ${String(turn + 1).padStart(2, '0')} · ${turnScores[turn]}`;
            playhead.setAttribute('x', vx + u * vw - 1);
        };
    },

    pod(svg) {
        // Side view of a ski boot, toe to the right, with the two mount positions under test.
        const boot = svgEl('g', {}, svg);
        svgEl('rect', { x: 26, y: 364, width: 292, height: 8, rx: 3, fill: INK }, boot);
        svgEl('rect', { x: 46, y: 344, width: 52, height: 20, rx: 3, fill: '#2a2930' }, boot);
        svgEl('rect', { x: 232, y: 346, width: 44, height: 18, rx: 3, fill: '#2a2930' }, boot);
        svgEl('rect', { x: 60, y: 338, width: 214, height: 12, rx: 2, fill: INK }, boot);
        svgEl('path', { d: 'M70 340 L64 262 C64 248 80 240 98 238 L150 236 C190 240 232 282 262 318 C270 328 274 336 270 340 Z', fill: '#1c1b21' }, boot);
        svgEl('path', { d: 'M66 270 L72 92 C72 84 78 80 86 80 L178 80 C186 80 190 86 189 94 L186 214 C186 226 176 236 160 238 L98 240 Z', fill: '#26252c' }, boot);
        svgEl('path', { d: 'M152 82 L184 82 C188 82 190 88 189 94 L186 214 C186 226 176 236 160 238 L150 237 Z', fill: '#33323a' }, boot);
        svgEl('path', { d: 'M70 100 L190 95 L190 115 L70 120 Z', fill: '#121116' }, boot);
        [[176, 150, -4], [178, 196, -4], [196, 258, 40], [222, 290, 46]].forEach(([x, y, r]) => {
            svgEl('rect', { x: -11, y: -4, width: 22, height: 8, rx: 2, fill: 'none', stroke: '#55545e', 'stroke-width': 1.5, transform: `translate(${x} ${y}) rotate(${r})` }, boot);
        });

        const mounts = [
            { x: 160, y: 106, w: 30, h: 22, label: 'A · CUFF POWER STRAP', lx: 214, ly: 64, lead: 'M176 96 L208 68' },
            { x: 110, y: 296, w: 34, h: 22, label: 'B · LOWER SHELL', lx: 156, ly: 404, lead: 'M120 308 L152 394' },
        ].map(m => {
            const ring = svgEl('rect', { fill: 'none', stroke: LIME, 'stroke-width': 1.5, rx: 10 }, svg);
            svgEl('rect', { x: m.x - m.w / 2, y: m.y - m.h / 2, width: m.w, height: m.h, rx: 6, fill: INK, stroke: LIME, 'stroke-width': 1.6 }, svg);
            svgEl('circle', { cx: m.x, cy: m.y, r: 3, fill: LIME }, svg);
            svgEl('path', { d: m.lead, fill: 'none', stroke: INK, 'stroke-width': 1 }, svg);
            svgText(svg, m.lx, m.ly, m.label, { 'font-size': 9.5 });
            return { ...m, ring };
        });

        svgText(svg, 14, 24, 'PLACEMENT UNDER TEST');
        svgText(svg, 586, 24, 'SYNCED TO VIDEO', { 'text-anchor': 'end' });

        // Streams: video frames on top, motion channels below.
        const x0 = 380, x1 = 586;
        const clipRect = svgEl('rect', { x: x0, y: 0, width: x1 - x0, height: 420 }, svgEl('clipPath', { id: 'pod-streams' }, svgEl('defs', {}, svg)));
        const streams = svgEl('g', { 'clip-path': 'url(#pod-streams)' }, svg);
        svgText(svg, 334, 152, 'VIDEO', { 'font-size': 9 });
        const frameRects = [];
        for (let i = 0; i < 12; i++) frameRects.push(svgEl('rect', { y: 142, width: 16, height: 12, rx: 1.5, fill: INK, 'fill-opacity': 0.75 }, streams));
        const channels = [
            { name: 'ACC', y: 200, f: [2.1, 5.3], a: 14 },
            { name: 'GYR', y: 250, f: [1.3, 7.7], a: 12 },
            { name: 'ORI', y: 300, f: [0.7, 2.9], a: 10 },
        ].map(ch => {
            svgText(svg, 334, ch.y + 4, ch.name, { 'font-size': 9 });
            svgEl('line', { x1: x0, x2: x1, y1: ch.y, y2: ch.y, stroke: INK, 'stroke-opacity': 0.15 }, svg);
            return { ...ch, path: svgEl('path', { fill: 'none', stroke: INK, 'stroke-width': 1.5 }, streams) };
        });
        const sync = svgEl('line', { y1: 132, y2: 320, stroke: '#ffffff', 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, svg);
        const links = [
            svgEl('path', { d: 'M176 106 C 260 106, 270 200, 326 200', fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-dasharray': '2 5', 'stroke-opacity': 0.6 }, svg),
            svgEl('path', { d: 'M128 296 C 230 296, 250 250, 326 250', fill: 'none', stroke: INK, 'stroke-width': 1.2, 'stroke-dasharray': '2 5', 'stroke-opacity': 0.6 }, svg),
        ];

        return t => {
            mounts.forEach((m, i) => {
                const k = (t * 0.8 + i * 0.5) % 1;
                const pad = 4 + k * 12;
                m.ring.setAttribute('x', m.x - m.w / 2 - pad);
                m.ring.setAttribute('y', m.y - m.h / 2 - pad);
                m.ring.setAttribute('width', m.w + pad * 2);
                m.ring.setAttribute('height', m.h + pad * 2);
                m.ring.setAttribute('stroke-opacity', 1 - k);
            });
            links.forEach(l => l.setAttribute('stroke-dashoffset', -t * 20));

            const shift = (t * 40) % 20;
            frameRects.forEach((r, i) => r.setAttribute('x', x0 + i * 20 - shift));
            channels.forEach((ch, c) => {
                let d = '';
                for (let x = x0; x <= x1 + 4; x += 4) {
                    const u = (x + t * 60) / 100;
                    const v = Math.sin(u * ch.f[0] + c) * 0.7 + Math.sin(u * ch.f[1]) * 0.3;
                    d += `${d ? 'L' : 'M'}${x} ${(ch.y - v * ch.a).toFixed(1)}`;
                }
                ch.path.setAttribute('d', d);
            });
            const sx = x0 + ((t * 0.12) % 1) * (x1 - x0);
            sync.setAttribute('x1', sx); sync.setAttribute('x2', sx);
        };
    },
};

/* ---------- Hero skier ---------- */

function heroSkier() {
    const g = document.getElementById('hero-skier');
    if (!g) return null;
    const skier = createSkeleton(g, { headFill: '#a9bcc7', width: 1.2, r: 1.5 });
    const svg = g.ownerSVGElement;
    const box = cornerBrackets(svg, { stroke: LIME, 'stroke-width': 3 });
    const label = svgEl('g', {}, svg);
    svgEl('rect', { width: 150, height: 26, rx: 3, fill: LIME }, label);
    const text = svgText(label, 10, 17.5, '', { 'font-size': 13 });
    const [tx, ty, s] = [560, 170, 2.6];

    return t => {
        const p = poseAt(t * 0.9);
        skier.set(p);
        const b = poseBounds(p);
        const x0 = tx + b.x0 * s, y0 = ty + b.y0 * s;
        setBrackets(box, x0, y0, tx + b.x1 * s, ty + b.y1 * s, 20);
        label.setAttribute('transform', `translate(${x0} ${y0 - 36})`);
        text.textContent = `SKIER · ${(0.96 + 0.02 * Math.sin(t * 5)).toFixed(2)}`;
    };
}

/* ---------- Wiring ---------- */

const stages = [...document.querySelectorAll('.stage')];
const thumbs = document.querySelector('.thumbs');
const panelColors = stages.map(s => getComputedStyle(s).getPropertyValue('--panel').trim());

stages.forEach((stage, i) => {
    const link = document.createElement('a');
    link.className = 'thumb';
    link.href = `#${stage.id}`;
    link.textContent = stage.dataset.short;
    link.style.setProperty('--thumb', panelColors[i]);
    link.setAttribute('aria-label', stage.querySelector('h3').textContent);
    thumbs.appendChild(link);

    const dots = stage.querySelector('.stage-dots');
    panelColors.forEach((c, j) => {
        const dot = document.createElement('i');
        dot.style.setProperty('--c', c);
        if (j === i) dot.className = 'is-current';
        dots.appendChild(dot);
    });
});
const thumbLinks = [...thumbs.children];

const renderers = [];
const hero = heroSkier();
if (hero) renderers.push({ el: document.querySelector('.hero'), draw: hero, visible: true, start: 0 });
document.querySelectorAll('.viz').forEach(svg => {
    const make = visuals[svg.dataset.viz];
    if (make) renderers.push({ el: svg, draw: make(svg), visible: false, start: 0 });
});

const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        const r = renderers.find(x => x.el === entry.target);
        if (!r) return;
        if (entry.isIntersecting && !r.visible) r.start = performance.now();
        r.visible = entry.isIntersecting;
    });
}, { threshold: 0.15 });
renderers.forEach(r => io.observe(r.el));

function frame(now) {
    renderers.forEach(r => {
        if (r.visible) r.draw((now - r.start) / 1000);
    });
    if (!reduceMotion) requestAnimationFrame(frame);
}

if (reduceMotion) {
    // One static frame per visual, at a moment where everything is drawn.
    renderers.forEach(r => r.draw(9));
} else {
    requestAnimationFrame(frame);
}

/* ---------- Real run sample ---------- */

// Turn events from the real run, in seconds from the start of the full run.
// The clip on the page starts 1.6 s into the run.
const SAMPLE_START = 1.6;
const SAMPLE_TURNS = [
    [0.4, 'left'], [2.1, 'right'], [5.8, 'left'], [9.6, 'right'], [13.9, 'left'],
    [17.3, 'right'], [20.9, 'left'], [24.3, 'right'], [27.9, 'left'],
];

function sampleRun() {
    const video = document.querySelector('.sample-video');
    const strip = document.querySelector('.turn-strip');
    const now = document.querySelector('.turn-now');
    if (!video || !strip) return;
    const head = strip.querySelector('.turn-head');
    let marks = [];

    function build() {
        const end = SAMPLE_START + video.duration;
        marks = SAMPLE_TURNS.map(([t, dir], i) => ({ t: t - SAMPLE_START, dir, n: i + 1 }))
            .filter(m => m.t >= 0 && m.t + SAMPLE_START <= end)
            .map(m => {
                const el = document.createElement('i');
                el.className = 'turn-mark';
                el.textContent = m.dir === 'left' ? 'L' : 'R';
                el.style.left = `${(m.t / video.duration) * 100}%`;
                strip.appendChild(el);
                return { ...m, el };
            });
    }

    function update() {
        if (!marks.length || !video.duration) return;
        head.style.left = `${(video.currentTime / video.duration) * 100}%`;
        let current = null;
        marks.forEach(m => { if (m.t <= video.currentTime) current = m; });
        marks.forEach(m => m.el.classList.toggle('is-current', m === current));
        now.textContent = current
            ? `TURN ${String(current.n).padStart(2, '0')} OF ${String(SAMPLE_TURNS.length).padStart(2, '0')} · ${current.dir.toUpperCase()}`
            : '—';
    }

    if (video.readyState >= 1) build();
    else video.addEventListener('loadedmetadata', build, { once: true });
    video.addEventListener('timeupdate', update);
    // timeupdate fires only a few times per second; follow frames while playing.
    function tick() {
        update();
        if (!video.paused) requestAnimationFrame(tick);
    }
    video.addEventListener('play', () => requestAnimationFrame(tick));

    if (reduceMotion) {
        video.controls = true;
        return;
    }
    // Only play while the clip is on screen.
    new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => { video.controls = true; });
        else video.pause();
    }, { threshold: 0.25 }).observe(video);
}

sampleRun();

const smallScreen = window.matchMedia('(max-width: 720px)');

function onScroll() {
    const vh = window.innerHeight;
    thumbs.classList.toggle('is-shown', window.scrollY > vh * 0.6);

    stages.forEach((stage, i) => {
        const r = stage.getBoundingClientRect();
        thumbLinks[i].classList.toggle('is-active', r.top <= vh / 2 && r.bottom > vh / 2);

        // Push the card back a little as the next stage slides over it.
        const card = stage.querySelector('.card');
        if (smallScreen.matches || reduceMotion) {
            card.style.transform = '';
            return;
        }
        const p = clamp((vh * 1.25 - r.bottom) / (vh * 0.45), 0, 1);
        card.style.transform = p ? `scale(${1 - 0.06 * p})` : '';
        card.style.filter = p ? `brightness(${1 - 0.35 * p})` : '';
    });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();
