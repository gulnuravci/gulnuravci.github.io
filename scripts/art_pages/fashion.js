import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Get the specific div by ID where we want to render the scene
const container = document.getElementById('model');

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);

// Create a WebGL renderer and set its size to the size of the container
const renderer = new THREE.WebGLRenderer({ alpha: true });  // Enable transparency
renderer.setSize(container.clientWidth, container.clientHeight);

// Append the renderer's canvas element to the container div
container.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = false;  // Disable user rotation
controls.enableZoom = false;    // Optionally disable zoom
controls.enablePan = false;     // Optionally disable pan

// Load the GLTF model
const loader = new GLTFLoader();
let model;  // Variable to store the model

loader.load("../../images/Fashion/camo_skirt_model.glb", function (gltf) {
    model = gltf.scene;
    scene.add(model);

    // Compute the bounding box of the loaded model
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    let scaleFactor;
    if (window.innerWidth > 1500){
        scaleFactor = 2.25;
    } else if (window.innerWidth > 850) {
        scaleFactor = 2.35;
    } else {
        scaleFactor = 3;
    }

    // Adjust camera position based on model's bounding box
    camera.position.set(center.x, center.y, center.z + size.z * scaleFactor); // Position camera directly in front of the model
    camera.lookAt(center); // Ensure the camera looks at the center of the model

    // Update controls target to center of model
    controls.target.copy(center);
    controls.update();
}, undefined, function (error) {
    console.error(error);
});

// Add ambient and directional light
const ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 10).normalize();
scene.add(directionalLight);

// Optional: Add a 360-degree lighting setup (e.g., HemisphereLight)
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
scene.add(hemisphereLight);

// Animate the scene
function animate() {
    requestAnimationFrame(animate);

    // Rotate model around its vertical axis
    if (model) {
        model.rotation.y += 0.01; // Adjust rotation speed as needed
    }

    renderer.render(scene, camera);
}
animate();

// Handle resizing the window
window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
});
