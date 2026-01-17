import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const spritesDir = path.join(__dirname, '../public/assets/sprites');

// Sprite sheet is 2048x1378
// Sprites are ORGANICALLY placed - manual bounding boxes based on visual analysis
// Format: { name, x, y, width, height }
// FIXED v7: Added gaps between sprites to prevent bleeding, extended bounds for curved text
// Verified from visual: sprites have ~30px top margin, curved text extends beyond artwork
const SPRITE_BOUNDS = [
  // Row 1 - v8: Extended col2 to capture "NIGHT", pushed col3 right
  // "BE BLEEDING EDGE" - full text captured at width 580
  { name: 'be-bleeding-edge', x: 0, y: 10, width: 580, height: 470 },
  // "FLY BY NIGHT" - "NIGHT" extends far right, need width ~500
  { name: 'fly-by-night', x: 600, y: 10, width: 500, height: 470 },
  // "THANK YOU" - start at 1120 to avoid "HT" bleeding
  { name: 'thank-you', x: 1120, y: 10, width: 400, height: 470 },
  // "BRAND NEW" - sun badge
  { name: 'brand-new', x: 1530, y: 10, width: 518, height: 470 },

  // Row 2 - v10: Fixed act-now/tell-the-truth boundary
  // "PAY ME" - keep as is
  { name: 'pay-me', x: 0, y: 480, width: 520, height: 420 },
  // "MAGIC COMES WITH A PRICE" - signpost is narrow
  { name: 'magic-comes-with-a-price', x: 540, y: 480, width: 420, height: 420 },
  // "ACT NOW" - end at 1390 to avoid banner
  { name: 'act-now', x: 980, y: 480, width: 410, height: 420 },
  // "TELL THE FUCKING TRUTH" - start at 1400 to capture "T" in TELL
  { name: 'tell-the-truth', x: 1400, y: 480, width: 648, height: 420 },

  // Row 3 - same adjustments
  // "ROLL THE DICE"
  { name: 'roll-the-dice', x: 0, y: 900, width: 580, height: 478 },
  // "NO CRYSTAL BALLS" - wider
  { name: 'no-crystal-balls', x: 600, y: 900, width: 500, height: 478 },
  // "NO SACRIFICE NO VICTORY" - start later
  { name: 'no-sacrifice-no-victory', x: 1120, y: 900, width: 400, height: 478 },
  // "SNAKE OIL"
  { name: 'snake-oil', x: 1530, y: 900, width: 518, height: 478 },
];

async function sliceSprites() {
  const inputPath = path.join(spritesDir, 'achievements-sheet.png');

  console.log('Loading sprite sheet...');
  const metadata = await sharp(inputPath).metadata();
  console.log(`Sheet size: ${metadata.width}x${metadata.height}`);

  // Remove old sliced files first
  console.log('\nSlicing sprites with manual bounds...\n');

  for (const sprite of SPRITE_BOUNDS) {
    const outputPath = path.join(spritesDir, `${sprite.name}.png`);

    // Ensure we don't go out of bounds
    const safeWidth = Math.min(sprite.width, metadata.width - sprite.x);
    const safeHeight = Math.min(sprite.height, metadata.height - sprite.y);

    try {
      await sharp(inputPath)
        .extract({
          left: sprite.x,
          top: sprite.y,
          width: safeWidth,
          height: safeHeight,
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ ${sprite.name}.png (${sprite.x},${sprite.y} ${safeWidth}x${safeHeight})`);
    } catch (err) {
      console.error(`✗ ${sprite.name}: ${err.message}`);
    }
  }

  console.log('\nDone! Sliced 12 sprites with organic bounds.');
}

sliceSprites().catch(console.error);
