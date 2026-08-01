/**
 * main.js — Interactivité, Menu Mobile & Recherche Instantanée pour Massalia Archives
 */
(function () {
  'use strict';

  let searchData = null;

  function initSkipLink() {
    const skipLink = document.getElementById('skip-link');
    const mainContent = document.getElementById('main');
    if (skipLink && mainContent) {
      skipLink.addEventListener('click', function (e) {
        mainContent.focus();
      });
    }
  }

  function initMobileMenu() {
    const toggleBtn = document.getElementById('menu-toggle-btn');
    const nav = document.getElementById('main-nav');
    if (!toggleBtn || !nav) return;

    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', !expanded);
      nav.classList.toggle('is-active');
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-active') && !nav.contains(e.target) && !toggleBtn.contains(e.target)) {
        nav.classList.remove('is-active');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-active')) {
        nav.classList.remove('is-active');
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.focus();
      }
    });
  }

  function initSearchModal() {
    const modal = document.getElementById('search-modal');
    const openBtn = document.getElementById('search-open-btn');
    const closeBtn = document.getElementById('search-close-btn');
    const backdrop = document.getElementById('search-backdrop');
    const input = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    if (!modal || !input || !resultsContainer) return;

    function openModal() {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      input.focus();
      if (!searchData) {
        fetchSearchIndex();
      }
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      if (openBtn) openBtn.focus();
    }

    if (openBtn) {
      openBtn.addEventListener('click', openModal);
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    if (backdrop) {
      backdrop.addEventListener('click', closeModal);
    }

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (modal.classList.contains('is-open')) {
          closeModal();
        } else {
          openModal();
        }
      } else if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });

    input.addEventListener('input', function () {
      const query = input.value.trim().toLowerCase();
      renderSearchResults(query, resultsContainer);
    });
  }

  function fetchSearchIndex() {
    fetch('/assets/search-index.json')
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        searchData = data;
        const input = document.getElementById('search-input');
        const resultsContainer = document.getElementById('search-results');
        if (input && input.value.trim().length > 0 && resultsContainer) {
          renderSearchResults(input.value.trim().toLowerCase(), resultsContainer);
        }
      })
      .catch(function (err) {
        console.error('Erreur lors du chargement de l index de recherche :', err);
      });
  }

  function renderSearchResults(query, container) {
    if (!query) {
      container.innerHTML = '<p class="search-hint">Saisissez vos mots-clés (ex: <em>"Iroquois"</em>, <em>"Cosquer"</em>, <em>"Saint-Victor"</em>, <em>"Port Antique"</em>)...</p>';
      return;
    }

    if (!searchData) {
      container.innerHTML = '<p class="search-hint">Chargement de l index des archives...</p>';
      return;
    }

    const filtered = searchData.filter(function (item) {
      const inTitle = item.title.toLowerCase().includes(query);
      const inDesc = item.metaDescription.toLowerCase().includes(query);
      const inLede = item.lede ? item.lede.toLowerCase().includes(query) : false;
      const inKeywords = item.keywords ? item.keywords.some(function (k) { return k.toLowerCase().includes(query); }) : false;
      const inStrate = item.strate ? item.strate.toLowerCase().includes(query) : false;
      return inTitle || inDesc || inLede || inKeywords || inStrate;
    });

    if (filtered.length === 0) {
      container.innerHTML = '<p class="search-hint">Aucun dossier ne correspond à "<strong>' + escapeHtml(query) + '</strong>".</p>';
      return;
    }

    const itemsHtml = filtered.map(function (item) {
      const badge = item.type === 'mere' ? 'Accueil &amp; Vue globale' : (item.type === 'fille' ? 'Strate Thémathique' : 'Dossier Spécifique');
      return '<a href="' + item.url + '" class="search-result-item">' +
        '<span class="search-result-badge">' + badge + (item.strate ? ' — ' + item.strate : '') + '</span>' +
        '<h3 class="search-result-title">' + highlightText(item.title, query) + '</h3>' +
        '<p class="search-result-desc">' + highlightText(item.metaDescription, query) + '</p>' +
        '</a>';
    }).join('');

    container.innerHTML = itemsHtml;
  }

  function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    const regex = new RegExp('(' + escapeRegExp(query) + ')', 'gi');
    return escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function initParallax() {
    const parallaxImages = document.querySelectorAll('.strate-article__img img, .hero-img-wrap img');
    if (!parallaxImages.length) return;

    let ticking = false;

    function updateParallax() {
      const windowHeight = window.innerHeight;

      parallaxImages.forEach((img) => {
        const parent = img.closest('.strate-article__img') || img.closest('.hero-img-wrap');
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        if (rect.top < windowHeight && rect.bottom > 0) {
          const centerY = rect.top + rect.height / 2;
          const viewportCenter = windowHeight / 2;
          const offsetRatio = (centerY - viewportCenter) / windowHeight;
          const translateY = Math.max(-30, Math.min(30, offsetRatio * 40));
          img.style.transform = `translate3d(0, ${translateY}px, 0) scale(1.08)`;
        }
      });

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateParallax();
  }

  function initAll() {
    initSkipLink();
    initMobileMenu();
    initSearchModal();
    initParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
