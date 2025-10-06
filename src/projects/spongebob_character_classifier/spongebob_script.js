const flowerImages = [
    '../../../images/Spongebob_Identifier/flower_pink.png',
    '../../../images/Spongebob_Identifier/flower_orange.png',
    '../../../images/Spongebob_Identifier/flower_green.png',
    '../../../images/Spongebob_Identifier/flower_purple.png'
];

let flowerCount = 0;
const maxFlowers = 40; // Maximum number of flowers on the screen at once
const flowerSpeed = 0.75; // The speed at which the flower will move
const flowerGenerationInterval = 1000; // Interval to generate flowers in milliseconds (e.g., 3000ms = 3 seconds)
const flowerContainerHeight = 9675; // Set this to the desired height of your flower container

// Ensure the flower container has the proper height
const container = document.getElementById('flower_container');
container.style.height = `${flowerContainerHeight}px`;

function createFlower() {
    if (flowerCount >= maxFlowers) {
        // Don't create more flowers if the maximum is reached.
        return;
    }

    // Create a new img element for the flower.
    const flower = document.createElement('img');
    flower.src = flowerImages[Math.floor(Math.random() * flowerImages.length)];
    flower.classList.add('flower');

    const minSize = 50; 
    const maxSize = 500;
    const size = Math.random() * (maxSize - minSize) + minSize;
    flower.style.width = `${size}px`;
    flower.style.height = 'auto';

    // Randomize the vertical position of the flower within the container.
    flower.style.position = 'absolute';
    flower.style.top = `${Math.random() * (flowerContainerHeight - size)}px`;

    container.appendChild(flower);
    flowerCount++;

    let position = -size; // Start off-screen to the left.

    // Function to move the flower horizontally and check to remove it.
    function moveFlower() {
        position += flowerSpeed;
        flower.style.left = `${position}px`;

        if (position > container.offsetWidth) {
            container.removeChild(flower);
            flowerCount--;
        } else {
            requestAnimationFrame(moveFlower);
        }
    }

    moveFlower();
}

for (let i = 0; i < 20; i++) { 
    createFlower()
}

// Continuously generate flowers at a set interval
setInterval(createFlower, flowerGenerationInterval);
