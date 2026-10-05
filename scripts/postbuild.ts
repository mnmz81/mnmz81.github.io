// Runs automatically after `npm run build`: creates 404.html and verifies the static output.
import { finalizeDist } from './postbuild/verify';

const DIST = 'dist/moris-site/browser';
const missing = finalizeDist(DIST);
if (missing.length) {
  console.error(`[postbuild] missing from ${DIST}:\n${missing.map((f) => `  ${f}`).join('\n')}`);
  process.exit(1);
}
console.log('[postbuild] 404.html created, output verified');
