import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';

for (const file of ['dist/index.html', 'dist/sw.js', 'dist/manifest.webmanifest', 'src/data/lessons.json']) {
  assert.ok(existsSync(file), `Missing ${file}: run npm run build first.`);
}
const manifest = JSON.parse(readFileSync('dist/manifest.webmanifest', 'utf8'));
for (const icon of manifest.icons) assert.ok(existsSync(`dist/${icon.src}`));
const audio = JSON.parse(readFileSync('src/data/audio.json', 'utf8'));
for (const file of Object.values(audio)) assert.ok(existsSync(`dist/audio/${file}`), `Missing recording ${file}`);
assert.equal(Object.keys(audio).length, 815, 'Preserve every original recording');
function scan(dir) {
  for (const name of readdirSync(dir)) {
    const path = `${dir}/${name}`;
    if (statSync(path).isDirectory()) { scan(path); continue; }
    if (!/\.(js|html|json|css)$/.test(path)) continue;
    const text = readFileSync(path, 'utf8');
    assert.ok(!/(?:sb_secret_[A-Za-z0-9_-]+|ghp_[A-Za-z0-9]{36}|-----BEGIN PRIVATE KEY-----)/.test(text), `Secret in ${path}`);
  }
}
scan('dist');
assert.ok(!readFileSync('dist/sw.js', 'utf8').includes('supabase.co'), 'Do not cache authenticated database responses');
console.log(`App build, manifest, ${Object.keys(audio).length} recordings, and secret checks passed.`);
