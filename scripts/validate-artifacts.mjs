import { readFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

const VALID_TARGETS = ['chrome', 'edge', 'firefox'];
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const requestedTarget = process.argv.find((arg) => arg.startsWith('--target='))?.split('=')[1];
const targets = requestedTarget ? [requestedTarget] : VALID_TARGETS;

if (targets.some((target) => !VALID_TARGETS.includes(target))) {
  console.error(`Invalid target. Expected one of: ${VALID_TARGETS.join(', ')}`);
  process.exit(1);
}

for (const target of targets) {
  const zipPath = join('artifacts', `bug-hunter-${target}-v${packageJson.version}.zip`);
  const result = spawnSync(
    process.execPath,
    ['scripts/validate-extension-package.mjs', '--zip', zipPath],
    { stdio: 'inherit' },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`Validated ${targets.length} artifact(s).`);
