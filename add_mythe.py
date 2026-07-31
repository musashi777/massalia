import json

with open('data/semantic-map.json', 'r') as f:
    smap = json.load(f)

# Add to children
smap['pages']['fille-antiquite']['children'].insert(0, "feuille-mythe-protis")

# Add siblings to the new page
siblings = [s for s in smap['pages']['fille-antiquite']['children'] if s != "feuille-mythe-protis"]

# Update siblings for all children
for child in smap['pages']['fille-antiquite']['children']:
    if child in smap['pages']:
        smap['pages'][child]['siblings'] = [s for s in smap['pages']['fille-antiquite']['children'] if s != child]

# Create the new page entry
smap['pages']['feuille-mythe-protis'] = {
    "type": "feuille",
    "slug": "mythe-fondation-protis-gyptis",
    "title": "Le Mythe de Protis et Gyptis",
    "metaTitle": "Le Mythe de Protis et Gyptis | Fondation de Massalia",
    "metaDescription": "L'union légendaire de Protis et Gyptis scellant la fondation pacifique de la cité de Massalia vers 600 av. J.-C.",
    "contentFile": "content/feuille-mythe-protis.md",
    "heroImage": "/assets/img/hero-fondation-massalia.jpg",
    "imageCaption": "Illustration de la légende de Protis et Gyptis.",
    "schemaType": "Article",
    "parent": "fille-antiquite",
    "anchorToParent": "Antiquité et Fondations",
    "siblings": siblings,
    "strate": {
        "niveau": 2,
        "label": "Niveau II — Récits fondateurs",
        "epoque": "Vers 600 av. J.-C."
    }
}

with open('data/semantic-map.json', 'w', encoding='utf-8') as f:
    json.dump(smap, f, ensure_ascii=False, indent=2)

print("Added mythe-protis to semantic map")
