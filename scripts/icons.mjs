// Renders src/icon.svg into the PNGs the installers need:
//   build/icon.png  (1024) – Windows/macOS installers (electron-builder)
//   electron/assets/icon.png, tray.png – window and system-tray icons
//   assets/icon.png (1024) – source for Android icons (npx @capacitor/assets generate --android)
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

await mkdir('build', { recursive: true });
await mkdir('assets', { recursive: true });
await mkdir('electron/assets', { recursive: true });
const svg = 'src/icon.svg';
await sharp(svg, { density: 512 }).resize(1024, 1024).png().toFile('build/icon.png');
await sharp(svg, { density: 512 }).resize(1024, 1024).png().toFile('assets/icon.png');
await sharp(svg, { density: 512 }).resize(256, 256).png().toFile('electron/assets/icon.png');
await sharp(svg, { density: 72 }).resize(32, 32).png().toFile('electron/assets/tray.png');
console.log('Icons written to build/, assets/ and electron/assets/');
