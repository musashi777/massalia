const fs = require('fs');
const css = fs.readFileSync('assets/css/style.css', 'utf8');

if (css.includes('aspect-ratio: 16 / 9')) {
  console.log("SUCCÈS: aspect-ratio trouvé (CLS protégé)");
} else {
  console.log("ERREUR: aspect-ratio manquant");
  process.exit(1);
}

if (css.includes('clamp(1rem, 0.95rem + 0.25vw, 1.125rem)')) {
  console.log("SUCCÈS: Échelle typographique fluide O(1) trouvée");
} else {
  console.log("ERREUR: Typographie fluide manquante");
  process.exit(1);
}
