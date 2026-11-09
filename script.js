/**
 * Portfolio & Certification Showcase
 * Lakshay Dhoundiyal - Dynamic Gallery, Search, Filter & Lightbox System
 */

(() => {
  'use strict';

  // State Management
  const state = {
    currentView: localStorage.getItem('portfolio-view') || 'certificate',
    selectedCategory: 'all',
    searchQuery: '',
    modalIndex: -1,
    visibleCards: [],
    theme: localStorage.getItem('portfolio-theme') || 'dark',
    isZoomed: false
  };

  // DOM Elements
  const html = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const searchInput = document.getElementById('searchInput');
  const searchClearBtn = document.getElementById('searchClearBtn');
  const viewTabBtns = document.querySelectorAll('.view-tab-btn');
  const categoryFilterBar = document.getElementById('categoryFilterBar');
  const resultsCountEl = document.getElementById('resultsCount');
  const emptyStateEl = document.getElementById('emptyState');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const backToTopBtn = document.getElementById('backToTopBtn');

  // Modal Elements
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  const modalClose = document.getElementById('modalClose');
  const modalPrevBtn = document.getElementById('modalPrevBtn');
  const modalNextBtn = document.getElementById('modalNextBtn');
  const modalZoomBtn = document.getElementById('modalZoomBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const modalTitleText = document.getElementById('modalTitleText');
  const modalIssuerBadge = document.getElementById('modalIssuerBadge');
  const modalNavCounter = document.getElementById('modalNavCounter');
  const modalBackdrop = modal ? modal.querySelector('.modal-backdrop') : null;

  const certGallery = document.getElementById('gallery-certificate');
  const lorGallery = document.getElementById('gallery-lor');

  // =========================================================================
  // 1. THEME MANAGEMENT
  // =========================================================================
  function initTheme() {
    html.setAttribute('data-theme', state.theme);
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`);
      themeToggleBtn.addEventListener('click', toggleTheme);
    }
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    html.setAttribute('data-theme', state.theme);
    localStorage.setItem('portfolio-theme', state.theme);
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('aria-label', `Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode`);
    }
    setTimeout(() => { html.style.transition = ''; }, 300);
  }

  // =========================================================================
  // 2. AUTOMATIC CARD CATEGORIZATION & ENHANCEMENT
  // =========================================================================
  const CERT_CATEGORIES = [
    { id: 'all', label: 'All Credentials', icon: '✦' },
    { id: 'cybersecurity', label: 'Cybersecurity', icon: '🛡️' },
    { id: 'cloud', label: 'Cloud & DevOps', icon: '☁️' },
    { id: 'software', label: 'Web & Software', icon: '💻' },
    { id: 'data', label: 'Data & AI', icon: '📊' },
    { id: 'coding', label: 'Coding & Problems', icon: '⚡' },
    { id: 'hackathons', label: 'Hackathons', icon: '🚀' }
  ];

  const LOR_CATEGORIES = [
    { id: 'all', label: 'All Letters', icon: '✦' },
    { id: 'academic', label: 'Academic & Ph.D.', icon: '🎓' },
    { id: 'cybersecurity', label: 'Cyber Security', icon: '🛡️' },
    { id: 'software', label: 'Software & Web', icon: '💻' },
    { id: 'industry', label: 'Industry & Internships', icon: '💼' }
  ];

  function classifyCard(card) {
    const isLor = card.dataset.type === 'lor' || card.closest('#gallery-lor');
    const title = (card.dataset.title || card.querySelector('.card-title')?.textContent || '').trim();
    const issuer = (card.dataset.issuer || card.querySelector('.card-meta')?.textContent || '').trim();
    const text = `${title} ${issuer} ${card.getAttribute('class') || ''}`.toLowerCase();

    if (isLor) {
      if (/ph\.d|job lor|das sir|registrar|chair|mehta|desai/i.test(text)) return 'academic';
      if (/cyber/i.test(text)) return 'cybersecurity';
      if (/web|developer|frontend|full stack/i.test(text)) return 'software';
      return 'industry';
    }

    if (/hackathon|antariksh|vultr.*hackathon/i.test(text)) return 'hackathons';
    if (/secops|cyber|security|hack|recon|pentest|penetration|threat|vulnerabilit|injection|cbtp|csedp|cnsp|cap|thm|cwl|opswat|infosec|dark web|bug hunting|jwpt|cppt|hygiene/i.test(text)) {
      return 'cybersecurity';
    }
    if (/oracle|aws|cloud|devops/i.test(text)) return 'cloud';
    if (/power bi|analytics|big data|data fundamentals|photoelectric|excel|sql|artificial intelligence|stock market/i.test(text)) {
      return 'data';
    }
    if (/interview|codevita|codechef|hackerrank|ncat/i.test(text)) return 'coding';
    if (/full stack|web|android|system design|software|api|bootcamp|scrum|rust|python|java|linux|word/i.test(text)) {
      return 'software';
    }
    return 'software';
  }

  function enhanceCards() {
    const allCards = document.querySelectorAll('.card');

    allCards.forEach(card => {
      const isLor = card.dataset.type === 'lor' || card.closest('#gallery-lor');
      const category = classifyCard(card);
      card.dataset.category = category;

      // Extract title and issuer
      const titleEl = card.querySelector('.card-title');
      const metaEl = card.querySelector('.card-meta');
      const title = card.dataset.title || (titleEl ? titleEl.textContent.trim() : '');
      const issuer = card.dataset.issuer || (metaEl ? metaEl.textContent.trim() : (isLor ? 'Recommendation' : 'Professional'));

      // Ensure data-title and data-issuer are stored
      card.dataset.title = title;
      card.dataset.issuer = issuer;

      // Add category tag on thumbnail if not already present
      const figure = card.querySelector('.card-figure');
      if (figure && !figure.querySelector('.card-category-tag')) {
        const tag = document.createElement('span');
        tag.className = 'card-category-tag';
        tag.textContent = isLor ? (category.charAt(0).toUpperCase() + category.slice(1)) : (issuer.length > 18 ? issuer.split(' ')[0] : issuer);
        figure.appendChild(tag);
      }

      // Add hover overlay with quick view badge if not present
      if (figure && !figure.querySelector('.card-hover-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'card-hover-overlay';
        overlay.innerHTML = `
          <span class="quick-view-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            Quick View
          </span>
        `;
        figure.appendChild(overlay);
      }

      // Enhance Card Body with verified row
      const cardBody = card.querySelector('.card-body');
      if (cardBody && !cardBody.querySelector('.card-meta-row')) {
        const existingMeta = cardBody.querySelector('.card-meta');
        const metaText = existingMeta ? existingMeta.textContent.trim() : (issuer || (isLor ? 'Verified Endorsement' : 'Verified'));

        if (existingMeta) existingMeta.remove();

        const metaRow = document.createElement('div');
        metaRow.className = 'card-meta-row';
        metaRow.innerHTML = `
          <span class="card-meta">
            <svg class="card-verified-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            ${metaText}
          </span>
          <span class="card-action-icon" title="Expand Credential" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </span>
        `;
        cardBody.appendChild(metaRow);
      }

      // Add click & keyboard events
      card.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        openModalForCard(card);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModalForCard(card);
        }
      });
    });
  }

  // Helper: Get real image source (handles data-src vs svg placeholder)
  function getCardImageSrc(card) {
    const imgEl = card.querySelector('.card-img');
    if (!imgEl) return '';
    if (imgEl.dataset && imgEl.dataset.src) {
      return imgEl.dataset.src;
    }
    if (imgEl.src && !imgEl.src.startsWith('data:image/svg')) {
      return imgEl.src;
    }
    return imgEl.getAttribute('data-src') || imgEl.src || '';
  }

  // =========================================================================
  // 3. CATEGORY FILTER BAR MANAGEMENT
  // =========================================================================
  function renderCategoryFilters() {
    if (!categoryFilterBar) return;
    const categories = state.currentView === 'certificate' ? CERT_CATEGORIES : LOR_CATEGORIES;
    const activeGallery = state.currentView === 'certificate' ? certGallery : lorGallery;
    const cards = activeGallery ? Array.from(activeGallery.querySelectorAll('.card')) : [];

    // Calculate dynamic counts per category
    const counts = { all: cards.length };
    cards.forEach(card => {
      const cat = card.dataset.category || 'other';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    categoryFilterBar.innerHTML = '';
    categories.forEach(cat => {
      const count = counts[cat.id] || 0;
      // Skip rendering empty categories
      if (cat.id !== 'all' && count === 0) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `filter-chip ${state.selectedCategory === cat.id ? 'active' : ''}`;
      btn.dataset.category = cat.id;
      btn.innerHTML = `
        <span aria-hidden="true">${cat.icon}</span>
        <span>${cat.label}</span>
        <span class="filter-count">(${count})</span>
      `;

      btn.addEventListener('click', () => {
        state.selectedCategory = cat.id;
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });

      categoryFilterBar.appendChild(btn);
    });
  }

  // =========================================================================
  // 4. FILTERING & SEARCH ENGINE
  // =========================================================================
  function applyFilters() {
    const activeGallery = state.currentView === 'certificate' ? certGallery : lorGallery;
    const inactiveGallery = state.currentView === 'certificate' ? lorGallery : certGallery;

    if (inactiveGallery) {
      inactiveGallery.classList.add('hidden');
      inactiveGallery.setAttribute('aria-hidden', 'true');
    }

    if (activeGallery) {
      activeGallery.classList.remove('hidden');
      activeGallery.setAttribute('aria-hidden', 'false');
    }

    const cards = activeGallery ? Array.from(activeGallery.querySelectorAll('.card')) : [];
    const query = state.searchQuery.toLowerCase().trim();
    let visibleCount = 0;
    state.visibleCards = [];

    cards.forEach(card => {
      const title = (card.dataset.title || '').toLowerCase();
      const issuer = (card.dataset.issuer || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();

      // Check category match
      const categoryMatches = state.selectedCategory === 'all' || category === state.selectedCategory;

      // Check search query match
      const searchMatches = !query || title.includes(query) || issuer.includes(query) || category.includes(query);

      if (categoryMatches && searchMatches) {
        card.style.display = '';
        state.visibleCards.push(card);
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Update result stats
    if (resultsCountEl) {
      const totalType = state.currentView === 'certificate' ? 'certificates' : 'recommendations';
      resultsCountEl.innerHTML = `Showing <strong>${visibleCount}</strong> of <strong>${cards.length}</strong> ${totalType}`;
    }

    // Toggle Empty State
    if (emptyStateEl) {
      if (visibleCount === 0) {
        emptyStateEl.classList.add('visible');
      } else {
        emptyStateEl.classList.remove('visible');
      }
    }

    // Lazy load newly visible images
    if (activeGallery) {
      triggerLazyLoad(activeGallery);
    }
  }

  // =========================================================================
  // 5. VIEW SWITCHER (CERTIFICATES VS LOR)
  // =========================================================================
  function setView(view) {
    state.currentView = view;
    state.selectedCategory = 'all';
    localStorage.setItem('portfolio-view', view);

    viewTabBtns.forEach(btn => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    renderCategoryFilters();
    applyFilters();
  }

  // =========================================================================
  // 6. LAZY LOADING WITH INTERSECTION OBSERVER
  // =========================================================================
  let observer = null;

  function initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('img[data-src]').forEach(loadImgSrc);
      return;
    }

    observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImgSrc(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '250px 0px',
      threshold: 0.01
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      img.classList.add('loading');
      observer.observe(img);
    });
  }

  function loadImgSrc(img) {
    const src = img.dataset.src;
    if (!src) return;

    img.src = src;
    img.decoding = 'async';
    img.onload = () => {
      img.classList.remove('loading');
      img.classList.add('loaded');
      img.removeAttribute('data-src');
    };
    img.onerror = () => {
      img.classList.remove('loading');
      img.classList.add('loaded');
    };
  }

  function triggerLazyLoad(container) {
    const unloaded = container.querySelectorAll('img[data-src]');
    unloaded.forEach(img => {
      if (observer) {
        observer.observe(img);
      } else {
        loadImgSrc(img);
      }
    });
  }

  // =========================================================================
  // 7. LIGHTBOX MODAL VIEWER
  // =========================================================================
  function openModalForCard(card) {
    const index = state.visibleCards.indexOf(card);
    if (index === -1) return;
    openModalAtIndex(index);
  }

  function openModalAtIndex(index) {
    if (index < 0 || index >= state.visibleCards.length) return;
    state.modalIndex = index;
    const card = state.visibleCards[index];
    const title = card.dataset.title || 'Credential Viewer';
    const issuer = card.dataset.issuer || 'Verified';
    const imgSrc = getCardImageSrc(card);

    // Update modal details
    if (modalTitleText) modalTitleText.textContent = title;
    if (modalIssuerBadge) modalIssuerBadge.textContent = issuer;
    if (modalNavCounter) modalNavCounter.textContent = `${index + 1} / ${state.visibleCards.length}`;

    // Reset zoom
    state.isZoomed = false;
    modalImg.classList.remove('zoomed');

    // Show image with smooth transition
    modalImg.style.opacity = '0.5';
    modalImg.style.filter = 'blur(4px)';

    const highRes = new Image();
    highRes.src = imgSrc;
    highRes.onload = () => {
      modalImg.src = imgSrc;
      modalImg.alt = `${title} preview`;
      modalImg.style.opacity = '1';
      modalImg.style.filter = 'none';
    };
    highRes.onerror = () => {
      modalImg.src = imgSrc;
      modalImg.style.opacity = '1';
      modalImg.style.filter = 'none';
    };

    // Preload previous and next images
    preloadModalNeighbours(index);

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function preloadModalNeighbours(index) {
    [-1, 1].forEach(offset => {
      const neighbor = state.visibleCards[index + offset];
      if (neighbor) {
        const src = getCardImageSrc(neighbor);
        if (src && !src.startsWith('data:image')) {
          const pre = new Image();
          pre.src = src;
        }
      }
    });
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    modalImg.src = '';
    state.isZoomed = false;
    modalImg.classList.remove('zoomed');
    document.body.style.overflow = '';
  }

  function nextModalImage() {
    if (state.visibleCards.length === 0) return;
    const nextIdx = (state.modalIndex + 1) % state.visibleCards.length;
    openModalAtIndex(nextIdx);
  }

  function prevModalImage() {
    if (state.visibleCards.length === 0) return;
    const prevIdx = (state.modalIndex - 1 + state.visibleCards.length) % state.visibleCards.length;
    openModalAtIndex(prevIdx);
  }

  function toggleZoom() {
    state.isZoomed = !state.isZoomed;
    modalImg.classList.toggle('zoomed', state.isZoomed);
  }

  function downloadCurrentImage() {
    if (!modalImg.src) return;
    const card = state.visibleCards[state.modalIndex];
    const title = card ? card.dataset.title : 'Certificate';
    const cleanTitle = title.replace(/[^\w\s-]/gi, '').replace(/\s+/g, '_');

    // Visual button feedback
    const originalIcon = downloadBtn.innerHTML;
    downloadBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    const a = document.createElement('a');
    a.href = modalImg.src;
    a.download = `${cleanTitle}_Lakshay_Dhoundiyal.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      downloadBtn.innerHTML = originalIcon;
    }, 1200);
  }

  // =========================================================================
  // 8. EVENT LISTENERS & SETUP
  // =========================================================================
  function setupEvents() {
    // Tab switcher
    viewTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.classList.contains('active')) {
          setView(btn.dataset.view);
        }
      });
    });

    // Search input with debounce
    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        if (searchClearBtn) {
          searchClearBtn.classList.toggle('visible', state.searchQuery.length > 0);
        }
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 180);
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.searchQuery = '';
        searchClearBtn.classList.remove('visible');
        applyFilters();
      });
    }

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        state.searchQuery = '';
        state.selectedCategory = 'all';
        if (searchClearBtn) searchClearBtn.classList.remove('visible');
        renderCategoryFilters();
        applyFilters();
      });
    }

    // Modal controls
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    if (modalNextBtn) modalNextBtn.addEventListener('click', nextModalImage);
    if (modalPrevBtn) modalPrevBtn.addEventListener('click', prevModalImage);
    if (modalZoomBtn) modalZoomBtn.addEventListener('click', toggleZoom);
    if (modalImg) modalImg.addEventListener('click', toggleZoom);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadCurrentImage);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      const isModalOpen = !modal.classList.contains('hidden');

      if (e.key === 'Escape') {
        if (isModalOpen) closeModal();
      } else if (e.key === 'ArrowRight' && isModalOpen) {
        nextModalImage();
      } else if (e.key === 'ArrowLeft' && isModalOpen) {
        prevModalImage();
      } else if (e.key === '/' && !isModalOpen && document.activeElement !== searchInput) {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
    });

    // Mobile touch swipe for modal
    let touchStartX = 0;
    let touchEndX = 0;

    if (modal) {
      modal.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      modal.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
    }

    function handleSwipe() {
      const swipeDistance = touchEndX - touchStartX;
      if (Math.abs(swipeDistance) > 50) {
        if (swipeDistance < 0) {
          nextModalImage(); // swipe left -> next
        } else {
          prevModalImage(); // swipe right -> prev
        }
      }
    }

    // Back to top floating button
    window.addEventListener('scroll', () => {
      if (backToTopBtn) {
        backToTopBtn.classList.toggle('visible', window.scrollY > 350);
      }
    }, { passive: true });

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Dynamic copyright year
    const yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // =========================================================================
  // 9. INITIALIZATION
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    enhanceCards();
    initLazyLoading();
    renderCategoryFilters();
    setView(state.currentView);
    setupEvents();
  });
})();
