/**
 * map-timeline-module.js — Module Front-end d'Interactivité & Visualisation
 * 
 * 1. Leaflet Map Engine : Chargement asynchrone GeoJSON (/data/geo/vestiges.geojson)
 * 2. Timeline Engine : Indexation O(1) via Map<StrateId, Event[]>
 */

class TimelineEngine {
  constructor(containerId, filterBarId) {
    this.container = document.getElementById(containerId);
    this.filterBar = document.getElementById(filterBarId);
    this.eventsMap = new Map(); // Indexation O(1) : Map<StrateId, Event[]>
    this.allEvents = [];
    this.activeStrate = 'all';
  }

  async init() {
    if (!this.container) return;
    try {
      const response = await fetch('/data/timeline.json');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      
      this.indexEvents(data);
      this.renderFilterBar(data.strates);
      this.renderEvents(this.allEvents);
    } catch (err) {
      console.error("❌ Échec du chargement de la chronologie:", err);
    }
  }

  indexEvents(data) {
    this.allEvents = data.events || [];
    this.eventsMap.set('all', this.allEvents);

    // Initialisation des listes dans la Map
    if (data.strates) {
      for (const strate of data.strates) {
        this.eventsMap.set(strate.id, []);
      }
    }

    // Remplissage O(n) à l'initialisation unique
    for (let i = 0; i < this.allEvents.length; i++) {
      const evt = this.allEvents[i];
      const list = this.eventsMap.get(evt.strateId);
      if (list) {
        list.push(evt);
      }
    }
  }

  renderFilterBar(strates) {
    if (!this.filterBar) return;

    const filterOptions = [
      { id: 'all', label: 'Toutes les strates' },
      ...strates.map(s => ({ id: s.id, label: s.label.split('—')[0].trim() }))
    ];

    const buttonsHtml = filterOptions.map(opt => {
      const activeClass = opt.id === this.activeStrate ? ' active' : '';
      const pressed = opt.id === this.activeStrate ? 'true' : 'false';
      return `<button type="button" class="chrono-filter-btn${activeClass}" data-strate="${opt.id}" aria-pressed="${pressed}">
        ${opt.label}
      </button>`;
    }).join('');

    this.filterBar.innerHTML = `<div class="chrono-filters-nav" role="toolbar" aria-label="Filtrer la chronologie par strate">
      <span class="filter-label">Filtrer par couche :</span>
      ${buttonsHtml}
    </div>`;

    this.filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.chrono-filter-btn');
      if (!btn) return;
      const strateId = btn.getAttribute('data-strate');
      this.filterByStrate(strateId);

      // Mise à jour de l'état des boutons
      const allBtns = this.filterBar.querySelectorAll('.chrono-filter-btn');
      allBtns.forEach(b => {
        const isCurrent = b === btn;
        b.classList.toggle('active', isCurrent);
        b.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      });
    });
  }

  // Accès direct O(1) lors des interactions de filtrage
  filterByStrate(strateId) {
    if (this.activeStrate === strateId) return;
    this.activeStrate = strateId;

    const filtered = this.eventsMap.get(strateId) || [];
    this.renderEvents(filtered);
  }

  renderEvents(events) {
    if (!this.container) return;

    if (events.length === 0) {
      this.container.innerHTML = `<p class="chrono-empty">Aucun événement répertorié dans cette strate.</p>`;
      return;
    }

    const html = events.map(evt => {
      const linkHtml = evt.slug ? `<a href="/${evt.slug}.html" class="chrono-event-link" aria-label="Lire la fiche : ${evt.title}">🔍 Découvrir l'archive</a>` : '';
      return `<li class="chrono-item reveal visible" data-strate="${evt.strateId}">
        <time class="chrono-date" datetime="${evt.yearStart}">${evt.displayDate}</time>
        <div class="chrono-body">
          <h3>${evt.title}</h3>
          <p>${evt.summary}</p>
          ${linkHtml}
        </div>
      </li>`;
    }).join('');

    this.container.innerHTML = html;
  }
}

class MassaliaMap {
  constructor(containerId, filterBarId) {
    this.containerId = containerId;
    this.filterBarId = filterBarId;
    this.map = null;
    this.markersGroup = null;
    this.allFeatures = [];
    this.activeStrate = 'all';
  }

  async init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Vérification de la présence de la bibliothèque Leaflet
    if (typeof L === 'undefined') {
      console.warn("⚠️ Leaflet JS non chargé.");
      return;
    }

    // Initialisation de la carte Leaflet centrée sur Marseille / Vieux-Port
    this.map = L.map(this.containerId, {
      center: [43.2965, 5.3698],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false
    });

    // Tuiles CartoDB Positron légères et élégantes
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);
    await this.loadGeoJSON();
  }

  async loadGeoJSON() {
    try {
      const response = await fetch('/data/geo/vestiges.geojson');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const geojson = await response.json();
      this.allFeatures = geojson.features || [];

      this.renderMarkers(this.allFeatures);
      this.initMapFilters();
    } catch (err) {
      console.error("❌ Échec du chargement du GeoJSON cartographique:", err);
    }
  }

  renderMarkers(features) {
    if (!this.markersGroup) return;
    this.markersGroup.clearLayers();

    features.forEach(feature => {
      const [lng, lat] = feature.geometry.coordinates;
      const marker = this.createCustomMarker(feature, [lat, lng]);
      this.bindAccessiblePopup(feature, marker);
      this.markersGroup.addLayer(marker);
    });
  }

  createCustomMarker(feature, latlng) {
    const strateId = feature.properties.strateId;
    const title = feature.properties.title;
    const pinHtml = `<div class="massalia-map-pin pin-${strateId}" title="${title}">
      <span class="pin-inner"></span>
    </div>`;

    const customIcon = L.divIcon({
      html: pinHtml,
      className: 'massalia-custom-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    return L.marker(latlng, { icon: customIcon });
  }

  bindAccessiblePopup(feature, layer) {
    const p = feature.properties;
    const imgHtml = p.heroImage ? `<div class="popup-img-wrap"><img src="${p.heroImage}" alt="${p.title}" loading="lazy" width="260" height="140" /></div>` : '';
    
    const popupContent = `
      <article class="map-popup-card">
        ${imgHtml}
        <span class="badge-strate badge-${p.strateId}">${p.strateLabel}</span>
        <h4 class="popup-title">${p.title}</h4>
        <p class="popup-epoque"><time>${p.epoque}</time></p>
        <p class="popup-summary">${p.summary}</p>
        <a href="${p.url}" class="popup-link">Consulter l'archive &rarr;</a>
      </article>
    `;
    layer.bindPopup(popupContent, { maxWidth: 280, className: 'massalia-leaflet-popup' });
  }

  initMapFilters() {
    const filterContainer = document.getElementById(this.filterBarId);
    if (!filterContainer) return;

    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.map-filter-btn');
      if (!btn) return;
      const strateId = btn.getAttribute('data-strate');

      filterContainer.querySelectorAll('.map-filter-btn').forEach(b => {
        const isCurrent = b === btn;
        b.classList.toggle('active', isCurrent);
        b.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      });

      if (strateId === 'all') {
        this.renderMarkers(this.allFeatures);
      } else {
        const filtered = this.allFeatures.filter(f => f.properties.strateId === strateId);
        this.renderMarkers(filtered);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const mapEngine = new MassaliaMap('leaflet-map-container', 'map-filter-bar');
  mapEngine.init();

  const timelineEngine = new TimelineEngine('chrono-timeline-list', 'chrono-filter-bar');
  timelineEngine.init();
});
