import { copyFileSync, cpSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📋 Copying extension files...');

// Copy manifest.json
copyFileSync(
  join(__dirname, 'manifest.json'),
  join(__dirname, 'dist', 'manifest.json')
);

// Copy icons folder
cpSync(
  join(__dirname, 'public', 'icons'),
  join(__dirname, 'dist', 'icons'),
  { recursive: true }
);

// Copy _locales folder
cpSync(
  join(__dirname, '_locales'),
  join(__dirname, 'dist', '_locales'),
  { recursive: true }
);

console.log('✅ Chrome Extension build complete!');
console.log('📁 Extension files are in the "dist" folder');
console.log('💡 Load the "dist" folder as an unpacked extension in Chrome');