const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  normalizeFeature,
  normalizeTimelineEvent,
  safeSitePath,
  safeSlug,
  safeStrateId,
  safeText
} = require('../assets/js/map-timeline-module.js');

const maliciousMarkup = '<img src=x onerror="globalThis.pwned=true">';

test('keeps editorial strings as literal text for textContent rendering', () => {
  assert.equal(safeText(maliciousMarkup), maliciousMarkup);
  assert.equal(safeText('x'.repeat(700)).length, 500);
  assert.equal(safeText({ value: maliciousMarkup }), '');
});

test('allows only known strate identifiers', () => {
  assert.equal(safeStrateId('couche-1-antiquite'), 'couche-1-antiquite');
  assert.equal(safeStrateId('couche-1-antiquite" onclick="alert(1)'), '');
});

test('allows only root-relative same-origin paths', () => {
  assert.equal(safeSitePath('/archive.html?view=map#site'), '/archive.html?view=map#site');
  assert.equal(safeSitePath('javascript:alert(1)'), '');
  assert.equal(safeSitePath('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(safeSitePath('https://attacker.example/payload'), '');
  assert.equal(safeSitePath('//attacker.example/payload'), '');
  assert.equal(safeSitePath('/\\attacker.example/payload'), '');
});

test('accepts only canonical slugs', () => {
  assert.equal(safeSlug('jardin-des-vestiges'), 'jardin-des-vestiges');
  assert.equal(safeSlug('../admin'), '');
  assert.equal(safeSlug('page"><script>alert(1)</script>'), '');
});

test('normalizes GeoJSON properties and rejects unsafe attributes', () => {
  const feature = normalizeFeature({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [5.37, 43.29] },
    properties: {
      title: maliciousMarkup,
      strateId: 'couche-1-antiquite',
      strateLabel: maliciousMarkup,
      epoque: '600 av. J.-C.',
      summary: maliciousMarkup,
      url: 'javascript:alert(1)',
      heroImage: 'data:image/svg+xml,<svg onload=alert(1)></svg>'
    }
  });

  assert.ok(feature);
  assert.equal(feature.properties.title, maliciousMarkup);
  assert.equal(feature.properties.summary, maliciousMarkup);
  assert.equal(feature.properties.url, '');
  assert.equal(feature.properties.heroImage, '');
});

test('rejects invalid GeoJSON geometry and unknown strates', () => {
  assert.equal(normalizeFeature({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [500, 43.29] },
    properties: { title: 'Invalid', strateId: 'couche-1-antiquite' }
  }), null);

  assert.equal(normalizeFeature({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [5.37, 43.29] },
    properties: { title: 'Invalid', strateId: 'unknown-strate' }
  }), null);
});

test('normalizes timeline events without trusting slugs or markup', () => {
  const event = normalizeTimelineEvent({
    id: 'event-1',
    yearStart: -600,
    displayDate: '600 av. J.-C.',
    title: maliciousMarkup,
    summary: maliciousMarkup,
    strateId: 'couche-1-antiquite',
    slug: 'archive"><script>alert(1)</script>'
  });

  assert.ok(event);
  assert.equal(event.title, maliciousMarkup);
  assert.equal(event.summary, maliciousMarkup);
  assert.equal(event.slug, '');
});

test('production renderer contains no direct HTML injection sinks', () => {
  const sourcePath = path.join(__dirname, '..', 'assets', 'js', 'map-timeline-module.js');
  const source = fs.readFileSync(sourcePath, 'utf8');

  assert.doesNotMatch(source, /\.innerHTML\s*=/);
  assert.doesNotMatch(source, /\.outerHTML\s*=/);
  assert.doesNotMatch(source, /insertAdjacentHTML\s*\(/);
  assert.doesNotMatch(source, /document\.write\s*\(/);
  assert.match(source, /html:\s*pinElement/);
  assert.match(source, /bindPopup\(popupContent/);
});
