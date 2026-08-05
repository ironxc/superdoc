import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.env.CI) {
  process.exit(0);
}

const entry = fileURLToPath(new URL('../node_modules/lefthook/bin/index.js', import.meta.url));
const result = spawnSync(process.execPath, [entry, 'install'], { stdio: 'inherit' });
if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
