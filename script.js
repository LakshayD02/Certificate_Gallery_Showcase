// filepath: c:\Users\jyoti\OneDrive\Documents\Desktop\Project_Laddu\certificate-gallery\script.js
/* external JS: theme toggle with switch, image modal viewer, keyboard + click-outside support */
(() => {
  const html = document.documentElement
  const themeSwitch = document.getElementById("themeSwitch")

  // Initialize theme from localStorage
  const stored = localStorage.getItem("theme")
  if (stored === "dark") {
    html.setAttribute("data-theme", "dark")
    themeSwitch.checked = true
    themeSwitch.setAttribute("aria-checked", "true")
  }

  // Toggle theme
  themeSwitch.addEventListener("change", () => {
    const isDark = themeSwitch.checked
    html.setAttribute("data-theme", isDark ? "dark" : "light")
    themeSwitch.setAttribute("aria-checked", String(isDark))
    localStorage.setItem("theme", isDark ? "dark" : "light")
  })

  // Image Modal
  const modal = document.getElementById("imageModal")
  const modalImg = document.getElementById("modalImg")
  const modalClose = document.getElementById("modalClose")
  const downloadBtn = document.getElementById("downloadBtn")
  const backdrop = modal.querySelector(".modal-backdrop")

  let currentImageSrc = "";
  let currentImageTitle = "";

  function openImage(imgSrc, title) {
    currentImageSrc = imgSrc;
    currentImageTitle = title;
    modalImg.src = imgSrc
    modalImg.alt = `${title} - Full view`
    modal.classList.remove("hidden")
    modal.setAttribute("aria-hidden", "false")
    document.body.style.overflow = "hidden"
  }

  function closeImage() {
    modal.classList.add("hidden")
    modal.setAttribute("aria-hidden", "true")
    modalImg.src = ""
    document.body.style.overflow = ""
  }

  // Download image function
  function downloadImage() {
    if (!currentImageSrc) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = currentImageSrc;
    link.download = `${currentImageTitle.replace(/\s+/g, '_')}_certificate.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Open image on card click
  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("a")) return
      const imgElement = card.querySelector(".card-img")
      const title = card.dataset.title
      if (imgElement && imgElement.src) {
        openImage(imgElement.src, title)
      }
    })

    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        const imgElement = card.querySelector(".card-img")
        const title = card.dataset.title
        if (imgElement && imgElement.src) {
          openImage(imgElement.src, title)
        }
      }
    })
  })

  // Close image modal
  if (modalClose) {
    modalClose.addEventListener("click", closeImage)
  }
  
  if (backdrop) {
    backdrop.addEventListener("click", closeImage)
  }

  // Download button
  if (downloadBtn) {
    downloadBtn.addEventListener("click", downloadImage)
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      closeImage()
    }
  })

  // set dynamic year for footer (if footer present)
  try {
    const yearEl = document.querySelector('.site-footer .year')
    if (yearEl) yearEl.textContent = new Date().getFullYear()
  } catch (e) {
    /* silent */
  }
})()

// BSR toggle behaviour (Certificate / LOR)
;(function () {
  const btns = document.querySelectorAll('.bsr-btn')
  const root = document.documentElement
  const storageKey = 'bsr-view'

  const certGallery = document.getElementById('gallery-certificate')
  const lorGallery = document.getElementById('gallery-lor')

  function setView(view) {
    // update active states
    btns.forEach(b => {
      const is = b.dataset.view === view
      b.classList.toggle('active', is)
      b.setAttribute('aria-selected', is ? 'true' : 'false')
    })
    // expose current view on root for CSS hooks or JS
    root.setAttribute('data-view', view)
    localStorage.setItem(storageKey, view)

    // show/hide galleries
    if (certGallery && lorGallery) {
      if (view === 'certificate') {
        certGallery.classList.remove('hidden')
        certGallery.setAttribute('aria-hidden', 'false')
        lorGallery.classList.add('hidden')
        lorGallery.setAttribute('aria-hidden', 'true')
      } else {
        lorGallery.classList.remove('hidden')
        lorGallery.setAttribute('aria-hidden', 'false')
        certGallery.classList.add('hidden')
        certGallery.setAttribute('aria-hidden', 'true')
      }
    }
  }

  // init from storage or default to certificate
  const initial = localStorage.getItem(storageKey) || 'certificate'
  setView(initial)

  btns.forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view))
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setView(btn.dataset.view)
      }
    })
  })
})()
