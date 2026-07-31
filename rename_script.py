import os
import json
import re

# 1. Rename template
if os.path.exists('templates/layout-soeur.html'):
    os.rename('templates/layout-soeur.html', 'templates/layout-feuille.html')

# 2. Update build.js
with open('build.js', 'r') as f:
    content = f.read()
content = content.replace('layout-soeur.html', 'layout-feuille.html')
content = content.replace('page.type === "soeur"', 'page.type === "feuille"')
content = content.replace('templates.soeur', 'templates.feuille')
with open('build.js', 'w') as f:
    f.write(content)

# 3. Update semantic-map.json
with open('data/semantic-map.json', 'r') as f:
    smap = f.read()
smap = smap.replace('"type": "soeur"', '"type": "feuille"')
smap = smap.replace('soeur-', 'feuille-')
with open('data/semantic-map.json', 'w') as f:
    f.write(smap)

# 4. Rename markdown files
for f in os.listdir('content'):
    if f.startswith('soeur-'):
        os.rename(os.path.join('content', f), os.path.join('content', f.replace('soeur-', 'feuille-')))

# 5. Rename images
for f in os.listdir('assets/img'):
    if f.startswith('soeur-'):
        os.rename(os.path.join('assets/img', f), os.path.join('assets/img', f.replace('soeur-', 'feuille-')))

# 6. Update markdown contents to fix image links
for f in os.listdir('content'):
    if f.endswith('.md'):
        filepath = os.path.join('content', f)
        with open(filepath, 'r') as file:
            md_content = file.read()
        md_content = md_content.replace('soeur-', 'feuille-')
        with open(filepath, 'w') as file:
            file.write(md_content)

print("Renaming complete")
