// filepath: script.js
/* external JS: theme toggle with switch, image modal viewer, keyboard + click-outside support */
(() => {
  'use strict';

  // Performance optimization: Debounce function
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

  // Theme Management
  const html = document.documentElement;
  const themeSwitch = document.getElementById("themeSwitch");

  // Initialize theme from localStorage
  const storedTheme = localStorage.getItem("theme");
  if (storedTheme === "dark") {
    html.setAttribute("data-theme", "dark");
    themeSwitch.checked = true;
    themeSwitch.setAttribute("aria-checked", "true");
  }

  // Toggle theme with animation
  themeSwitch.addEventListener("change", () => {
    const isDark = themeSwitch.checked;
    
    // Add transition for smooth theme change
    html.style.transition = 'background-color 0.3s ease, color 0.3s ease';
    html.setAttribute("data-theme", isDark ? "dark" : "light");
    themeSwitch.setAttribute("aria-checked", String(isDark));
    localStorage.setItem("theme", isDark ? "dark" : "light");
    
    // Remove transition after animation completes
    setTimeout(() => {
      html.style.transition = '';
    }, 300);
  });

  // Image Modal Management
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImg");
  const modalClose = document.getElementById("modalClose");
  const downloadBtn = document.getElementById("downloadBtn");
  const backdrop = modal?.querySelector(".modal-backdrop");

  let currentImageSrc = "";
  let currentImageTitle = "";
  let imageObserver = null;
  let loadedImages = new Set(); // Track loaded images to avoid duplicates

  function openImage(imgSrc, title) {
    currentImageSrc = imgSrc;
    currentImageTitle = title;
    
    // Show loading state
    modalImg.style.opacity = '0.7';
    modalImg.style.filter = 'blur(2px)';
    modalImg.style.transition = 'opacity 0.3s ease, filter 0.3s ease';
    
    // Load high quality image
    const highQualityImg = new Image();
    highQualityImg.onload = () => {
      modalImg.src = imgSrc;
      modalImg.alt = `${title} - Full view`;
      modalImg.style.opacity = '1';
      modalImg.style.filter = 'blur(0)';
      
      // Preload nearby images
      preloadNearbyImages(imgSrc);
    };
    
    highQualityImg.onerror = () => {
      modalImg.src = imgSrc;
      modalImg.alt = `${title} - Full view`;
      modalImg.style.opacity = '1';
      modalImg.style.filter = 'blur(0)';
    };
    
    highQualityImg.src = imgSrc;
    
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeImage() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    modalImg.src = "";
    modalImg.style.opacity = '1';
    modalImg.style.filter = 'none';
    document.body.style.overflow = "";
  }

  // Download image function
  function downloadImage() {
    if (!currentImageSrc) return;
    
    // Add visual feedback
    const originalHTML = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    downloadBtn.style.transform = 'scale(0.9)';
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = currentImageSrc;
    link.download = `${currentImageTitle.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')}_certificate.png`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Reset button state
    setTimeout(() => {
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.style.transform = '';
    }, 500);
  }

  // Optimized image loading with Intersection Observer
  function initializeLazyLoading(galleryElement = null) {
    if (!('IntersectionObserver' in window)) {
      // Fallback for browsers without Intersection Observer
      loadAllImages(galleryElement);
      return;
    }

    // Disconnect existing observer if any
    if (imageObserver) {
      imageObserver.disconnect();
    }

    imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          loadImage(img);
          
          // Preload next 2 images
          const nextImages = getNextImages(img);
          nextImages.forEach(nextImg => preloadImage(nextImg));
          
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px 0px', // Start loading 200px before image enters viewport
      threshold: 0.01
    });

    // Determine which images to observe
    let imagesToObserve;
    if (galleryElement) {
      // Observe only images in the specified gallery
      imagesToObserve = galleryElement.querySelectorAll('img[data-src]');
    } else {
      // Observe all images with data-src attribute
      imagesToObserve = document.querySelectorAll('img[data-src]');
    }

    // Observe the images
    imagesToObserve.forEach(img => {
      imageObserver.observe(img);
    });

    // Preload first visible images immediately
    const visibleGallery = galleryElement || document.querySelector('.gallery:not(.hidden)');
    if (visibleGallery) {
      const firstImages = visibleGallery.querySelectorAll('img[data-src]');
      // Load more images on larger screens
      const preloadCount = window.innerWidth > 768 ? 8 : (window.innerWidth > 480 ? 4 : 2);
      Array.from(firstImages).slice(0, preloadCount).forEach(img => {
        loadImage(img);
      });
    }
  }

  function loadImage(imgElement) {
    const dataSrc = imgElement.getAttribute('data-src');
    if (!dataSrc || loadedImages.has(dataSrc)) return;

    loadedImages.add(dataSrc);
    
    // Add loading class
    imgElement.classList.add('loading');
    
    const img = new Image();
    img.onload = () => {
      imgElement.src = dataSrc;
      imgElement.removeAttribute('data-src');
      imgElement.classList.remove('loading');
      imgElement.classList.add('loaded');
    };
    
    img.onerror = () => {
      imgElement.classList.remove('loading');
      loadedImages.delete(dataSrc);
      console.error('Failed to load image:', dataSrc);
    };
    
    img.src = dataSrc;
  }

  function preloadImage(imgElement) {
    const dataSrc = imgElement.getAttribute('data-src');
    if (!dataSrc || loadedImages.has(dataSrc)) return;

    loadedImages.add(dataSrc);
    
    const img = new Image();
    img.src = dataSrc;
  }

  // Helper function to get next images
  function getNextImages(currentImg) {
    const gallery = currentImg.closest('.gallery');
    if (!gallery) return [];
    
    const allImages = Array.from(gallery.querySelectorAll('img[data-src]'));
    const currentIndex = allImages.indexOf(currentImg);
    
    // Preload more images on larger screens
    const preloadCount = window.innerWidth > 768 ? 3 : 2;
    return allImages.slice(currentIndex + 1, currentIndex + 1 + preloadCount);
  }

  // Fallback for browsers without Intersection Observer
  function loadAllImages(galleryElement = null) {
    let images;
    if (galleryElement) {
      images = galleryElement.querySelectorAll('img[data-src]');
    } else {
      images = document.querySelectorAll('img[data-src]');
    }
    
    images.forEach(img => {
      loadImage(img);
    });
  }

  // Preload images near the currently viewed one
  function preloadNearbyImages(currentSrc) {
    const currentGallery = document.querySelector('.gallery:not(.hidden)');
    if (!currentGallery) return;
    
    const allImages = Array.from(currentGallery.querySelectorAll('img'));
    const currentIndex = allImages.findIndex(img => img.src === currentSrc);
    
    if (currentIndex === -1) return;
    
    // Preload next images based on screen size
    const preloadCount = window.innerWidth > 768 ? 4 : 3;
    const nextImages = allImages.slice(currentIndex + 1, currentIndex + 1 + preloadCount);
    
    nextImages.forEach(img => {
      if (img.src && !img.complete) {
        const tempImg = new Image();
        tempImg.src = img.src;
      }
    });
  }

  // Set up card click listeners
  function setupCardClickListeners() {
    document.querySelectorAll(".card").forEach((card) => {
      // Click event
      card.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        const imgElement = card.querySelector(".card-img");
        const title = card.dataset.title;
        if (imgElement && imgElement.src) {
          openImage(imgElement.src, title);
        }
      });

      // Keyboard navigation
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const imgElement = card.querySelector(".card-img");
          const title = card.dataset.title;
          if (imgElement && imgElement.src) {
            openImage(imgElement.src, title);
          }
        }
      });
    });
  }

  // Close image modal
  if (modalClose) {
    modalClose.addEventListener("click", closeImage);
  }
  
  if (backdrop) {
    backdrop.addEventListener("click", closeImage);
  }

  // Download button
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadImage);
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeImage();
    }
    
    // Arrow key navigation for modal (optional)
    if (!modal.classList.contains("hidden") && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      navigateModalImages(e.key === "ArrowRight" ? 1 : -1);
    }
  });

  // Modal image navigation
  function navigateModalImages(direction) {
    const currentGallery = document.querySelector('.gallery:not(.hidden)');
    if (!currentGallery) return;
    
    const allCards = Array.from(currentGallery.querySelectorAll('.card'));
    const currentCardIndex = allCards.findIndex(card => 
      card.querySelector('.card-img')?.src === currentImageSrc
    );
    
    if (currentCardIndex === -1) return;
    
    const nextIndex = currentCardIndex + direction;
    if (nextIndex >= 0 && nextIndex < allCards.length) {
      const nextCard = allCards[nextIndex];
      const nextImg = nextCard.querySelector('.card-img');
      const nextTitle = nextCard.dataset.title;
      
      if (nextImg && nextImg.src) {
        openImage(nextImg.src, nextTitle);
      }
    }
  }

  // Initialize everything when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    // Set dynamic year for footer
    try {
      const yearEl = document.querySelector('.site-footer .year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();
    } catch (e) {
      /* silent */
    }
    
    // Initialize lazy loading for visible gallery
    const visibleGallery = document.querySelector('.gallery:not(.hidden)');
    if (visibleGallery) {
      initializeLazyLoading(visibleGallery);
    }
    
    // Setup card click listeners
    setupCardClickListeners();
    
    // Performance: Clean up on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, pause image loading
        if (imageObserver) {
          imageObserver.disconnect();
        }
      } else {
        // Page is visible again, resume lazy loading
        const visibleGallery = document.querySelector('.gallery:not(.hidden)');
        if (visibleGallery) {
          initializeLazyLoading(visibleGallery);
        }
      }
    });
    
    // Optimize for slow connections
    if (navigator.connection) {
      if (navigator.connection.saveData || navigator.connection.effectiveType.includes('2g')) {
        // Reduce preloading on slow connections
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
          img.setAttribute('loading', 'lazy');
        });
      }
    }
  });

  // Window load event for final optimizations
  window.addEventListener('load', () => {
    // Remove loading state from any remaining images
    document.querySelectorAll('.loading').forEach(img => {
      img.classList.remove('loading');
    });
  });

  // Make initializeLazyLoading available globally for BSR toggle
  window.initializeLazyLoading = initializeLazyLoading;
  window.loadImage = loadImage;
})();

// BSR toggle behaviour (Certificate / LOR) - FIXED VERSION
;(function () {
  'use strict';
  
  const btns = document.querySelectorAll('.bsr-btn');
  const root = document.documentElement;
  const storageKey = 'bsr-view';

  const certGallery = document.getElementById('gallery-certificate');
  const lorGallery = document.getElementById('gallery-lor');

  function setView(view) {
    // Update active states
    btns.forEach(b => {
      const isActive = b.dataset.view === view;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    
    // Expose current view on root for CSS hooks
    root.setAttribute('data-view', view);
    localStorage.setItem(storageKey, view);

    // Show/hide galleries
    if (certGallery && lorGallery) {
      if (view === 'certificate') {
        // Hide LOR gallery
        lorGallery.classList.add('hidden');
        lorGallery.setAttribute('aria-hidden', 'true');
        
        // Show Certificate gallery
        certGallery.classList.remove('hidden');
        certGallery.setAttribute('aria-hidden', 'false');
        
        // Initialize lazy loading for certificate gallery
        setTimeout(() => {
          if (typeof window.initializeLazyLoading === 'function') {
            window.initializeLazyLoading(certGallery);
          }
          
          // Also, manually load any images that might not be observed
          const unloadedImages = certGallery.querySelectorAll('img[data-src]');
          if (unloadedImages.length > 0) {
            // Load first few immediately
            const preloadCount = Math.min(4, unloadedImages.length);
            for (let i = 0; i < preloadCount; i++) {
              if (typeof window.loadImage === 'function') {
                window.loadImage(unloadedImages[i]);
              } else {
                // Fallback: directly set src
                const dataSrc = unloadedImages[i].getAttribute('data-src');
                if (dataSrc) {
                  unloadedImages[i].src = dataSrc;
                  unloadedImages[i].removeAttribute('data-src');
                }
              }
            }
          }
        }, 100);
      } else {
        // Hide Certificate gallery
        certGallery.classList.add('hidden');
        certGallery.setAttribute('aria-hidden', 'true');
        
        // Show LOR gallery
        lorGallery.classList.remove('hidden');
        lorGallery.setAttribute('aria-hidden', 'false');
        
        // Initialize lazy loading for LOR gallery
        setTimeout(() => {
          if (typeof window.initializeLazyLoading === 'function') {
            window.initializeLazyLoading(lorGallery);
          }
          
          // Also, manually load any images that might not be observed
          const unloadedImages = lorGallery.querySelectorAll('img[data-src]');
          if (unloadedImages.length > 0) {
            // Load first few immediately
            const preloadCount = Math.min(4, unloadedImages.length);
            for (let i = 0; i < preloadCount; i++) {
              if (typeof window.loadImage === 'function') {
                window.loadImage(unloadedImages[i]);
              } else {
                // Fallback: directly set src
                const dataSrc = unloadedImages[i].getAttribute('data-src');
                if (dataSrc) {
                  unloadedImages[i].src = dataSrc;
                  unloadedImages[i].removeAttribute('data-src');
                }
              }
            }
          }
        }, 100);
      }
    }
  }

  // Initialize from storage or default to certificate
  const initial = localStorage.getItem(storageKey) || 'certificate';
  setView(initial);

  // Button event listeners
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.classList.contains('active')) {
        setView(btn.dataset.view);
      }
    });
    
    btn.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !btn.classList.contains('active')) {
        e.preventDefault();
        setView(btn.dataset.view);
      }
    });
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  const imgs = document.querySelectorAll('img[data-src]');

  const loadImage = img => {
    if (!img.dataset.src) return;
    img.src = img.dataset.src;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.decoding = 'async';
    img.removeAttribute('data-src');
    img.classList.add('loaded');
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadImage(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px', threshold: 0.01 });

    imgs.forEach(img => io.observe(img));
  } else {
    imgs.forEach(loadImage); // fallback
  }
});
