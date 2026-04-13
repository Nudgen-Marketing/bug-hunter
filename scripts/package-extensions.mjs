import { mkdirSync, readFileSync, rmSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, resolve } from 'path';

const VALID_TARGETS = ['chrome', 'edge', 'firefox'];
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const requestedTarget = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1];
const targets = requestedTarget ? [requestedTarget] : VALID_TARGETS;

if (targets.some((target) => !VALID_TARGETS.includes(target))) {
  console.error(`Invalid target. Expected one of: ${VALID_TARGETS.join(', ')}`);
  process.exit(1);
}

const artifactsDir = resolve('artifacts');
rmSync(artifactsDir, { recursive: true, force: true });
mkdirSync(artifactsDir, { recursive: true });

for (const target of targets) {
  const sourceDir = resolve(join('dist', target));
  const archiveName = `bug-hunter-${target}-v${packageJson.version}.zip`;
  const archivePath = join(artifactsDir, archiveName);
  const result = spawnSync(
    'zip',
    ['-r', archivePath, '.'],
    {
      cwd: sourceDir,
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Created extension packages in ${artifactsDir}`);
