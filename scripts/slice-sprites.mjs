import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../public/assets');
const spritesDir = path.join(assetsDir, 'sprites');

// Sprite sheet: 2048x1378, 4 cols x 3 rows
const COLS = 4;
const ROWS = 3;
const SPRITE_WIDTH = 512;  // 2048 / 4
const SPRITE_HEIGHT = 459; // 1378 / 3 (rounded)

// Achievement names matching the 4x3 grid (left to right, top to bottom)
const ACHIEVEMENTS = [
  // Row 0
  'be-bleeding-edge',
  'fly-by-night',
  'thank-you',
  'brand-new',
  // Row 1
  'pay-me',
  'magic-comes-with-a-price',
  'act-now',
  'tell-the-truth',
  // Row 2
  'roll-the-dice',
  'no-crystal-balls',
  'no-sacrifice-no-victory',
  'snake-oil',
];

async function sliceSprites() {
  const inputPath = path.join(spritesDir, 'achievements-sheet.png');

  console.log('Loading sprite sheet...');
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  console.log(`Sprite sheet: ${metadata.width}x${metadata.height}`);
  console.log(`Slicing into ${COLS}x${ROWS} grid (${SPRITE_WIDTH}x${SPRITE_HEIGHT} each)`);

  let index = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const name = ACHIEVEMENTS[index];
      const outputPath = path.join(spritesDir, `${name}.png`);

      const left = col * SPRITE_WIDTH;
      const top = row * SPRITE_HEIGHT;

      await sharp(inputPath)
        .extract({
          left,
          top,
          width: SPRITE_WIDTH,
          height: Math.min(SPRITE_HEIGHT, metadata.height - top),
        })
        .toFile(outputPath);

      console.log(`✓ ${name}.png (${left},${top})`);
      index++;
    }
  }

  console.log('\nDone! Created 12 individual badge PNGs.');
}

sliceSprites().catch(console.error);
