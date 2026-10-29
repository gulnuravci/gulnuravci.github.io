import * as THREE from 'three';

// Half-profile of the dress form as [radius, height] in metres (roughly a
// US size 6). Cross sections are ellipses: x radius = profile radius,
// z radius = profile radius * depth(height).
const PROFILE = [
    [0.0, 0.655], [0.11, 0.66], [0.15, 0.675], [0.165, 0.72], [0.17, 0.8],
    [0.163, 0.87], [0.145, 0.94], [0.127, 1.0], [0.124, 1.03], [0.13, 1.09],
    [0.144, 1.16], [0.154, 1.22], [0.153, 1.28], [0.155, 1.34], [0.165, 1.39],
    [0.16, 1.43], [0.12, 1.465], [0.07, 1.49], [0.052, 1.51], [0.048, 1.56],
    [0.04, 1.585], [0.0, 1.59],
];

const LUT_MIN = 0.6, LUT_MAX = 1.6, LUT_STEP = 0.002;

const DEPTH = [
    [0.6, 0.82], [0.95, 0.8], [1.2, 0.76], [1.32, 0.68], [1.42, 0.55],
    [1.48, 0.7], [1.51, 0.95], [1.6, 0.95],
];

export const WAIST_Y = 1.02;

function interpolate(table, y) {
    if (y <= table[0][0]) return table[0][1];
    for (let i = 1; i < table.length; i++) {
        if (y <= table[i][0]) {
            const [y0, v0] = table[i - 1], [y1, v1] = table[i];
            return v0 + ((y - y0) / (y1 - y0)) * (v1 - v0);
        }
    }
    return table[table.length - 1][1];
}

const depthLut = Float32Array.from(
    { length: Math.ceil((LUT_MAX - LUT_MIN) / LUT_STEP) + 1 },
    (_, k) => interpolate(DEPTH, LUT_MIN + k * LUT_STEP)
);

export function depthAt(y) {
    if (y < LUT_MIN || y > LUT_MAX) return interpolate(DEPTH, y);
    return depthLut[Math.round((y - LUT_MIN) / LUT_STEP)];
}

// Ramanujan's approximation for the perimeter of an ellipse
export function ellipsePerimeter(a, b) {
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
}

function linenTexture(waistV) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#efe3d3';
    ctx.fillRect(0, 0, 1024, 512);
    const image = ctx.getImageData(0, 0, 1024, 512);
    for (let k = 0; k < image.data.length; k += 4) {
        const n = (Math.random() - 0.5) * 18;
        image.data[k] += n;
        image.data[k + 1] += n;
        image.data[k + 2] += n;
    }
    ctx.putImageData(image, 0, 0);
    // princess and side seams (u = 0 is centre front)
    ctx.fillStyle = 'rgba(120, 90, 70, 0.35)';
    for (const u of [0.09, 0.25, 0.4, 0.6, 0.75, 0.91]) ctx.fillRect(u * 1024 - 1, 0, 2, 512);
    // black twill tape at centre front, centre back and waist
    ctx.fillStyle = '#1a1414';
    for (const u of [0, 0.5, 1]) ctx.fillRect(u * 1024 - 3, 0, 6, 512);
    ctx.fillRect(0, (1 - waistV) * 512 - 4, 1024, 8);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
}

export function createDressForm() {
    const curve = new THREE.SplineCurve(PROFILE.map(([r, y]) => new THREE.Vector2(r, y)));
    const points = curve.getPoints(220);

    // radius lookup table, used by the cloth collision
    const lut = new Float32Array(Math.ceil((LUT_MAX - LUT_MIN) / LUT_STEP) + 1);
    for (let k = 0; k < lut.length; k++) {
        const y = LUT_MIN + k * LUT_STEP;
        let r = 0;
        for (let i = 1; i < points.length; i++) {
            const p = points[i - 1], q = points[i];
            if ((y - p.y) * (y - q.y) <= 0 && p.y !== q.y) {
                r = Math.max(r, p.x + ((y - p.y) / (q.y - p.y)) * (q.x - p.x));
            }
        }
        lut[k] = r;
    }
    const radiusAt = (y) => {
        if (y < LUT_MIN || y > LUT_MAX) return 0;
        return lut[Math.round((y - LUT_MIN) / LUT_STEP)];
    };

    let waistIndex = 0;
    points.forEach((p, i) => {
        if (Math.abs(p.y - WAIST_Y) < Math.abs(points[waistIndex].y - WAIST_Y)) waistIndex = i;
    });

    const torsoGeometry = new THREE.LatheGeometry(points, 96);
    const position = torsoGeometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
        position.setZ(i, position.getZ(i) * depthAt(position.getY(i)));
    }
    torsoGeometry.computeVertexNormals();

    const linen = new THREE.MeshStandardMaterial({
        map: linenTexture(waistIndex / (points.length - 1)),
        roughness: 0.95,
    });
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a2f22, roughness: 0.45 });

    // the torso and its neck cap turn; the stand stays put. Costumes scanned
    // on a real dress form bring their own torso, so `body` can be hidden.
    const group = new THREE.Group();
    const body = new THREE.Group();
    body.add(new THREE.Mesh(torsoGeometry, linen));
    group.add(body);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.012, 32), wood);
    cap.position.y = 1.592;
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 24, 16), wood);
    knob.position.y = 1.612;
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.005, 8, 96), wood);
    trim.rotation.x = Math.PI / 2;
    trim.scale.y = depthAt(0.675);
    trim.position.y = 0.675;
    body.add(cap, knob, trim);

    const stand = new THREE.Group();
    // tall enough to reach inside a scanned form; the 3D torso hides the top
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.8, 16), wood);
    pole.position.y = 0.5;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 24), wood);
    collar.position.y = 0.42;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.04, 0.05, 24), wood);
    hub.position.y = 0.1;
    stand.add(pole, collar, hub);
    for (let k = 0; k < 3; k++) {
        const leg = new THREE.Group();
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.022, 0.035), wood);
        bar.position.set(0.15, 0, 0);
        bar.rotation.z = -0.25;
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16), wood);
        foot.position.set(0.29, -0.045, 0);
        leg.add(bar, foot);
        leg.position.y = 0.09;
        leg.rotation.y = (k / 3) * Math.PI * 2 + Math.PI / 6;
        stand.add(leg);
    }

    const waistRadius = radiusAt(WAIST_Y);
    return {
        group,
        body,
        stand,
        radiusAt,
        depthAt,
        waistY: WAIST_Y,
        waistRadius,
    };
}

// soft round shadow on the floor
export function createFloor() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const shadow = ctx.createRadialGradient(128, 128, 0, 128, 128, 40);
    shadow.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    shadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadow;
    ctx.fillRect(0, 0, 256, 256);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 2.4),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.001;
    return floor;
}
