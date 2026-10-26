import { spawnSync } from 'node:child_process';
const steps = [
  ['node_modules/typescript/bin/tsc', '-b'],
  ['node_modules/vite/bin/vite.js', 'build'],
  ['node_modules/vitest/vitest.mjs', 'run'],
  ['.github/scripts/verify-build.mjs'],
];
for (const step of steps) {
  const result = spawnSync(process.execPath, step, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
