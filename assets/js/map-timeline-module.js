/**
 * map-timeline-module.js — Module Front-end d'Interactivité & Visualisation
 *
 * 1. Leaflet Map Engine : chargement asynchrone GeoJSON
 * 2. Timeline Engine : indexation par strate
 * 3. Safe Rendering : validation des données et construction DOM sans HTML injecté
 */

const ALLOWED_STRATE_IDS = Object.freeze([
  'couche-1-antiquite',
  'couche-2-fortifications',
  'couche-3-religieux',
  'couche-4-littoral'
]);

const ALLOWED_STRATE_ID_SET = new Set(ALLOWED_STRATE_IDS);
const SAFE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_TEXT_LENGTH = 500;

function safeText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function safeStrateId(value) {
  return typeof value === 'string' && ALLOWED_STRATE_ID_SET.has(value) ? value : '';
}

function safeSlug(value) {
  const slug = safeText(value, 120);
  return SAFE_SLUG_PATTERN.test(slug) ? slug : '';
}

function safeSitePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return '';
  }

  try {
    const baseOrigin = 'https://massalia.invalid';
    const parsed = new URL(value, baseOrigin);
    if (parsed.origin !== baseOrigin) return '';
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return '';
  }
}

function normalizeStrate(rawStrate) {
  if (!rawStrate || typeof rawStrate !== 'object') return null;

  const id = safeStrateId(rawStrate.id);
  const label = safeText(rawStrate.label, 120);
  if (!id || !label) return null;

  return { id, label };
}

function normalizeTimelineEvent(rawEvent) {
  if (!rawEvent || typeof rawEvent !== 'object') return null;

  const strateId = safeStrateId(rawEvent.strateId);
  const title = safeText(rawEvent.title, 180);
  const displayDate = safeText(rawEvent.displayDate, 100);
  if (!strateId || !title || !displayDate) return null;

  return {
    id: safeText(rawEvent.id, 120),
    yearStart: Number.isFinite(rawEvent.yearStart) ? Math.trunc(rawEvent.yearStart) : null,
    displayDate,
    title,
    summary: safeText(rawEvent.summary),
    strateId,
    slug: safeSlug(rawEvent.slug)
  };
}

function normalizeFeature(rawFeature) {
  if (!rawFeature || rawFeature.type !== 'Feature') return null;
  if (!rawFeature.geometry || rawFeature.geometry.type !== 'Point') return null;

  const coordinates = rawFeature.geometry.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const [lng, lat] = coordinates;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;

  const rawProperties = rawFeature.properties;
  if (!rawProperties || typeof rawProperties !== 'object') return null;

  const strateId = safeStrateId(rawProperties.strateId);
  const title = safeText(rawProperties.title, 180);
  if (!strateId || !title) return null;

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [lng, lat]
    },
    properties: {
      title,
      strateId,
      strateLabel: safeText(rawProperties.strateLabel, 120),
      epoque: safeText(rawProperties.epoque, 120),
      summary: safeText(rawProperties.summary),
      url: safeSitePath(rawProperties.url),
      heroImage: safeSitePath(rawProperties.heroImage)
    }
  };
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

class TimelineEngine {
  constructor(containerId, filterBarId) {
    this.container = document.getElementById(containerId);
    this.filterBar = document.getElementById(filterBarId);
    this.eventsMap = new Map();
    this.allEvents = [];
    this.strates = [];
    this.activeStrate = 'all';
  }

  async init() {
    if (!this.container) return;

    try {
      const response = await fetch('/data/timeline.json');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      this.indexEvents(data);
      this.renderFilterBar(this.strates);
      this.renderEvents(this.allEvents);
    } catch (err) {
      console.error('❌ Échec du chargement de la chronologie:', err);
    }
  }

  indexEvents(data) {
    const rawStrates = Array.isArray(data?.strates) ? data.strates : [];
    const rawEvents = Array.isArray(data?.events) ? data.events : [];

    this.strates = rawStrates.map(normalizeStrate).filter(Boolean);
    this.allEvents = rawEvents.map(normalizeTimelineEvent).filter(Boolean);
    this.eventsMap = new Map([['all', this.allEvents]]);

    for (const strate of this.strates) {
      this.eventsMap.set(strate.id, []);
    }

    for (const event of this.allEvents) {
      const list = this.eventsMap.get(event.strateId);
      if (list) list.push(event);
    }
  }

  renderFilterBar(strates) {
    if (!this.filterBar) return;

    const filterOptions = [
      { id: 'all', label: 'Toutes les strates' },
      ...strates.map((strate) => ({
        id: strate.id,
        label: strate.label.split('—')[0].trim()
      }))
    ];

    const navigation = document.createElement('div');
    navigation.className = 'chrono-filters-nav';
    navigation.setAttribute('role', 'toolbar');
    navigation.setAttribute('aria-label', 'Filtrer la chronologie par strate');
    navigation.append(createTextElement('span', 'filter-label', 'Filtrer par couche :'));

    for (const option of filterOptions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chrono-filter-btn';
      button.dataset.strate = option.id;
      button.textContent = option.label;

      const isActive = option.id === this.activeStrate;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      navigation.append(button);
    }

    this.filterBar.replaceChildren(navigation);
    this.filterBar.addEventListener('click', (event) => {
      const button = event.target.closest('.chrono-filter-btn');
      if (!button || !this.filterBar.contains(button)) return;

      const strateId = button.dataset.strate;
      if (strateId !== 'all' && !ALLOWED_STRATE_ID_SET.has(strateId)) return;
      this.filterByStrate(strateId);

      this.filterBar.querySelectorAll('.chrono-filter-btn').forEach((candidate) => {
        const isCurrent = candidate === button;
        candidate.classList.toggle('active', isCurrent);
        candidate.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      });
    });
  }

  filterByStrate(strateId) {
    if (this.activeStrate === strateId) return;
    this.activeStrate = strateId;
    this.renderEvents(this.eventsMap.get(strateId) || []);
  }

  renderEvents(events) {
    if (!this.container) return;

    if (events.length === 0) {
      this.container.replaceChildren(
        createTextElement('p', 'chrono-empty', 'Aucun événement répertorié dans cette strate.')
      );
      return;
    }

    const fragment = document.createDocumentFragment();

    for (const event of events) {
      const item = document.createElement('li');
      item.className = 'chrono-item reveal visible';
      item.dataset.strate = event.strateId;

      const time = createTextElement('time', 'chrono-date', event.displayDate);
      if (event.yearStart !== null) time.dateTime = String(event.yearStart);

      const body = document.createElement('div');
      body.className = 'chrono-body';
      body.append(
        createTextElement('h3', '', event.title),
        createTextElement('p', '', event.summary)
      );

      if (event.slug) {
        const link = createTextElement('a', 'chrono-event-link', '🔍 Découvrir l’archive');
        link.href = `/${event.slug}.html`;
        link.setAttribute('aria-label', `Lire la fiche : ${event.title}`);
        body.append(link);
      }

      item.append(time, body);
      fragment.append(item);
    }

    this.container.replaceChildren(fragment);
  }
}

class MassaliaMap {
  constructor(containerId, filterBarId) {
    this.containerId = containerId;
    this.filterBarId = filterBarId;
    this.map = null;
    this.markersGroup = null;
    this.allFeatures = [];
  }

  async init() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (typeof L === 'undefined') {
      console.warn('⚠️ Leaflet JS non chargé.');
      return;
    }

    this.map = L.map(this.containerId, {
      center: [43.2965, 5.3698],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false
    });

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
      const rawFeatures = Array.isArray(geojson?.features) ? geojson.features : [];

      this.allFeatures = rawFeatures.map(normalizeFeature).filter(Boolean);
      if (this.allFeatures.length !== rawFeatures.length) {
        console.warn('⚠️ Certaines entités GeoJSON invalides ont été ignorées.');
      }

      this.renderMarkers(this.allFeatures);
      this.initMapFilters();
    } catch (err) {
      console.error('❌ Échec du chargement du GeoJSON cartographique:', err);
    }
  }

  renderMarkers(features) {
    if (!this.markersGroup) return;
    this.markersGroup.clearLayers();

    for (const feature of features) {
      const [lng, lat] = feature.geometry.coordinates;
      const marker = this.createCustomMarker(feature, [lat, lng]);
      this.bindAccessiblePopup(feature, marker);
      this.markersGroup.addLayer(marker);
    }
  }

  createCustomMarker(feature, latlng) {
    const { strateId, title } = feature.properties;
    const pinElement = document.createElement('div');
    pinElement.classList.add('massalia-map-pin', `pin-${strateId}`);
    pinElement.title = title;

    const pinInner = document.createElement('span');
    pinInner.className = 'pin-inner';
    pinElement.append(pinInner);

    const customIcon = L.divIcon({
      html: pinElement,
      className: 'massalia-custom-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    return L.marker(latlng, { icon: customIcon });
  }

  bindAccessiblePopup(feature, layer) {
    const properties = feature.properties;
    const popupContent = document.createElement('article');
    popupContent.className = 'map-popup-card';

    if (properties.heroImage) {
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'popup-img-wrap';

      const image = document.createElement('img');
      image.src = properties.heroImage;
      image.alt = properties.title;
      image.loading = 'lazy';
      image.width = 260;
      image.height = 140;
      imageWrapper.append(image);
      popupContent.append(imageWrapper);
    }

    const badge = createTextElement('span', 'badge-strate', properties.strateLabel);
    badge.classList.add(`badge-${properties.strateId}`);

    const period = document.createElement('p');
    period.className = 'popup-epoque';
    period.append(createTextElement('time', '', properties.epoque));

    popupContent.append(
      badge,
      createTextElement('h4', 'popup-title', properties.title),
      period,
      createTextElement('p', 'popup-summary', properties.summary)
    );

    if (properties.url) {
      const link = createTextElement('a', 'popup-link', 'Consulter l’archive →');
      link.href = properties.url;
      popupContent.append(link);
    }

    layer.bindPopup(popupContent, {
      maxWidth: 280,
      className: 'massalia-leaflet-popup'
    });
  }

  initMapFilters() {
    const filterContainer = document.getElementById(this.filterBarId);
    if (!filterContainer) return;

    filterContainer.addEventListener('click', (event) => {
      const button = event.target.closest('.map-filter-btn');
      if (!button || !filterContainer.contains(button)) return;

      const strateId = button.dataset.strate;
      if (strateId !== 'all' && !ALLOWED_STRATE_ID_SET.has(strateId)) return;

      filterContainer.querySelectorAll('.map-filter-btn').forEach((candidate) => {
        const isCurrent = candidate === button;
        candidate.classList.toggle('active', isCurrent);
        candidate.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      });

      const features = strateId === 'all'
        ? this.allFeatures
        : this.allFeatures.filter((feature) => feature.properties.strateId === strateId);
      this.renderMarkers(features);
    });
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    const mapEngine = new MassaliaMap('leaflet-map-container', 'map-filter-bar');
    mapEngine.init();

    const timelineEngine = new TimelineEngine('chrono-timeline-list', 'chrono-filter-bar');
    timelineEngine.init();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ALLOWED_STRATE_IDS,
    normalizeFeature,
    normalizeStrate,
    normalizeTimelineEvent,
    safeSitePath,
    safeSlug,
    safeStrateId,
    safeText
  };
}
