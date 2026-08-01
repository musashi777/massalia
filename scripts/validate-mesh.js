#!/usr/bin/env node
/**
 * validate-mesh.js — Validateur du cocon sémantique Massalia.
 *
 * Complexité algorithmique :
 *   Soit P le nombre de pages décrites dans semantic-map.json, R le nombre total
 *   de relations parent/enfants/sœurs, H la taille cumulée des fichiers HTML et
 *   L le nombre d’ancres <a> analysées.
 *   - Indexation et contrôle de la carte : O(P + R).
 *   - Lecture et analyse des HTML : O(H + L), chaque fichier et chaque ancre
 *     étant parcourus une seule fois ; les recherches dans les Map et Set sont
 *     en O(1) amorti.
 *   - Complexité totale : O(P + R + H + L), soit linéaire par rapport à la
 *     taille du cocon et des sorties générées.
 *   - Mémoire : O(P + R) pour les index et les relations autorisées ; les HTML
 *     sont traités fichier par fichier.
 *
 * Dépendances : modules Node.js natifs fs et path uniquement. Aucune dépendance
 * npm n’est requise.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MAP_FILE = path.join(ROOT, "data", "semantic-map.json");
const DIST_DIR = path.join(ROOT, "dist");
const TECHNICAL_FRAGMENT = /^#/;
const TECHNICAL_PROTOCOL = /^(?:mailto:|tel:|javascript:|data:)/i;
const ABSOLUTE_PROTOCOL = /^[a-z][a-z0-9+.-]*:/i;
const ANCHOR_HREF = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi;

function stop(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    stop(`Impossible de lire ${path.relative(ROOT, filePath)} : ${error.message}`);
  }
}

function fileForPage(page) {
  return page.type === "mere" ? "index.html" : `${page.slug}.html`;
}

function assertKnownPageId(pageId, relatedId, relation, pages, errors) {
  if (!Object.prototype.hasOwnProperty.call(pages, relatedId)) {
    errors.push(`Carte invalide : « ${pageId} » référence « ${relatedId} » dans « ${relation} », mais cette page n’existe pas.`);
  }
}

function addRelation(allowed, pageId, relatedId, relation, pages, errors) {
  assertKnownPageId(pageId, relatedId, relation, pages, errors);
  if (Object.prototype.hasOwnProperty.call(pages, relatedId)) {
    allowed.add(relatedId);
  }
}

function normalizeAnchorTarget(href, sourceFile, baseUrl) {
  const value = href.trim();

  if (!value || TECHNICAL_FRAGMENT.test(value) || TECHNICAL_PROTOCOL.test(value)) {
    return { kind: "technical" };
  }

  const baseWithoutTrailingSlash = String(baseUrl || "").replace(/\/+$/, "");
  let localValue = value;

  if (baseWithoutTrailingSlash && (value === baseWithoutTrailingSlash || value.startsWith(`${baseWithoutTrailingSlash}/`))) {
    localValue = value.slice(baseWithoutTrailingSlash.length) || "/";
  } else if (ABSOLUTE_PROTOCOL.test(value) || value.startsWith("//")) {
    return { kind: "external" };
  }

  const pathWithoutQueryOrFragment = localValue.split(/[?#]/, 1)[0];
  if (!pathWithoutQueryOrFragment) {
    return { kind: "technical" };
  }

  let normalized;
  if (pathWithoutQueryOrFragment.startsWith("/")) {
    normalized = path.posix.normalize(pathWithoutQueryOrFragment.replace(/^\/+/, ""));
  } else {
    normalized = path.posix.normalize(path.posix.join(path.posix.dirname(sourceFile), pathWithoutQueryOrFragment));
  }

  if (normalized === "." || normalized === "") {
    normalized = "index.html";
  }

  if (normalized.startsWith("../")) {
    return { kind: "outside-dist", target: normalized };
  }

  if (["a-propos.html", "politique-editoriale.html", "mentions-legales.html"].includes(normalized)) {
    return { kind: "technical" };
  }

  return { kind: "internal", target: normalized };
}

if (!fs.existsSync(MAP_FILE)) {
  stop("Fichier data/semantic-map.json introuvable.");
}

if (!fs.existsSync(DIST_DIR)) {
  stop("Répertoire dist/ introuvable. Exécutez d’abord node build.js.");
}

const semanticMap = readJson(MAP_FILE);
const pages = semanticMap.pages;
const baseUrl = semanticMap.site && semanticMap.site.baseUrl;

if (!pages || typeof pages !== "object" || Array.isArray(pages)) {
  stop("La propriété « pages » de data/semantic-map.json est invalide.");
}

const errors = [];
const pageIdByFile = new Map();
const pageByFile = new Map();
let homePageId = null;

for (const [pageId, page] of Object.entries(pages)) {
  if (!page || typeof page !== "object") {
    errors.push(`Carte invalide : définition absente ou invalide pour « ${pageId} ».`);
    continue;
  }

  if (!page.type || !page.slug) {
    errors.push(`Carte invalide : « ${pageId} » doit définir « type » et « slug ».`);
    continue;
  }

  const outputFile = fileForPage(page);
  if (pageIdByFile.has(outputFile)) {
    errors.push(`Carte invalide : « ${pageId} » et « ${pageIdByFile.get(outputFile)} » génèrent toutes deux ${outputFile}.`);
    continue;
  }

  pageIdByFile.set(outputFile, pageId);
  pageByFile.set(outputFile, page);

  if (page.type === "mere") {
    if (homePageId) {
      errors.push(`Carte invalide : plusieurs pages mères détectées (« ${homePageId} » et « ${pageId} »).`);
    }
    homePageId = pageId;
  }
}

if (!homePageId) {
  errors.push("Carte invalide : aucune page mère ne définit l’accueil global.");
}

const allowedTargetsByPage = new Map();
for (const [pageId, page] of Object.entries(pages)) {
  if (!page || typeof page !== "object" || !pageIdByFile.has(fileForPage(page))) {
    continue;
  }

  const allowed = new Set();

  // Le lien logo vers l’accueil est une navigation technique commune à tous les gabarits.
  if (homePageId) {
    allowed.add(homePageId);
  }

  // La page mère (hub/pilier) peut lier toutes les pages du cocon — c'est son rôle
  // de page-pilier dans l'architecture en cocon sémantique.
  if (page.type === "mere") {
    for (const anyPageId of Object.keys(pages)) {
      allowed.add(anyPageId);
    }
  }

  if (page.parent) {
    addRelation(allowed, pageId, page.parent, "parent", pages, errors);
  }

  for (const childId of Array.isArray(page.children) ? page.children : []) {
    addRelation(allowed, pageId, childId, "children", pages, errors);
    if (pages[childId] && pages[childId].parent !== pageId) {
      errors.push(`Carte invalide : « ${childId} » doit déclarer « ${pageId} » comme parent.`);
    }
  }

  for (const siblingId of Array.isArray(page.siblings) ? page.siblings : []) {
    addRelation(allowed, pageId, siblingId, "siblings", pages, errors);
    const sibling = pages[siblingId];
    if (sibling && sibling.parent !== page.parent) {
      errors.push(`Carte invalide : « ${pageId} » et « ${siblingId} » ne partagent pas le même parent.`);
    }
    if (sibling && (!Array.isArray(sibling.siblings) || !sibling.siblings.includes(pageId))) {
      errors.push(`Carte invalide : la relation sœur entre « ${pageId} » et « ${siblingId} » doit être réciproque.`);
    }
  }

  allowedTargetsByPage.set(pageId, allowed);
}

const generatedFiles = fs.readdirSync(DIST_DIR).filter((fileName) => fileName.endsWith(".html"));
const expectedFiles = new Set(pageIdByFile.keys());

const GOVERNANCE_FILES = new Set(["a-propos.html", "politique-editoriale.html", "mentions-legales.html"]);

for (const expectedFile of expectedFiles) {
  if (!generatedFiles.includes(expectedFile)) {
    errors.push(`Sortie manquante : dist/${expectedFile}.`);
  }
}

for (const generatedFile of generatedFiles) {
  if (GOVERNANCE_FILES.has(generatedFile)) {
    continue; // Pages de gouvernance hors cocon sémantique strict
  }
  if (!expectedFiles.has(generatedFile)) {
    errors.push(`Sortie non mappée : dist/${generatedFile} n’est pas définie dans semantic-map.json.`);
  }
}

for (const htmlFile of generatedFiles) {
  const pageId = pageIdByFile.get(htmlFile);
  if (!pageId) {
    continue;
  }

  const htmlPath = path.join(DIST_DIR, htmlFile);
  const html = fs.readFileSync(htmlPath, "utf8");
  const allowedTargets = allowedTargetsByPage.get(pageId);
  let anchorMatch;

  // SEO Phase 1 : ne valider le maillage strict que dans le <main>,
  // le <header> et le <footer> sont des navigations site-wide autorisées.
  const mainMatch = html.match(/<main[\s>][\s\S]*?<\/main>/i);
  const mainContent = mainMatch ? mainMatch[0] : html;

  while ((anchorMatch = ANCHOR_HREF.exec(mainContent)) !== null) {
    const href = anchorMatch[1] || anchorMatch[2] || anchorMatch[3] || "";
    const target = normalizeAnchorTarget(href, htmlFile, baseUrl);

    if (target.kind === "technical") {
      continue;
    }

    if (target.kind === "external") {
      errors.push(`Lien externe interdit dans dist/${htmlFile} : « ${href} ». Le cocon n’autorise que les pages définies par semantic-map.json.`);
      continue;
    }

    if (target.kind === "outside-dist") {
      errors.push(`Lien sortant de dist/ dans dist/${htmlFile} : « ${href} » résout vers « ${target.target} ».`);
      continue;
    }

    const targetPageId = pageIdByFile.get(target.target);
    if (!targetPageId) {
      errors.push(`Lien interne non mappé dans dist/${htmlFile} : « ${href} » résout vers « ${target.target} ».`);
      continue;
    }

    if (!allowedTargets.has(targetPageId)) {
      errors.push(`Lien non autorisé dans dist/${htmlFile} : « ${href} » cible « ${targetPageId} », absent des relations autorisées de « ${pageId} ».`);
    }
  }
}

if (errors.length > 0) {
  console.error(`✗ Validation du maillage échouée : ${errors.length} erreur(s).`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`✓ Maillage sémantique valide : ${generatedFiles.length} page(s) et les liens internes respectent data/semantic-map.json.`);
