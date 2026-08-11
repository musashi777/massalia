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

test('foundation narrative separates literary tradition from archaeology', () => {
  const article = read('content/feuille-mythe-protis.md');

  assert.match(article, /Statut documentaire — récit littéraire/);
  assert.match(article, /Ce que l’archéologie atteste/);
  assert.match(article, /Ce que les sources ne permettent pas d’affirmer/);
  assert.match(article, /modalités concrètes.*demeurent partiellement inconnues/s);
});

test('indigenous societies are represented as historical actors', () => {
  const overview = read('content/mere-histoire-marseille.md');
  const antiquity = read('content/fille-antiquite.md');

  assert.match(overview, /Ces populations ne sont pas de simples bénéficiaires/);
  assert.match(antiquity, /sociétés locales sélectionnent, adaptent ou refusent/);
});

test('tin trade is framed as a debated network rather than a monopoly', () => {
  const article = read('content/feuille-commerce-etain-gaulois.md');

  assert.match(article, /hypothèse discutée/);
  assert.match(article, /ne prouvent ni.*monopole/s);
  assert.doesNotMatch(article, /monopole de fait|Massalia a su capter|contrôler la production/);
});

test('targeted editorial pages cite institutional or academic references', () => {
  for (const relativePath of [
    'content/mere-histoire-marseille.md',
    'content/fille-antiquite.md',
    'content/feuille-mythe-protis.md',
    'content/feuille-commerce-etain-gaulois.md'
  ]) {
    const content = read(relativePath);
    assert.match(content, /inrap\.fr|ccj\.cnrs\.fr/i, relativePath);
  }
});

test('default test command includes editorial regression tests', () => {
  const packageJson = JSON.parse(read('package.json'));

  assert.match(packageJson.scripts.test, /npm run test:editorial/);
  assert.equal(packageJson.scripts['test:editorial'], 'node --test tests/editorial-rigor.test.js');
});

test('generated pages only badge explicitly classified images', () => {
  const foundation = read('dist/mythe-fondation-protis-gyptis.html');
  const antiquity = read('dist/antiquite-et-fondations.html');
  const portAntique = read('dist/fouilles-port-antique.html');

  assert.match(foundation, /img-badge--reconstruction/);
  assert.doesNotMatch(antiquity, /alt="\[Reconstitution artistique\]/);
  assert.doesNotMatch(portAntique, /img-badge--(?:reconstruction|archive)/);
});

test('generated editorial chrome makes no unsupported authority claims', () => {
  const buildSource = read('build.js');
  const foundation = read('dist/mythe-fondation-protis-gyptis.html');
  const about = read('dist/a-propos.html');

  assert.match(foundation, /Massalia Archives — projet éditorial indépendant/);
  assert.doesNotMatch(foundation, /Sources primaires vérifiées|Comité Éditorial Massalia Archives|datePublished/);
  assert.doesNotMatch(buildSource, /Archives départementales des Bouches-du-Rhône &amp; Musée d'Histoire de Marseille/);
  assert.match(about, /ne revendique ni comité scientifique ni validation institutionnelle/);
});

test('new caption and editorial fields are escaped before HTML rendering', () => {
  const buildSource = read('build.js');

  assert.match(buildSource, /escapeHtml\(text\)/);
  assert.match(buildSource, /escapeHtml\(page\.editorialStatus \|\| "Synthèse documentaire"\)/);
  assert.match(buildSource, /const safeAlt = escapeHtml\(alt \|\| ""\)/);
});
