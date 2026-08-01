const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist');
const htmlFiles = fs.readdirSync(distDir).filter(f => f.endsWith('.html'));

console.log(`=== AUDIT QA MASSALIA (${htmlFiles.length} pages dans /dist) ===\n`);

let totalErrors = 0;

htmlFiles.forEach(file => {
  const filePath = path.join(distDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];

  // 1. Check Canonical tag
  if (!content.includes('<link rel="canonical"')) {
    errors.push('Manque la balise <link rel="canonical">');
  }

  // 2. Check single H1
  const h1Matches = content.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
  if (h1Matches.length === 0) {
    errors.push('Aucun <h1> trouvé');
  } else if (h1Matches.length > 1) {
    errors.push(`Plusieurs (${h1Matches.length}) <h1> trouvés`);
  }

  // 3. Check JSON-LD
  if (!content.includes('application/ld+json')) {
    errors.push('Manque le bloc JSON-LD <script type="application/ld+json">');
  }

  // 4. Check image alt tags
  const imgRegex = /<img[^>]+>/g;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    const imgTag = match[0];
    if (!imgTag.includes('alt="') || imgTag.includes('alt=""')) {
      errors.push(`Image sans balise alt valide : ${imgTag}`);
    }
  }

  // 5. Check internal links integrity
  const hrefRegex = /href="([^"#:]+)"/g;
  let hrefMatch;
  while ((hrefMatch = hrefRegex.exec(content)) !== null) {
    let target = hrefMatch[1];
    if (target.startsWith('/')) {
      target = target.substring(1);
    }
    if (target === '') target = 'index.html';
    if (!target.includes(':') && !target.startsWith('mailto') && !target.startsWith('[') && !target.includes('NOTEBOOK_URL')) {
      const targetPath = path.join(distDir, target);
      if (!fs.existsSync(targetPath)) {
        errors.push(`Lien mort (404) détecté vers: ${hrefMatch[1]}`);
      }
    }
  }

  if (errors.length > 0) {
    console.log(`❌ ${file}:`);
    errors.forEach(err => console.log(`   - ${err}`));
    totalErrors += errors.length;
  } else {
    console.log(`✓ ${file}: Conforme (Canonical, 1 H1, JSON-LD, Alt text, Liens valides)`);
  }
});

console.log(`\n===========================================`);
if (totalErrors === 0) {
  console.log(`🎉 AUDIT QA RÉUSSI : 0 ERREUR DÉTECTÉE SUR TOUTES LES PAGES !`);
  process.exit(0);
} else {
  console.log(`❌ AUDIT QA ÉCHOUÉ : ${totalErrors} ERREUR(S) TROUVÉE(S).`);
  process.exit(1);
}
