import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// A 3D scan is a rigid mesh, so it can't be cloth-simulated directly. Instead
// a vertex shader bends it: the lower a vertex sits below the waist, the more
// it trails behind the turn, flares out and flutters. A damped spring drives
// the trailing angle, so the hem overshoots and swings back when you stop.

const loader = new GLTFLoader();
const cache = new Map();

const FLOW_HEAD = /* glsl */ `
uniform float uWaist;
uniform float uLength;
uniform float uLag;
uniform float uFlare;
uniform float uFlutter;
uniform float uTime;
`;

const FLOW_NORMAL = /* glsl */ `
float flowT = clamp((uWaist - position.y) / uLength, 0.0, 1.0);
float flowW = flowT * flowT;
float flowA = atan(position.z, position.x);
float flowAngle = -uLag * flowW;
mat2 flowRot = mat2(cos(flowAngle), -sin(flowAngle), sin(flowAngle), cos(flowAngle));
#include <beginnormal_vertex>
objectNormal.xz = flowRot * objectNormal.xz;
`;

const FLOW_POSITION = /* glsl */ `
#include <begin_vertex>
transformed.xz = flowRot * transformed.xz;
float flowR = length(transformed.xz);
float flowOut = uFlare * flowW + sin(flowA * 7.0 - uTime * 6.0) * uFlutter * flowW;
transformed.xz *= 1.0 + flowOut;
transformed.y += uFlare * flowW * flowR * 0.8;
`;

function loadModel(url) {
    if (!cache.has(url)) cache.set(url, loader.loadAsync(url));
    return cache.get(url);
}

// Cuts away the top `fraction` of the scan (e.g. the hanger it was scanned on).
function cropTop(geometry, box, fraction) {
    if (!fraction || !geometry.index) return;
    const cut = box.max.y - (box.max.y - box.min.y) * fraction;
    const y = geometry.attributes.position.array;
    const index = geometry.index.array;
    const kept = [];
    for (let t = 0; t < index.length; t += 3) {
        if (y[index[t] * 3 + 1] <= cut && y[index[t + 1] * 3 + 1] <= cut && y[index[t + 2] * 3 + 1] <= cut) {
            kept.push(index[t], index[t + 1], index[t + 2]);
        }
    }
    geometry.setIndex(kept);
    box.max.y = cut;
}

// Fits, per height band, the line the flattened garment lies along (seen
// from above, z = a + b * x), plus the garment's extent along that line.
function profile(positions, used, box, bins) {
    const sums = Array.from({ length: bins }, () => ({ n: 0, x: 0, z: 0, xx: 0, xz: 0 }));
    const bin = (y) => Math.min(bins - 1, Math.max(0, Math.floor(((y - box.min.y) / (box.max.y - box.min.y)) * bins)));
    for (const i of used) {
        const s = sums[bin(positions[i * 3 + 1])], x = positions[i * 3], z = positions[i * 3 + 2];
        s.n++;
        s.x += x;
        s.z += z;
        s.xx += x * x;
        s.xz += x * z;
    }
    let last = sums.find((s) => s.n);
    const rows = sums.map((s) => {
        if (s.n > 2) last = s;
        const { n, x, z, xx, xz } = last;
        const b = (n * xz - x * z) / (n * xx - x * x || 1);
        return { a: (z - b * x) / n, b, min: Infinity, max: -Infinity };
    });
    const along = (row, x, z) => (x + row.b * z) / Math.hypot(1, row.b);
    for (const i of used) {
        const row = rows[bin(positions[i * 3 + 1])];
        const s = along(row, positions[i * 3], positions[i * 3 + 2]);
        row.min = Math.min(row.min, s);
        row.max = Math.max(row.max, s);
    }
    rows.forEach((row, k) => {
        if (row.min === Infinity) Object.assign(row, rows[k - 1] ?? rows.find((r) => r.min !== Infinity));
        row.center = (row.min + row.max) / 2;
        row.half = (row.max - row.min) / 2;
    });
    for (let pass = 0; pass < 2; pass++) {
        for (const key of ['a', 'b', 'center', 'half']) {
            const v = rows.map((r) => r[key]);
            rows.forEach((r, k) => (r[key] = (v[Math.max(k - 1, 0)] + v[k] + v[Math.min(k + 1, bins - 1)]) / 3));
        }
    }
    return (x, y, z) => {
        const row = rows[bin(y)];
        const norm = Math.hypot(1, row.b);
        return {
            u: (along(row, x, z) - row.center) / row.half,
            offset: (z - row.a - row.b * x) / norm, // signed distance from the line
            facing: (nx, nz) => (nz - row.b * nx) / norm, // > 0 if a normal faces the front
            half: row.half,
        };
    };
}

// A garment scanned flat (lying down or on a hanger) is a squashed tube: a
// front layer and a back layer joined at the side folds. This opens it back
// up around the dress form. Each layer's width becomes half the circumference,
// and the depth differences inside a layer (pleats, gathers) are kept as
// relief on the surface.
function wrapAroundForm(geometry, box, form, top, scale, flare) {
    smoothNormals(geometry);
    const position = geometry.attributes.position;
    const p = position.array, n = geometry.attributes.normal.array;
    const used = new Set(geometry.index.array);
    const at = profile(p, used, box, 40);
    let meanRelief = 0;
    for (const i of used) meanRelief += Math.abs(at(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]).offset) / used.size;

    for (let i = 0; i < position.count; i++) {
        const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
        const row = at(x, y, z);
        const facing = row.facing(n[i * 3], n[i * 3 + 2]);
        const side = Math.abs(facing) > 0.2 ? Math.sign(facing) : Math.sign(row.offset) || 1;
        const u = Math.max(-1, Math.min(1, row.u));
        const theta = side * (Math.PI / 2) * (1 - u);
        const worldY = top + (y - box.max.y) * scale;
        const body = form.radiusAt(worldY) + 0.006;
        const garment = (2 * row.half * scale) / Math.PI;
        const relief = (Math.abs(row.offset) - meanRelief) * scale * 0.6;
        const t = (top - worldY) / ((box.max.y - box.min.y) * scale);
        const r = Math.max(Math.max(body, garment) + relief, body) * (1 + flare * t * t);
        p[i * 3] = r * Math.cos(theta);
        p[i * 3 + 1] = worldY;
        p[i * 3 + 2] = r * Math.sin(theta) * (body > 0.01 ? form.depthAt(worldY) : 1);
    }
    position.needsUpdate = true;
}

// Scans are split into UV islands, so vertices are duplicated along the
// seams. Average normals by position so the seams don't show as creases.
function smoothNormals(geometry) {
    geometry.computeVertexNormals();
    const p = geometry.attributes.position.array, n = geometry.attributes.normal.array;
    const groups = new Map();
    for (let i = 0; i < p.length; i += 3) {
        const key = `${p[i].toFixed(4)},${p[i + 1].toFixed(4)},${p[i + 2].toFixed(4)}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(i);
    }
    for (const group of groups.values()) {
        if (group.length < 2) continue;
        const sum = [0, 0, 0];
        for (const i of group) for (let t = 0; t < 3; t++) sum[t] += n[i + t];
        const len = Math.hypot(...sum) || 1;
        for (const i of group) for (let t = 0; t < 3; t++) n[i + t] = sum[t] / len;
    }
}

export async function createScanGarment(garment, form) {
    const gltf = await loadModel(garment.model);
    gltf.scene.updateMatrixWorld(true);

    const rotate = new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(...(garment.rotate ?? [0, 0, 0]).map(THREE.MathUtils.degToRad))
    );
    const length = garment.length / 100;
    const top = form.waistY + 0.01;
    const uniforms = {
        uWaist: { value: form.waistY },
        uLength: { value: length },
        uLag: { value: 0 },
        uFlare: { value: 0 },
        uFlutter: { value: 0 },
        uTime: { value: 0 },
    };

    const root = new THREE.Group();
    gltf.scene.traverse((object) => {
        if (!object.isMesh) return;
        const geometry = object.geometry.clone();
        geometry.applyMatrix4(object.matrixWorld);
        geometry.applyMatrix4(rotate);
        geometry.computeBoundingBox();
        const box = geometry.boundingBox.clone();
        cropTop(geometry, box, garment.cropTop);
        const scale = length / (box.max.y - box.min.y);
        if (garment.scannedFlat) {
            wrapAroundForm(geometry, box, form, top, scale, garment.flare ?? 0);
        } else {
            const center = box.getCenter(new THREE.Vector3());
            geometry.translate(-center.x, -box.max.y, -center.z);
            geometry.scale(scale, scale, scale);
            geometry.translate(0, top, 0);
        }
        smoothNormals(geometry);

        const material = object.material.clone();
        material.flatShading = false;
        material.side = THREE.DoubleSide;
        material.onBeforeCompile = (shader) => {
            Object.assign(shader.uniforms, uniforms);
            shader.vertexShader = FLOW_HEAD + shader.vertexShader
                .replace('#include <beginnormal_vertex>', FLOW_NORMAL)
                .replace('#include <begin_vertex>', FLOW_POSITION);
        };
        root.add(new THREE.Mesh(geometry, material));
    });

    const flow = garment.flow ?? 0.5;
    let lag = 0, lagVelocity = 0;
    return {
        root: null,
        attached: root,
        update(dt, motion) {
            // damped spring, pushed by the form's angular acceleration and air drag
            const force = flow * (motion.accel + 0.6 * motion.velocity) - 45 * lag - 6 * lagVelocity;
            lagVelocity += force * dt;
            lag = THREE.MathUtils.clamp(lag + lagVelocity * dt, -0.9, 0.9);
            uniforms.uLag.value = lag;
            uniforms.uFlare.value = Math.min(flow * 0.005 * motion.velocity * motion.velocity, 0.5);
            uniforms.uFlutter.value = Math.min(flow * 0.006 * Math.abs(motion.velocity), 0.05);
            uniforms.uTime.value = motion.time;
        },
        dispose() {
            root.traverse((o) => {
                if (!o.isMesh) return;
                o.geometry.dispose();
                o.material.dispose();
            });
        },
    };
}
