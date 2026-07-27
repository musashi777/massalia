# Massalia — Rapport de finalisation

## Résultat d’exécution

Le projet statique a été finalisé sans ajout de dépendance npm. Les dix contenus éditoriaux ont été revus à partir de sources institutionnelles et muséales, le maillage sémantique est désormais contrôlé par un script Node.js natif, et les fichiers nécessaires au référencement ainsi qu’au déploiement continu ont été ajoutés.

> **Validation finale réussie :** `node build.js && node scripts/validate-mesh.js` s’est terminée avec le code de retour **0**. Le build a généré **10 pages HTML**, `sitemap.xml` et `robots.txt`.

## Note sur les consignes locales

L’archive fournie ne contenait pas de fichier `AGENTS.md`, ni à sa racine ni dans un sous-répertoire. Les contraintes explicitement présentes dans la demande ont néanmoins été respectées : build en Node.js pur, absence d’installation npm, validation du cocon sémantique et génération statique.

Aucun audit Lighthouse automatisé n’a été exécuté, et aucune affirmation de score WCAG AAA ou Lighthouse 100/100 n’est formulée dans ce rapport.

## Tableau avant / après — contenu factuel

| Fichier | Avant | Après | Références de contrôle |
|---|---|---|---|
| `content/mere-histoire-marseille.md` | Présentait comme établies une diffusion généralisée de la vigne, de l’olivier et de l’alphabet grec par Massalia. | Reformule l’apport de Massalia autour des échanges maritimes et des relations avec l’arrière-pays, sans causalité non étayée. | Inrap [1], Ville de Marseille [5] |
| `content/fille-antiquite.md` | Confondait le récit de Prôtis et Gyptis avec l’histoire attestée et qualifiait Nann de roi ligure. | Distingue explicitement le mythe fondateur ; emploie les formes Prôtis, Gyptis et Nannos, roi des Ségobriges ; confirme la prise de 49 av. J.-C. | Musée d’Histoire [4], Ville de Marseille [5] |
| `content/fille-fortifications.md` | Présentait le Fort Saint-Jean comme directement médiéval et datait le Château d’If « à partir de 1524 ». | Distingue commanderie médiévale et fort du XVIIᵉ siècle ; date la décision pour If de 1516 et l’achèvement de 1531. | Mucem [6], CMN [8] |
| `content/fille-religieux.md` | Attribuait comme certitude la fondation de Saint-Victor à Jean Cassien et décrivait des « catacombes romaines ». | Présente la fondation cassianite comme une tradition et les espaces souterrains comme des vestiges de carrière, nécropole et basilique de l’Antiquité tardive. | FranceArchives [13], Office de tourisme [14] |
| `content/soeur-port-antique.md` | Avançait des datations et une direction de fouille nominative sans appui vérifié. | Reprend le cadre documenté : fouilles de 1967 à 1983, ouverture en 1983, vestiges de plusieurs périodes et fonctions du quartier. | Musée d’Histoire [3] |
| `content/soeur-jardin-vestiges.md` | Réduisait le site à un rempart et quai grecs du IIIᵉ siècle av. J.-C. et formulait une unicité mondiale non sourcée. | Décrit un site ouvert en 1983, formé de vestiges hellénistiques, romains et de l’Antiquité tardive, complémentaire du musée. | Musée d’Histoire [3] |
| `content/soeur-rhinoceros-if.md` | Présentait comme fait établi un graffiti de rhinocéros gravé en 1516 au château. | Retire cette attribution non établie ; documente le transit du rhinocéros de 1515, la rencontre avec François Iᵉʳ et la gravure de Dürer. | CMN [9] [10], NGA [11], Art Institute of Chicago [12] |
| `content/soeur-arsenal-galeres.md` | Affirmait l’exclusivité immédiate de Marseille comme port d’attache et une chronologie détaillée insuffisamment sourcée. | Cadre l’arsenal comme une décision de 1666, une base logistique majeure et un système progressivement obsolète dont l’activité cesse à Marseille en 1748. | Musée d’Histoire [18], Ville de Marseille [5] |
| `content/soeur-crypte-saint-victor.md` | Datait à tort une reconstruction du XIᵉ siècle sous Guillaume de Grimoard et assimilait les espaces à des catacombes. | Corrige la chronologie : travaux à partir du XIᵉ siècle, campagne romane ultérieure, fortification sous Urbain V au XIVᵉ siècle ; distingue tradition et archéologie. | FranceArchives [13], Office de tourisme [14] |
| `content/soeur-bonne-mere-exvoto.md` | Décrivait les ex-voto avec des quantités et événements précis non documentés dans les sources retenues. | Retient les éléments vérifiés : travaux dès 1853, consécration en 1864, statue placée en 1870, ensemble diversifié d’ex-voto et dommages pendant la Seconde Guerre mondiale. | Basilique [16] [17], Ville de Marseille [15] |

Les métadonnées concernées dans `data/semantic-map.json` ont également été mises à jour pour éviter que les titres, descriptions et repères de strate ne réintroduisent les formulations corrigées dans les pages générées.

## Tableau avant / après — pipeline technique

| Élément | Avant | Après |
|---|---|---|
| `scripts/validate-mesh.js` | Absent. | Nouveau validateur Node.js pur avec analyse de complexité **O(P + R + H + L)**. Il contrôle la carte, les sorties générées, les relations parent/enfants/sœurs, l’accueil global et chaque ancre interne dans `dist/*.html`. |
| `build.js` | Génération de 10 pages HTML et copie de la feuille CSS. | Génère en plus `dist/sitemap.xml` et `dist/robots.txt` à partir de `data/semantic-map.json`, qui reste la source de vérité des URLs. |
| `dist/sitemap.xml` | Absent. | Généré avec les 10 URLs canoniques du site. |
| `dist/robots.txt` | Absent. | Généré avec autorisation d’exploration et déclaration du sitemap. |
| `vercel.json` | Absent. | Ajoute une configuration Vercel qui lance `node build.js && node scripts/validate-mesh.js` avant de publier `dist/`. |
| `.github/workflows/deploy.yml` | Absent. | Ajoute une chaîne GitHub Actions : récupération du dépôt, Node.js 22, build, validation, puis déploiement Vercel de production. |

## Validation technique finale

| Contrôle | Résultat |
|---|---:|
| Pages générées | 10 / 10 |
| `sitemap.xml` généré | Oui |
| `robots.txt` généré | Oui |
| Liens internes contrôlés | Oui |
| Liens non autorisés détectés | 0 |
| Code de retour de la commande demandée | **0** |

La commande exécutée est la suivante :

```bash
node build.js && node scripts/validate-mesh.js
```

## Déploiement continu

Le workflow de déploiement attend trois secrets GitHub : `VERCEL_TOKEN`, `VERCEL_ORG_ID` et `VERCEL_PROJECT_ID`. Avant une mise en production, la valeur `site.baseUrl` dans `data/semantic-map.json` doit être remplacée par le nom de domaine final : cette valeur alimente les URL canoniques, le sitemap, les données structurées et `robots.txt`.

## Sources

Le registre exhaustif, avec les titres, organismes, URLs et faits utilisés, est disponible dans [`content/SOURCES.md`](content/SOURCES.md). Les références numérotées de ce rapport correspondent à ce registre.
