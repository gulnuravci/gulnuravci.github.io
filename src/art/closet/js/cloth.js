import * as THREE from 'three';
import { fabricMaterial } from './fabric.js';
import { ellipsePerimeter } from './dress-form.js';

// Position-based cloth simulation of a skirt. The skirt is built from a flat
// sewing pattern (an annulus sector for circle cuts, a rectangle for gathered
// cuts), so rest lengths, grain and print placement match the real garment.
// The waist row is pinned to the turning dress form; everything below it
// hangs in world space, so it lags, swings and flares out when the form spins.

const STEP = 1 / 90;
const MAX_STEPS = 4;
const ITERATIONS = 10;
const GRAVITY = -9.8;
const THICKNESS = 0.007;
const COLUMNS = 88;
const ROWS = 24;

const DRAPES = {
    flowy: { compress: 0.15, shear: 0.3, bend: 0.025, drag: 0.004, friction: 0.25 },
    medium: { compress: 0.3, shear: 0.5, bend: 0.08, drag: 0.007, friction: 0.4 },
    stiff: { compress: 0.6, shear: 0.8, bend: 0.3, drag: 0.012, friction: 0.6 },
};

const KIND_STRUCTURAL = 0, KIND_SHEAR = 1, KIND_BEND = 2;

function hemCircumference(cut, waist, length) {
    switch (cut) {
        case 'circle': return waist + 2 * Math.PI * length;
        case 'half-circle': return waist + Math.PI * length;
        case 'a-line': return waist + 1.2 * length;
        case 'gathered': return waist;
        default: throw new Error(`Unknown cut: ${cut}`);
    }
}

class SkirtSim {
    constructor(form, { cut, length, gather = 1, drape = 'medium' }) {
        const U = COLUMNS, V = ROWS;
        const L = length / 100;
        const dl = L / V;
        const params = DRAPES[drape];
        this.form = form;
        this.params = params;
        this.U = U;
        this.V = V;

        const r0 = form.waistRadius + THICKNESS;
        const depth0 = form.depthAt(form.waistY);
        const waist = ellipsePerimeter(r0, r0 * depth0);
        const cin = waist * gather;
        const cout = hemCircumference(cut, cin, L);

        // flat pattern coordinates in metres
        const sweep = (cout - cin) / L;
        const pattern = (i, j) => {
            if (sweep < 1e-3) return [(i / U) * cin, j * dl];
            const rho = cin / sweep + j * dl;
            const a = (i / U) * sweep;
            return [rho * Math.cos(a), rho * Math.sin(a)];
        };
        this.uv = [];
        for (let j = 0; j <= V; j++) {
            for (let i = 0; i <= U; i++) this.uv.push(...pattern(i, j));
        }
        const restLength = (i0, j0, i1, j1) => {
            const [x0, y0] = pattern(i0, j0), [x1, y1] = pattern(i1, j1);
            return Math.hypot(x1 - x0, y1 - y0);
        };

        const N = U * (V + 1);
        this.N = N;
        this.pos = new Float32Array(N * 3);
        this.prev = new Float32Array(N * 3);
        this.pin = new Float32Array(U * 2);

        // start on a cone with sinusoidal folds that use up the extra fabric,
        // then let the simulation relax it
        const coneSin = Math.min(Math.max((cout / (2 * Math.PI) - r0) / L, 0), 0.55);
        const coneCos = Math.sqrt(1 - coneSin * coneSin);
        const folds = 9;
        for (let j = 0; j <= V; j++) {
            const y = form.waistY - j * dl * coneCos;
            const base = Math.max(r0 + j * dl * coneSin, form.radiusAt(y) + 2 * THICKNESS);
            let ring = 0;
            for (let i = 0; i < U; i++) ring += restLength(i, j, i + 1, j);
            const excess = Math.max(ring / (2 * Math.PI * base) - 1, 0);
            const amplitude = j === 0 ? 0 : Math.min((2 * base / folds) * Math.sqrt(excess), base * 0.5);
            const depth = j === 0 ? depth0 : depth0 + (1 - depth0) * Math.min(j / 6, 1);
            for (let i = 0; i < U; i++) {
                const t = (i / U) * Math.PI * 2;
                const r = base + amplitude * Math.sin(folds * t) + (j ? (Math.random() - 0.5) * 0.003 : 0);
                const k = (j * U + i) * 3;
                this.pos[k] = r * Math.cos(t);
                this.pos[k + 1] = y;
                this.pos[k + 2] = r * Math.sin(t) * depth;
                if (j === 0) {
                    this.pin[i * 2] = this.pos[k];
                    this.pin[i * 2 + 1] = this.pos[k + 2];
                }
            }
        }
        this.prev.set(this.pos);

        // constraints
        const a = [], b = [], rest = [], kind = [];
        const add = (i0, j0, i1, j1, k) => {
            if (j0 === 0 && j1 === 0) return;
            a.push(j0 * U + (i0 % U));
            b.push(j1 * U + (i1 % U));
            rest.push(restLength(i0, j0, i1, j1));
            kind.push(k);
        };
        for (let j = 0; j <= V; j++) {
            for (let i = 0; i < U; i++) {
                add(i, j, i + 1, j, KIND_STRUCTURAL);
                add(i, j, i + 2, j, KIND_BEND);
                if (j < V) {
                    add(i, j, i, j + 1, KIND_STRUCTURAL);
                    add(i, j, i + 1, j + 1, KIND_SHEAR);
                    add(i + 1, j, i, j + 1, KIND_SHEAR);
                }
                if (j < V - 1) add(i, j, i, j + 2, KIND_BEND);
            }
        }
        this.ca = Int32Array.from(a);
        this.cb = Int32Array.from(b);
        this.rest = Float32Array.from(rest);
        this.stretchK = new Float32Array(kind.length);
        this.compressK = new Float32Array(kind.length);
        kind.forEach((k, n) => {
            this.stretchK[n] = k === KIND_STRUCTURAL ? 1 : k === KIND_SHEAR ? params.shear : params.bend;
            this.compressK[n] = k === KIND_STRUCTURAL ? params.compress : this.stretchK[n];
        });
    }

    step(angle, prevAngle) {
        const { pos, prev, pin, U, N, params } = this;
        const c = Math.cos(angle), s = Math.sin(angle);
        for (let i = 0; i < U; i++) {
            const x = pin[i * 2], z = pin[i * 2 + 1];
            pos[i * 3] = prev[i * 3] = c * x + s * z;
            pos[i * 3 + 2] = prev[i * 3 + 2] = -s * x + c * z;
        }
        const keep = 1 - params.drag;
        const g = GRAVITY * STEP * STEP;
        for (let k = U * 3; k < N * 3; k += 3) {
            const vx = (pos[k] - prev[k]) * keep;
            const vy = (pos[k + 1] - prev[k + 1]) * keep;
            const vz = (pos[k + 2] - prev[k + 2]) * keep;
            prev[k] = pos[k];
            prev[k + 1] = pos[k + 1];
            prev[k + 2] = pos[k + 2];
            pos[k] += vx;
            pos[k + 1] += vy + g;
            pos[k + 2] += vz;
        }
        for (let it = 0; it < ITERATIONS; it++) {
            this.solve();
            this.collide(angle, angle - prevAngle, it === ITERATIONS - 1);
        }
    }

    solve() {
        const { pos, ca, cb, rest, stretchK, compressK, U } = this;
        for (let n = 0; n < ca.length; n++) {
            const ia = ca[n], ib = cb[n];
            const pa = ia * 3, pb = ib * 3;
            const dx = pos[pb] - pos[pa], dy = pos[pb + 1] - pos[pa + 1], dz = pos[pb + 2] - pos[pa + 2];
            const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (d < 1e-9) continue;
            const diff = (d - rest[n]) / d;
            const k = diff > 0 ? stretchK[n] : compressK[n];
            const wa = ia < U ? 0 : 1, wb = ib < U ? 0 : 1;
            const corr = (diff * k) / (wa + wb);
            if (wa) {
                pos[pa] += dx * corr;
                pos[pa + 1] += dy * corr;
                pos[pa + 2] += dz * corr;
            }
            if (wb) {
                pos[pb] -= dx * corr;
                pos[pb + 1] -= dy * corr;
                pos[pb + 2] -= dz * corr;
            }
        }
    }

    // push particles out of the (turning, elliptical) dress form and the floor
    collide(angle, turn, applyFriction) {
        const { pos, prev, U, N, form } = this;
        const c = Math.cos(angle), s = Math.sin(angle);
        const friction = this.params.friction;
        for (let p = U; p < N; p++) {
            const k = p * 3;
            const y = pos[k + 1];
            if (y < 0.02) pos[k + 1] = 0.02;
            const r = form.radiusAt(y);
            if (r === 0) continue;
            const x = pos[k], z = pos[k + 2];
            const lx = c * x - s * z, lz = (s * x + c * z);
            const depth = form.depthAt(y);
            const ez = lz / depth;
            const d = Math.sqrt(lx * lx + ez * ez);
            const R = r + THICKNESS;
            if (d >= R || d < 1e-6) continue;
            const scale = R / d;
            const nx = lx * scale, nz = ez * scale * depth;
            pos[k] = c * nx + s * nz;
            pos[k + 2] = -s * nx + c * nz;
            if (applyFriction) {
                // drag the cloth's velocity towards the form's surface velocity
                const bx = turn * pos[k + 2], bz = -turn * pos[k];
                const vx = pos[k] - prev[k], vy = pos[k + 1] - prev[k + 1], vz = pos[k + 2] - prev[k + 2];
                prev[k] = pos[k] - (vx + (bx - vx) * friction);
                prev[k + 1] = pos[k + 1] - vy * (1 - friction);
                prev[k + 2] = pos[k + 2] - (vz + (bz - vz) * friction);
            }
        }
    }
}

function skirtGeometry(sim) {
    const { U, V } = sim;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array((U + 1) * (V + 1) * 3), 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(sim.uv, 2));
    const index = [];
    for (let j = 0; j < V; j++) {
        for (let i = 0; i < U; i++) {
            const a = j * (U + 1) + i, b = a + 1, c = a + U + 1, d = c + 1;
            index.push(a, b, c, b, d, c);
        }
    }
    geometry.setIndex(index);
    return geometry;
}

function syncGeometry(sim, geometry) {
    const { U, V, pos } = sim;
    const out = geometry.attributes.position.array;
    for (let j = 0; j <= V; j++) {
        for (let i = 0; i <= U; i++) {
            const src = (j * U + (i % U)) * 3, dst = (j * (U + 1) + i) * 3;
            out[dst] = pos[src];
            out[dst + 1] = pos[src + 1];
            out[dst + 2] = pos[src + 2];
        }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    // the first and last columns are the same seam: share their normals
    const n = geometry.attributes.normal.array;
    for (let j = 0; j <= V; j++) {
        const a = j * (U + 1) * 3, b = (j * (U + 1) + U) * 3;
        for (let t = 0; t < 3; t++) n[a + t] = n[b + t] = (n[a + t] + n[b + t]) / 2;
    }
    geometry.computeBoundingSphere();
}

// Remaps a geometry's 0..1 UVs to metres.
function uvsInMetres(geometry, width, height) {
    const uv = geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * width, uv.getY(i) * height);
}

function waistband(form, material) {
    const r = form.waistRadius + THICKNESS * 1.6;
    const depth = form.depthAt(form.waistY);
    const height = 0.035;
    const geometry = new THREE.CylinderGeometry(r, r, height, 96, 1, true);
    uvsInMetres(geometry, ellipsePerimeter(r, r * depth), height);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.z = depth;
    mesh.position.y = form.waistY - height / 2 + 0.008;
    return mesh;
}

function bodice(form, material) {
    const top = 1.33, bottom = form.waistY - 0.01, offset = 0.006;
    const profile = [];
    for (let y = bottom; y <= top + 1e-6; y += 0.01) profile.push(new THREE.Vector2(form.radiusAt(y) + offset, y));
    const geometry = new THREE.LatheGeometry(profile, 96);
    const position = geometry.attributes.position, uv = geometry.attributes.uv;
    for (let i = 0; i < position.count; i++) {
        const y = position.getY(i), r = form.radiusAt(y) + offset, depth = form.depthAt(y);
        position.setZ(i, position.getZ(i) * depth);
        uv.setXY(i, uv.getX(i) * ellipsePerimeter(r, r * depth), y);
    }
    geometry.computeVertexNormals();
    const group = new THREE.Group();
    group.add(new THREE.Mesh(geometry, material));

    // spaghetti straps over each shoulder
    for (const x of [-0.085, 0.085]) {
        const front = [], back = [];
        for (let y = top - 0.01; ; y += 0.01) {
            const r = form.radiusAt(y);
            if (r < Math.abs(x) + 0.004) break;
            const z = form.depthAt(y) * Math.sqrt(r * r - x * x) + offset + 0.002;
            front.push(new THREE.Vector3(x, y, z));
            back.unshift(new THREE.Vector3(x, y, -z));
        }
        const last = front[front.length - 1];
        const curve = new THREE.CatmullRomCurve3([...front, new THREE.Vector3(x, last.y + 0.008, 0), ...back]);
        group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0035, 8), material));
    }
    return group;
}

export function createClothGarment(garment, form, angle) {
    const sim = new SkirtSim(form, garment);
    const material = fabricMaterial(garment.fabric);
    const geometry = skirtGeometry(sim);
    const skirt = new THREE.Mesh(geometry, material);
    skirt.frustumCulled = false;

    // let it fall into its folds before anyone sees it
    for (let n = 0; n < 150; n++) sim.step(angle, angle);
    syncGeometry(sim, geometry);

    const attached = new THREE.Group();
    attached.add(waistband(form, material));
    if (garment.type === 'dress') attached.add(bodice(form, material));

    let accumulator = 0;
    return {
        root: skirt,
        attached,
        update(dt, motion, prevAngle) {
            accumulator = Math.min(accumulator + dt, STEP * MAX_STEPS);
            const steps = Math.floor(accumulator / STEP);
            if (!steps) return;
            accumulator -= steps * STEP;
            let last = prevAngle;
            for (let n = 1; n <= steps; n++) {
                const next = prevAngle + ((motion.angle - prevAngle) * n) / steps;
                sim.step(next, last);
                last = next;
            }
            syncGeometry(sim, geometry);
        },
        dispose() {
            geometry.dispose();
            material.map.dispose();
            material.dispose();
            attached.traverse((o) => o.geometry?.dispose());
        },
    };
}
