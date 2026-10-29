/* Seasonal touches for the home page.
   The script reads the visitor's date and picks one theme, so it needs no yearly updates.
   Preview a theme: ?season=halloween    Pretend it is another day: ?date=2026-12-07 */
(function () {
    // ---------- Dates ----------

    function day(y, m, d) { return new Date(y, m - 1, d); } // m is 1-12
    function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
    function stamp(d) { return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
    function inRange(date, start, end) { const t = stamp(date); return t >= stamp(start) && t <= stamp(end); }
    function within(date, m1, d1, m2, d2) {
        const y = date.getFullYear();
        return inRange(date, day(y, m1, d1), day(y, m2, d2));
    }
    function nthWeekday(y, m, weekday, n) {
        const offset = (weekday - day(y, m, 1).getDay() + 7) % 7;
        return day(y, m, 1 + offset + 7 * (n - 1));
    }

    // Anonymous Gregorian algorithm for Easter Sunday
    function easter(y) {
        const a = y % 19, b = Math.floor(y / 100), c = y % 100;
        const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const n = h + l - 7 * m + 114;
        return day(y, Math.floor(n / 31), (n % 31) + 1);
    }

    // Islamic and Chinese dates come from the browser's built-in calendars
    const formatters = {};
    function calendarDate(date, calendar) {
        if (!(calendar in formatters)) {
            let f = null;
            try {
                f = new Intl.DateTimeFormat('en-US-u-ca-' + calendar, { month: 'numeric', day: 'numeric' });
                if (f.resolvedOptions().calendar !== calendar) f = null;
            } catch (e) {
                f = null;
            }
            formatters[calendar] = f;
        }
        const f = formatters[calendar];
        if (!f) return null;
        const parts = {};
        f.formatToParts(date).forEach(p => { parts[p.type] = p.value; });
        return { month: Number(parts.month), day: Number(parts.day) };
    }

    function islamic(date) { return calendarDate(date, 'islamic-umalqura') || {}; }

    // Known host dates. Years after this list fall back to the usual windows.
    const OLYMPICS = [
        { start: day(2028, 7, 12), end: day(2028, 7, 30), name: 'LA 2028' },
        { start: day(2030, 2, 1), end: day(2030, 2, 17), name: 'FRENCH ALPS 2030' },
        { start: day(2032, 7, 23), end: day(2032, 8, 8), name: 'BRISBANE 2032' },
        { start: day(2034, 2, 10), end: day(2034, 2, 26), name: 'SALT LAKE CITY 2034' },
    ];
    function olympics(date) {
        const y = date.getFullYear();
        const known = OLYMPICS.find(o => o.start.getFullYear() === y);
        if (known) return inRange(date, known.start, known.end) && known.name;
        if (y % 4 === 0 && within(date, 7, 24, 8, 9)) return 'SUMMER ' + y;
        if (y % 4 === 2 && within(date, 2, 6, 2, 22)) return 'WINTER ' + y;
        return false;
    }

    const ZODIAC = ['RAT', 'OX', 'TIGER', 'RABBIT', 'DRAGON', 'SNAKE', 'HORSE', 'GOAT', 'MONKEY', 'ROOSTER', 'DOG', 'PIG'];

    // ---------- Pixel art ----------
    // One character is one pixel. A '.' or any character with no color is clear.

    function sprite(art, colors, scale) {
        const w = Math.max(...art.map(r => r.length));
        let rects = '';
        art.forEach((row, y) => {
            for (let x = 0; x < row.length;) {
                let run = 1;
                while (row[x + run] === row[x]) run++;
                const c = colors[row[x]];
                if (c) {
                    const [fill, cls] = Array.isArray(c) ? c : [c];
                    rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${fill}"${cls ? ` class="${cls}"` : ''}/>`;
                }
                x += run;
            }
        });
        return `<svg viewBox="0 0 ${w} ${art.length}" width="${w * scale}" height="${art.length * scale}" shape-rendering="crispEdges">${rects}</svg>`;
    }

    // Two frames stacked; CSS swaps them
    function frames(a, b) { return `<span class="season-frames">${a}${b}</span>`; }

    const ART = {
        batUp: [
            'X.............X',
            'XX....X.X....XX',
            'XXX...XXX...XXX',
            'XXXX.XeXeX.XXXX',
            '.XXXXXXXXXXXXX.',
            '..XX..XXX..XX..',
            '.......X.......',
        ],
        batDown: [
            '......X.X......',
            '......XXX......',
            '.....XeXeX.....',
            '..XXXXXXXXXXX..',
            '.XXXX.XXX.XXXX.',
            'XXX...XXX...XXX',
            'X......X......X',
        ],
        pumpkin: [
            '......gg.....',
            '.....gg......',
            '..ooOOoOOoo..',
            '.oOOOoOOoOOo.',
            'oOOOoOOOoOOOo',
            'oOyyoOOOoyyOo',
            'oOOyoOyOoyOOo',
            'oOOOoOOOoOOOo',
            'oOyOyOyOyOyOo',
            'oOOyOyOyOyOOo',
            '.oOOoOOOoOOo.',
            '..ooooooooo..',
        ],
        spider: [
            '.X.....X.',
            'X..MMM..X',
            'X.MMMMM.X',
            '.XMeMeMX.',
            'XXMMMMMXX',
            'X.XMMMX.X',
            '.X.....X.',
        ],
        snow: [
            '...W...',
            '.W.W.W.',
            '..WWW..',
            'WWW.WWW',
            '..WWW..',
            '.W.W.W.',
            '...W...',
        ],
        snowSmall: [
            '.W.',
            'WWW',
            '.W.',
        ],
        leaf: [
            '....L....',
            '...LLL...',
            '.L.LLL.L.',
            '.LLLLLLL.',
            'LLLLLLLLL',
            '.LLLLLLL.',
            '...LSL...',
            '....S....',
            '....S....',
        ],
        blossom: [
            '..P..',
            '.PPP.',
            'PPyPP',
            '.PPP.',
            '.P.P.',
        ],
        petal: [
            '.O.',
            'OOO',
            '.O.',
        ],
        heart: [
            '.HH.HH.',
            'HwHHHHH',
            'HHHHHHH',
            '.HHHHH.',
            '..HHH..',
            '...H...',
        ],
        shamrock: [
            '....GG.GG....',
            '...GGGGGGG...',
            '....GGGGG....',
            '.GG..GGG..GG.',
            'GGGG..G..GGGG',
            '.GGGGGGGGGGG.',
            'GGGG..G..GGGG',
            '.GG...S...GG.',
            '......S......',
            '.....S.......',
        ],
        pi: [
            '.PPPPPP',
            'P.P..P.',
            '..P..P.',
            '..P..P.',
            '..P..P.',
            '.P...PP',
        ],
        pie: [
            '....cccccccc....',
            '..ccCCCCCCCCcc..',
            '.cCCCrCCCCrCCCc.',
            'cCCrCCCCrCCCCrCc',
            'cCCCCCCCCCCCCCCc',
            'cccccccccccccccc',
            'FfFfFfFfFfFfFfFf',
            '.TTTTTTTTTTTTTT.',
            '..TTTTTTTTTTTT..',
        ],
        football: [
            '....BBBBB....',
            '..BBBBBBBBB..',
            '.BBBBWBWBBBB.',
            'BBBBWWWWWBBBB',
            '.BBBBWBWBBBB.',
            '..BBBBBBBBB..',
            '....BBBBB....',
        ],
        goalpost: [
            'Y.........Y',
            'Y.........Y',
            'Y.........Y',
            'Y.........Y',
            'Y.........Y',
            'Y.........Y',
            'Y.........Y',
            'YYYYYYYYYYY',
            '.....Y.....',
            '.....Y.....',
            '.....Y.....',
            '.....Y.....',
            '....YYY....',
            'GGGGGGGGGGG',
        ],
        flag: [
            'PBBBBBBRRRRRRRR',
            'PBwBwBBWWWWWWWW',
            'PBBwBwBRRRRRRRR',
            'PBwBwBBWWWWWWWW',
            'PBBBBBBRRRRRRRR',
            'PWWWWWWWWWWWWWW',
            'PRRRRRRRRRRRRRR',
            'PWWWWWWWWWWWWWW',
            'PRRRRRRRRRRRRRR',
            'P..............',
            'P..............',
            'P..............',
            'P..............',
        ],
        fanous: [
            '...D...',
            '..D.D..',
            '...D...',
            '..DDD..',
            '.DDDDD.',
            'DyyyyyD',
            'DyYyYyD',
            'DyyDyyD',
            'DyYyYyD',
            'DyyyyyD',
            '.DDDDD.',
            '..DDD..',
            '...D...',
        ],
        redLantern: [
            '...KKK...',
            '.RRRRRRR.',
            'RRrRRRrRR',
            'RRrRyRrRR',
            'RRrRyRrRR',
            'RRrRRRrRR',
            '.RRRRRRR.',
            '...KKK...',
            '....T....',
            '...TTT...',
            '...T.T...',
        ],
        star: [
            '..S..',
            '..S..',
            'SSSSS',
            '..S..',
            '..S..',
        ],
        dot: ['S'],
        firefly: ['FF', 'FF'],
        globe: [
            '...BBBBB...',
            '..BGGBBBBB.',
            '.BGGGGBBGB.',
            'BBGGGBBGGGB',
            'BBBGBBBGGBB',
            'BBBBBBBBGBB',
            'BBBGGBBBBBB',
            '.BBGGGBBBB.',
            '..BBGGBBB..',
            '...BBBBB...',
        ],
        skull: [
            '...WWWWW...',
            '.WWWpWpWWW.',
            'WWWWWyWWWWW',
            'WWWWpWpWWWW',
            'WW...W...WW',
            'WW.o.W.o.WW',
            'WW...W...WW',
            '.WWWW.WWWW.',
            '..WWWWWWW..',
            '..W.W.W.W..',
            '..WWWWWWW..',
        ],
        medal: [
            'RR.RR',
            '.RRR.',
            '..R..',
            '.MMM.',
            'MMmMM',
            'MMMMM',
            '.MMM.',
        ],
        egg: [
            '..EEE..',
            '.EEEEE.',
            '.EEEEE.',
            'SSSSSSS',
            'EEEEEEE',
            'EdEdEdE',
            'EEEEEEE',
            '.EEEEE.',
            '..EEE..',
        ],
        tree: [
            '.....Y.....',
            '....YYY....',
            '.....G.....',
            '....GGG....',
            '...GGrGG...',
            '....GGG....',
            '...GGGGG...',
            '..GbGGGGG..',
            '...GGGGG...',
            '..GGGGyGG..',
            '.GGGGGGGGG.',
            'GGrGGGGGbGG',
            '.....T.....',
            '....TTT....',
        ],
        bulb: [
            '.k.',
            'BBB',
            'BBB',
            '.B.',
        ],
        plane: [
            'T.................',
            'TT.....WWWWWWWW...',
            'TTT......s..s.....',
            'TTTBBBBBBBBBBBB.p.',
            '.BBBBBBBBwwBwwBBBp',
            '...SSSSSSSSSSSSS.p',
            '........s....s....',
            '........k....k....',
        ],
        cat: [
            'K.....K..',
            'KK...KK..',
            'KKKKKKK..',
            'KeKKKeK..',
            'KKKpKKK.K',
            '.KKKKK..K',
            '.KKKKKK.K',
            '.KKKKKKKK',
            '.KK.KK...',
        ],
        catWalkA: [
            'K............K.K',
            'K............KKK',
            '.K...........eKe',
            '.K.KKKKKKKKKKKKK',
            '..KKKKKKKKKKKKK.',
            '..KKKKKKKKKKKK..',
            '..K.K......K.K..',
            '..K.K......K.K..',
        ],
        catWalkB: [
            'K............K.K',
            'K............KKK',
            '.K...........eKe',
            '.K.KKKKKKKKKKKKK',
            '..KKKKKKKKKKKKK.',
            '..KKKKKKKKKKKK..',
            '...KK.....KK....',
            '..K..K...K..K...',
        ],
        frog: [
            '..GG...GG..',
            '.GwkG.GwkG.',
            '.GGGGGGGGG.',
            'GGGGGGGGGGG',
            'GGgGGGGGgGG',
            '.GGgggggGG.',
            'GG.GG.GG.GG',
        ],
        groundhog: [
            '..BBBBBB..',
            '.BBBBBBBB.',
            '.BkBBBBkB.',
            '.BBBnnBBB.',
            '..BBwwBB..',
            '.BBBBBBBB.',
            'BBbBBBBbBB',
            'BBBbbbbBBB',
            'BBBbbbbBBB',
            '.BBbbbbBB.',
            '.BBBBBBBB.',
        ],
        mound: [
            '...GG.GGGGGG.GG...',
            '..DDDDDDDDDDDDDD..',
            '.DDDdDDDDDDDDdDDD.',
            'DDDDDDDDDDDDDDDDDD',
        ],
        picado: [
            'FFFFFFFFF',
            'FFFFFFFFF',
            'FF.FFF.FF',
            'F.F.F.F.F',
            'FF.FFF.FF',
            'FFFF.FFFF',
            'FFF...FFF',
            'FFFF.FFFF',
            'FFFFFFFFF',
            'F.F.F.F.F',
        ],
        beads: [
            'B.........B',
            'b.........b',
            '.B.......B.',
            '.b.......b.',
            '..B.....B..',
            '...b...b...',
            '....BbB....',
            '....MMM....',
            '...MMmMM...',
            '....MMM....',
        ],
        mask: [
            '...G.......Y...',
            '..GG.......YY..',
            '.PPPP.....PPPP.',
            'PPPPPPP.PPPPPPP',
            'PPy..PPPPP..yPP',
            'PPy..PPPPP..yPP',
            '.PPPPPP.PPPPPP.',
            '..PPPP...PPPP..',
        ],
        block: [
            'KKKKKKKKKKKK',
            'KYYYYYYYYYYK',
            'KYoYYYYYYoYK',
            'KYYYKKKKYYYK',
            'KYYKKYYKKYYK',
            'KYYYYYYKKYYK',
            'KYYYYYKKYYYK',
            'KYYYYKKYYYYK',
            'KYYYYYYYYYYK',
            'KYYYYKKYYYYK',
            'KYoYYYYYYoYK',
            'KKKKKKKKKKKK',
        ],
        hilt: [
            'kWWk',
            '.kk.',
            'SSSS',
            'SkSS',
            'SSSS',
            'SkSS',
            'SSSS',
            'kSSk',
            'SSSS',
            '.SS.',
            '.SS.',
            'kkkk',
        ],
        tulips: [
            '.R.R...P.P...Y.Y.',
            '.RRR...PPP...YYY.',
            '.RRR...PPP...YYY.',
            '..R.....P.....Y..',
            '..G.....G.....G..',
            '...G....G....G...',
            '....G...G...G....',
            '.....G.GGG.G.....',
            '......GGGGG......',
            '.....kkkkkkk.....',
            '.....KKKKKKK.....',
            '......KKKKK......',
            '......KKKKK......',
        ],
        tie: [
            '.KKKKK.',
            '..KKK..',
            '..KKK..',
            '.KKkKK.',
            '.KkKKK.',
            '.KKKKk.',
            'KKKkKKK',
            'KkKKKkK',
            'KKKKkKK',
            'KKkKKKK',
            '.KKKkK.',
            '..KKK..',
            '...K...',
        ],
        mooncake: [
            '..CCCCCCCC..',
            '.CccccccccC.',
            'CccCCCCCCccC',
            'CcCcCccCcCcC',
            'CcCccCCccCcC',
            'CcCcCccCcCcC',
            'CccCCCCCCccC',
            '.CccccccccC.',
            '..CCCCCCCC..',
            '.dddddddddd.',
        ],
        soccer: [
            '..WkkkW..',
            '.WWWkWWW.',
            'WWWWWWWWW',
            'kWWWkWWWk',
            'kWWkkkWWk',
            'WWWWkWWWW',
            'WWWWWWWWW',
            '.WkWWWkW.',
            '..kkWkk..',
        ],
        bit0: ['PPP', 'P.P', 'P.P', 'P.P', 'PPP'],
        bit1: ['.P.', 'PP.', '.P.', '.P.', 'PPP'],
        meteor: [
            '.........d',
            '........d.',
            '.......c..',
            '......c...',
            '.....b....',
            '....b.....',
            '...a......',
            '..a.......',
            '.WW.......',
            'WW........',
        ],
    };

    // Shapes that are easier to compute than to draw
    function crescentArt(size) {
        const r = size / 2, rows = [];
        for (let y = 0; y < size; y++) {
            let row = '';
            for (let x = 0; x < size; x++) {
                const outer = Math.hypot(x + 0.5 - r, y + 0.5 - r) < r;
                const inner = Math.hypot(x + 0.5 - r - size * 0.28, y + 0.5 - r + size * 0.08) < r * 0.82;
                row += outer && !inner ? 'M' : '.';
            }
            rows.push(row);
        }
        return rows;
    }

    function ringsArt() {
        const r = 4.2, centers = [[5, 5, 'b'], [15, 5, 'k'], [25, 5, 'r'], [10, 10, 'y'], [20, 10, 'g']];
        const rows = [];
        for (let y = 0; y < 16; y++) {
            let row = '';
            for (let x = 0; x < 31; x++) {
                const hit = centers.find(([cx, cy]) => Math.abs(Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - r) < 0.7);
                row += hit ? hit[2] : '.';
            }
            rows.push(row);
        }
        return rows;
    }

    // Two frames: straight rays, then diagonal rays
    function sunArt(diagonal) {
        const rows = [];
        for (let y = 0; y < 19; y++) {
            let row = '';
            for (let x = 0; x < 19; x++) {
                const dx = x - 9, dy = y - 9, dist = Math.hypot(dx, dy);
                const ray = diagonal ? Math.abs(dx) === Math.abs(dy) : dx === 0 || dy === 0;
                row += dist < 4.6 ? (dist < 3.4 ? 'Y' : 'O') : ray && dist > 6 && dist < 9.5 ? 'R' : '.';
            }
            rows.push(row);
        }
        return rows;
    }

    function fullMoonArt() {
        const r = 7.5, craters = [[5, 6, 1.6], [10, 4, 1.1], [9, 10, 2], [4, 11, 1]];
        const rows = [];
        for (let y = 0; y < 15; y++) {
            let row = '';
            for (let x = 0; x < 15; x++) {
                const inside = Math.hypot(x + 0.5 - r, y + 0.5 - r) < r;
                const crater = craters.some(([cx, cy, cr]) => Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < cr);
                row += inside ? (crater ? 'm' : 'M') : '.';
            }
            rows.push(row);
        }
        return rows;
    }

    const PURPLE = { X: '#8b6bb5', M: '#6e5296', e: '#ffff00' };
    const SUN = { Y: '#ffff00', O: '#ffcc00', R: '#ff8c1a' };
    const LEAF_COLORS = ['#e2582b', '#f29a2e', '#d13b3b', '#e8c23a'];

    const draw = {
        bat: () => frames(sprite(ART.batUp, PURPLE, 4), sprite(ART.batDown, PURPLE, 4)),
        spider: () => sprite(ART.spider, PURPLE, 3),
        pumpkin: () => sprite(ART.pumpkin, { o: '#c75a12', O: '#ff8c1a', y: ['#ffff00', 'flicker'], g: '#4f9a3a' }, 5),
        snow: () => Math.random() < 0.5
            ? sprite(ART.snow, { W: '#e3f2ff' }, 3)
            : sprite(ART.snowSmall, { W: '#e3f2ff' }, 3),
        leaf: () => sprite(ART.leaf, { L: pick(LEAF_COLORS), S: '#7a4a22' }, 3),
        greenLeaf: () => sprite(ART.leaf, { L: pick(['#4f9a3a', '#7cc35a', '#2f7a3a']), S: '#7a4a22' }, 3),
        blossom: () => sprite(ART.blossom, { P: pick(['#ffb7d5', '#ff8fc4', '#ffd6e8']), y: '#ffff00' }, 3),
        marigold: () => sprite(ART.petal, { O: pick(['#ff8c1a', '#ffb000', '#ff6a00']) }, 3),
        heart: () => sprite(ART.heart, { H: pick(['#ff69b4', '#ff3d8b']), w: '#ffd1e8' }, 3),
        shamrock: () => sprite(ART.shamrock, { G: pick(['#3fae49', '#2e8b3a', '#5cc45f']), S: '#2e6b2e' }, 3),
        pi: () => sprite(ART.pi, { P: pick(['#ffff00', '#ff69b4']) }, 3),
        pie: () => sprite(ART.pie, { c: '#b9772e', C: '#e8b06a', r: '#8a2f1d', F: '#c4452b', f: '#8a2f1d', T: '#9fa4ad' }, 5),
        football: () => sprite(ART.football, { B: '#9a5426', W: '#ffffff' }, 3),
        goalpost: () => sprite(ART.goalpost, { Y: '#ffff00', G: '#3fae49' }, 6),
        flag: () => sprite(ART.flag, { P: '#c0c0c0', B: '#2c4fa3', w: '#ffffff', R: '#d22f3c', W: '#ffffff' }, 5),
        fanous: () => sprite(ART.fanous, { D: '#d9a521', y: ['#ffe066', 'flicker'], Y: '#fff7cc' }, 4),
        crescent: () => sprite(crescentArt(13), { M: '#ffe9a8' }, 4),
        redLantern: () => sprite(ART.redLantern, { K: '#d9a521', R: '#d6262f', r: '#a5161e', y: ['#ffcf3a', 'flicker'], T: '#ffcf3a' }, 4),
        star: () => sprite(ART.star, { S: pick(['#ffff00', '#fff3b0', '#ffffff']) }, 2),
        dot: () => sprite(ART.dot, { S: pick(['#ffff00', '#fff3b0', '#ffffff']) }, 3),
        firefly: () => sprite(ART.firefly, { F: '#d8ff5a' }, 2),
        globe: () => sprite(ART.globe, { B: '#3a7bd5', G: '#4caf50' }, 6),
        skull: () => sprite(ART.skull, { W: '#f4ecdf', p: '#ff69b4', y: '#ffff00', o: '#ff8c1a' }, 5),
        medal: () => sprite(ART.medal, { R: pick(['#d22f3c', '#2c4fa3']), M: pick(['#ffd34d', '#c9ced6', '#cd7f32']), m: '#ffffff' }, 3),
        egg: () => {
            const [E, S] = pick([['#ffb7d5', '#ffff00'], ['#a8e6ff', '#ff69b4'], ['#c8f7a8', '#8b6bb5'], ['#fff3a0', '#3a7bd5'], ['#d9c2ff', '#ff8c1a']]);
            return sprite(ART.egg, { E, S, d: S }, 3);
        },
        tree: () => sprite(ART.tree, { Y: ['#ffff00', 'flicker'], G: '#2e8b3a', r: '#ff3d5a', b: '#5ab0ff', y: '#ffff00', T: '#7a4a22' }, 5),
        rings: () => sprite(ringsArt(), { b: '#0081c8', k: '#e8e8e8', r: '#ee334e', y: '#fcb131', g: '#00a651' }, 3),
        plane: () => sprite(ART.plane, { T: '#ff69b4', W: '#ffff00', B: '#f4ecdf', S: '#ff69b4', w: '#5ab0ff', p: '#9fa4ad', s: '#9fa4ad', k: '#555555' }, 3),
        cat: () => {
            const [K, e] = pick([['#a8a8b0', '#ffff00'], ['#f29a2e', '#3fae49'], ['#f4ecdf', '#5ab0ff'], ['#5a5a66', '#ffff00']]);
            return sprite(ART.cat, { K, e, p: '#ff69b4' }, 3);
        },
        blackCat: () => frames(
            sprite(ART.catWalkA, { K: '#4a4a55', e: '#ffff00' }, 3),
            sprite(ART.catWalkB, { K: '#4a4a55', e: '#ffff00' }, 3)),
        frog: () => sprite(ART.frog, { G: '#4caf50', g: '#a8e07a', w: '#ffffff', k: '#000000' }, 3),
        groundhog: () => `<div class="season-burrow"><div class="season-peek"><div class="season-critter">${
            sprite(ART.groundhog, { B: '#9a6a3a', b: '#c99a62', k: '#000000', n: '#3a2a1a', w: '#ffffff' }, 5)
        }</div></div>${sprite(ART.mound, { G: '#4f9a3a', D: '#6b4a2a', d: '#4f3720' }, 5)}</div>`,
        picado: color => sprite(ART.picado, { F: color }, 3),
        beads: (scale = 4) => sprite(ART.beads, { B: pick(['#8b3fbf', '#3fae49', '#ffd34d']), b: '#ffffff', M: '#ffd34d', m: '#8b3fbf' }, scale),
        mask: () => sprite(ART.mask, { P: '#8b3fbf', y: '#ffd34d', G: '#3fae49', Y: '#ffd34d' }, 5),
        block: () => sprite(ART.block, { K: '#7a4a22', Y: '#ffd000', o: '#7a4a22' }, 5),
        saber: () => `<div class="season-saber" style="--blade: ${pick(['#4cff4c', '#5ab0ff', '#ff69b4'])}"><div class="season-blade"></div>${
            sprite(ART.hilt, { k: '#555555', W: '#9fa4ad', S: '#c9ced6' }, 4)
        }</div>`,
        tulips: () => sprite(ART.tulips, { R: '#ff3d5a', P: '#ff8fc4', Y: '#ffff00', G: '#4f9a3a', k: '#e2582b', K: '#c75a12' }, 5),
        tie: (scale = 5) => sprite(ART.tie, { K: pick(['#3a6fd8', '#d22f3c', '#8b6bb5']), k: '#ffff00' }, scale),
        mooncake: () => sprite(ART.mooncake, { C: '#c98a3d', c: '#e8b06a', d: '#8a5a22' }, 5),
        fullMoon: () => sprite(fullMoonArt(), { M: '#fff3c4', m: '#e8d9a0' }, 4),
        sun: () => frames(sprite(sunArt(false), SUN, 4), sprite(sunArt(true), SUN, 4)),
        soccer: (scale = 3) => sprite(ART.soccer, { W: '#f4f4f4', k: '#555555' }, scale),
        bit: () => sprite(pick([ART.bit0, ART.bit1]), { P: pick(['#ffff00', '#ff69b4']) }, 3),
        meteor: () => sprite(ART.meteor, { W: '#ffffff', a: '#fff3b0', b: 'rgba(255, 243, 176, 0.7)', c: 'rgba(255, 243, 176, 0.45)', d: 'rgba(255, 243, 176, 0.25)' }, 3),
    };

    // ---------- Scene pieces ----------

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const density = Math.max(0.5, Math.min(1, window.innerWidth / 1200));
    function rand(a, b) { return a + Math.random() * (b - a); }
    function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

    function el(cls, html, vars) {
        const node = document.createElement('div');
        node.className = cls;
        if (html) node.innerHTML = html;
        for (const k in vars || {}) node.style.setProperty('--' + k, vars[k]);
        return node;
    }

    let overlay;
    function layer() {
        if (!overlay) {
            overlay = el('season-layer');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    let topLayer;
    function hangLayer() {
        if (!topLayer) {
            topLayer = el('season-hangers');
            topLayer.setAttribute('aria-hidden', 'true');
            document.body.appendChild(topLayer);
        }
        return topLayer;
    }

    // Small yellow label above the name, same look as the card tags
    function tag(text) {
        const h1 = document.querySelector('.intro h1');
        if (!h1) return null;
        const label = document.createElement('span');
        label.className = 'season-tag';
        label.textContent = text;
        h1.parentNode.insertBefore(label, h1);
        return label;
    }

    // Things that drift down (or up) the screen on a loop
    function fall({ art, count, speed = [10, 18], sway = 40, spin = 25, rise = false }) {
        if (reduceMotion) return;
        for (let i = 0, n = Math.round(count * density); i < n; i++) {
            const dur = rand(speed[0], speed[1]);
            const piece = el('season-fall' + (rise ? ' rise' : ''), '', {
                x: rand(0, 98) + 'vw', dur: dur + 's', delay: -rand(0, dur) + 's',
            });
            piece.appendChild(el('season-sway', art(), {
                amp: rand(sway / 3, sway) + 'px', 'sway-dur': rand(1.8, 3.6) + 's', spin: rand(-spin, spin) + 'deg',
            }));
            layer().appendChild(piece);
        }
    }

    // Things that cross the screen, then wait off screen before the next pass
    // motion: 'bob', 'arc' (a throw), 'hop' or 'walk'. edge: how far off screen each pass starts.
    function fly({ art, count, speed = [8, 14], top = [5, 55], motion = 'bob', bothWays = true, edge = 60, offset }) {
        if (reduceMotion) return;
        for (let i = 0, n = Math.max(1, Math.round(count * density)); i < n; i++) {
            const dur = rand(speed[0], speed[1]);
            const reverse = bothWays && Math.random() < 0.5;
            const piece = el(`season-fly ${motion}` + (reverse ? ' reverse' : ''), '', {
                y: rand(top[0], top[1]) + 'vh', dur: dur + 's', delay: (offset ?? -rand(0, dur)) + 's', edge: edge + 'px',
            });
            piece.appendChild(el('season-path', `<div class="season-face">${art()}</div>`, { bob: rand(0.8, 1.6) + 's' }));
            layer().appendChild(piece);
        }
    }

    // Things on a string from the top of the page
    function hang(items) {
        const narrow = window.innerWidth < 768;
        items.forEach(({ art, x, len, string = '#777', bob = false, still = false }) => {
            if (narrow && x < 70) return;
            const piece = el('season-hang' + (bob ? ' bob' : '') + (still ? ' still' : ''), art(), {
                x: x + 'vw', len: (narrow ? len * 0.5 : len) + 'px', string,
                dur: rand(3, 5) + 's', delay: -rand(0, 5) + 's',
            });
            hangLayer().appendChild(piece);
        });
    }

    // A row of small things along the top of the page; art(i) draws the i-th one
    function garland({ art, gap, lens, string, cls = '', wire = false }) {
        if (wire) hangLayer().appendChild(el('season-wire', '', { string }));
        const n = Math.floor(window.innerWidth / gap);
        for (let i = 0; i <= n; i++) {
            hangLayer().appendChild(el('season-hang ' + cls, art(i), {
                x: (i / n) * 97 + 'vw', len: lens[i % lens.length] + 'px', string,
                dur: rand(2.5, 4) + 's', delay: -(i % 3) * 0.55 + 's',
            }));
        }
    }

    function lights(colors) {
        garland({
            art: i => sprite(ART.bulb, { k: '#555', B: colors[i % colors.length] }, 3),
            gap: 44, lens: [12, 6], string: '#3a3a3a', cls: 'season-bulb',
        });
    }

    // Shooting stars that cross the top of the screen now and then
    function meteors(count) {
        if (reduceMotion) return;
        for (let i = 0; i < count; i++) {
            layer().appendChild(el('season-meteor', draw.meteor(), {
                x: rand(25, 105) + 'vw', y: rand(-5, 30) + 'vh', dur: rand(4, 9) + 's', delay: -rand(0, 9) + 's',
            }));
        }
    }

    // Twinkling points; with drift they wander like fireflies
    function twinkle({ art, count, top = [0, 100], drift = false }) {
        for (let i = 0, n = Math.round(count * density); i < n; i++) {
            const piece = el('season-twinkle' + (drift ? ' drift' : ''), art(), {
                x: rand(1, 98) + 'vw', y: rand(top[0], top[1]) + 'vh',
                dur: rand(1.5, 3.5) + 's', delay: -rand(0, 4) + 's',
                dx: rand(-60, 60) + 'px', dy: rand(-40, 40) + 'px', 'drift-dur': rand(6, 12) + 's',
            });
            layer().appendChild(piece);
        }
    }

    // Pixel fireworks on a canvas; returns a function to set one off at a point
    function fireworks(colors, every) {
        if (reduceMotion) return () => {};
        const canvas = document.createElement('canvas');
        canvas.className = 'season-canvas';
        layer().appendChild(canvas);
        const ctx = canvas.getContext('2d');
        const P = 4;
        let sparks = [], last = 0;
        function size() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
        size();
        window.addEventListener('resize', size);

        function burst(x, y) {
            const color = pick(colors), n = 28;
            for (let i = 0; i < n; i++) {
                const a = (i / n) * Math.PI * 2, s = rand(1.5, 3.2);
                sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(45, 75), color: Math.random() < 0.2 ? '#ffffff' : color });
            }
        }

        function frame(t) {
            if (every && t - last > every) {
                last = t;
                burst(rand(0.1, 0.9) * canvas.width, rand(0.08, 0.4) * canvas.height);
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            sparks = sparks.filter(s => s.life-- > 0);
            for (const s of sparks) {
                s.x += s.vx; s.y += s.vy;
                s.vx *= 0.97; s.vy = s.vy * 0.97 + 0.04;
                ctx.globalAlpha = Math.min(1, s.life / 30);
                ctx.fillStyle = s.color;
                ctx.fillRect(Math.round(s.x / P) * P, Math.round(s.y / P) * P, P, P);
            }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        return burst;
    }

    // Removes and re-adds a class so its CSS animation plays again
    function restart(node, cls) {
        node.classList.remove(cls);
        void node.offsetWidth;
        node.classList.add(cls);
        node.addEventListener('animationend', () => node.classList.remove(cls), { once: true });
    }

    // Sprites that jump out of a point: 'up' floats away, 'toss' arcs and drops
    function pop(art, from, count, mode = 'toss') {
        const r = from.getBoundingClientRect();
        const x0 = r.left + r.width / 2, y0 = r.top + r.height / 3;
        for (let i = 0; i < count; i++) {
            const piece = el('season-pop', art());
            piece.style.left = x0 + 'px';
            piece.style.top = y0 + 'px';
            layer().appendChild(piece);
            const dx = rand(-0.9, 0.15) * window.innerWidth * 0.5;
            const keyframes = mode === 'up'
                ? [
                    { transform: 'translate(-50%, -50%)', easing: 'ease-in' },
                    { transform: `translate(${dx}px, ${-y0 - 80}px)` },
                ]
                : [
                    { transform: 'translate(-50%, -50%) rotate(0deg)', easing: 'ease-out' },
                    { transform: `translate(${dx * 0.5}px, ${-rand(120, 260)}px) rotate(${rand(-180, 180)}deg)`, offset: 0.4, easing: 'ease-in' },
                    { transform: `translate(${dx}px, ${window.innerHeight - y0 + 60}px) rotate(${rand(-360, 360)}deg)` },
                ];
            piece.animate(keyframes, { duration: rand(1600, 2600), delay: i * 90, fill: 'both' }).onfinish = () => piece.remove();
        }
    }

    // One larger sprite in the bottom-right corner; it can react to a click
    function perch(art, label, onClick) {
        const node = document.createElement(onClick ? 'button' : 'div');
        node.className = 'season-perch';
        node.innerHTML = art;
        if (onClick) {
            node.type = 'button';
            node.title = label;
            node.setAttribute('aria-label', label);
            node.addEventListener('click', () => onClick(node));
        } else {
            node.setAttribute('aria-hidden', 'true');
        }
        document.body.appendChild(node);
        return node;
    }

    // Eggs hidden in the page margins; the tag keeps score
    function eggHunt(total) {
        const label = tag(`EGG HUNT 0/${total}`);
        const main = document.querySelector('main').getBoundingClientRect();
        const height = document.documentElement.scrollHeight;
        let found = 0;
        for (let i = 0; i < total; i++) {
            const egg = document.createElement('button');
            egg.type = 'button';
            egg.className = 'season-egg';
            egg.setAttribute('aria-label', 'Hidden egg');
            egg.innerHTML = draw.egg();
            const left = Math.random() < 0.5;
            const gutter = left ? main.left : window.innerWidth - main.right;
            const x = rand(4, Math.max(8, gutter - 30));
            egg.style[left ? 'left' : 'right'] = x + 'px';
            egg.style.top = rand(220, height - 60) + 'px';
            egg.addEventListener('click', () => {
                found++;
                if (label) label.textContent = found === total ? 'YOU FOUND EVERY EGG!' : `EGG HUNT ${found}/${total}`;
                if (found === total) pop(draw.blossom, egg, 14);
                egg.classList.add('found');
                setTimeout(() => egg.remove(), 400);
            }, { once: true });
            document.body.appendChild(egg);
        }
    }

    // ---------- Themes ----------
    // The first theme that matches today wins, so short holidays sit above long ones.
    // when() returns false, or a value that build() can use.

    const THEMES = [
        {
            id: 'newyear',
            when: d => (within(d, 12, 31, 12, 31) && d.getFullYear() + 1) || (within(d, 1, 1, 1, 1) && d.getFullYear()),
            preview: () => new Date().getFullYear() + 1,
            build: year => {
                tag(`HAPPY NEW YEAR ${year}`);
                const boom = fireworks(['#ff69b4', '#ffff00', '#8b6bb5', '#5ab0ff'], 1100);
                perch(draw.heart(), 'Set off a firework', node => {
                    const r = node.getBoundingClientRect();
                    boom(r.left - 80, r.top - 160);
                });
            },
        },
        {
            id: 'july4',
            when: d => within(d, 7, 1, 7, 4),
            build: () => {
                tag('HAPPY 4TH OF JULY');
                const boom = fireworks(['#d22f3c', '#ffffff', '#3a6fd8'], 1300);
                perch(draw.flag(), 'Set off a firework', node => {
                    const r = node.getBoundingClientRect();
                    boom(r.left - 60, r.top - 140);
                    setTimeout(() => boom(r.left - 220, r.top - 220), 250);
                });
            },
        },
        {
            id: 'aprilfools',
            when: d => within(d, 4, 1, 4, 1),
            build: () => {
                const label = tag("HAPPY APRIL FOOLS' DAY");
                if (label) label.classList.add('upside-down');
                perch(draw.block(), 'Hit the block', () => {
                    if (label) label.classList.remove('upside-down');
                    if (reduceMotion) return;
                    // Spin around the middle of the screen, not the middle of the long page
                    const main = document.querySelector('main');
                    const middle = window.innerHeight / 2 - main.getBoundingClientRect().top;
                    main.style.transformOrigin = `50% ${middle}px`;
                    restart(main, 'season-roll');
                });
            },
        },
        {
            id: 'leapday',
            when: d => d.getMonth() === 1 && d.getDate() === 29,
            build: () => {
                tag('HAPPY LEAP DAY');
                fly({ art: draw.frog, count: 4, speed: [10, 16], top: [86, 92], motion: 'hop' });
            },
        },
        {
            id: 'groundhog',
            when: d => within(d, 2, 2, 2, 2),
            build: () => {
                tag('HAPPY GROUNDHOG DAY');
                perch(draw.groundhog(), 'Scare the groundhog', node => {
                    node.classList.add('hide');
                    setTimeout(() => node.classList.remove('hide'), 3000);
                });
            },
        },
        {
            id: 'piday',
            when: d => within(d, 3, 14, 3, 14),
            build: () => {
                tag('HAPPY PI DAY · 3.14159...');
                fall({ art: draw.pi, count: 12, spin: 40 });
                perch(draw.pie(), 'Slice the pie', node => pop(draw.pi, node, 8));
            },
        },
        {
            id: 'maythe4th',
            when: d => within(d, 5, 4, 5, 4),
            build: () => {
                tag('MAY THE 4TH BE WITH YOU');
                twinkle({ art: draw.star, count: 16, top: [2, 60] });
                perch(draw.saber(), 'Switch it on', node => node.classList.toggle('on'));
            },
        },
        {
            id: 'cincodemayo',
            when: d => within(d, 5, 5, 5, 5),
            build: () => {
                tag('FELIZ CINCO DE MAYO');
                const colors = ['#ff69b4', '#ffff00', '#5ab0ff', '#4caf50', '#ff8c1a', '#8b6bb5'];
                garland({ art: i => draw.picado(colors[i % colors.length]), gap: 40, lens: [2], string: '#bbbbbb', wire: true });
            },
        },
        {
            id: 'catday',
            when: d => within(d, 8, 8, 8, 8),
            build: () => {
                tag("IT'S RAINING CATS · INTERNATIONAL CAT DAY");
                fall({ art: draw.cat, count: 14, spin: 20 });
            },
        },
        {
            id: 'aviation',
            when: d => (within(d, 8, 19, 8, 19) && { label: 'HAPPY NATIONAL AVIATION DAY', banner: 'HAPPY AVIATION DAY' })
                || (within(d, 12, 17, 12, 17) && { label: 'WRIGHT BROTHERS DAY', banner: 'FIRST FLIGHT · DEC 17 1903' }),
            preview: () => ({ label: 'HAPPY NATIONAL AVIATION DAY', banner: 'HAPPY AVIATION DAY' }),
            build: ({ label, banner }) => {
                tag(label);
                fly({
                    art: () => `<div class="season-tow"><span class="season-banner">${banner}</span><span class="season-rope"></span>${draw.plane()}</div>`,
                    count: 1, speed: [16, 16], top: [2, 4], bothWays: false, edge: 600, offset: -1,
                });
            },
        },
        {
            id: 'programmers',
            when: d => stamp(d) === stamp(new Date(d.getFullYear(), 0, 256)),
            build: () => {
                tag("HAPPY PROGRAMMERS' DAY · DAY 256");
                fall({ art: draw.bit, count: 16, speed: [8, 14], sway: 6, spin: 0 });
            },
        },
        {
            id: 'superbowl',
            when: d => {
                const sunday = nthWeekday(d.getFullYear(), 2, 0, 2);
                return inRange(d, addDays(sunday, -2), sunday) && (d.getDay() === 0 ? 'SUPER BOWL SUNDAY' : 'SUPER BOWL WEEKEND');
            },
            preview: () => 'SUPER BOWL SUNDAY',
            build: label => {
                tag(label);
                fly({ art: draw.football, count: 3, speed: [6, 10], top: [25, 60], motion: 'arc' });
                perch(draw.goalpost(), 'Kick a field goal', node => pop(draw.football, node, 1));
            },
        },
        {
            id: 'valentines',
            when: d => within(d, 2, 12, 2, 14),
            build: () => {
                tag("HAPPY VALENTINE'S DAY");
                fall({ art: draw.heart, count: 14, speed: [12, 20], spin: 10, rise: true });
            },
        },
        {
            id: 'stpatricks',
            when: d => within(d, 3, 16, 3, 17),
            build: () => {
                tag("HAPPY ST. PATRICK'S DAY");
                fall({ art: draw.shamrock, count: 14 });
            },
        },
        {
            id: 'earthday',
            when: d => within(d, 4, 22, 4, 22),
            build: () => {
                tag('HAPPY EARTH DAY');
                fall({ art: draw.greenLeaf, count: 10 });
                perch(draw.globe(), 'Plant some leaves', node => pop(draw.greenLeaf, node, 8));
            },
        },
        {
            id: 'friday13',
            when: d => d.getDay() === 5 && d.getDate() === 13,
            build: () => {
                tag('FRIDAY THE 13TH');
                fly({ art: draw.blackCat, count: 1, speed: [14, 14], top: [90, 90], motion: 'walk', bothWays: false, offset: -1 });
            },
        },
        {
            id: 'mothersday',
            when: d => {
                const sunday = nthWeekday(d.getFullYear(), 5, 0, 2);
                return inRange(d, addDays(sunday, -1), sunday);
            },
            build: () => {
                tag("HAPPY MOTHER'S DAY");
                fall({ art: draw.blossom, count: 10 });
                perch(draw.tulips(), 'Send some love', node => pop(draw.heart, node, 8, 'up'));
            },
        },
        {
            id: 'fathersday',
            when: d => {
                const sunday = nthWeekday(d.getFullYear(), 6, 0, 3);
                return inRange(d, addDays(sunday, -1), sunday);
            },
            build: () => {
                tag("HAPPY FATHER'S DAY");
                perch(draw.tie(), 'Toss some ties', node => pop(() => draw.tie(3), node, 6));
            },
        },
        {
            id: 'solstice',
            when: d => within(d, 6, 20, 6, 21),
            build: () => {
                tag('LONGEST DAY OF THE YEAR');
                twinkle({ art: draw.firefly, count: 10, top: [40, 95], drift: true });
                perch(draw.sun(), 'Sun');
            },
        },
        {
            id: 'mardigras',
            when: d => {
                const tuesday = addDays(easter(d.getFullYear()), -47);
                return inRange(d, addDays(tuesday, -1), tuesday);
            },
            build: () => {
                tag('HAPPY MARDI GRAS');
                hang([
                    { art: draw.beads, x: 62, len: 30, string: '#ffd34d' },
                    { art: draw.beads, x: 72, len: 60, string: '#ffd34d' },
                    { art: draw.beads, x: 83, len: 15, string: '#ffd34d' },
                    { art: draw.beads, x: 93, len: 45, string: '#ffd34d' },
                ]);
                perch(draw.mask(), 'Throw beads', node => pop(() => draw.beads(3), node, 8));
            },
        },
        {
            id: 'halloween',
            when: d => within(d, 10, 15, 10, 31),
            build: () => {
                tag('HAPPY HALLOWEEN');
                fly({ art: draw.bat, count: 5, speed: [9, 16] });
                hang([{ art: draw.spider, x: 86, len: 150, string: '#9a9a9a', bob: true }]);
                perch(draw.pumpkin(), 'Knock on the pumpkin', node => pop(draw.bat, node, 6, 'up'));
            },
        },
        {
            id: 'diadelosmuertos',
            when: d => within(d, 11, 1, 11, 2),
            build: () => {
                tag('DÍA DE LOS MUERTOS');
                fall({ art: draw.marigold, count: 18, speed: [9, 15] });
                perch(draw.skull(), 'Toss marigolds', node => pop(draw.marigold, node, 12));
            },
        },
        {
            id: 'thanksgiving',
            when: d => {
                const thursday = nthWeekday(d.getFullYear(), 11, 4, 4);
                return inRange(d, addDays(thursday, -1), addDays(thursday, 3));
            },
            build: () => {
                tag('HAPPY THANKSGIVING');
                fall({ art: draw.leaf, count: 12 });
                perch(draw.pie(), 'Shake the leaves', node => pop(draw.leaf, node, 8));
            },
        },
        {
            id: 'easter',
            when: d => {
                const sunday = easter(d.getFullYear());
                return inRange(d, addDays(sunday, -2), sunday);
            },
            build: () => {
                fall({ art: draw.blossom, count: 8 });
                eggHunt(5);
            },
        },
        {
            id: 'meteors',
            when: d => (within(d, 8, 11, 8, 13) && 'PERSEID') || (within(d, 12, 13, 12, 14) && 'GEMINID'),
            preview: () => 'PERSEID',
            build: name => {
                tag(`${name} METEOR SHOWER · LOOK UP TONIGHT`);
                twinkle({ art: draw.dot, count: 14, top: [2, 50] });
                meteors(5);
            },
        },
        {
            id: 'midautumn',
            when: d => {
                const c = calendarDate(d, 'chinese');
                return c && c.month === 8 && c.day >= 14 && c.day <= 16;
            },
            build: () => {
                tag('HAPPY MID-AUTUMN FESTIVAL');
                hang([
                    { art: draw.redLantern, x: 64, len: 40, string: '#d9a521' },
                    { art: draw.fullMoon, x: 77, len: 24, string: 'transparent', still: true },
                    { art: draw.redLantern, x: 91, len: 60, string: '#d9a521' },
                ]);
                twinkle({ art: draw.dot, count: 10, top: [2, 40] });
                perch(draw.mooncake(), 'Share a mooncake', node => pop(draw.star, node, 10, 'up'));
            },
        },
        {
            id: 'eidalfitr',
            when: d => islamic(d).month === 10 && islamic(d).day <= 3,
            build: () => {
                tag('EID MUBARAK');
                hang([
                    { art: draw.fanous, x: 64, len: 40, string: '#d9a521' },
                    { art: draw.crescent, x: 76, len: 20, string: '#d9a521' },
                    { art: draw.fanous, x: 90, len: 70, string: '#d9a521' },
                ]);
                const boom = fireworks(['#ffd34d', '#ffffff', '#ff69b4'], 1800);
                perch(draw.fanous(), 'Celebrate', node => {
                    const r = node.getBoundingClientRect();
                    boom(r.left - 80, r.top - 160);
                });
            },
        },
        {
            id: 'eidaladha',
            when: d => islamic(d).month === 12 && islamic(d).day >= 10 && islamic(d).day <= 13,
            build: () => {
                tag('EID MUBARAK');
                hang([
                    { art: draw.fanous, x: 70, len: 50, string: '#d9a521' },
                    { art: draw.crescent, x: 82, len: 24, string: '#d9a521' },
                    { art: draw.fanous, x: 92, len: 80, string: '#d9a521' },
                ]);
                twinkle({ art: draw.star, count: 14, top: [2, 45] });
            },
        },
        {
            id: 'lunarnewyear',
            // Starts on New Year's Eve. This also covers years like 2027, where the browser's
            // calendar puts New Year's Day one day late.
            when: d => {
                const c = calendarDate(addDays(d, 1), 'chinese');
                return c && c.month === 1 && c.day <= 15 && ZODIAC[(d.getFullYear() - 4) % 12];
            },
            preview: () => ZODIAC[(new Date().getFullYear() - 4) % 12],
            build: animal => {
                tag(`HAPPY LUNAR NEW YEAR · YEAR OF THE ${animal}`);
                hang([
                    { art: draw.redLantern, x: 60, len: 30, string: '#d9a521' },
                    { art: draw.redLantern, x: 70, len: 70, string: '#d9a521' },
                    { art: draw.redLantern, x: 80, len: 20, string: '#d9a521' },
                    { art: draw.redLantern, x: 90, len: 55, string: '#d9a521' },
                ]);
                const boom = fireworks(['#ff3d3d', '#ffcf3a'], 0);
                perch(draw.redLantern(), 'Set off a firework', node => {
                    const r = node.getBoundingClientRect();
                    boom(r.left - 80, r.top - 160);
                });
            },
        },
        {
            id: 'christmas',
            when: d => within(d, 12, 20, 12, 26),
            build: () => {
                tag('HAPPY HOLIDAYS');
                lights(['#ff3d5a', '#ffff00', '#5ab0ff', '#4caf50', '#ff69b4']);
                fall({ art: draw.snow, count: 18 });
                perch(draw.tree(), 'Shake the tree', node => pop(draw.snow, node, 10));
            },
        },
        {
            id: 'olympics',
            when: d => olympics(d),
            preview: () => 'LA 2028',
            build: name => {
                tag(`${name} OLYMPICS`);
                fall({ art: draw.medal, count: 6, speed: [12, 20], spin: 15 });
                perch(draw.rings(), 'Hand out medals', node => pop(draw.medal, node, 8));
            },
        },
        {
            id: 'worldcup',
            // The usual mid-June to mid-July window in World Cup years
            when: d => d.getFullYear() % 4 === 2 && within(d, 6, 11, 7, 19) && d.getFullYear(),
            preview: () => 2030,
            build: year => {
                tag(`WORLD CUP ${year}`);
                fly({ art: draw.soccer, count: 3, speed: [6, 10], top: [30, 60], motion: 'arc' });
                perch(draw.soccer(6), 'Take a shot', node => pop(draw.soccer, node, 3));
            },
        },
        {
            id: 'ramadan',
            when: d => islamic(d).month === 9,
            build: () => {
                tag('RAMADAN MUBARAK');
                hang([
                    { art: draw.fanous, x: 66, len: 60, string: '#d9a521' },
                    { art: draw.crescent, x: 79, len: 24, string: '#d9a521' },
                    { art: draw.fanous, x: 91, len: 40, string: '#d9a521' },
                ]);
                twinkle({ art: draw.star, count: 12, top: [2, 45] });
            },
        },

        // No holiday today: a quiet touch for the season
        {
            id: 'winter',
            when: d => d.getMonth() === 11 || d.getMonth() < 2 || (d.getMonth() === 2 && d.getDate() < 20),
            build: () => fall({ art: draw.snow, count: 8, speed: [14, 22] }),
        },
        {
            id: 'spring',
            when: d => d.getMonth() < 5 || (d.getMonth() === 5 && d.getDate() < 21),
            build: () => fall({ art: draw.blossom, count: 7, speed: [14, 22] }),
        },
        {
            id: 'summer',
            when: d => d.getMonth() < 8 || (d.getMonth() === 8 && d.getDate() < 22),
            build: () => twinkle({ art: draw.firefly, count: 12, top: [30, 95], drift: true }),
        },
        {
            id: 'fall',
            when: () => true,
            build: () => fall({ art: draw.leaf, count: 7, speed: [14, 22] }),
        },
    ];

    function pickTheme(date) {
        for (const theme of THEMES) {
            const value = theme.when(date);
            if (value) return { theme, value };
        }
    }

    if (typeof document === 'undefined') {
        module.exports = { pickTheme, THEMES };
        return;
    }

    // ---------- Start ----------

    function start() {
        const params = new URLSearchParams(window.location.search);
        const forced = THEMES.find(t => t.id === params.get('season'));
        let choice;
        if (forced) {
            choice = { theme: forced, value: forced.preview ? forced.preview() : true };
        } else {
            const fake = /^(\d{4})-(\d{2})-(\d{2})$/.exec(params.get('date') || '');
            choice = pickTheme(fake ? day(+fake[1], +fake[2], +fake[3]) : new Date());
        }
        document.documentElement.dataset.season = choice.theme.id;
        choice.theme.build(choice.value);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
})();
