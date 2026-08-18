const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { before, test } = require('node:test');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

before(() => {
  execFileSync(process.execPath, ['build.js'], { cwd: root, stdio: 'pipe' });
});

test('homepage presentation exposes its period, evidence levels and public source', () => {
  const homepage = read('dist/index.html');

  assert.match(homepage, /Présentation — Antiquité/);
  assert.match(homepage, /aria-label="Niveaux de preuve"/);
  assert.match(homepage, /Récit littéraire/);
  assert.match(homepage, /Fait archéologique/);
  assert.match(homepage, /Source : Atlas archéologique de Marseille, Inrap/);
  assert.doesNotMatch(homepage, />\[source\]</);
});

test('presentation section follows the dark 5/7 documentary layout', () => {
  const styles = read('assets/css/style-v4.css');

  assert.match(styles, /\.prose-section\s*{[^}]*background:\s*var\(--color-surface-low\)/s);
  assert.match(styles, /\.prose-inner\s*{[^}]*grid-template-columns:\s*minmax\(0, 5fr\) minmax\(0, 7fr\)/s);
  assert.match(styles, /\.evidence-grid\s*{/);
  assert.doesNotMatch(styles, /\.article-figure figcaption\s*{[^}]*rgba\(209,228,251,0\.3\)/s);
});

test('secondary navigation and back-to-top button use the shared angular brand language', () => {
  const improvements = read('assets/css/improvements-v4.css');
  const finalNavigation = improvements.slice(improvements.indexOf('/* ═══ SOMMAIRE STICKY ═══ */'));
  const backToTopRule = finalNavigation.match(/\.btn-top, \.back-to-top-btn\s*{[^}]*}/s)?.[0] || '';
  const backToTopHoverRule = finalNavigation.match(/\.btn-top:hover, \.back-to-top-btn:hover\s*{[^}]*}/s)?.[0] || '';

  assert.match(finalNavigation, /\.sommaire-sticky a\s*{[^}]*border-radius:\s*0;/s);
  assert.match(finalNavigation, /\.sommaire-sticky a\.active\s*{[^}]*border-bottom-color:\s*var\(--color-accent/s);
  assert.match(backToTopRule, /border-radius:\s*0;/);
  assert.doesNotMatch(`${backToTopRule}\n${backToTopHoverRule}`, /#8b4513|#6d360f|border-radius:\s*50%/i);
});

test('default test command includes design regression tests', () => {
  const packageJson = JSON.parse(read('package.json'));

  assert.match(packageJson.scripts.test, /npm run test:design/);
  assert.equal(packageJson.scripts['test:design'], 'node --test tests/design-consistency.test.js');
});
