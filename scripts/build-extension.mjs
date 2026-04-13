import * as esbuild from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const VALID_TARGETS = ['chrome', 'edge', 'firefox'];
const isWatch = process.argv.includes('--watch');
const requestedTarget = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1];

if (!requestedTarget || !VALID_TARGETS.includes(requestedTarget)) {
  console.error(`Missing or invalid --target. Expected one of: ${VALID_TARGETS.join(', ')}`);
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const baseManifest = JSON.parse(readFileSync('manifest.json', 'utf8'));

const target = requestedTarget;
const outdir = join('dist', target);

mkdirSync(outdir, { recursive: true });

const buildOptions = {
  entryPoints: [
    'src/content/main.ts',
    'src/background/main.ts',
    'src/popup/main.tsx',
  ],
  bundle: true,
  format: 'iife',
  target: ['firefox128', 'chrome120', 'edge120'],
  outdir,
  entryNames: '[dir]/[name]',
  sourcemap: isWatch ? 'inline' : false,
  minify: !isWatch,
  logLevel: 'info',
  jsx: 'transform',
  jsxFactory: 'h',
  jsxFragment: 'Fragment',
};

function createManifest(browserTarget) {
  const manifest = structuredClone(baseManifest);
  manifest.version = packageJson.version;
  manifest.background = browserTarget === 'firefox'
    ? { scripts: ['background/main.js'] }
    : { service_worker: 'background/main.js' };
  manifest.action = {
    ...manifest.action,
    default_popup: 'index.html',
  };
  manifest.web_accessible_resources = [
    {
      resources: ['content.css'],
      matches: ['<all_urls>'],
    },
  ];

  if (browserTarget === 'firefox') {
    manifest.browser_specific_settings = {
      gecko: {
        id: 'bug-hunter@nudgen.net',
      },
    };
  } else {
    delete manifest.browser_specific_settings;
  }

  return manifest;
}

function copyStaticFiles() {
  const copies = [
    ['content.css', 'content.css'],
    ['src/popup/index.html', 'index.html'],
    ['assets', 'assets'],
  ];

  for (const [src, dest] of copies) {
    cpSync(src, join(outdir, dest), { recursive: true });
  }

  const manifest = createManifest(target);
  writeFileSync(
    join(outdir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );
}

async function run() {
  if (!isWatch) {
    rmSync(outdir, { recursive: true, force: true });
    mkdirSync(outdir, { recursive: true });
  }

  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    copyStaticFiles();
    await ctx.watch();
    console.log(`Watching ${target} build for changes...`);
    return;
  }

  await esbuild.build(buildOptions);
  copyStaticFiles();
  console.log(`Build complete for ${target}.`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
