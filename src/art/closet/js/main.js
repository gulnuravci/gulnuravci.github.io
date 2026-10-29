import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createDressForm, createFloor } from './dress-form.js';
import { createClothGarment } from './cloth.js';
import { createScanGarment } from './scan.js';
import { swatchURL } from './fabric.js';
import { GARMENTS } from './garments.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('stage-canvas');
const hint = document.getElementById('stage-hint');
const status = document.getElementById('stage-status');
const rail = document.getElementById('rail');

// ---------- scene ----------

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.NeutralToneMapping;

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

scene.add(new THREE.HemisphereLight(0xfff4f8, 0x2a1020, 0.6));
const key = new THREE.DirectionalLight(0xffffff, 1.8);
key.position.set(1.5, 2.5, 2.5);
const rim = new THREE.DirectionalLight(0xff69b4, 2.5);
rim.position.set(-2, 1.8, -2);
const fill = new THREE.DirectionalLight(0xffe9c4, 0.5);
fill.position.set(-2, 1, 2);
scene.add(key, rim, fill);

const form = createDressForm();
scene.add(form.group, form.stand, createFloor());

const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
const TARGET = new THREE.Vector3();
const FORM_TOP = 1.64;
let viewTop = FORM_TOP;

function resize() {
    const { clientWidth: w, clientHeight: h } = stage;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // fit everything from the floor to the top of the form (or of a taller
    // costume), and ~1.2m wide for when a skirt flares
    const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max((viewTop + 0.2) / 2 / halfTan, 0.62 / (halfTan * camera.aspect));
    TARGET.set(0, viewTop / 2 + 0.02, 0);
    camera.position.set(0, TARGET.y + 0.21, distance);
    camera.lookAt(TARGET);
    camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

// ---------- spinning ----------

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const AUTO_SPIN = reduceMotion ? 0 : 0.35;
const MAX_SPIN = 14;
const motion = { angle: 0, velocity: 0, accel: 0, time: 0 };
let dragging = false;
let lastX = 0;
let lastInteraction = -Infinity;

function interact() {
    lastInteraction = performance.now();
    hint.classList.add('hidden');
}

canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    canvas.setPointerCapture(event.pointerId);
    stage.classList.add('dragging');
    interact();
});
canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    motion.angle += (event.clientX - lastX) * 0.01;
    lastX = event.clientX;
});
for (const type of ['pointerup', 'pointercancel']) {
    canvas.addEventListener(type, () => {
        dragging = false;
        stage.classList.remove('dragging');
        interact();
    });
}
canvas.addEventListener('keydown', (event) => {
    const push = { ArrowLeft: -3, ArrowRight: 3 }[event.key];
    if (!push) return;
    event.preventDefault();
    motion.velocity = THREE.MathUtils.clamp(motion.velocity + push, -MAX_SPIN, MAX_SPIN);
    interact();
});
document.getElementById('twirl').addEventListener('click', () => {
    motion.velocity = (motion.velocity < 0 ? -1 : 1) * 10;
    interact();
});

// ---------- wearing garments ----------

let current = null;
let wearToken = 0;

function takeOff() {
    if (!current) return;
    if (current.root) scene.remove(current.root);
    form.group.remove(current.attached);
    form.body.visible = true;
    current.dispose();
    current = null;
}

async function wear(garment) {
    const token = ++wearToken;
    for (const button of rail.querySelectorAll('.hanger')) {
        button.setAttribute('aria-pressed', String(button.dataset.id === garment.id));
    }
    document.getElementById('tag-name').textContent = garment.name;
    document.getElementById('tag-details').textContent = garment.details ?? '';
    document.getElementById('tag-description').textContent = garment.description ?? '';
    const photos = document.getElementById('tag-photos');
    photos.hidden = !garment.photos;
    if (garment.photos) photos.href = garment.photos;
    history.replaceState(null, '', '#' + garment.id);

    takeOff();
    // let the tag repaint before the cloth settles, which blocks for a moment
    await new Promise(requestAnimationFrame);
    if (token !== wearToken) return;
    let next;
    try {
        if (garment.type === 'scan') {
            status.textContent = 'Steaming…';
            status.hidden = false;
            next = await createScanGarment(garment, form);
        } else {
            next = createClothGarment(garment, form, motion.angle);
        }
    } catch (error) {
        console.error(error);
        if (token === wearToken) {
            status.textContent = `Couldn't load ${garment.name}`;
            status.hidden = false;
        }
        return;
    }
    if (token !== wearToken) {
        next.dispose();
        return;
    }
    status.hidden = true;
    current = next;
    if (current.root) scene.add(current.root);
    form.group.add(current.attached);
    form.body.visible = !current.hidesForm;
    viewTop = Math.max(FORM_TOP, current.top ?? 0);
    resize();
}

for (const garment of GARMENTS) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'hanger';
    button.type = 'button';
    button.dataset.id = garment.id;

    const hook = document.createElement('img');
    hook.className = 'hanger-hook';
    hook.src = '../../../images/Fashion/hanger.png';
    hook.alt = '';
    const silhouette = document.createElement('span');
    if (garment.type === 'scan') {
        silhouette.className = 'silhouette photo';
        silhouette.style.backgroundImage = `url("${garment.thumbnail}")`;
    } else {
        silhouette.className = `silhouette ${garment.type}`;
        silhouette.style.backgroundImage = `url("${swatchURL(garment.fabric)}")`;
    }
    const label = document.createElement('span');
    label.className = 'hanger-label';
    label.textContent = garment.name;

    button.append(hook, silhouette, label);
    button.addEventListener('click', () => wear(garment));
    item.append(button);
    rail.append(item);
}

const fromHash = GARMENTS.find((g) => '#' + g.id === location.hash);
wear(fromHash ?? GARMENTS[0]);

// ---------- loop ----------

const clock = new THREE.Clock();
let prevAngle = motion.angle;
let prevVelocity = 0;

renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 1 / 20);
    if (dt === 0) return;
    motion.time += dt;

    if (dragging) {
        motion.velocity += ((motion.angle - prevAngle) / dt - motion.velocity) * 0.5;
        motion.velocity = THREE.MathUtils.clamp(motion.velocity, -MAX_SPIN, MAX_SPIN);
    } else {
        const target = performance.now() - lastInteraction > 4000 ? AUTO_SPIN : 0;
        motion.velocity += (target - motion.velocity) * (1 - Math.exp(-dt * 0.9));
        motion.angle += motion.velocity * dt;
    }
    motion.accel += ((motion.velocity - prevVelocity) / dt - motion.accel) * 0.3;
    prevVelocity = motion.velocity;

    form.group.rotation.y = motion.angle;
    current?.update(dt, motion, prevAngle);
    prevAngle = motion.angle;

    renderer.render(scene, camera);
});
