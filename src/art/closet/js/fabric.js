import * as THREE from 'three';

const FINISHES = {
    matte: { roughness: 0.92, sheen: 0.8, sheenRoughness: 0.6 },
    satin: { roughness: 0.3, sheen: 0.3, sheenRoughness: 0.25 },
    velvet: { roughness: 1.0, sheen: 1.0, sheenRoughness: 0.3 },
};

// Draws one repeat of a generated print onto a canvas.
export function drawFabric(fabric, size = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    const [a = '#ff69b4', b = '#ffffff', c = '#ffff00'] = fabric.colors || [];
    const half = size / 2;

    switch (fabric.pattern) {
        case 'gingham':
            ctx.fillStyle = b;
            ctx.fillRect(0, 0, size, size);
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = a;
            ctx.fillRect(0, 0, half, size);
            ctx.fillRect(0, 0, size, half);
            ctx.globalAlpha = 1;
            break;
        case 'dots':
            ctx.fillStyle = a;
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = b;
            for (const [x, y] of [[0.25, 0.25], [0.75, 0.75]]) {
                ctx.beginPath();
                ctx.arc(x * size, y * size, size * 0.11, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        case 'stripes':
            ctx.fillStyle = a;
            ctx.fillRect(0, 0, size, size);
            ctx.fillStyle = b;
            ctx.fillRect(0, 0, half, size);
            break;
        case 'floral':
            ctx.fillStyle = a;
            ctx.fillRect(0, 0, size, size);
            for (const [x, y, r] of [[0.25, 0.3, 0.12], [0.75, 0.78, 0.1], [0.8, 0.2, 0.06], [0.2, 0.82, 0.07]]) {
                ctx.fillStyle = b;
                for (let p = 0; p < 5; p++) {
                    const t = (p / 5) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.arc((x + Math.cos(t) * r * 0.6) * size, (y + Math.sin(t) * r * 0.6) * size, r * 0.45 * size, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = c;
                ctx.beginPath();
                ctx.arc(x * size, y * size, r * 0.3 * size, 0, Math.PI * 2);
                ctx.fill();
            }
            break;
        default:
            ctx.fillStyle = a;
            ctx.fillRect(0, 0, size, size);
    }

    // a little weave texture so it reads as cloth, not plastic
    const image = ctx.getImageData(0, 0, size, size);
    const d = image.data;
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const k = (y * size + x) * 4;
            const weave = ((x + y) % 2 === 0 ? 6 : -6) + (Math.random() - 0.5) * 14;
            d[k] += weave;
            d[k + 1] += weave;
            d[k + 2] += weave;
        }
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
}

function fabricTexture(fabric) {
    const texture = fabric.image
        ? new THREE.TextureLoader().load(fabric.image)
        : new THREE.CanvasTexture(drawFabric(fabric));
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    return texture;
}

// Fabric material. Geometry UVs are expected in metres, so one texture repeat
// covers `tile` cm of real fabric.
export function fabricMaterial(fabric) {
    const map = fabricTexture(fabric);
    const tile = (fabric.tile ?? 5) / 100;
    map.repeat.set(1 / tile, 1 / tile);
    const material = new THREE.MeshPhysicalMaterial({
        map,
        side: THREE.DoubleSide,
        sheenColor: new THREE.Color(0xffffff),
        ...FINISHES[fabric.finish ?? 'matte'],
    });
    // shade the inside of the garment darker, as if in its own shadow
    material.onBeforeCompile = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            '#include <color_fragment>\ndiffuseColor.rgb *= gl_FrontFacing ? 1.0 : 0.5;'
        );
    };
    return material;
}

export function swatchURL(fabric) {
    return fabric.image || drawFabric(fabric, 96).toDataURL();
}
