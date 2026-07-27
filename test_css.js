const fs = require('fs');
const css = fs.readFileSync('assets/css/style.css', 'utf8');

if (css.includes('@media (max-width: 860px)')) {
  console.log("ERREUR: La Media Query n'a pas été retirée");
  process.exit(1);
} else {
  console.log("SUCCÈS: Media Query classique retirée");
}

if (css.includes('flex-basis: calc(')) {
  console.log("SUCCÈS: Formule Holy Albatross (fluidité O(1)) trouvée");
} else {
  console.log("ERREUR: Formule Holy Albatross absente");
  process.exit(1);
}
