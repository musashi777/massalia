/**
 * main.js — Interactivité, Menu Mobile & Recherche Instantanée pour Massalia Archives
 * v2.1 — Ajouts : focus trap modal (WCAG AA), bouton retour haut, scroll reveal
 */
(function () {
  'use strict';

  let searchData = null;

  /* ---- Skip Link ---- */
  function initSkipLink() {
    const skipLink = document.getElementById('skip-link');
    const mainContent = document.getElementById('main');
    if (skipLink && mainContent) {
      skipLink.addEventListener('click', function () {
        mainContent.focus();
      });
    }
  }

  /* ---- Menu Mobile ---- */
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

  /* ---- Récupère tous les éléments focusables d'un container ---- */
  function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  /* ---- Modale Recherche (avec focus trap WCAG 2.1 AA) ---- */
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
      document.body.style.overflow = 'hidden'; /* Bloquer le scroll derrière */
      input.focus();
      if (!searchData) {
        fetchSearchIndex();
      }
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (openBtn) openBtn.focus();
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);

    /* Focus Trap — Tab reste à l'intérieur du dialog (WCAG SC 2.1.2) */
    modal.addEventListener('keydown', function (e) {
      if (!modal.classList.contains('is-open') || e.key !== 'Tab') return;

      const focusable = getFocusableElements(modal);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        /* Shift+Tab depuis le premier élément → aller au dernier */
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        /* Tab depuis le dernier élément → revenir au premier */
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    /* Ctrl+K pour ouvrir/fermer ; Escape pour fermer */
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        modal.classList.contains('is-open') ? closeModal() : openModal();
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
      .then(function (res) { return res.json(); })
      .then(function (data) {
        searchData = data;
        const input = document.getElementById('search-input');
        const resultsContainer = document.getElementById('search-results');
        if (input && input.value.trim().length > 0 && resultsContainer) {
          renderSearchResults(input.value.trim().toLowerCase(), resultsContainer);
        }
      })
      .catch(function (err) {
        console.error('Erreur lors du chargement de l\'index de recherche :', err);
      });
  }

  function renderSearchResults(query, container) {
    if (!query) {
      container.innerHTML = '<p class="search-hint">Saisissez vos mots-clés (ex: <em>"Iroquois"</em>, <em>"Cosquer"</em>, <em>"Saint-Victor"</em>, <em>"Port Antique"</em>)...</p>';
      return;
    }
    if (!searchData) {
      container.innerHTML = '<p class="search-hint">Chargement de l\'index des archives...</p>';
      return;
    }

    const filtered = searchData.filter(function (item) {
      const q = query;
      return item.title.toLowerCase().includes(q)
        || item.metaDescription.toLowerCase().includes(q)
        || (item.lede && item.lede.toLowerCase().includes(q))
        || (item.keywords && item.keywords.some(function (k) { return k.toLowerCase().includes(q); }))
        || (item.strate && item.strate.toLowerCase().includes(q));
    });

    if (filtered.length === 0) {
      container.innerHTML = '<p class="search-hint">Aucun dossier ne correspond à "<strong>' + escapeHtml(query) + '</strong>".</p>';
      return;
    }

    /* Harmonisation terminologique : "Couche" dans les badges de résultats */
    const itemsHtml = filtered.map(function (item) {
      const badge = item.type === 'mere'
        ? 'Accueil &amp; Vue globale'
        : (item.type === 'fille' ? 'Couche Thématique' : 'Dossier Spécifique');
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
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ---- Bouton flottant "↑ Retour en haut" (visible après 600px de scroll) ---- */
  function initBackToTop() {
    let btn = document.getElementById('btn-top') || document.getElementById('back-to-top');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'btn-top';
      btn.className = 'btn-top';
      btn.setAttribute('aria-label', 'Retour en haut de page');
      btn.setAttribute('title', 'Retour en haut');
      btn.innerHTML = '↑';
      document.body.appendChild(btn);
    }

    window.addEventListener('scroll', function () {
      const show = window.scrollY > 600;
      btn.classList.toggle('visible', show);
      btn.classList.toggle('is-visible', show);
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      const skipLink = document.getElementById('skip-link');
      if (skipLink) skipLink.focus();
    });
  }

  /* ---- Sommaire Sticky Scrollspy ---- */
  function initStickySommaire() {
    const links = document.querySelectorAll('.sommaire-sticky a');
    if (!links.length) return;
    const sections = [];

    links.forEach(function (link) {
      const id = link.getAttribute('data-section') || link.getAttribute('href').replace('#', '');
      const el = document.getElementById(id);
      if (el) sections.push({ id: id, el: el, link: link });
    });

    if (!sections.length || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('active'); });
          const match = sections.find(function (s) { return s.el === entry.target; });
          if (match) match.link.classList.add('active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(function (s) { observer.observe(s.el); });
  }

  /* ---- Barre de Progression de Lecture ---- */
  function initReadingProgress() {
    const bar = document.getElementById('reading-progress-bar');
    if (!bar) return;

    function updateProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight > 0) {
        const progress = (scrollTop / docHeight) * 100;
        bar.style.width = Math.min(100, Math.max(0, progress)) + '%';
      }
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    updateProgress();
  }

  /* ---- FAQ Accordéon Animé ---- */
  function initFaqAccordion() {
    const triggers = document.querySelectorAll('.faq-trigger');
    if (!triggers.length) return;

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        const targetId = trigger.getAttribute('aria-controls');
        const answer = document.getElementById(targetId);

        trigger.setAttribute('aria-expanded', !expanded);

        if (answer) {
          if (expanded) {
            answer.setAttribute('hidden', '');
            answer.classList.remove('is-open');
          } else {
            answer.removeAttribute('hidden');
            answer.classList.add('is-open');
          }
        }
      });
    });
  }

  /* ---- Parallaxe ---- */
  function initParallax() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const parallaxImages = document.querySelectorAll('.strate-article__img img, .hero-img-wrap img, .hero-media img');
    if (!parallaxImages.length) return;

    let ticking = false;

    function updateParallax() {
      const windowHeight = window.innerHeight;
      parallaxImages.forEach(function (img) {
        const parent = img.closest('.strate-article__img') || img.closest('.hero-img-wrap') || img.closest('.hero-media');
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        if (rect.top < windowHeight && rect.bottom > 0) {
          const centerY = rect.top + rect.height / 2;
          const viewportCenter = windowHeight / 2;
          const offsetRatio = (centerY - viewportCenter) / windowHeight;
          const translateY = Math.max(-30, Math.min(30, offsetRatio * 40));
          img.style.transform = 'translate3d(0, ' + translateY + 'px, 0) scale(1.08)';
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

  /* ---- Scroll Reveal (IntersectionObserver) ---- */
  function initScrollReveal() {
    const elements = document.querySelectorAll('.scroll-reveal, .reveal');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window) || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      elements.forEach(function (el) { el.classList.add('visible'); });
      return;
    }

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    elements.forEach(function (el) { observer.observe(el); });
  }

  /* ---- Point d'entrée ---- */
  function initAll() {
    initSkipLink();
    initMobileMenu();
    initSearchModal();
    initBackToTop();
    initStickySommaire();
    initReadingProgress();
    initFaqAccordion();
    initParallax();
    initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
