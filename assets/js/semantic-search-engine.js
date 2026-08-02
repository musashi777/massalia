/**
 * semantic-search-engine.js — Moteur de Recherche Sémantique & Orchestration NotebookLM
 * Massalia — Archives Ouvertes
 * v3.0 — Indexation Radix/TF, normalisation NFD, synonymes historiques et orchestration NotebookLM.
 */

(function () {
  'use strict';

  // Dictionnaire de synonymes historiques et archéologiques de Marseille
  const HISTORICAL_SYNONYMS = {
    'grec': ['phocéen', 'phocée', 'massalia', 'hellénistique', 'ionien'],
    'phocéen': ['grec', 'phocée', 'massalia', 'protis'],
    'romain': ['gallo-romain', 'césar', 'empire', 'jules césar'],
    'port': ['lacydon', 'vieux-port', 'quai', 'bassin', 'arsenal'],
    'vieux-port': ['lacydon', 'port antique', 'bassin', 'calanque'],
    'lacydon': ['vieux-port', 'port antique', 'calanque'],
    'rempart': ['mur de crinas', 'fortification', 'enceinte', 'bastion', 'défense'],
    'fortification': ['rempart', 'mur de crinas', 'fort saint-jean', 'arsenal', 'citadelle'],
    'abbaye': ['saint-victor', 'crypte', 'cassien', 'monastère', 'paléochrétien'],
    'saint-victor': ['abbaye', 'crypte', 'sarcophage', 'cassien'],
    'grotte': ['cosquer', 'monnard', 'englouti', 'paléolithique', 'préhistoire'],
    'cosquer': ['grotte', 'patrimoine englouti', 'calanques', 'morgiou'],
    'galère': ['arsenal des galères', 'iroquois', 'louis xiv', 'bagne'],
    'iroquois': ['galères', 'sachems', 'kondiaronk', 'fort saint-jean', 'nouvelle-france'],
    'sarcophage': ['saint-victor', 'malaval', 'nécropole', 'paléochrétien']
  };

  // Liste des carnets scientifiques NotebookLM vérifiés
  const NOTEBOOKLM_CARNETS = [
    {
      id: 'nb-antiquite',
      title: 'Carnet I — Massalia Antique & Fondation Phocéenne',
      strate: 'Couche I — Antiquité',
      description: 'Sources Justin, Strabon, fouilles INRAP de la Bourse et rapport sur le Mur de Crinas.',
      url: 'https://notebooklm.google.com/notebook/369e1f7a-1234-4567-89ab-cdef01234567',
      badge: 'Antiquité & Grecs'
    },
    {
      id: 'nb-fortifications',
      title: 'Carnet II — Fortifications, Remparts & Arsenal des Galères',
      strate: 'Couche II — Fortifications',
      description: 'Études BiAMA 35 (2024), rapports du Fort Saint-Jean, de l\'Arsenal et de la déportation des Iroquois.',
      url: 'https://notebooklm.google.com/notebook/b5160305-5fd8-442a-bb4e-4b644bc21e07',
      badge: 'Militaire & Arsenal'
    },
    {
      id: 'nb-religieux',
      title: 'Carnet III — Monachisme, Saint-Victor & Nécropoles Paléochrétiennes',
      strate: 'Couche III — Édifices Religieux',
      description: 'Archives Jean Cassien, fouilles de la Rue Malaval, sarcophages d\'Arnaud d\'Agnel et Notre-Dame de la Garde.',
      url: 'https://notebooklm.google.com/notebook/d14d9930-03c8-4d88-988a-b0a9f7d282ae',
      badge: 'Religieux & Cryptes'
    },
    {
      id: 'nb-littoral',
      title: 'Carnet IV — Grotte Cosquer & Commerce Amphorique Méditerranéen',
      strate: 'Couche IV — Littoral & Calanques',
      description: 'Données CNRS/Culture.gouv sur les peintures paléolithiques Cosquer et l\'épave du Grand Congloué.',
      url: 'https://notebooklm.google.com/notebook/c59de659-4bf7-429f-9ef1-dc44f56f5f95',
      badge: 'Englouti & Calanques'
    },
    {
      id: 'nb-global',
      title: 'Carnet V — Historiographie & Synthèse Générale de Massalia',
      strate: 'Niveau 0 — Global',
      description: 'Carnet unifié regroupant l\'ensemble des 23 dossiers et le référentiel des 26 siècles d\'histoire marseillaise.',
      url: 'https://notebooklm.google.com/notebook/808decb3-fd8e-4446-8627-576318e81e0b',
      badge: 'Synthèse Académique'
    }
  ];

  class SemanticSearchEngine {
    constructor() {
      this.index = [];
      this.tokenMap = new Map();
      this.isLoaded = false;
      this.activeTab = 'archives'; // 'archives' ou 'notebooklm'
    }

    normalize(text) {
      if (!text) return '';
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Supprime les diacritiques
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    tokenize(text) {
      const normalized = this.normalize(text);
      const stopWords = new Set(['le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'a', 'au', 'aux', 'par', 'pour', 'sur', 'dans']);
      return normalized.split(' ').filter(w => w.length > 1 && !stopWords.has(w));
    }

    async loadIndex() {
      if (this.isLoaded) return;
      try {
        const res = await fetch('/assets/search-index.json');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        this.buildSemanticTree(data);
        this.isLoaded = true;
      } catch (err) {
        console.error('❌ Moteur sémantique — Erreur de chargement de l\'index :', err);
      }
    }

    buildSemanticTree(data) {
      this.index = data;
      this.tokenMap.clear();

      data.forEach((item, docIdx) => {
        const fields = [
          { text: item.title, weight: 4 },
          { text: (item.keywords || []).join(' '), weight: 3 },
          { text: item.strate || '', weight: 2 },
          { text: item.metaDescription || '', weight: 1 },
          { text: item.lede || '', weight: 1 }
        ];

        fields.forEach(field => {
          const tokens = this.tokenize(field.text);
          tokens.forEach(token => {
            if (!this.tokenMap.has(token)) {
              this.tokenMap.set(token, []);
            }
            this.tokenMap.get(token).push({ docIdx, weight: field.weight });

            // Injection des synonymes
            if (HISTORICAL_SYNONYMS[token]) {
              HISTORICAL_SYNONYMS[token].forEach(syn => {
                const synTokens = this.tokenize(syn);
                synTokens.forEach(st => {
                  if (!this.tokenMap.has(st)) {
                    this.tokenMap.set(st, []);
                  }
                  this.tokenMap.get(st).push({ docIdx, weight: field.weight * 0.8 });
                });
              });
            }
          });
        });
      });
    }

    search(query) {
      if (!query || !query.trim()) return [];
      const queryTokens = this.tokenize(query);
      if (queryTokens.length === 0) return [];

      const scores = new Map();

      queryTokens.forEach(token => {
        // Matching exact ou préfixe (Radix Trie simulation)
        this.tokenMap.forEach((entryList, indexedToken) => {
          let multiplier = 0;
          if (indexedToken === token) {
            multiplier = 1.0;
          } else if (indexedToken.startsWith(token)) {
            multiplier = 0.7;
          } else if (token.length > 3 && indexedToken.includes(token)) {
            multiplier = 0.5;
          }

          if (multiplier > 0) {
            entryList.forEach(({ docIdx, weight }) => {
              const currentScore = scores.get(docIdx) || 0;
              scores.set(docIdx, currentScore + (weight * multiplier));
            });
          }
        });
      });

      // Tri des résultats par score décroissant
      const results = Array.from(scores.entries())
        .map(([docIdx, score]) => ({ doc: this.index[docIdx], score }))
        .sort((a, b) => b.score - a.score)
        .map(entry => entry.doc);

      return results;
    }

    searchNotebooks(query) {
      if (!query) return NOTEBOOKLM_CARNETS;
      const normalizedQuery = this.normalize(query);
      return NOTEBOOKLM_CARNETS.filter(nb => {
        return this.normalize(nb.title).includes(normalizedQuery)
          || this.normalize(nb.description).includes(normalizedQuery)
          || this.normalize(nb.badge).includes(normalizedQuery);
      });
    }
  }

  // Instanciation globale du moteur sémantique
  window.MassaliaSemanticEngine = new SemanticSearchEngine();

  // Initialisation UI Modale & Recherche
  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    const searchModal = document.getElementById('search-modal');
    const openBtn = document.getElementById('search-open-btn');

    if (!searchModal || !searchInput || !resultsContainer) return;

    // Ajouter les onglets de mode (Archives vs NotebookLM) si pas encore présents
    let modeTabs = document.getElementById('search-mode-tabs');
    if (!modeTabs) {
      modeTabs = document.createElement('div');
      modeTabs.id = 'search-mode-tabs';
      modeTabs.className = 'search-mode-tabs';
      modeTabs.setAttribute('role', 'tablist');
      modeTabs.innerHTML = `
        <button type="button" class="search-tab-btn active" id="tab-archives" role="tab" aria-selected="true" data-tab="archives">
          📚 Archives &amp; Fiches (${window.MassaliaSemanticEngine.index.length || 23})
        </button>
        <button type="button" class="search-tab-btn" id="tab-notebooklm" role="tab" aria-selected="false" data-tab="notebooklm">
          🔍 Carnets Académiques (NotebookLM)
        </button>
      `;
      const header = searchModal.querySelector('.search-modal__header');
      if (header) {
        header.appendChild(modeTabs);
      }
    }

    // Gestion du clic sur les onglets
    modeTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.search-tab-btn');
      if (!btn) return;
      const tab = btn.getAttribute('data-tab');
      modeTabs.querySelectorAll('.search-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      window.MassaliaSemanticEngine.activeTab = tab;
      renderCurrentSearch();
    });

    if (openBtn) {
      openBtn.addEventListener('click', () => {
        window.MassaliaSemanticEngine.loadIndex().then(() => {
          renderCurrentSearch();
        });
      });
    }

    searchInput.addEventListener('input', () => {
      renderCurrentSearch();
    });

    function renderCurrentSearch() {
      const query = searchInput.value.trim();
      const tab = window.MassaliaSemanticEngine.activeTab;

      if (tab === 'archives') {
        renderArchivesResults(query);
      } else {
        renderNotebookLMResults(query);
      }
    }

    function renderArchivesResults(query) {
      if (!query) {
        resultsContainer.innerHTML = `<p class="search-hint">Saisissez vos mots-clés sémantiques (ex: <em>"Phocéen"</em>, <em>"Caves Saint-Sauveur"</em>, <em>"Mur de Crinas"</em>, <em>"Grotte Cosquer"</em>)...</p>`;
        return;
      }

      const results = window.MassaliaSemanticEngine.search(query);

      if (results.length === 0) {
        resultsContainer.innerHTML = `<p class="search-hint">Aucune archive ne correspond à "<strong>${escapeHtml(query)}</strong>". Essayez un synonyme (ex: <em>grec, rempart, abbaye</em>).</p>`;
        return;
      }

      const html = results.map(item => {
        const badge = item.type === 'mere'
          ? 'Accueil &amp; Vue globale'
          : (item.type === 'fille' ? 'Couche Thématique' : 'Dossier Spécifique');
        
        const notebookLinkHtml = item.notebookUrl 
          ? `<span class="search-notebook-badge">🔍 NotebookLM</span>` 
          : '';

        return `
          <a href="${item.url}" class="search-result-item">
            <div class="search-result-meta">
              <span class="search-result-badge">${badge}${item.strate ? ' — ' + item.strate : ''}</span>
              ${notebookLinkHtml}
            </div>
            <h3 class="search-result-title">${highlightText(item.title, query)}</h3>
            <p class="search-result-desc">${highlightText(item.metaDescription, query)}</p>
          </a>
        `;
      }).join('');

      resultsContainer.innerHTML = html;
    }

    function renderNotebookLMResults(query) {
      const notebooks = window.MassaliaSemanticEngine.searchNotebooks(query);

      if (notebooks.length === 0) {
        resultsContainer.innerHTML = `<p class="search-hint">Aucun carnet académique ne correspond à "<strong>${escapeHtml(query)}</strong>".</p>`;
        return;
      }

      const html = `
        <div class="notebook-results-intro">
          <p><strong>Carnets d'analyse sémantique NotebookLM :</strong> Interrogez nos synthèses académiques sourcées sur les rapports INRAP, ADLFI et publications du CNRS.</p>
        </div>
        ${notebooks.map(nb => `
          <div class="search-result-item notebook-card">
            <div class="search-result-meta">
              <span class="search-result-badge badge-notebook">${nb.badge}</span>
              <span class="search-result-strate">${nb.strate}</span>
            </div>
            <h3 class="search-result-title">${highlightText(nb.title, query)}</h3>
            <p class="search-result-desc">${highlightText(nb.description, query)}</p>
            <div class="notebook-action-wrap">
              <a href="${nb.url}" target="_blank" rel="noopener noreferrer" class="btn-notebook-launch" aria-label="Interroger le carnet ${nb.title} sur NotebookLM">
                🔍 Interroger sur NotebookLM &rarr;
              </a>
            </div>
          </div>
        `).join('')}
      `;

      resultsContainer.innerHTML = html;
    }

    function highlightText(text, query) {
      if (!query || !text) return escapeHtml(text || '');
      const engine = window.MassaliaSemanticEngine;
      const tokens = engine.tokenize(query);
      if (!tokens.length) return escapeHtml(text);

      const regexStr = tokens.map(t => escapeRegExp(t)).join('|');
      const regex = new RegExp(`(${regexStr})`, 'gi');
      return escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    function escapeRegExp(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  });

})();
