# Brief SEO Massalia — Synthèse concurrentielle + Plan d'action exécutable

## Objectif

Positionner le site **Massalia** (actuellement `massalia-*.vercel.app`) comme la référence grand public sur l'histoire, le patrimoine et les vestiges archéologiques de Marseille, en exploitant les angles morts sémantiques non couverts par les sites institutionnels et encyclopédiques.

---

## 1. Diagnostic consolidé

### 1.1 Corpus analysé (2 vagues)

| Vague | Sites analysés | Angle |
|---|---|---|
| Vague 1 | marseille.fr, musees.marseille.fr, marseilletourisme.fr, Wikipedia (fr), marseille-spirit.com | Top 5 SERP grand public |
| Vague 2 | musee-histoire.marseille.fr, marseille-tourisme.com (EN), Wikipedia, INRAP (atlas), Provence7 | Corpus archéologique + tourisme EN |

### 1.2 Forces du site Massalia

- **Approche thématique en strates** (4 axes) vs concurrents chronologiques — différenciation éditoriale unique
- **Meta title et description optimisées** (63 et 150 caractères)
- **Open Graph + Twitter Card** complets
- **Sujets exclusifs** : Grotte Monnard, Château d'If dans un cadre patrimonial, angle politique des fortifications ("dominer la cité rebelle")
- **Métaphore stratigraphique** — aucun concurrent n'utilise ce concept
- **4 pages secondaires** avec URLs descriptives propres (`/antiquite-et-fondations.html`, etc.)

### 1.3 Faiblesses techniques

| Problème | Impact | Gravité |
|---|---|---|
| Canonical pointe vers un autre déploiement Vercel | Duplicate content, déindexation | Critique |
| Pas de domaine personnalisé (URL Vercel aléatoire) | Aucune autorité EAT, non mémorisable | Critique |
| Pas de sitemap.xml | Découverte des pages par les crawlers ralentie | Majeur |
| Pas de robots.txt | Pas de directives crawl | Majeur |
| Pas de Schema.org / JSON-LD | Pas de rich snippets, EAT faible | Majeur |
| 4 images sans alt text | Accessibilité + SEO image | Majeur |
| 5 liens footer cassés (→ `/`) | Maillage interne dégradé, UX | Mineur |
| H1 sans "Marseille" ("HISTOIRE et PATRIMOINE") | Sous-optimisation mot-clé principal | Mineur |
| Contenu accueil ~640 mots | Sous le seuil compétitif (1200+) | Majeur |
| Pages footer promises non implémentées (Cartographie, Photothèque, Chronologie) | Promesses non tenues | Mineur |

### 1.4 Positionnement différenciant

```
Concurrents : récit chronologique → de la Préhistoire au XXIe siècle
Massalia     : récit stratigraphique → 4 couches patrimoniales superposées

              ┌─────────────────────────────────┐
              │  Strate IV — Littoral & Calanques │  (préhistoire → contemporain)
              ├─────────────────────────────────┤
              │  Strate III — Édifices religieux  │  (Ve → XIXe)
              ├─────────────────────────────────┤
              │  Strate II — Fortifications        │  (XIIe → XVIIe)
              ├─────────────────────────────────┤
              │  Strate I — Antiquité & Fondations │  (VIe s. av. J.-C. → Ve s.)
              └─────────────────────────────────┘
```

---

## 2. Content gaps consolidés (10 sujets)

Fusion des gaps identifiés dans les deux corpus d'analyse. Priorité calculée sur : niveau de concurrence (inversé), volume de recherche estimé, faisabilité éditoriale.

| # | Sujet | Gap source | Page cible | Intention SEO | Priorité |
|---|---|---|---|---|---|
| 1 | **Basilique paléochrétienne rue Malaval** (Ve s.) | Corpus 1 | Strate I — Antiquité | "nécropole paléochrétienne Marseille", "basilique rue Malaval" | P1 |
| 2 | **Musée des Docks Romains** (place Vivaux, dolia in situ) | Corpus 1 | Strate I — Antiquité | "docks romains Marseille", "entrepôt romain dolia Marseille" | P1 |
| 3 | **Siège de César (-49) et circonvallation** | Corpus 2 | Strate I — Antiquité | "siège César Marseille", "bataille Marseille 49 av J-C" | P1 |
| 4 | **Fouilles Espace Bargemon + topographie du Lacydon** | Corpus 1 | Strate I — Antiquité | "fouilles Bargemon Marseille", "port antique Lacydon topographie" | P1 |
| 5 | **Réseau hydraulique antique + enceinte nord (Carmes)** | Corpus 2 | Strate I — Antiquité | "aqueduc romain Marseille", "enceinte hellénistique Marseille Carmes" | P2 |
| 6 | **Oppidum de la Tourette / Ségobriges** | Corpus 1 | Strate I — Antiquité | "Ségobriges Marseille", "oppidum Tourette Saint-Marcel" | P2 |
| 7 | **Caves Saint-Sauveur / réseau souterrain du Panier** | Corpus 2 | Strate I — Antiquité | "Caves Saint-Sauveur Marseille", "vestiges souterrains Panier Marseille" | P2 |
| 8 | **Réplique Cosquer Méditerranée** (Villa Méditerranée, 2022) | Corpus 1 | Strate IV — Littoral | "grotte Cosquer Marseille visite", "Cosquer Méditerranée" | P2 |
| 9 | **Routes terrestres de l'étain gaulois** | Corpus 2 | Strate I — Antiquité | "commerce étain Massalia", "route de l'étain Gaule Marseille" | P3 |
| 10 | **Grotte Monnard** (aménagements industriels, karst) | Corpus 2 | Strate IV — Littoral | "Grotte Monnard Marseille", "réseau karstique Marseille" | P3 |

> Note : les sujets 5 et 7 nécessitent une vérification par source primaire (INRAP, DRAC, OpenEdition) avant rédaction définitive. Les sujets 1, 2, 3, 4, 6 et 8 sont sourcés et prêts à la rédaction.

---

## 3. Plan d'action exécutable pour agent

### Phase 1 — Corrections techniques bloquantes

#### Tâche 1.1 — Corriger la balise canonical

**Fichier concerné :** `index.html` (et toutes les pages `.html`)

**Action :** Remplacer la balise canonical actuelle par l'URL de production cible.

```html
<!-- AVANT (incorrect) -->
<link rel="canonical" href="https://massalia-g84ktoyi1-musashi777s-projects.vercel.app/" />

<!-- APRÈS (correct) -->
<link rel="canonical" href="https://www.massalia-histoire.fr/" />
```

> Si le domaine personnalisé n'est pas encore déployé, utiliser au minimum l'URL du déploiement de production Vercel stable (pas un preview branch).

**Critère d'acceptation :** `canonical` identique à l'URL de la page en cours sur les 5 pages du site.

---

#### Tâche 1.2 — Déployer un domaine personnalisé

**Action :** Configurer un domaine propre via Vercel (ex: `massalia-histoire.fr` ou `massalia-patrimoine.fr`).

**Critère d'acceptation :** Le site est accessible via le domaine personnalisé. Le canonical, og:url et toutes les URL absolues pointent vers ce domaine.

---

#### Tâche 1.3 — Créer sitemap.xml

**Fichier à créer :** `sitemap.xml` à la racine du projet

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.massalia-histoire.fr/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.massalia-histoire.fr/antiquite-et-fondations.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.massalia-histoire.fr/fortifications-et-architecture-militaire.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.massalia-histoire.fr/edifices-religieux-et-symboles.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.massalia-histoire.fr/littoral-calanques-et-commerce-maritime.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

**Critère d'acceptation :** `sitemap.xml` accessible à `https://[domaine]/sitemap.xml`, valide selon le schéma XSD.

---

#### Tâche 1.4 — Créer robots.txt

**Fichier à créer :** `robots.txt` à la racine

```
User-agent: *
Allow: /

Sitemap: https://www.massalia-histoire.fr/sitemap.xml
```

**Critère d'acceptation :** `robots.txt` accessible et contient l'URL du sitemap.

---

#### Tâche 1.5 — Ajouter les alt text manquants

**Fichiers concernés :** `index.html` (section strates)

```html
<!-- Pour chaque image de strate, ajouter un alt descriptif : -->

<img src="/assets/img/hero-antiquite.png"
     alt="Vestiges du port antique de Marseille, Massalia, fouilles du Centre Bourse" />

<img src="/assets/img/hero-fortifications.png"
     alt="Fort Saint-Nicolas et fortifications de Marseille, architecture militaire" />

<img src="/assets/img/hero-religieux.png"
     alt="Abbaye Saint-Victor et Notre-Dame de la Garde, patrimoine religieux de Marseille" />

<img src="/assets/img/hero-littoral.png"
     alt="Calanques de Marseille et Grotte Cosquer, patrimoine littoral et maritime" />
```

**Critère d'acceptation :** 0 image sans alt text sur l'ensemble du site. Chaque alt contient au moins un mot-clé pertinent.

---

#### Tâche 1.6 — Corriger le H1 de la page d'accueil

**Fichier :** `index.html`

```html
<!-- AVANT -->
<h1>HISTOIRE et PATRIMOINE</h1>

<!-- APRÈS -->
<h1>Histoire et Patrimoine de Marseille</h1>
```

**Critère d'acceptation :** Le H1 contient le mot-clé "Marseille". Un seul H1 par page.

---

#### Tâche 1.7 — Corriger les liens cassés du footer

**Fichier :** `index.html` (et template footer si factorisé)

| Lien | Action |
|---|---|
| Cartographie | Créer la page `/cartographie.html` OU retirer le lien si non pertinent |
| Photothèque | Créer la page `/phototheque.html` OU retirer le lien |
| Légal | Créer `/mentions-legales.html` (page simple) |
| Données | Créer `/politique-donnees.html` (page simple) |
| Chronologie | Créer `/chronologie.html` OU faire pointer vers une ancre réelle |

**Critère d'acceptation :** 0 lien du footer ne pointe vers `/` par défaut. Chaque lien mène à une page existante.

---

#### Tâche 1.8 — Ajouter le balisage Schema.org (JSON-LD)

**Fichier :** `index.html` (dans `<head>` ou avant `</body>`)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Massalia — Archives Ouvertes",
  "description": "Dossier de référence sur l'histoire et le patrimoine de Marseille : fondations antiques, fortifications militaires, édifices religieux, littoral et monde souterrain.",
  "url": "https://www.massalia-histoire.fr/",
  "logo": "https://www.massalia-histoire.fr/assets/img/hero-mere.png",
  "email": "contact@massalia.fr"
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Massalia — Histoire et Patrimoine de Marseille",
  "url": "https://www.massalia-histoire.fr/",
  "inLanguage": "fr-FR"
}
```

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Accueil",
      "item": "https://www.massalia-histoire.fr/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Antiquité et Fondations",
      "item": "https://www.massalia-histoire.fr/antiquite-et-fondations.html"
    }
  ]
}
```

> Répéter le BreadcrumbList sur chaque page avec le fil d'Ariane correspondant.

**Critère d'acceptation :** JSON-LD valide sur https://search.google.com/test/rich-results. Présent sur les 5 pages.

---

### Phase 2 — Architecture et maillage interne

#### Tâche 2.1 — Densifier la page d'accueil (640 → 1200+ mots)

**Fichier :** `index.html`

**Action :** Pour chaque section de strate (4 strates), ajouter un paragraphe descriptif de 100-150 mots couvrant :
- Les lieux/sites principaux de la strate
- Les périodes chronologiques couvertes
- Un lien vers la page détaillée de la strate (déjà existant via CTA)

Ajouter également une section introductive de 100 mots sur la métaphore stratigraphique (déjà amorcée, à développer).

**Critère d'acceptation :** Le contenu textuel de la page d'accueil dépasse 1200 mots. La densité de "Marseille" est entre 1% et 2.5%.

---

#### Tâche 2.2 — Implémenter la page Chronologie

**Fichier à créer :** `/chronologie.html`

**Structure :**

```
H1 : Chronologie de l'histoire de Marseille
H2 : Préhistoire et Protohistoire (-27000 → -600)
H2 : Fondation de Massalia (-600 → -49)
H2 : Massilia romaine (-49 → Ve s.)
H2 : Moyen Âge (Ve → XVe)
H2 : Renaissance et Époque moderne (XVIe → XVIIIe)
H2 : Époque contemporaine (XIXe → XXIe)
```

**Contenu :** Frise chronologique avec dates clés, liens vers les pages strates correspondantes.

**Critère d'acceptation :** Page de minimum 800 mots, maillée vers les 4 pages strates. Ajoutée au sitemap.xml.

---

#### Tâche 2.3 — Implémenter la page Cartographie

**Fichier à créer :** `/cartographie.html`

**Structure :**

```
H1 : Cartographie du patrimoine marseillais
H2 : Strate I — Sites antiques et archéologiques
H2 : Strate II — Fortifications et citadelles
H2 : Strate III — Édifices religieux
H2 : Strate IV — Sites littoraux et naturels
```

**Contenu :** Liste des lieux par strate avec coordonnées GPS, brève description, lien vers la page strate correspondante. Optionnel : intégrer une carte Leaflet.js ou Google Maps embed.

**Critère d'acceptation :** Minimum 15 lieux répertoriés. Ajoutée au sitemap.xml.

---

#### Tâche 2.4 — Maillage interne entre strates

**Action :** Sur chaque page de strate, ajouter en bas de page une section "Strates liées" avec liens vers les 3 autres strates + la page Chronologie + la page Cartographie.

```html
<section class="strates-liees">
  <h2>Strates liées</h2>
  <ul>
    <li><a href="/fortifications-et-architecture-militaire.html">Fortifications et Architecture Militaire</a></li>
    <li><a href="/edifices-religieux-et-symboles.html">Édifices Religieux et Symboles</a></li>
    <li><a href="/littoral-calanques-et-commerce-maritime.html">Littoral, Calanques et Commerce Maritime</a></li>
    <li><a href="/chronologie.html">Chronologie de Marseille</a></li>
    <li><a href="/cartographie.html">Cartographie du patrimoine</a></li>
  </ul>
</section>
```

**Critère d'acceptation :** Chaque page contient au moins 3 liens internes vers d'autres pages du site. Aucune page orpheline.

---

#### Tâche 2.5 — Ajouter une FAQ structurée sur la page d'accueil

**Fichier :** `index.html`

**Structure (avant le footer) :**

```html
<section class="faq">
  <h2>Questions fréquentes sur l'histoire de Marseille</h2>

  <h3>Quand a été fondée Marseille ?</h3>
  <p>Marseille a été fondée vers 600 av. J.-C. par des marins grecs venus de Phocée...</p>

  <h3>Quel est le plus ancien vestige de Marseille ?</h3>
  <p>Les remparts hellénistiques du IIIe siècle av. J.-C., visibles au Jardin des Vestiges...</p>

  <h3>Peut-on visiter les vestiges antiques de Marseille ?</h3>
  <p>Oui, le site du Port Antique (Jardin des Vestiges) est accessible au Centre Bourse...</p>

  <h3>Qu'est-ce que le mur de Crinas ?</h3>
  <p>Le mur de Crinas est un rempart hellénistique en calcaire rose du IIIe siècle av. J.-C....</p>

  <h3>Où se trouvent les Docks romains de Marseille ?</h3>
  <p>Le musée des Docks Romains, situé 28 place Vivaux, présente in situ des entrepôts...</p>
</section>
```

**Balisage JSON-LD FAQPage à ajouter :**

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Quand a été fondée Marseille ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Marseille a été fondée vers 600 av. J.-C. par des marins grecs venus de Phocée (actuelle Turquie). C'est la plus ancienne ville de France."
      }
    },
    {
      "@type": "Question",
      "name": "Où se trouvent les Docks romains de Marseille ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le musée des Docks Romains, situé 28 place Vivaux (2e arrondissement), présente in situ des entrepôts romains à dolia datant du Ier au IIIe siècle apr. J.-C."
      }
    }
  ]
}
```

**Critère d'acceptation :** Minimum 5 questions/réponses. JSON-LD FAQPage valide sur Rich Results Test. Chaque réponse fait 40-80 mots.

---

### Phase 3 — Création de contenu (content gaps)

#### Tâche 3.1 — Enrichir la Strate I "Antiquité et Fondations"

**Fichier :** `/antiquite-et-fondations.html`

C'est la page la plus stratégique. Elle doit couvrir 7 des 10 content gaps. Structure cible :

```
H1 : Antiquité et Fondations de Marseille
H2 : Avant Massalia : l'occupation pré-phocéenne
  H3 : L'oppidum de la Tourette et les Ségobriges
  H3 : La Grotte Cosquer et les occupations paléolithiques
  H3 : Les gisements de l'Huveaune et la Grotte Monnard
H2 : La fondation de Massalia (vers 600 av. J.-C.)
  H3 : Le mythe de Gyptis et Prôtis
  H3 : Les sources antiques : Aristote, Justin, Strabon
  H3 : Trois collines et un promontoire : la topographie de la cité grecque
H2 : Le port antique et le Lacydon
  H3 : La calanque du Lacydon et la corne du port
  H3 : Les fouilles de l'Espace Bargemon (2002-2003)
  H3 : Le bassin-réservoir d'eau douce et les quais romains
  H3 : Les Docks romains et les dolia (musée de la place Vivaux)
H2 : Le commerce de Massalia
  H3 : Les routes terrestres de l'étain gaulois
  H3 : Les comptoirs phocéens : d'Agde à Nice
  H3 : Pythéas, Euthymènes et les explorations lointaines
H2 : Le siège de César (-49 av. J.-C.)
  H3 : L'alliance avec Pompée et le mauvais choix
  H3 : Les travaux de circonvallation de Trébonius
  H3 : Conséquences : de Massalia à Massilia
H2 : Marseille paléochrétienne (Ve-VIe s.)
  H3 : La basilique funéraire de la rue Malaval
  H3 : La memoria et les 228 sépultures
  H3 : L'évêque Orose et le concile d'Arles (314)
H2 : Le réseau hydraulique et les enceintes
  H3 : L'enceinte hellénistique et son extension vers les Carmes
  H3 : Les Caves Saint-Sauveur et le réseau souterrain du Panier
  H3 : L'aqueduc de l'Huveaune
```

**Sources à utiliser pour la rédaction :**

| Sujet | Source principale | URL |
|---|---|---|
| Oppidum Tourette / Ségobriges | marseille.fr (page histoire) | https://www.marseille.fr/decouvrir-marseille/histoire-de-marseille/présentation |
| Fondation / Gyptis / Prôtis | Provence7 | https://www.provence7.com/a-a-z-des-articles/massalia-naissance-de-la-cite-grecque-de-marseille/ |
| Topographie 3 collines | INRAP (Antiquité grecque) | https://multimedia.inrap.fr/atlas/marseille/synthese-periodes/antiquite-grecque |
| Fouilles Bargemon | INRAP (Espace Bargemon) | https://multimedia.inrap.fr/atlas/marseille/sites/2861/Espace-Bargemon |
| Docks Romains | musee-histoire.marseille.fr | https://musee-histoire.marseille.fr/lieux/musee-des-docks-romains |
| Siège de César -49 | Wikipedia (Histoire de Marseille) | https://fr.wikipedia.org/wiki/Histoire_de_Marseille |
| Basilique rue Malaval | Inrap + Persée | https://www.inrap.fr/decouverte-paleochretienne-sur-le-site-de-la-rue-malaval-marseille-bouches-du-985 |
| Rue Malaval (détail) | Persée (note Moliner) | https://www.persee.fr/doc/crai_0065-0536_2010_num_154_3_93010 |
| Port antique / topographie | secretsdici.fr | https://secretsdici.fr/2023/01/secrets-de-provence-bfm-marseille-le-port-antique/ |
| Port de Massilia | INRAP (port de Massilia) | https://multimedia.inrap.fr/atlas/marseille/decouvertes-marseille/port-de-massilia |
| Caves Saint-Sauveur | À vérifier (INRAP/DRAC) | — |
| Aqueduc Huveaune | INRAP (carte archéologique) | https://multimedia.inrap.fr/atlas/marseille/sites-archeologiques-marseille |

> Attention : les sujets "Caves Saint-Sauveur" et "aqueduc de l'Huveaune" doivent être vérifiés par source primaire avant rédaction définitive. Si la source est insuffisante, remplacer par un autre sujet sourcé.

**Critère d'acceptation :**
- Page de minimum 3000 mots
- 15+ sous-sections H2/H3
- Chaque fait archéologique cite sa source (lien hypertexte)
- Densité "Marseille" entre 1% et 2.5%
- Au moins 5 liens internes (vers autres strates, chronologie, cartographie)
- Densité sémantique : Massalia, Massilia, Phocée, Lacydon, Gyptis, Prôtis, César, dolia, hellénistique, paléochrétien, memoria, circonvallation, Ségobriges, oppidum

---

#### Tâche 3.2 — Enrichir la Strate IV "Littoral, Calanques et Commerce Maritime"

**Fichier :** `/littoral-calanques-et-commerce-maritime.html`

**Structure cible :**

```
H1 : Littoral, Calanques et Commerce Maritime de Marseille
H2 : La Grotte Cosquer : art pariétal et montée des eaux
  H3 : Découverte par Henri Cosquer (1985)
  H3 : La réplique Cosquer Méditerranée (Villa Méditerranée, 2022)
  H3 : Visite pratique : accès, horaires, tarifs
H2 : La Grotte Monnard : réseaux karstiques et aménagements industriels
H2 : Le patrimoine englouti de la rade de Marseille
  H3 : Les épaves antiques et l'archéologie sous-marine
  H3 : Le Grand Congloué et les fouilles Cousteau/Benoit
H2 : Les Calanques : géologie et patrimoine naturel
  H3 : Du parc national des Calanques aux sites préhistoriques
H2 : Le commerce maritime de Massalia
  H3 : Routes méditerranéennes : Italie, Espagne, Afrique du Nord, Proche-Orient
  H3 : Les amphores et leur rôle dans la datation archéologique
```

**Sources :**

| Sujet | Source | URL |
|---|---|---|
| Grotte Cosquer + réplique | Panorama du Monde | https://www.panoramadumonde.fr/grotte-cosquer-ou-la-trouver-et-comment-y-acceder/ |
| Épaves / Grand Congloué | Musée des Docks Romains (Wikipedia) | https://fr.wikipedia.org/wiki/Mus%C3%A9e_des_docks_romains |
| Port de Massilia / commerce | INRAP | https://multimedia.inrap.fr/atlas/marseille/decouvertes-marseille/port-de-massilia |
| Grotte Monnard | Déjà couvert par le site — approfondir | — |

**Critère d'acceptation :** Page de minimum 2000 mots. Section "Visite pratique" avec infos concrètes (horaires, tarifs, adresse, transports).

---

#### Tâche 3.3 — Enrichir les Strates II et III (existantes)

**Fichiers :**
- `/fortifications-et-architecture-militaire.html`
- `/edifices-religieux-et-symboles.html`

**Action :** Vérifier le contenu existant. Si les pages sont < 1500 mots, les densifier avec :

Pour la Strate II (Fortifications) :
- Fort Saint-Jean : histoire, accès, visite
- Fort Saint-Nicolas : conception par Louis XIV, angle politique ("dominer la cité rebelle")
- Château d'If : histoire, accès, visite, lien littéraire (Dumas)
- Remparts hellénistiques : mur de Crinas, tours, porte de la cité

Pour la Strate III (Édifices religieux) :
- Abbaye Saint-Victor : crypte, histoire du Ve siècle à nos jours
- Notre-Dame de la Garde : basilique, symbole, panorama
- Cathédrale de la Major : histoire, architecture
- Basilique paléochrétienne rue Malaval (lien transversal avec Strate I)

**Critère d'acceptation :** Chaque page strate > 1500 mots. Chaque lieu dispose d'un encadré "Visite" (adresse, horaires, accès transport).

---

### Phase 4 — Vérification finale (QA)

#### Checklist complète

| # | Critère | Méthode de vérification | Statut |
|---|---|---|---|
| 1 | Un seul H1 par page, contenant "Marseille" | Inspection DOM ou `document.querySelectorAll('h1')` | ☐ |
| 2 | Canonical = URL de production sur toutes les pages | `curl -s [URL] \| grep canonical` | ☐ |
| 3 | og:url = URL de production | Inspection source HTML | ☐ |
| 4 | 0 image sans alt text | `document.querySelectorAll('img:not([alt])')` ou audit Lighthouse | ☐ |
| 5 | sitemap.xml valide et accessible | `curl https://[domaine]/sitemap.xml` + validation XSD | ☐ |
| 6 | robots.txt présent avec URL sitemap | `curl https://[domaine]/robots.txt` | ☐ |
| 7 | 0 lien cassé dans le footer | Clic manuel ou `linkchecker` | ☐ |
| 8 | JSON-LD Organization + WebSite + BreadcrumbList valides | https://search.google.com/test/rich-results | ☐ |
| 9 | JSON-LD FAQPage valide (si FAQ implémentée) | https://search.google.com/test/rich-results | ☐ |
| 10 | Page d'accueil > 1200 mots | Comptage texte brut | ☐ |
| 11 | Page Strate I (Antiquité) > 3000 mots | Comptage texte brut | ☐ |
| 12 | Page Strate IV (Littoral) > 2000 mots | Comptage texte brut | ☐ |
| 13 | Pages Strates II et III > 1500 mots chacune | Comptage texte brut | ☐ |
| 14 | Page Chronologie > 800 mots | Comptage texte brut | ☐ |
| 15 | Page Cartographie > 15 lieux répertoriés | Comptage manuel | ☐ |
| 16 | Chaque page strate a 3+ liens internes sortants | Inspection HTML | ☐ |
| 17 | Densité "Marseille" entre 1% et 2.5% par page | Audit SEO (ex: Yoast, SeoQuantum) | ☐ |
| 18 | Chaque fait archéologique cite sa source (lien) | Relecture éditoriale | ☐ |
| 19 | Mobile responsive validé | Google Mobile-Friendly Test | ☐ |
| 20 | Score Lighthouse SEO > 90 | Google Lighthouse (Chrome DevTools) | ☐ |

---

## 4. Ordre d'exécution recommandé pour l'agent

```
Phase 1 (technique) — 1 jour
  └─ 1.1 Canonical → 1.6 H1 → 1.5 Alt text → 1.7 Liens footer → 1.8 JSON-LD → 1.3 Sitemap → 1.4 Robots.txt
     (1.2 domaine personnalisé = action manuelle hors agent)

Phase 2 (architecture) — 1 jour
  └─ 2.1 Densifier accueil → 2.5 FAQ → 2.2 Chronologie → 2.3 Cartographie → 2.4 Maillage interne

Phase 3 (contenu) — 3-5 jours
  └─ 3.1 Strate I Antiquité (priorité absolue) → 3.2 Strate IV Littoral → 3.3 Strates II + III

Phase 4 (QA) — 0.5 jour
  └─ Checklist complète → Lighthouse → Rich Results Test
```

---

## 5. Résumé du positionnement cible

Après exécution du plan, le site Massalia sera le seul à proposer :

1. **Une architecture thématique en strates** (vs chronologique chez tous les concurrents)
2. **Une couverture des 10 content gaps** que ni les sites institutionnels, ni Wikipedia, ni les guides touristiques ne couvrent en profondeur
3. **Un maillage sémantique structuré** (cocon thématique : 4 strates + chronologie + cartographie + FAQ)
4. **Un balisage technique SEO complet** (Schema.org, sitemap, canonical, alt texts, FAQ rich snippets)
5. **Un angle éditorial différenciant** (stratigraphie patrimoniale + angle politique des fortifications + Grotte Monnard exclusive)

> Le facteur clé de succès est la **Strate I — Antiquité et Fondations** : c'est la page la plus stratégique car elle concentre 7 des 10 content gaps et cible les requêtes les plus concurrentielles ("histoire Marseille", "fondation Massalia", "vestiges antiques Marseille").
