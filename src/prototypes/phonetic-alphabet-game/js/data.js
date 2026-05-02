const phonetic = {
    A: 'Alpha',    B: 'Bravo',    C: 'Charlie',  D: 'Delta',
    E: 'Echo',     F: 'Foxtrot',  G: 'Golf',     H: 'Hotel',
    I: 'India',    J: 'Juliet',   K: 'Kilo',     L: 'Lima',
    M: 'Mike',     N: 'November', O: 'Oscar',    P: 'Papa',
    Q: 'Quebec',   R: 'Romeo',    S: 'Sierra',   T: 'Tango',
    U: 'Uniform',  V: 'Victor',   W: 'Whiskey',  X: 'X-ray',
    Y: 'Yankee',   Z: 'Zulu'
};

const letters = Object.keys(phonetic);

const PLATE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PLATE_DIGITS  = '0123456789';

function generatePlate() {
    const rand = arr => arr[Math.floor(Math.random() * arr.length)];
    const d = () => rand(PLATE_DIGITS.split(''));
    const l = () => rand(PLATE_LETTERS.split(''));
    return `N${d()}${d()}${d()}${l()}${l()}`;
}

function plateToPhonetic(plate) {
    return plate.split('').map(ch => PLATE_DIGITS.includes(ch) ? ch : phonetic[ch]);
}
