const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const input = path.join(root, 'build', 'icon.ico');
const output = path.join(root, 'build', 'icon.converted.ico');
const normalized = path.join(root, 'build', 'icon.normalized.png');

(async () => {
  const { default: pngToIco } = await import('png-to-ico');
  await sharp(input).resize(256, 256, { fit: 'cover' }).png().toFile(normalized);
  const ico = await pngToIco(normalized);
  fs.writeFileSync(output, ico);
  fs.renameSync(output, input);
  fs.rmSync(normalized, { force: true });
  console.log(`Created valid ICO: ${input} (${ico.length} bytes)`);
})();
