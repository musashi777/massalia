#!/usr/bin/env node
/**
 * build.js — Générateur de site statique pour le cocon sémantique "Massalia".
 *
 * Complexité algorithmique :
 *   Soit N le nombre de pages du cocon (ici N = 10) et M la taille moyenne
 *   d'un fichier de contenu.
 *   - Lecture + parsing markdown : O(N × M)
 *   - Construction du graphe de maillage (parent/enfants/sœurs) : O(N),
 *     car chaque page ne référence qu'un nombre borné (≤ 3) de voisins
 *     directs issus de semantic-map.json — aucun parcours transitif n'est
 *     nécessaire pour respecter l'étanchéité du cocon.
 *   - Rendu de template (remplacement de placeholders) : O(N × M)
 *   Complexité totale : O(N × M), linéaire par rapport au volume de contenu.
 *   Aucune étape n'est quadratique : on n'effectue jamais de comparaison
 *   de chaque page avec toutes les autres pages du site.
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data", "semantic-map.json");
const CONTENT_DIR = ROOT;
const TEMPLATES_DIR = path.join(ROOT, "templates");
const DIST_DIR = path.join(ROOT, "dist");

const map = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
const { site, pages } = map;

const templates = {
  mere: fs.readFileSync(path.join(TEMPLATES_DIR, "layout-mere.html"), "utf8"),
  fille: fs.readFileSync(path.join(TEMPLATES_DIR, "layout-fille.html"), "utf8"),
  soeur: fs.readFileSync(path.join(TEMPLATES_DIR, "layout-soeur.html"), "utf8"),
};

/* ---------------------------------------------------------------------- *
 * Mini-parseur Markdown (paragraphes, listes, gras, italique)
 * Volontairement minimal : pas de dépendance externe (contrainte "0 €").
 * ---------------------------------------------------------------------- */
function inline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
}

function markdownToHtml(md) {
  const blocks = md.trim().split(/\n\s*\n/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim());
      const isList = lines.every((l) => l.startsWith("- "));
      if (isList) {
        const items = lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("\n    ");
        return `<ul>\n    ${items}\n  </ul>`;
      }
      return `<p>${inline(lines.join(" "))}</p>`;
    })
    .join("\n\n  ");
}

/* ---------------------------------------------------------------------- *
 * Résolution des URLs et gabarit "strate" (élément signature)
 * ---------------------------------------------------------------------- */
function urlFor(pageId) {
  const p = pages[pageId];
  return p.type === "mere" ? "/" : `/${p.slug}.html`;
}

const STRATE_SCALE = [
  { niveau: 0, generic: "Niveau 0 — Surface" },
  { niveau: 1, generic: "Niveau I — Couche intermédiaire" },
  { niveau: 2, generic: "Niveau II — Strate profonde" },
];

function renderStrateIndicator(page) {
  return STRATE_SCALE.map((band) => {
    const active = band.niveau === page.strate.niveau;
    const label = active ? page.strate.label : band.generic;
    const epoque = active ? `<span class="strate__epoque">${page.strate.epoque}</span>` : "";
    return `<div class="strate__band${active ? " strate__band--active" : ""}">
      <span class="strate__label">${label}</span>${epoque}
    </div>`;
  }).join("\n    ");
}

function renderChildrenCards(page) {
  if (!page.children) return "";
  return page.children
    .map((childId, i) => {
      const child = pages[childId];
      const romanIndex = ["Couche I", "Couche II", "Couche III"][i] || `Couche ${i + 1}`;
      return `<article class="couche-card">
      <p class="couche-card__index">${romanIndex} — ${child.strate.epoque}</p>
      <h3><a href="${urlFor(childId)}">${child.title}</a></h3>
      <p>${child.metaDescription}</p>
      <a class="card-link" href="${urlFor(childId)}">Explorer &rarr;</a>
    </article>`;
    })
    .join("\n    ");
}

function renderSiblingLinks(page) {
  if (!page.siblings) return "";
  return page.siblings
    .map((sibId) => {
      const sib = pages[sibId];
      return `<li><a href="${urlFor(sibId)}">${sib.title}</a></li>`;
    })
    .join("\n          ");
}

function schemaFor(pageId, page) {
  const base = {
    "@context": "https://schema.org",
    "@type": page.schemaType,
    name: page.title,
    description: page.metaDescription,
    url: `${site.baseUrl}${urlFor(pageId)}`,
  };
  if (page.schemaType === "HistoricSite") {
    base.additionalType = "https://schema.org/LandmarksOrHistoricalBuildings";
  }
  return JSON.stringify(base, null, 2);
}

/* ---------------------------------------------------------------------- *
 * Rendu d'un template : remplacement simple de placeholders {{clé}}
 * ---------------------------------------------------------------------- */
function render(templateStr, vars) {
  return templateStr.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Placeholder manquant : ${key}`);
    return vars[key];
  });
}

/* ---------------------------------------------------------------------- *
 * Construction de chaque page
 * ---------------------------------------------------------------------- */
if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

let built = 0;

for (const [pageId, page] of Object.entries(pages)) {
  const mdPath = path.join(CONTENT_DIR, page.contentFile);
  const md = fs.readFileSync(mdPath, "utf8");
  const contentHtml = markdownToHtml(md);
  const firstParagraphMatch = contentHtml.match(/<p>(.+?)<\/p>/);
  const lede = firstParagraphMatch
    ? firstParagraphMatch[1].replace(/<[^>]+>/g, "").split(". ").slice(0, 1).join(". ") + "."
    : "";

  const commonVars = {
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    canonicalUrl: `${site.baseUrl}${urlFor(pageId)}`,
    ogImage: `${site.baseUrl}${site.defaultOgImage}`,
    twitterHandle: site.twitterHandle,
    schemaJson: schemaFor(pageId, page),
    title: page.title,
    lede,
    contentHtml,
  };

  let html;

  if (page.type === "mere") {
    html = render(templates.mere, {
      ...commonVars,
      childrenCards: renderChildrenCards(page),
    });
  } else if (page.type === "fille") {
    const parent = pages[page.parent];
    html = render(templates.fille, {
      ...commonVars,
      parentUrl: urlFor(page.parent),
      parentTitle: parent.title,
      childrenCards: renderChildrenCards(page),
      strateIndicator: renderStrateIndicator(page),
    });
  } else if (page.type === "soeur") {
    const parent = pages[page.parent];
    html = render(templates.soeur, {
      ...commonVars,
      parentUrl: urlFor(page.parent),
      parentTitle: parent.title,
      siblingLinks: renderSiblingLinks(page),
      strateIndicator: renderStrateIndicator(page),
    });
  }

  const outPath =
    page.type === "mere"
      ? path.join(DIST_DIR, "index.html")
      : path.join(DIST_DIR, `${page.slug}.html`);

  fs.writeFileSync(outPath, html, "utf8");
  built++;
  console.log(`✓ ${pageId} → ${path.relative(ROOT, outPath)}`);
}

// Copie des assets statiques
fs.mkdirSync(path.join(DIST_DIR, "assets", "css"), { recursive: true });
fs.copyFileSync(
  path.join(ROOT, "assets", "css", "style.css"),
  path.join(DIST_DIR, "assets", "css", "style.css")
);

// Fichiers SEO générés à partir de la même source de vérité que les pages.
const sitemapUrls = Object.entries(pages)
  .map(([pageId]) => `  <url><loc>${site.baseUrl}${urlFor(pageId)}</loc></url>`)
  .join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`;

fs.writeFileSync(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf8");
fs.writeFileSync(path.join(DIST_DIR, "robots.txt"), robots, "utf8");

console.log(`\n${built} pages générées dans /dist.`);
console.log("✓ sitemap.xml et robots.txt générés.");
