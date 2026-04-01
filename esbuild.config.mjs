import * as esbuild from 'esbuild';
import { cpSync, mkdirSync } from 'fs';
import { join } from 'path';

const isWatch = process.argv.includes('--watch');
const dist = 'dist';

mkdirSync(dist, { recursive: true });

const buildOptions = {
  entryPoints: [
    'src/content/main.ts',
    'src/background/main.ts',
    'src/popup/main.tsx',
  ],
  bundle: true,
  format: 'iife',
  target: ['chrome120'],
  outdir: dist,
  entryNames: '[dir]/[name]',
  sourcemap: isWatch ? 'inline' : false,
  minify: !isWatch,
  logLevel: 'info',
  jsx: 'transform',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
};

function copyStaticFiles() {
  const copies = [
    ['content.css', 'content.css'],
    ['manifest.json', 'manifest.json'],
    ['src/popup/index.html', 'index.html'],
    ['assets', 'assets'],
  ];

  for (const [src, dest] of copies) {
    try {
      cpSync(src, join(dist, dest), { recursive: true });
    } catch (e) {
      console.warn(`Warning: could not copy ${src}: ${e.message}`);
    }
  }
}

if (isWatch) {
  const ctx = await esbuild.context(buildOptions);
  copyStaticFiles();
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(buildOptions);
  copyStaticFiles();
  console.log('Build complete.');
}
