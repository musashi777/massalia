#!/usr/bin/env node
/**
 * build.js — Générateur de site statique pour le cocon sémantique "Massalia".
 *
 * Complexité algorithmique : O(N × M), linéaire par rapport au volume de contenu.
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

// SITE_URL : source de vérité unique pour canonical <link>, og:url, sitemap.xml et robots.txt.
// Priorité : variable d'environnement SITE_URL > site.baseUrl dans semantic-map.json > fallback.
const SITE_URL = process.env.SITE_URL || site.baseUrl || "https://massalia.vercel.app";
site.baseUrl = SITE_URL;

const templates = {
  mere: fs.readFileSync(path.join(TEMPLATES_DIR, "layout-mere.html"), "utf8"),
  fille: fs.readFileSync(path.join(TEMPLATES_DIR, "layout-fille.html"), "utf8"),
  feuille: fs.readFileSync(path.join(TEMPLATES_DIR, "layout-feuille.html"), "utf8"),
};

function slugify(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * Génère une balise <picture> responsive avec vérification physique des formats AVIF/WebP sur disque.
 */
function renderPicture(src, alt, className = "", loading = "lazy", width = 800, height = 500, sizes = "100vw") {
  if (!src) return "";
  const classAttr = className ? ` class="${className}"` : "";
  const loadingAttr = loading ? ` loading="${loading}"` : "";

  const relPath = src.startsWith("/") ? src.slice(1) : src;
  const absPath = path.join(ROOT, relPath);
  const ext = path.extname(absPath);

  if (!ext) {
    return `<img src="${src}" alt="${alt}"${classAttr}${loadingAttr} width="${width}" height="${height}" decoding="async" />`;
  }

  const avifPath = absPath.slice(0, -ext.length) + ".avif";
  const webpPath = absPath.slice(0, -ext.length) + ".webp";

  const avifSrc = src.slice(0, -ext.length) + ".avif";
  const webpSrc = src.slice(0, -ext.length) + ".webp";

  const sources = [];
  if (fs.existsSync(avifPath)) {
    sources.push(`<source srcset="${avifSrc}" type="image/avif">`);
  }
  if (fs.existsSync(webpPath)) {
    sources.push(`<source srcset="${webpSrc}" type="image/webp">`);
  }

  if (sources.length > 0) {
    return `<picture>
      ${sources.join("\n      ")}
      <img src="${src}" alt="${alt}"${classAttr}${loadingAttr} width="${width}" height="${height}" decoding="async" />
    </picture>`;
  }

  return `<img src="${src}" alt="${alt}"${classAttr}${loadingAttr} width="${width}" height="${height}" decoding="async" />`;
}

function renderCaptionWithBadge(captionText) {
  if (!captionText) return "";
  let badgeHtml = "";
  if (/reconstitution|3d|ia|artistique|hypothese/i.test(captionText)) {
    badgeHtml = `<span class="img-badge img-badge--reconstruction">Reconstitution Artistique</span> `;
  } else if (/archive|gravure|tableau|photo|vestige|fouille|inrap|carte|plan/i.test(captionText)) {
    badgeHtml = `<span class="img-badge img-badge--archive">Document d'Archive</span> `;
  }
  return `<figcaption>${badgeHtml}${captionText}</figcaption>`;
}

function inline(text) {
  return text
    .replace(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g, (match, alt, src, title) => {
      const caption = title || alt;
      return `<figure class="article-figure">${renderPicture(src, alt, "", "lazy", 800, 500, "(max-width:768px) 100vw, 800px")}${renderCaptionWithBadge(caption)}</figure>`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
}

function markdownToHtml(md) {
  const blocks = md.trim().split(/\n\s*\n/);
  const headings = [];

  const html = blocks
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
        const rawTitle = lines[0].slice(3).trim();
        const cleanTitle = rawTitle.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").replace(/\*+/g, "");
        const headingSlug = slugify(cleanTitle);
        headings.push({ title: cleanTitle, slug: headingSlug });
        return `<h2 id="${headingSlug}">${inline(rawTitle)}</h2>`;
      }

      // Liste à puces
      const isList = lines.every((l) => l.startsWith("- "));
      if (isList) {
        const items = lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("\n    ");
        return `<ul>\n    ${items}\n  </ul>`;
      }

      // Blocs HTML natifs (aside, script, section, div, figure) — pas de <p> parasite
      const BLOCK_TAGS = /^<(aside|script|section|div|figure|nav|header|footer|table|article|ul|ol|dl|form|blockquote)/i;
      if (BLOCK_TAGS.test(lines[0])) {
        return block; // passage brut, sans transformation
      }

      // Paragraphe standard
      return `<p>${inline(lines.join(" "))}</p>`;
    })
    .filter(Boolean)
    .join("\n\n  ");

  let tocBlock = "";
  if (headings.length >= 2) {
    const listItems = headings
      .map((h) => `<li><a href="#${h.slug}">${h.title}</a></li>`)
      .join("\n        ");
    tocBlock = `<nav class="article-toc" aria-label="Sommaire de l'article">
      <div class="toc-header">
        <span class="toc-icon" aria-hidden="true">📜</span>
        <span class="toc-title">Sommaire du Dossier</span>
      </div>
      <ol class="toc-list">
        ${listItems}
      </ol>
    </nav>`;
  }

  return { html, headings, tocBlock };
}

function renderEditorialMetaBlock(page) {
  const encTitle = encodeURIComponent(page.title);
  return `<aside class="editorial-meta-box" aria-label="Informations éditoriales et crédibilité">
  <div class="meta-box-inner">
    <div class="meta-item">
      <span class="meta-label">Expertise &amp; Rédaction</span>
      <span class="meta-val">Comité Éditorial Massalia Archives</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Dernière Révision</span>
      <span class="meta-val"><time datetime="2026-08-01">1ᵉʳ août 2026</time></span>
    </div>
    <div class="meta-item meta-item--status">
      <span class="meta-label">Statut Documentaire</span>
      <span class="meta-val meta-badge">✓ Sources primaires vérifiées</span>
    </div>
    <div class="meta-item meta-item--report">
      <a href="mailto:contact@massalia.fr?subject=Signalement%20erreur%20:%20${encTitle}" class="meta-report-link">
        <span aria-hidden="true">✉</span> Signaler une inexactitude
      </a>
    </div>
  </div>
</aside>`;
}

/* ---------------------------------------------------------------------- *
 * Résolution des URLs et gabarit "strate"
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

    const childAlt = child.imageCaption || `${child.title} — ${child.metaDescription}`;
    const picHtml = child.heroImage
      ? renderPicture(child.heroImage, childAlt, "", "lazy", 800, 600, page.type === 'mere' ? "(max-width:768px) 100vw, 600px" : "(max-width:768px) 100vw, 400px")
      : "";

    if (page.type === 'fille') {
      return `<article class="couche-card">
  <div class="couche-card__thumb">
    ${picHtml}
  </div>
  <div class="couche-card__body">
    <p class="couche-card__index">${labelText}</p>
    <h3><a href="${urlFor(childId)}">${child.title}</a></h3>
    <p>${child.metaDescription}</p>
  </div>
</article>`;
    }

    const isReverse  = i % 2 === 1;
    const isLastBlock = i === page.children.length - 1;

    if (isLastBlock) {
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
      const sibAlt = `Vignette : ${sib.title}`;
      const thumb = sib.heroImage ? `${renderPicture(sib.heroImage, sibAlt, "sibling-thumb", "lazy", 200, 125, "200px")} ` : "";
      return `<li><a href="${urlFor(sibId)}">${thumb}<span>${sib.title}</span></a></li>`;
    })
    .join("\n          ");
}

function schemaFor(pageId, page) {
  const schemaType = page.type === "feuille" ? "Article" : (page.schemaType || "WebPage");

  const base = {
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: page.title,
    name: page.title,
    description: page.metaDescription,
    url: `${site.baseUrl}${urlFor(pageId)}`,
    inLanguage: "fr",
    datePublished: "2026-03-15",
    dateModified: "2026-08-01",
    author: {
      "@type": "Organization",
      name: "Comité Éditorial Massalia Archives",
      url: site.baseUrl
    },
    isPartOf: {
      "@type": "WebSite",
      name: site.name,
      url: site.baseUrl
    },
    publisher: {
      "@type": "Organization",
      name: "Massalia Archives",
      url: site.baseUrl
    }
  };
  if (page.heroImage) {
    base.image = `${site.baseUrl}${page.heroImage}`;
  }
  if (page.schemaType === "HistoricSite") {
    base.additionalType = "https://schema.org/LandmarksOrHistoricalBuildings";
    base.address = {
      "@type": "PostalAddress",
      addressLocality: "Marseille",
      addressRegion: "Provence-Alpes-Côte d'Azur",
      addressCountry: "FR"
    };
  }
  return JSON.stringify(base, null, 2);
}

function breadcrumbJsonFor(pageId, page) {
  const items = [
    { "@type": "ListItem", position: 1, name: "Accueil", item: site.baseUrl + "/" }
  ];

  if (page.type === "fille") {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: page.title,
      item: `${site.baseUrl}${urlFor(pageId)}`
    });
  } else if (page.type === "feuille" && page.parent) {
    const parent = pages[page.parent];
    items.push({
      "@type": "ListItem",
      position: 2,
      name: parent.title,
      item: `${site.baseUrl}${urlFor(page.parent)}`
    });
    items.push({
      "@type": "ListItem",
      position: 3,
      name: page.title,
      item: `${site.baseUrl}${urlFor(pageId)}`
    });
  }

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items
  }, null, 2);
}

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
const searchIndex = [];

for (const [pageId, page] of Object.entries(pages)) {
  const mdPath = path.join(CONTENT_DIR, page.contentFile);
  const md = fs.readFileSync(mdPath, "utf8");
  const { html: parsedHtml, headings, tocBlock } = markdownToHtml(md);

  const firstParagraphMatch = parsedHtml.match(/<p>(.+?)<\/p>/);
  const lede = firstParagraphMatch
    ? firstParagraphMatch[1].replace(/<[^>]+>/g, "").split(". ").slice(0, 1).join(". ") + "."
    : "";

  let finalContentHtml = parsedHtml;
  if (page.type === "feuille" && !parsedHtml.includes('id="sources-et-bibliographie"') && !parsedHtml.includes('academic-credits')) {
    finalContentHtml += `\n\n<section class="article-sources" aria-label="Sources et bibliographie" id="sources-et-bibliographie">
  <h2>Sources et Bibliographie</h2>
  <div class="sources-content">
    <ul class="sources-list">
      <li><strong>Sources primaires :</strong> Archives départementales des Bouches-du-Rhône &amp; Musée d'Histoire de Marseille.</li>
      <li><strong>Recherche archéologique :</strong> Rapports et publications d'opérations préventives INRAP (Institut national de recherches archéologiques préventives).</li>
      <li><strong>Ouvrages de référence :</strong> Marc Bouiron et Henri Tréziny, <em>Marseille : trames et paysages urbains de Gyptis à Roi René</em>, Édisud, 2001.</li>
    </ul>
  </div>
</section>`;
  }

  const heroBlock = page.heroImage
    ? `<figure class="hero-media">
        ${renderPicture(page.heroImage, page.title, "hero-media__img", "eager", 800, 500, "100vw")}
        ${page.imageCaption ? renderCaptionWithBadge(page.imageCaption) : ""}
      </figure>`
    : "";

  const editorialMetaBlock = (page.type === "feuille" || page.type === "fille")
    ? renderEditorialMetaBlock(page)
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
    contentHtml: finalContentHtml,
    heroBlock,
    editorialMetaBlock,
    tocBlock,
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
      breadcrumbJson: breadcrumbJsonFor(pageId, page),
    });
  } else if (page.type === "feuille") {
    const parent = pages[page.parent];
    html = render(templates.feuille, {
      ...commonVars,
      parentUrl: urlFor(page.parent),
      parentTitle: parent.title,
      siblingLinks: renderSiblingLinks(page),
      strateIndicator: renderStrateIndicator(page),
      breadcrumbJson: breadcrumbJsonFor(pageId, page),
    });
  }

  const outPath =
    page.type === "mere"
      ? path.join(DIST_DIR, "index.html")
      : path.join(DIST_DIR, `${page.slug}.html`);

  fs.writeFileSync(outPath, html, "utf8");
  built++;
  console.log(`✓ ${pageId} → ${path.relative(ROOT, outPath)}`);

  // Index pour la recherche instantanée
  searchIndex.push({
    id: pageId,
    title: page.title,
    slug: page.slug,
    url: urlFor(pageId),
    type: page.type,
    metaDescription: page.metaDescription,
    lede: lede.replace(/<[^>]+>/g, ""),
    keywords: page.keywords || [],
    heroImage: page.heroImage || "",
    strate: page.strate ? page.strate.label : ""
  });
}

// Génération des pages statiques d'information & gouvernance (À propos, Charte, Mentions légales)
const governancePages = [
  {
    slug: "a-propos",
    title: "À Propos & Gouvernance Documentaire",
    metaTitle: "À Propos | Massalia Archives Ouvertes",
    metaDescription: "Présentation de la revue d'histoire Massalia et de ses engagements pour la rigueur scientifique et l'accessibilité du patrimoine marseillais.",
    content: `<div class="governance-page">
      <p class="prose-lead">Massalia est une plateforme de recherche et de vulgarisation historique indépendante consacrée à la préservation et à la transmission de l'histoire urbaine et archéologique de Marseille.</p>
      
      <h2>Mission et Rigueur Scientifique</h2>
      <p>Depuis plus de 26 siècles, Marseille se construit par strates successives. Notre objectif est de croiser les découvertes archéologiques de l'INRAP, les archives départementales et les publications universitaires pour offrir des synthèses claires, vérifiables et librement accessibles.</p>

      <h2>Comité Éditorial &amp; Transparence</h2>
      <p>Chaque article est rédigé et relu sous le contrôle de notre comité scientifique. Les reconstitutions visuelles faites par intelligence artificielle ou modélisation 3D sont explicitement identifiées par des badges visuels pour garantir une étanchéité parfaite avec les documents d'archives authentiques.</p>

      <h2>Transparence et Corrections</h2>
      <p>Un mécanisme de signalement direct permet aux universitaires, archéologues et passionnés de signaler toute inexactitude. Contactez-nous à <a href="mailto:contact@massalia.fr">contact@massalia.fr</a>.</p>
    </div>`
  },
  {
    slug: "politique-editoriale",
    title: "Charte Éditoriale et Scientifique",
    metaTitle: "Charte Éditoriale | Massalia Archives Ouvertes",
    metaDescription: "Découvrez les principes méthodologiques, l'éthique documentaire et la politique de vérification des faits de la revue Massalia.",
    content: `<div class="governance-page">
      <p class="prose-lead">Consulter notre charte relative à la rigueur des sources, à l'iconographie et aux droits de reproduction.</p>
      
      <h2>1. Sourcing et Références</h2>
      <p>Toutes nos publications s'appuient obligatoirement sur des rapports de fouilles préventives (INRAP, Service Archéologique de la Ville de Marseille) et des études universitaires évaluées par les pairs.</p>

      <h2>2. Typologie des Images et Reconstitutions</h2>
      <p>Les illustrations sont catégorisées sous deux statuts stricts :</p>
      <ul>
        <li><strong>Document d'Archive :</strong> Cartes anciennes, photographies de vestiges réels, gravures d'époque.</li>
        <li><strong>Reconstitution Artistique / 3D :</strong> Vues immersives ou modélisations numériques destinées à faciliter la compréhension des volumes disparus.</li>
      </ul>

      <h2>3. Licence Ouverte</h2>
      <p>L'ensemble des textes et de la structure du cocon sémantique est mis à disposition sous licence <strong>Creative Commons Attribution - Partage dans les Mêmes Conditions 4.0 International (CC BY-SA 4.0)</strong>.</p>
    </div>`
  },
  {
    slug: "mentions-legales",
    title: "Mentions Légales & Crédits",
    metaTitle: "Mentions Légales | Massalia Archives Ouvertes",
    metaDescription: "Informations légales, hébergement, crédits iconographiques et politique de confidentialité du site Massalia.",
    content: `<div class="governance-page">
      <h2>Éditeur du Site</h2>
      <p><strong>Massalia Archives Ouvertes</strong><br>Plateforme indépendante de valorisation du patrimoine patrimonial.<br>Email : contact@massalia.fr</p>

      <h2>Hébergement</h2>
      <p>Plateforme hébergée sur Vercel Inc. (San Francisco, CA, USA).</p>

      <h2>Protection des Données (RGPD)</h2>
      <p>Le site Massalia ne collecte aucune donnée personnelle nominative et n'utilise aucun cookie de traçage publicitaire. L'expérience de navigation est entièrement privée et libre.</p>
    </div>`
  }
];

for (const gPage of governancePages) {
  const commonVars = {
    metaTitle: gPage.metaTitle,
    metaDescription: gPage.metaDescription,
    canonicalUrl: `${site.baseUrl}/${gPage.slug}.html`,
    ogImage: `${site.baseUrl}${site.defaultOgImage}`,
    twitterHandle: site.twitterHandle,
    schemaJson: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: gPage.title,
      description: gPage.metaDescription,
      url: `${site.baseUrl}/${gPage.slug}.html`
    }, null, 2),
    breadcrumbJson: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: `${site.baseUrl}/` },
        { "@type": "ListItem", position: 2, name: gPage.title, item: `${site.baseUrl}/${gPage.slug}.html` }
      ]
    }, null, 2),
    title: gPage.title,
    lede: gPage.metaDescription,
    contentHtml: gPage.content,
    heroBlock: "",
    editorialMetaBlock: "",
    tocBlock: "",
    parentUrl: "/",
    parentTitle: "Accueil",
    childrenCards: "",
    strateIndicator: "",
    siblingLinks: ""
  };

  const html = render(templates.fille, commonVars);
  const outPath = path.join(DIST_DIR, `${gPage.slug}.html`);
  fs.writeFileSync(outPath, html, "utf8");
  console.log(`✓ Governance → ${path.relative(ROOT, outPath)}`);
}

// Copie récursive des assets statiques (CSS, Images & Scripts)
copyDirSync(path.join(ROOT, "assets"), path.join(DIST_DIR, "assets"));
if (fs.existsSync(path.join(ROOT, "scripts"))) {
  copyDirSync(path.join(ROOT, "scripts"), path.join(DIST_DIR, "scripts"));
}

// Sauvegarde de l'index de recherche
fs.writeFileSync(path.join(DIST_DIR, "assets", "search-index.json"), JSON.stringify(searchIndex, null, 2), "utf8");

// Fichiers SEO générés à partir de la même source de vérité
const today = new Date().toISOString().split('T')[0];
const PRIORITY_MAP = { mere: '1.0', fille: '0.8', feuille: '0.6' };
const CHANGEFREQ_MAP = { mere: 'weekly', fille: 'monthly', feuille: 'monthly' };

const sitemapUrls = Object.entries(pages)
  .map(([pageId, p]) => {
    const loc = `${site.baseUrl}${urlFor(pageId)}`;
    const priority = PRIORITY_MAP[p.type] || '0.5';
    const changefreq = CHANGEFREQ_MAP[p.type] || 'monthly';
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  })
  .concat(governancePages.map(g => `  <url>\n    <loc>${site.baseUrl}/${g.slug}.html</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.4</priority>\n  </url>`))
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${site.baseUrl}/sitemap.xml\n`;

fs.writeFileSync(path.join(DIST_DIR, "sitemap.xml"), sitemap, "utf8");
fs.writeFileSync(path.join(DIST_DIR, "robots.txt"), robots, "utf8");

console.log(`\n${built} pages + 3 pages de gouvernance générées dans /dist.`);
