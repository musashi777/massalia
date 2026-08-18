const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { before, test } = require('node:test');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const productionUrl = 'https://massalia-puce.vercel.app';
const read = relativePath => fs.readFileSync(path.join(root, relativePath), 'utf8');

before(() => {
  execFileSync(process.execPath, ['build.js'], {
    cwd: root,
    env: { ...process.env, SITE_URL: productionUrl },
    stdio: 'pipe',
  });
});

test('repository fallback uses the stable Vercel production alias', () => {
  const semanticMap = JSON.parse(read('data/semantic-map.json'));
  const buildSource = read('build.js');

  assert.equal(semanticMap.site.baseUrl, productionUrl);
  assert.match(buildSource, /site\.baseUrl \|\| "https:\/\/massalia-puce\.vercel\.app"/);
  assert.doesNotMatch(buildSource, /massalia-luh273w20|massalia\.vercel\.app/);
});

test('every generated page aligns canonical and og:url with production', () => {
  const htmlFiles = fs.readdirSync(dist).filter(file => file.endsWith('.html'));

  assert.ok(htmlFiles.length > 0);
  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(dist, file), 'utf8');
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/i)?.[1];
    const ogUrl = html.match(/<meta property="og:url" content="([^"]+)">/i)?.[1];

    assert.ok(canonical, `${file}: canonical missing`);
    assert.ok(ogUrl, `${file}: og:url missing`);
    assert.ok(canonical.startsWith(`${productionUrl}/`), `${file}: ${canonical}`);
    assert.equal(ogUrl, canonical, `${file}: og:url differs from canonical`);
    assert.doesNotMatch(html, /<meta[^>]+(?:name|property)="robots"[^>]+noindex/i, `${file}: noindex`);
  }
});

test('sitemap and robots only advertise the production origin', () => {
  const sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
  const robots = fs.readFileSync(path.join(dist, 'robots.txt'), 'utf8');
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);

  assert.ok(locations.length > 0);
  assert.ok(locations.every(location => location.startsWith(`${productionUrl}/`)));
  assert.doesNotMatch(sitemap, /massalia-luh273w20|massalia\.vercel\.app/);
  assert.match(robots, new RegExp(`Sitemap: ${productionUrl.replaceAll('.', '\\.')}/sitemap\\.xml`));
  assert.doesNotMatch(robots, /Disallow:\s*\//i);
});

test('default test command includes production SEO regressions', () => {
  const packageJson = JSON.parse(read('package.json'));

  assert.match(packageJson.scripts.test, /npm run test:seo/);
  assert.equal(packageJson.scripts['test:seo'], 'node --test tests/production-seo.test.js');
});
