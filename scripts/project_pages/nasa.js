let scene1, camera1, renderer1, sphere1;
let scene2, camera2, renderer2, sphere2;

function init() {
    // First sphere setup
    const container1 = document.getElementById('sphere-container');
    scene1 = new THREE.Scene();
    camera1 = new THREE.PerspectiveCamera(75, container1.clientWidth / container1.clientHeight, 0.1, 1000);
    renderer1 = new THREE.WebGLRenderer({ alpha: true });
    renderer1.setSize(container1.clientWidth, container1.clientHeight);
    container1.appendChild(renderer1.domElement);
    
    const light1 = new THREE.AmbientLight(0xffffff);
    scene1.add(light1);

    const geometry1 = new THREE.SphereGeometry(1.22, 32, 32);
    const texture1 = new THREE.TextureLoader().load('../../images/Work Experience Icons/nasa.png');
    texture1.wrapS = THREE.RepeatWrapping;
    texture1.wrapT = THREE.ClampToEdgeWrapping;
    texture1.repeat.set(4, 1);
    const material1 = new THREE.MeshBasicMaterial({ map: texture1 });
    sphere1 = new THREE.Mesh(geometry1, material1);
    scene1.add(sphere1);

    camera1.position.z = 2;

    // Second sphere setup
    const container2 = document.getElementById('sphere-container-2');
    scene2 = new THREE.Scene();
    camera2 = new THREE.PerspectiveCamera(75, container2.clientWidth / container2.clientHeight, 0.1, 1000);
    renderer2 = new THREE.WebGLRenderer({ alpha: true });
    renderer2.setSize(container2.clientWidth, container2.clientHeight);
    container2.appendChild(renderer2.domElement);

    const light2 = new THREE.AmbientLight(0xffffff);
    scene2.add(light2);

    const geometry2 = new THREE.SphereGeometry(1.22, 32, 32);
    // Reuse the same texture or load a different one
    const material2 = new THREE.MeshBasicMaterial({ map: texture1 });
    sphere2 = new THREE.Mesh(geometry2, material2);
    scene2.add(sphere2);

    camera2.position.z = 2;

    animate();
}

function animate() {
    requestAnimationFrame(animate);

    // Animate the first sphere
    sphere1.rotation.y += 0.01;
    renderer1.render(scene1, camera1);

    // Animate the second sphere
    sphere2.rotation.y += 0.01;
    renderer2.render(scene2, camera2);
}

init();

function createStar() {
    const star = document.createElement('div');
    star.className = 'star';

    // Randomize the size within a range, for example, between 10px and 30px
    const starSize = Math.random() * (30 - 10) + 10; // Min size 10px, Max size 30px
    star.style.width = `${starSize}px`;
    star.style.height = `${starSize}px`;

    star.style.top = `${Math.random() * 100}%`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.animation = `blink ${Math.random() * 5 + 2}s infinite`;
    document.getElementById('star-container').appendChild(star);
}

function initStars() {
    const numberOfStars = 100; // Adjust as needed
    for (let i = 0; i < numberOfStars; i++) {
        createStar();
    }
}

const style = document.createElement('style');
style.innerHTML = `
@keyframes blink {
    0%, 100% { opacity: 0; }
    50% { opacity: 1; }
}
`;
document.head.appendChild(style);

initStars();
