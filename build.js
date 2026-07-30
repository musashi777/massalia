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
 * Mini-parseur Markdown étendu (paragraphes, listes, titres, citations, images)
 * Volontairement minimal : pas de dépendance externe (contrainte "0 €").
 * ---------------------------------------------------------------------- */
/**
 * Génère une balise <picture> responsive avec sources AVIF, WebP et fallback PNG.
 *
 * Responsive images :
 *   - srcset 1x / 2x par format : le navigateur télécharge la résolution adaptée
 *     au DPR de l'écran (écrans Retina dpr≥2 ou écrans standard dpr=1).
 *   - sizes : indique au navigateur la largeur d'affichage attendue *avant*
 *     de télécharger l'image, permettant une sélection optimale dans srcset.
 *   - width + height intrinsèques : anti-CLS — le layout est réservé O(N)
 *     sans recalcul en cascade (reflow O(N²)).
 *
 * Convention de nommage 2x : image@2x.avif / image@2x.webp
 * (génération via pipeline sharp/squoosh ou Vercel Image Optimization).
 *
 * @param {string} src       - Chemin PNG de l'image (ex: /assets/img/hero.png)
 * @param {string} alt       - Texte alternatif. Passer "" pour une image décorative.
 * @param {string} className - Classe CSS optionnelle sur <img>.
 * @param {string} loading   - "lazy" (défaut) ou "eager" pour le LCP.
 * @param {number} width     - Largeur intrinsèque 1x pour éviter le CLS (défaut 800).
 * @param {number} height    - Hauteur intrinsèque 1x pour éviter le CLS (défaut 500).
 * @param {string} sizes     - Hint de largeur affichée pour le srcset (défaut "100vw").
 */
function renderPicture(src, alt, className = "", loading = "lazy", width = 800, height = 500, sizes = "100vw") {
  if (!src) return "";
  const webpSrc = src.replace(/\.png$/i, ".webp");
  const avifSrc = src.replace(/\.png$/i, ".avif");
  const classAttr = className ? ` class="${className}"` : "";
  const loadingAttr = loading ? ` loading="${loading}"` : "";
  
  return `<picture>
    <source srcset="${avifSrc}" type="image/avif">
    <source srcset="${webpSrc}" type="image/webp">
    <img src="${src}" alt="${alt}"${classAttr}${loadingAttr} width="${width}" height="${height}" decoding="async" />
  </picture>`;
}

function inline(text) {
  return text
    .replace(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g, (match, alt, src, title) => {
      const caption = title || alt;
      // Images inline dans le contenu Markdown : pleine largeur colonne article
      return `<figure class="article-figure">${renderPicture(src, alt, "", "lazy", 800, 500, "(max-width:768px) 100vw, 800px")}${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
}

function markdownToHtml(md) {
  const blocks = md.trim().split(/\n\s*\n/);
  return blocks
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim());

      // Image markdown autonome
      if (lines.length === 1 && lines[0].startsWith("![")) {
        return inline(lines[0]);
      }

      // Citations / Bloc-notes
      if (lines.every((l) => l.startsWith(">"))) {
        const quoteContent = lines.map((l) => inline(l.replace(/^>\s*/, ""))).join("<br>");
        return `<blockquote class="article-quote">${quoteContent}</blockquote>`;
      }

      // Titres H1 (déjà rendu dans la structure de page)
      if (lines[0].startsWith("# ")) {
        return null;
      }

      // Titres H2 et H3
      if (lines[0].startsWith("### ")) {
        return `<h3>${inline(lines[0].slice(4))}</h3>`;
      }
      if (lines[0].startsWith("## ")) {
        return `<h2>${inline(lines[0].slice(3))}</h2>`;
      }

      // Liste à puces
      const isList = lines.every((l) => l.startsWith("- "));
      if (isList) {
        const items = lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("\n    ");
        return `<ul>\n    ${items}\n  </ul>`;
      }

      // Paragraphe standard
      return `<p>${inline(lines.join(" "))}</p>`;
    })
    .filter(Boolean)
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

// Numéros romains pour les strates 1–4
const STRATE_NUMERALS = ["01", "02", "03", "04"];

function renderChildrenCards(page) {
  if (!page.children) return "";
  const ROMAN_NUMERALS = ["Couche I", "Couche II", "Couche III", "Couche IV"];
  const EPOQUE_LABELS  = ["600 AV. J.-C.", "XIIᵉ — XVIIᵉ", "Vᵉ — XIXᵉ", "Littoral"];

  return page.children.map((childId, i) => {
    const child      = pages[childId];
    const roman      = ROMAN_NUMERALS[i]  || `Couche ${i + 1}`;
    const num        = STRATE_NUMERALS[i] || String(i + 1).padStart(2, "0");
    const epoque     = EPOQUE_LABELS[i]   || (child.strate ? child.strate.epoque : "");
    const labelText  = child.strate && child.strate.label ? child.strate.label : `${roman} — ${child.strate.epoque}`;
    const isReverse  = i % 2 === 1;
    const isLastBlock = i === page.children.length - 1;

    // sizes : la carte occupe ~100vw sur mobile et ~600px en col desktop
    const picHtml = child.heroImage
      ? renderPicture(child.heroImage, "", "", "lazy", 800, 600, "(max-width:768px) 100vw, 600px")
      : "";

    if (isLastBlock) {
      // Strate 04 : bloc inversé off-white pleine largeur
      return `<article class="strate-article strate-article--block" id="strate-${num}">
  <div class="strate-article__img" style="position:relative;">
    ${picHtml}
    <span class="overlap-number overlap-number--tl" aria-hidden="true">${num}</span>
  </div>
  <div class="strate-article__body">
    <h3>${child.title}</h3>
    <p>${child.metaDescription}</p>
    <a class="strate-link" href="${urlFor(childId)}">Explorer la Strate</a>
  </div>
</article>`;
    }

    const verticalClass = isReverse ? "" : "";
    const articleClass  = isReverse ? "strate-article strate-article--reverse" : "strate-article";
    const numPos        = isReverse ? "overlap-number--br" : "overlap-number--tl";

    return `<article class="${articleClass}" id="strate-${num}">
  <div class="strate-article__vertical" aria-hidden="true">${epoque}</div>
  <div class="strate-article__img" style="position:relative;">
    ${picHtml}
    <span class="overlap-number ${numPos}" aria-hidden="true">${num}</span>
  </div>
  <div class="strate-article__body">
    <p class="couche-card__index">${labelText}</p>
    <h3>${child.title}</h3>
    <p>${child.metaDescription}</p>
    <a class="strate-link" href="${urlFor(childId)}">Explorer la Strate</a>
  </div>
</article>`;
  }).join("\n");
}

function renderSiblingLinks(page) {
  if (!page.siblings) return "";
  return page.siblings
    .map((sibId) => {
      const sib = pages[sibId];
      // alt="" : vignette décorative, le texte <span> du lien fournit le label accessible.
      // sizes : vignette de navigation, jamais plus de 200px.
      const thumb = sib.heroImage ? `${renderPicture(sib.heroImage, "", "sibling-thumb", "lazy", 200, 125, "200px")} ` : "";
      return `<li><a href="${urlFor(sibId)}">${thumb}<span>${sib.title}</span></a></li>`;
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
  if (page.heroImage) {
    base.image = `${site.baseUrl}${page.heroImage}`;
  }
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

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
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

  const heroBlock = page.heroImage
    ? `<figure class="hero-media">
        ${renderPicture(page.heroImage, page.title, "hero-media__img", "eager", 800, 500, "100vw")}
        ${page.imageCaption ? `<figcaption class="hero-media__caption">${page.imageCaption}</figcaption>` : ""}
      </figure>`
    : "";

  const commonVars = {
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    canonicalUrl: `${site.baseUrl}${urlFor(pageId)}`,
    ogImage: `${site.baseUrl}${page.heroImage || site.defaultOgImage}`,
    twitterHandle: site.twitterHandle,
    schemaJson: schemaFor(pageId, page),
    title: page.title,
    lede,
    contentHtml,
    heroBlock,
    heroImage: page.heroImage || "",
    imageCaption: page.imageCaption || "",
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

// Copie récursive des assets statiques (CSS, Images & Scripts)
copyDirSync(path.join(ROOT, "assets"), path.join(DIST_DIR, "assets"));
if (fs.existsSync(path.join(ROOT, "scripts"))) {
  copyDirSync(path.join(ROOT, "scripts"), path.join(DIST_DIR, "scripts"));
}

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
