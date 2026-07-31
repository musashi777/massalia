import json

with open('data/semantic-map.json', 'r') as f:
    smap = json.load(f)

new_pages = ["feuille-evolution-lacydon", "feuille-commerce-etain-gaulois"]

# Add to children
for page in reversed(new_pages):
    smap['pages']['fille-antiquite']['children'].insert(1, page)

# Update siblings for all children
for child in smap['pages']['fille-antiquite']['children']:
    if child in smap['pages']:
        smap['pages'][child]['siblings'] = [s for s in smap['pages']['fille-antiquite']['children'] if s != child]

# Create the new page entries
smap['pages']['feuille-evolution-lacydon'] = {
    "type": "feuille",
    "slug": "evolution-lacydon-marseille",
    "title": "L'évolution du Lacydon",
    "metaTitle": "L'évolution du Lacydon | Port originel de Massalia",
    "metaDescription": "Histoire et topographie du Lacydon, la calanque antique devenue le Vieux-Port de Marseille.",
    "contentFile": "content/feuille-evolution-lacydon.md",
    "heroImage": "/assets/img/hero-littoral.png",
    "imageCaption": "Vue de la calanque du Lacydon.",
    "schemaType": "Article",
    "parent": "fille-antiquite",
    "anchorToParent": "Antiquité et Fondations",
    "siblings": [],
    "strate": {
        "niveau": 2,
        "label": "Niveau II — Topographie et aménagement",
        "epoque": "Antiquité - Époque Moderne"
    }
}

smap['pages']['feuille-commerce-etain-gaulois'] = {
    "type": "feuille",
    "slug": "commerce-etain-massalia-gaulois",
    "title": "Le commerce de l'étain avec les Gaulois",
    "metaTitle": "Le commerce de l'étain à Massalia | Échanges avec les Gaulois",
    "metaDescription": "Le rôle géopolitique et économique de Massalia dans la route de l'étain à l'âge du Fer.",
    "contentFile": "content/feuille-commerce-etain-gaulois.md",
    "heroImage": "/assets/img/feuille-commerce-amphores.png",
    "imageCaption": "Échanges commerciaux en Méditerranée.",
    "schemaType": "Article",
    "parent": "fille-antiquite",
    "anchorToParent": "Antiquité et Fondations",
    "siblings": [],
    "strate": {
        "niveau": 2,
        "label": "Niveau II — Géopolitique et commerce",
        "epoque": "VIᵉ siècle - IIᵉ siècle av. J.-C."
    }
}

# Fix siblings for the new entries
for new_page in new_pages:
    smap['pages'][new_page]['siblings'] = [s for s in smap['pages']['fille-antiquite']['children'] if s != new_page]

with open('data/semantic-map.json', 'w', encoding='utf-8') as f:
    json.dump(smap, f, ensure_ascii=False, indent=2)

print("Added others to semantic map")
