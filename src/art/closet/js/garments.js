// Everything hanging on the closet rail. Add a new object here to add a piece.
//
// Two kinds of garments:
//
//   type: 'scan'  - a 3D scan (.glb) of the real piece, e.g. from Polycam,
//                   KIRI Engine or Luma. The page bakes a "flow" sway into the
//                   hem so the scan swings when the form spins.
//     model:   path to the .glb
//     length:  finished length in cm (used to scale the scan onto the form)
//     rotate:  [x, y, z] degrees, if the scan comes in sideways
//     cropTop: fraction of the scan's height to cut off the top (the hanger)
//     scannedFlat: true if it was scanned lying flat or on a hanger, so it
//              gets opened up into a tube around the dress form
//     flare:   extra hem width for flat scans (0.3 = 30% wider at the hem),
//              since folds and pleats hide fabric when the piece lies flat
//     flow:    0 (rigid) to 1 (very swishy)
//
//   type: 'skirt' | 'dress' - simulated cloth, built from a sewing pattern.
//     cut:     'circle' | 'half-circle' | 'a-line' | 'gathered'
//     length:  finished length in cm, waist to hem
//     gather:  waist fullness for 'gathered' (2 = twice the waist measurement)
//     drape:   'flowy' (chiffon, rayon) | 'medium' (cotton) | 'stiff' (denim)
//     fabric:  how the fabric looks. Either a photo of the fabric:
//                { image: 'path/to/fabric-photo.jpg', tile: 10 }
//              or a generated print:
//                { pattern: 'gingham' | 'dots' | 'stripes' | 'floral' | 'solid',
//                  colors: [...], tile: 3 }
//              tile = real-world size of one repeat in cm.
//              finish: 'matte' | 'satin' | 'velvet'

const IMAGES = '../../../images/Fashion/';

export const GARMENTS = [
    {
        id: 'camo-skirt',
        name: 'Camo Pleated Mini',
        type: 'scan',
        model: IMAGES + 'camo_skirt_model.glb',
        thumbnail: IMAGES + 'camo_skirt_thumb.png',
        length: 37,
        cropTop: 0.24,
        scannedFlat: true,
        flare: 0.3,
        flow: 0.7,
        details: 'Upcycled · Cotton twill · Pleated',
        description: 'I thrifted oversized military pants and reimagined them by bringing in the waist and creating pleats from the fabric from the legs. How cute!',
    },
    // The pieces below are cloth-simulation demos. Swap in your own fabric
    // photos, names and stories.
    {
        id: 'gingham-circle-skirt',
        name: 'Gingham Circle Skirt',
        type: 'skirt',
        cut: 'circle',
        length: 50,
        drape: 'flowy',
        fabric: { pattern: 'gingham', colors: ['#ff69b4', '#fff6fa'], tile: 2.5, finish: 'matte' },
        details: 'Circle skirt · Cotton lawn · Demo',
        description: 'A full circle skirt. The gingham runs on the bias around the hem, just like it does on the real thing.',
    },
    {
        id: 'satin-slip-dress',
        name: 'Midnight Slip Dress',
        type: 'dress',
        cut: 'half-circle',
        length: 72,
        drape: 'flowy',
        fabric: { pattern: 'solid', colors: ['#3a1a5c'], tile: 4, finish: 'satin' },
        details: 'Bias slip · Satin · Demo',
        description: 'A slinky satin slip dress with a half-circle skirt.',
    },
    {
        id: 'polka-dot-midi',
        name: 'Polka Dot Gathered Midi',
        type: 'skirt',
        cut: 'gathered',
        gather: 1.8,
        length: 64,
        drape: 'medium',
        fabric: { pattern: 'dots', colors: ['#ffe600', '#111111'], tile: 4, finish: 'matte' },
        details: 'Gathered dirndl · Cotton · Demo',
        description: 'Two rectangles of fabric gathered into a waistband.',
    },
];
