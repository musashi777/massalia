# Rapport d'Analyse Critique et d'Optimisation Absolue

## 1. Analyse de Performance (Big O)

### 1.1 Exécution Node.js (`build.js`)
*   **Initialement :** Lecture et écriture de fichiers de manière synchrone (`fs.readFileSync`, `fs.writeFileSync`). Le temps total bloquant l'Event Loop pour la construction de N pages de taille M est **O(N × M)** séquentiel.
*   **Optimisation :** Bascule sur `fs.promises` couplé à `Promise.all()`.
*   **Gain :** Exécution concurrente non bloquante. Le temps effectif de traitement I/O tend vers **O(max(M))**, l'Event Loop est libéré, réduisant la latence globale drastiquement, tout en maintenant la compléxité algorithmique globale en **O(N × M)** asynchrone (meilleure exploitation des threads de l'OS).

### 1.2 Layout UI/UX (CSS)
*   **Initialement :** Utilisation d'une Media Query (`@media (max-width: 860px)`). Le moteur de rendu du navigateur doit évaluer l'arbre CSSOM à chaque redimensionnement, et au franchissement du seuil (860px), il invalide le Layout Tree entier, forçant un recalcul dispendieux (Reflow/Layout).
*   **Optimisation :** Implémentation du pattern mathématique *"Holy Albatross"* via Flexbox (`flex-basis: calc(...)` et `min(...)`).
*   **Gain :** Complexité temporelle continue en **O(1)**. Le navigateur résout algébriquement la disposition à chaque trame sans condition conditionnelle asynchrone (pas de commutation de contexte de style). Pas de Layout Thrashing (invalidation de mise en page).

## 2. Sécurité

### 2.1 Failles Cross-Site Scripting (XSS)
*   **Vulnérabilité identifiée :** Les variables injectées dans le moteur de templates natif (via `render()`) n'étaient pas échappées.
*   **Correctif :** Introduction d'une fonction `escapeHTML(str)` exécutée en **O(L)** (L = longueur de la chaîne). Elle est appliquée à l'ensemble des métadonnées (titres, descriptions) avant l'injection HTML.
*   **Résultat :** Protection totale contre l'injection de scripts malveillants via les fichiers de données ou de configuration.

### 2.2 Failles Regular Expression Denial of Service (ReDoS)
*   **Vulnérabilité identifiée :** Le parseur Markdown (`inline(text)`) utilisait un Backtracking excessif : `/\*\*(.+?)\*\*/g`. Sur une entrée malformée, le moteur de RegEx peut s'emballer de manière exponentielle : **O(2^L)**.
*   **Correctif :** Remplacement par des classes de caractères strictes excluant le caractère de capture : `/\*\*([^*]+)\*\*/g`.
*   **Résultat :** La complexité d'évaluation redescend et reste fixée à **O(L)** linéaire, assurant une immunité totale au *Catastrophic Backtracking*.
