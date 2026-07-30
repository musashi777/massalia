/**
 * MASSALIA — Enhancements Script (v2.0)
 * Scroll Reveal, Parallax, et Interactions
 */

// ---- SCROLL REVEAL (Intersection Observer) ----
function initScrollReveal() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Appliquer le scroll reveal aux éléments
  const elementsToReveal = document.querySelectorAll(
    '.strate-article, .prose-section, .cta-section, .strates-header'
  );

  elementsToReveal.forEach((el) => {
    el.classList.add('scroll-reveal');
    observer.observe(el);
  });
}

// ---- PARALLAX EFFECT ----
function initParallax() {
  const parallaxElements = document.querySelectorAll('.hero-img-wrap img, .strate-article__img img');

  window.addEventListener('scroll', () => {
    parallaxElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const scrollPosition = window.scrollY;
      const elementPosition = el.offsetTop;
      const distance = scrollPosition - elementPosition;

      // Appliquer un léger décalage basé sur la position de défilement
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.style.transform = `translateY(${distance * 0.1}px) scale(1.06)`;
      }
    });
  });
}

// ---- SMOOTH SCROLL ANCHOR LINKS ----
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '') return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ---- HEADER SCROLL EFFECT ----
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  let lastScrollTop = 0;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;

    if (scrollTop > 100) {
      header.style.borderBottomColor = 'rgba(230, 126, 34, 0.2)';
    } else {
      header.style.borderBottomColor = 'rgba(230, 126, 34, 0.1)';
    }

    lastScrollTop = scrollTop;
  });
}

// ---- LAZY LOADING IMAGES ----
function initLazyLoading() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          imageObserver.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

// ---- BUTTON RIPPLE EFFECT ----
function initButtonRipple() {
  const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

  buttons.forEach((button) => {
    button.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// ---- ACTIVE LINK HIGHLIGHT ----
function initActiveLinkHighlight() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.footer-nav-links a, .site-header a');

  window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (scrollY >= sectionTop - 200) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// ---- PERFORMANCE: DEBOUNCE ----
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ---- PERFORMANCE: THROTTLE ----
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ---- INIT ALL ENHANCEMENTS ----
function initEnhancements() {
  // Vérifier que le DOM est chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
}

function initAll() {
  initScrollReveal();
  initParallax();
  initSmoothScroll();
  initHeaderScroll();
  initLazyLoading();
  initButtonRipple();
  initActiveLinkHighlight();

  console.log('✓ Massalia Enhancements loaded');
}

// Lancer les améliorations
initEnhancements();

// ---- EXPORT POUR UTILISATION EXTERNE ----
window.MassaliaEnhancements = {
  initScrollReveal,
  initParallax,
  initSmoothScroll,
  initHeaderScroll,
  initLazyLoading,
  initButtonRipple,
  initActiveLinkHighlight,
  debounce,
  throttle
};
