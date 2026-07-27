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

/* ---------------------------------------------------------------------- *
 * Sécurité : Échappement HTML (Protection XSS) en O(N)
 * ---------------------------------------------------------------------- */
const htmlEntities = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

function escapeHTML(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[&<>"']/g, char => htmlEntities[char]);
}

/* ---------------------------------------------------------------------- *
 * Mini-parseur Markdown (paragraphes, listes, gras, italique)
 * Volontairement minimal : pas de dépendance externe (contrainte "0 €").
 * Sécurisé contre ReDoS avec des RegEx strictes
 * ---------------------------------------------------------------------- */
function inline(text) {
  // Remplacement sans backtracking exponentiel (ReDoS safe)
  return text
    // Images: ![alt](url) -> Transformées en structures sémantiques natives O(N)
    .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<figure><img src="$2" alt="$1" loading="lazy" decoding="async"><figcaption>$1</figcaption></figure>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
}

function markdownToHtml(md) {
  // Split optimisé sans \s* qui peut causer des ralentissements sur de longues chaînes
  const blocks = md.trim().split(/(?:\r?\n){2,}/);
  return blocks
    .map((block) => {
      const lines = block.split(/\r?\n/).map((l) => l.trim());

      const isList = lines.every((l) => l.startsWith("- "));
      if (isList) {
        const items = lines.map((l) => `<li>${inline(escapeHTML(l.slice(2)))}</li>`).join("\n    ");
        return `<ul>\n    ${items}\n  </ul>`;
      }

      const isBlockquote = lines.every((l) => l.startsWith("> "));
      if (isBlockquote) {
        const content = lines.map((l) => inline(escapeHTML(l.slice(2)))).join("<br>");
        return `<blockquote>${content}</blockquote>`;
      }

      return `<p>${inline(escapeHTML(lines.join(" ")))}</p>`;
    })
    .join("\n\n  ");
}

/* ---------------------------------------------------------------------- *
 * Résolution des URLs et gabarit "strate" (élément signature)
 * ---------------------------------------------------------------------- */
function urlFor(pageId, pages) {
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

function renderChildrenCards(page, pages) {
  if (!page.children) return "";
  return page.children
    .map((childId, i) => {
      const child = pages[childId];
      const romanIndex = ["Couche I", "Couche II", "Couche III"][i] || `Couche ${i + 1}`;
      return `<article class="couche-card">
      <p class="couche-card__index">${romanIndex} — ${child.strate.epoque}</p>
      <h3><a href="${urlFor(childId, pages)}">${child.title}</a></h3>
      <p>${child.metaDescription}</p>
      <a class="card-link" href="${urlFor(childId, pages)}">Explorer &rarr;</a>
    </article>`;
    })
    .join("\n    ");
}

function renderSiblingLinks(page, pages) {
  if (!page.siblings) return "";
  return page.siblings
    .map((sibId) => {
      const sib = pages[sibId];
      return `<li><a href="${urlFor(sibId, pages)}">${sib.title}</a></li>`;
    })
    .join("\n          ");
}

function schemaFor(pageId, page, site) {
  const base = {
    "@context": "https://schema.org",
    "@type": page.schemaType,
    name: page.title,
    description: page.metaDescription,
    url: `${site.baseUrl}${urlFor(pageId, { [pageId]: page })}`,
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
    // Le HTML généré ou les chaînes déjà construites (childrenCards, etc.) ne sont pas échappées ici,
    // car cela échapperait les balises HTML. Les données sensibles ont été échappées en amont.
    return vars[key];
  });
}

/* ---------------------------------------------------------------------- *
 * Construction de chaque page (Exécution Asynchrone / Concurrentielle)
 * ---------------------------------------------------------------------- */
async function buildSite() {
  const fsPromises = fs.promises;

  if (!fs.existsSync(DIST_DIR)) await fsPromises.mkdir(DIST_DIR, { recursive: true });

  const mapData = await fsPromises.readFile(DATA_FILE, "utf8");
  const map = JSON.parse(mapData);
  const { site, pages } = map;

  const [tplMere, tplFille, tplSoeur] = await Promise.all([
    fsPromises.readFile(path.join(TEMPLATES_DIR, "layout-mere.html"), "utf8"),
    fsPromises.readFile(path.join(TEMPLATES_DIR, "layout-fille.html"), "utf8"),
    fsPromises.readFile(path.join(TEMPLATES_DIR, "layout-soeur.html"), "utf8"),
  ]);

  const templates = { mere: tplMere, fille: tplFille, soeur: tplSoeur };
  let built = 0;

  // Lancement de la génération des pages en parallèle
  const pagePromises = Object.entries(pages).map(async ([pageId, page]) => {
    const mdPath = path.join(CONTENT_DIR, page.contentFile);
    const md = await fsPromises.readFile(mdPath, "utf8");
    const contentHtml = markdownToHtml(md);
    const firstParagraphMatch = contentHtml.match(/<p>(.+?)<\/p>/);
    const lede = firstParagraphMatch
      ? firstParagraphMatch[1].replace(/<[^>]+>/g, "").split(". ").slice(0, 1).join(". ") + "."
      : "";

    const commonVars = {
      metaTitle: escapeHTML(page.metaTitle),
      metaDescription: escapeHTML(page.metaDescription),
      canonicalUrl: `${site.baseUrl}${urlFor(pageId, pages)}`,
      ogImage: `${site.baseUrl}${site.defaultOgImage}`,
      twitterHandle: escapeHTML(site.twitterHandle),
      schemaJson: schemaFor(pageId, page, site), // JSON généré, pas besoin d'échappement HTML ici
      title: escapeHTML(page.title),
      lede,
      contentHtml,
    };

    let html;

    if (page.type === "mere") {
      html = render(templates.mere, {
        ...commonVars,
        childrenCards: renderChildrenCards(page, pages),
      });
    } else if (page.type === "fille") {
      const parent = pages[page.parent];
      html = render(templates.fille, {
        ...commonVars,
        parentUrl: urlFor(page.parent, pages),
        parentTitle: escapeHTML(parent.title),
        childrenCards: renderChildrenCards(page, pages),
        strateIndicator: renderStrateIndicator(page),
      });
    } else if (page.type === "soeur") {
      const parent = pages[page.parent];
      html = render(templates.soeur, {
        ...commonVars,
        parentUrl: urlFor(page.parent, pages),
        parentTitle: escapeHTML(parent.title),
        siblingLinks: renderSiblingLinks(page, pages),
        strateIndicator: renderStrateIndicator(page),
      });
    }

    const outPath =
      page.type === "mere"
        ? path.join(DIST_DIR, "index.html")
        : path.join(DIST_DIR, `${page.slug}.html`);

    await fsPromises.writeFile(outPath, html, "utf8");
    console.log(`✓ ${pageId} → ${path.relative(ROOT, outPath)}`);
    return true;
  });

  const results = await Promise.all(pagePromises);
  built = results.length;

  // Copie des assets statiques
  await fsPromises.mkdir(path.join(DIST_DIR, "assets", "css"), { recursive: true });
  await fsPromises.copyFile(
    path.join(ROOT, "assets", "css", "style.css"),
    path.join(DIST_DIR, "assets", "css", "style.css")
  );

  // Fichiers SEO
  const sitemapUrls = Object.entries(pages)
    .map(([pageId]) => `  <url><loc>${site.baseUrl}${urlFor(pageId, pages)}</loc></url>`)
    .join("\n");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`;
  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`;

  await Promise.all([
    fsPromises.writeFile(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf8"),
    fsPromises.writeFile(path.join(DIST_DIR, "robots.txt"), robots, "utf8")
  ]);

  console.log(`\n${built} pages générées dans /dist.`);
  console.log("✓ sitemap.xml et robots.txt générés.");
}

buildSite().catch(err => {
  console.error("Erreur lors de la génération du site:", err);
  process.exit(1);
});
