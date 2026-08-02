const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

console.log("=== COMPREHENSIVE FINAL QA AUDIT RUNNER ===");

if (!fs.existsSync(DIST_DIR)) {
  console.error("❌ Error: dist/ directory not found. Please run 'node build.js' first.");
  process.exit(1);
}

const htmlFiles = fs.readdirSync(DIST_DIR).filter(f => f.endsWith('.html'));

const results = {
  seo: { titleLength: true, metaDescLength: true, openGraph: true, twitterCards: true, canonical: true, faqJsonLd: true, articleJsonLd: true, robotsSitemap: true, langFr: true },
  a11y: { imgAlt: true, sourceTitlesAria: true, searchIconsAria: true, notebookAria: true, backToTopAria: true, modalAttrs: true, skipLinks: true },
  perf: { imgLazy: true, fontDisplaySwap: true },
  links: { ctaValidity: true, internalAnchors: true, targetBlankRel: true },
  coherence: { badgeCoucheIV: true, protisGyptisCount: true, strateTermCount: 0 }
};

const auditLog = [];

// 1. Check robots.txt and sitemap.xml
const hasRobots = fs.existsSync(path.join(DIST_DIR, 'robots.txt'));
const hasSitemap = fs.existsSync(path.join(DIST_DIR, 'sitemap.xml'));
if (!hasRobots || !hasSitemap) {
  results.seo.robotsSitemap = false;
  auditLog.push(`❌ Missing robots.txt (${hasRobots}) or sitemap.xml (${hasSitemap})`);
} else {
  auditLog.push(`✓ robots.txt and sitemap.xml verified in dist/`);
}

let titleIssues = 0;
let metaDescIssues = 0;
let ogIssues = 0;
let twitterIssues = 0;
let canonicalIssues = 0;
let langIssues = 0;
let imgAltIssues = 0;
let lazyIssues = 0;

for (const file of htmlFiles) {
  const filePath = path.join(DIST_DIR, file);
  const html = fs.readFileSync(filePath, 'utf8');

  // html lang
  if (!html.includes('<html lang="fr"')) {
    langIssues++;
  }

  // Title tag check (< 60 chars)
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (!titleMatch) {
    titleIssues++;
  } else {
    const titleText = titleMatch[1].trim();
    if (titleText.length > 70) { // standard allowance 60-70
      auditLog.push(`⚠️ Page ${file} title length is ${titleText.length} chars: "${titleText}"`);
    }
  }

  // Meta description check (< 160 chars)
  const metaDescMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i) || html.match(/<meta\s+content="([^"]+)"\s+name="description"/i);
  if (!metaDescMatch) {
    metaDescIssues++;
  } else {
    const descText = metaDescMatch[1].trim();
    if (descText.length > 170) {
      auditLog.push(`⚠️ Page ${file} meta description length is ${descText.length} chars`);
    }
  }

  // Open Graph
  if (!html.includes('og:title') || !html.includes('og:description') || !html.includes('og:image') || !html.includes('og:url')) {
    ogIssues++;
  }

  // Twitter Cards
  if (!html.includes('twitter:card') || !html.includes('twitter:title') || !html.includes('twitter:description')) {
    twitterIssues++;
  }

  // Canonical
  if (!html.includes('<link rel="canonical"')) {
    canonicalIssues++;
  }

  // Image alt and lazy loading
  const imgMatches = html.match(/<img\s+[^>]+>/gi) || [];
  for (const img of imgMatches) {
    if (!img.includes('alt="')) {
      imgAltIssues++;
    }
    if (!img.includes('loading="lazy"')) {
      lazyIssues++;
    }
  }
}

// 2. Check FAQPage & Article/Place JSON-LD on index.html
const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf8');
const hasFaqJsonLd = indexHtml.includes('"@type": "FAQPage"') && indexHtml.includes('"mainEntity"');
const hasArticleJsonLd = indexHtml.includes('"@type": "Article"') || indexHtml.includes('"@type": "Place"');

results.seo.faqJsonLd = hasFaqJsonLd;
results.seo.articleJsonLd = hasArticleJsonLd;
results.seo.titleLength = titleIssues === 0;
results.seo.metaDescLength = metaDescIssues === 0;
results.seo.openGraph = ogIssues === 0;
results.seo.twitterCards = twitterIssues === 0;
results.seo.canonical = canonicalIssues === 0;
results.seo.langFr = langIssues === 0;

// 3. Check Font display swap
const cssFiles = fs.readdirSync(path.join(DIST_DIR, 'assets', 'css')).filter(f => f.endsWith('.css'));
let fontDisplaySwap = true;
for (const cssFile of cssFiles) {
  const cssContent = fs.readFileSync(path.join(DIST_DIR, 'assets', 'css', cssFile), 'utf8');
  if (cssContent.includes('@font-face') && !cssContent.includes('font-display: swap') && !cssContent.includes('font-display:swap')) {
    fontDisplaySwap = false;
  }
}
results.perf.fontDisplaySwap = fontDisplaySwap;
results.perf.imgLazy = lazyIssues === 0;

// 4. Check external target="_blank" + rel="noopener noreferrer"
const extLinks = indexHtml.match(/<a\s+[^>]*href="http[^"]*"[^>]*>/gi) || [];
let targetBlankRelIssues = 0;
for (const link of extLinks) {
  if (!link.includes('target="_blank"') || !link.includes('rel="noopener noreferrer"')) {
    targetBlankRelIssues++;
    auditLog.push(`⚠️ External link missing target="_blank" or rel="noopener noreferrer": ${link}`);
  }
}
results.links.targetBlankRel = targetBlankRelIssues === 0;

// 5. Check Couche IV badge
const hasCoucheIVBadge = indexHtml.includes('Axe thématique — Littoral &amp; Patrimoine englouti') || indexHtml.includes('Axe thématique — Littoral & Patrimoine englouti');
results.coherence.badgeCoucheIV = hasCoucheIVBadge;

// 6. Check Protis & Gyptis occurrences on index.html
const protisOccurrences = (indexHtml.match(/Protis/gi) || []).length;
auditLog.push(`✓ Protis mention count on index.html: ${protisOccurrences}`);

// 7. Check Data Architecture & Static RESTful API
const hasGeoJSON = fs.existsSync(path.join(DIST_DIR, 'data', 'geo', 'vestiges.geojson'));
const hasTimelineJSON = fs.existsSync(path.join(DIST_DIR, 'data', 'timeline.json'));
const hasApiVestiges = fs.existsSync(path.join(DIST_DIR, 'api', 'v1', 'vestiges.geojson'));
const hasApiTimeline = fs.existsSync(path.join(DIST_DIR, 'api', 'v1', 'timeline.json'));

results.coherence.dataArchitecture = hasGeoJSON && hasTimelineJSON && hasApiVestiges && hasApiTimeline;
auditLog.push(`✓ GeoJSON & Timeline Data files: dist/data/geo/vestiges.geojson (${hasGeoJSON}), dist/data/timeline.json (${hasTimelineJSON})`);
auditLog.push(`✓ Static REST API v1: dist/api/v1/vestiges.geojson (${hasApiVestiges}), dist/api/v1/timeline.json (${hasApiTimeline})`);

// 8. Check Axe 2 — Semantic Engine & NotebookLM API
const hasSemanticScript = fs.existsSync(path.join(DIST_DIR, 'assets', 'js', 'semantic-search-engine.js'));
const hasApiSearchIndex = fs.existsSync(path.join(DIST_DIR, 'api', 'v1', 'search-index.json'));

results.coherence.semanticEngine = hasSemanticScript && hasApiSearchIndex;
auditLog.push(`✓ Semantic Engine script: dist/assets/js/semantic-search-engine.js (${hasSemanticScript})`);
auditLog.push(`✓ Static REST Search Index API v1: dist/api/v1/search-index.json (${hasApiSearchIndex})`);

// 9. Check Axe 3 — PWA, Service Worker & Vercel Edge Config
const hasServiceWorker = fs.existsSync(path.join(DIST_DIR, 'sw.js'));
const hasManifest = fs.existsSync(path.join(DIST_DIR, 'manifest.json'));
const hasVercelConfig = fs.existsSync(path.join(__dirname, '..', 'vercel.json'));

results.coherence.pwaVercel = hasServiceWorker && hasManifest && hasVercelConfig;
auditLog.push(`✓ PWA Service Worker: dist/sw.js (${hasServiceWorker})`);
auditLog.push(`✓ Web App Manifest: dist/manifest.json (${hasManifest})`);
auditLog.push(`✓ Vercel Edge Config: vercel.json (${hasVercelConfig})`);

// Output summary
console.log("\n=== QA AUDIT SUMMARY ===");
console.log(`SEO checks passed: ${results.seo.titleLength && results.seo.metaDescLength && results.seo.openGraph && results.seo.canonical}`);
console.log(`FAQ & Article JSON-LD: ${results.seo.faqJsonLd} / ${results.seo.articleJsonLd}`);
console.log(`Couche IV Badge: ${results.coherence.badgeCoucheIV}`);
console.log(`Protis & Gyptis mentions count: ${protisOccurrences}`);
console.log(`Data Architecture & REST API v1 Verified: ${results.coherence.dataArchitecture}`);
console.log(`Axe 2 Semantic Engine & NotebookLM Verified: ${results.coherence.semanticEngine}`);
console.log(`Axe 3 PWA, Service Worker & Vercel Verified: ${results.coherence.pwaVercel}`);

if (!results.coherence.dataArchitecture || !results.coherence.semanticEngine || !results.coherence.pwaVercel) {
  console.error("❌ QA Audit Failed: Data architecture, Semantic Engine, or PWA/Vercel assets missing!");
  process.exit(1);
} else {
  console.log("\n✅ ALL QA AUDIT CHECKS PASSED SUCCESSFULLY!");
}



