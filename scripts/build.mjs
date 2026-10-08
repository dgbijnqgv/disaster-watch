// Bundles src/ into dist/ (used by the desktop app and as Capacitor's webDir).
//   node scripts/build.mjs          build once
//   node scripts/build.mjs --serve  build, watch and serve on http://localhost:5173 (browser preview)
import * as esbuild from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const serve = process.argv.includes('--serve');
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const f of ['styles.css', 'icon.svg']) await cp(`src/${f}`, `dist/${f}`);
// The About section shows the version from package.json.
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
await writeFile('dist/index.html', (await readFile('src/index.html', 'utf8')).replaceAll('{{version}}', version));

const common = { bundle: true, minify: !serve, sourcemap: serve, target: ['chrome110', 'safari16'], logLevel: 'info' };

// UI: app.js + its CSS (Leaflet) -> dist/app.js, dist/app.css
const ui = await esbuild.context({ ...common, entryPoints: { app: 'src/app.js' }, outdir: 'dist', format: 'esm', loader: { '.png': 'dataurl' } });
// Android background task: must be one classic script with no imports.
const runner = await esbuild.context({ ...common, entryPoints: ['src/runner.js'], outfile: 'dist/runner.js', format: 'iife', target: 'es2020' });

if (serve) {
  await Promise.all([ui.watch(), runner.watch()]);
  const { port } = await ui.serve({ servedir: 'dist', port: 5173, host: '127.0.0.1' });
  console.log(`Browser preview: http://localhost:${port}`);
} else {
  await Promise.all([ui.rebuild(), runner.rebuild()]);
  await Promise.all([ui.dispose(), runner.dispose()]);
}
