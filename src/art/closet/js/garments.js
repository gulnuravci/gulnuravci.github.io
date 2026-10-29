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
//     scannedOnForm: true if it was scanned on a dress form (a whole costume).
//              The scan's own form replaces the 3D one. If the scan reaches
//              the floor, its own stand replaces the 3D stand too.
//     height:  for scannedOnForm, the real height in cm of the whole scan,
//              from its lowest point to its highest point (e.g. the wig)
//     bottom:  for scannedOnForm, cm from the floor to the scan's lowest
//              point. 0 (the default) if the scan reaches the floor.
//     flowFrom: for scannedOnForm, cm below the top where the swaying
//              starts (about the waist)
//     flow:    0 (rigid) to 1 (very swishy)
//     photos:  optional link to a page with photos of the piece
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
const SEWING = '../../../images/Sewing/';

export const GARMENTS = [
    {
        id: 'purah-cosplay',
        name: 'Purah',
        type: 'scan',
        model: SEWING + 'Purah Cosplay/purah.glb',
        thumbnail: SEWING + 'Purah Cosplay/purah-thumb.png',
        scannedOnForm: true,
        height: 133,
        bottom: 23,
        flowFrom: 62,
        flow: 0.6,
        photos: '../sewing/purah-cosplay.html',
        details: 'Cosplay · Zelda: Tears of the Kingdom',
        description: 'Purah, from The Legend of Zelda: Tears of the Kingdom.',
    },
    {
        id: 'jolyne-cujoh-cosplay',
        name: 'Jolyne Cujoh',
        type: 'scan',
        model: SEWING + 'Jolyne Cujoh Cosplay/jolyne.glb',
        thumbnail: SEWING + 'Jolyne Cujoh Cosplay/jolyne-thumb.png',
        scannedOnForm: true,
        height: 150,
        flowFrom: 93,
        flow: 0.3,
        photos: '../sewing/jolyne-cujoh-cosplay.html',
        details: "Cosplay · JoJo's Bizarre Adventure: Stone Ocean",
        description: "Jolyne Cujoh, from JoJo's Bizarre Adventure: Stone Ocean.",
    },
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
];
