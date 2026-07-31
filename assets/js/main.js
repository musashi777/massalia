/**
 * main.js — Interactivité & Parallaxe fluide pour Massalia Archives
 */
(function () {
  'use strict';

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
        // Ne calculer que si l'élément est dans le viewport
        if (rect.top < windowHeight && rect.bottom > 0) {
          const centerY = rect.top + rect.height / 2;
          const viewportCenter = windowHeight / 2;
          const offsetRatio = (centerY - viewportCenter) / windowHeight;
          // Offset max doux ±25px pour éviter d'expulser l'image de son conteneur
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initParallax);
  } else {
    initParallax();
  }
})();
