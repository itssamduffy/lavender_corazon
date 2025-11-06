document.addEventListener('DOMContentLoaded', function() {

    /**
     * Smooth scrolling for navigation links
     */
    function initSmoothScroll() {
        const navLinks = document.querySelectorAll('#main-header nav a[href*="#"], .logo a[href*="#"]'); // Adjusted to catch # on same page
        const header = document.getElementById('main-header');
        let headerOffset = header ? header.offsetHeight : 70;

        // Recalculate headerOffset on resize as it might change
        window.addEventListener('resize', () => {
            headerOffset = header ? header.offsetHeight : 70;
        });
        
        navLinks.forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                const currentPath = window.location.pathname.split('/').pop() || 'index.html';
                const targetPath = href.split('#')[0];
                const targetId = href.split('#')[1];

                // If link is to a different page or just a # for top of current page
                if (targetPath && targetPath !== currentPath && targetPath !== '') {
                    // Let browser handle navigation to different page
                    // If mobile menu is open, close it
                    if (mainNav && mainNav.classList.contains('is-active')) {
                        toggleMobileMenu();
                    }
                    return; 
                }
                
                // If it's a same-page link or just "#"
                e.preventDefault();

                if (href === "#" || (targetPath === currentPath && !targetId) || (targetPath === '' && !targetId) ) { // Logo link to top of current page
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (targetId) {
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                        const offsetPosition = elementPosition - headerOffset;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                    }
                }
                
                if (mainNav && mainNav.classList.contains('is-active')) {
                    toggleMobileMenu();
                }
            });
        });
    }

    /**
     * Mobile Menu Toggle
     */
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');

    function toggleMobileMenu() {
        if (!mainNav || !menuToggle) return;
        const isActive = mainNav.classList.toggle('is-active');
        menuToggle.classList.toggle('is-active');
        menuToggle.setAttribute('aria-expanded', isActive.toString());
    }

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    document.addEventListener('click', function(event) {
        if (mainNav && mainNav.classList.contains('is-active')) {
            const isClickInsideNav = mainNav.contains(event.target);
            const isClickOnToggle = menuToggle && menuToggle.contains(event.target);
            if (!isClickInsideNav && !isClickOnToggle) {
                toggleMobileMenu();
            }
        }
    });

    /**
     * Intersection Observer for fade-in animations on sections
     */
    function initScrollAnimations() {
        const sections = document.querySelectorAll('main section');
        if (sections.length === 0) return;
        const options = { root: null, rootMargin: '0px', threshold: 0.1 };
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, options);
        sections.forEach(section => observer.observe(section));
    }

    /**
     * Dynamically load blog entries based on container ID
     */
    function loadEntries() {
        const entriesContainers = [
            { id: 'entries-container-sam', jsonFile: 'data/sam-entries.json', artist: 'Sam Duffy' },
            { id: 'entries-container-rune', jsonFile: 'data/rune-entries.json', artist: 'Rune Soto Ponce' }
        ];

        entriesContainers.forEach(containerConfig => {
            const containerElement = document.getElementById(containerConfig.id);
            if (!containerElement) return;

            const loadingMessageElement = containerElement.querySelector('.loading-message');

            fetch(containerConfig.jsonFile)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${containerConfig.jsonFile}`);
                    return response.json();
                })
                .then(data => {
                    if (loadingMessageElement) loadingMessageElement.remove();
                    if (data.entries && data.entries.length > 0) {
                        data.entries.forEach(entry => {
                            const entryPreview = document.createElement('article');
                            entryPreview.classList.add('entry-preview');
                            const placeholderUrl = `https://placehold.co/360x240/e8e8e8/666?text=Image`;
                            const imageHtml = entry.imageUrl ? `
                                <img src="${placeholderUrl}" 
                                     data-src="${entry.imageUrl}" 
                                     alt="${entry.title || 'Entry image'}" 
                                     class="lazy-load"
                                     onerror="this.onerror=null; this.src='https://placehold.co/360x240/eee/ccc?text=Error'; this.classList.remove('lazy-load');">` : '';
                            entryPreview.innerHTML = `
                                ${imageHtml}
                                <div class="entry-content">
                                    <h3><a href="${entry.substackUrl || entry.postUrl}" target="_blank" rel="noopener noreferrer">${entry.title}</a></h3>
                                    <p class="excerpt">${entry.excerpt}</p>
                                    <a href="${entry.substackUrl || entry.postUrl}" target="_blank" rel="noopener noreferrer" class="read-more">Read Full Entry <span class="sr-only">for ${entry.title}</span> &rarr;</a>
                                </div>`;
                            containerElement.appendChild(entryPreview);
                        });
                        initLazyLoad();
                    } else {
                        containerElement.innerHTML = `<p class="error-message-global">No entries found for ${containerConfig.artist}.</p>`;
                    }
                })
                .catch(error => {
                    console.error(`Error fetching entries for ${containerConfig.artist}:`, error);
                    if (loadingMessageElement) loadingMessageElement.remove();
                    containerElement.innerHTML = `<p class="error-message-global">Could not load entries for ${containerConfig.artist}. (${error.message})</p>`;
                });
        });
    }

    /**
     * Lazy Loading for Images
     */
    function initLazyLoad() {
        const lazyImages = document.querySelectorAll('img.lazy-load');
        if (lazyImages.length === 0) return;
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-load');
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: "0px 0px 100px 0px" });
        lazyImages.forEach(img => imageObserver.observe(img));
    }

    /**
     * Contact Form Handling (generalized)
     */
    function setupContactForm(formId, artistName, artistEmail) {
        const contactForm = document.getElementById(formId);
        if (!contactForm) return;

        const formFeedback = contactForm.nextElementSibling; // Assumes feedback div is immediately after form

        function validateField(field) {
            const errorElement = field.parentElement.querySelector('.error-message');
            let isValid = true;
            let message = '';
            if (field.hasAttribute('required') && !field.value.trim()) {
                isValid = false;
                message = `${field.previousElementSibling.textContent} is required.`;
            } else if (field.type === 'email' && field.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
                isValid = false;
                message = 'Please enter a valid email address.';
            }
            if (errorElement) errorElement.textContent = message;
            field.classList.toggle('invalid', !isValid);
            return isValid;
        }
        
        function validateForm(form) {
            let isFormValid = true;
            form.querySelectorAll('input[required], textarea[required]').forEach(field => {
                if (!validateField(field)) isFormValid = false;
            });
            return isFormValid;
        }

        contactForm.querySelectorAll('input[required], textarea[required]').forEach(field => {
            field.addEventListener('blur', () => validateField(field));
        });

        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            if (!validateForm(contactForm)) {
                if (formFeedback) {
                    formFeedback.textContent = 'Please correct the errors in the form.';
                    formFeedback.className = 'form-feedback error';
                    formFeedback.style.display = 'block';
                }
                const firstInvalidField = contactForm.querySelector('.invalid');
                if (firstInvalidField) firstInvalidField.focus();
                return;
            }

            const name = contactForm.querySelector('[name="name"]').value;
            const email = contactForm.querySelector('[name="email"]').value; // User's email
            const messageContent = contactForm.querySelector('[name="message"]').value;
            const subject = `Message from ${name} via Lavender Corazón (${artistName})`;
            const mailtoLink = `mailto:${artistEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageContent)}%0D%0A%0D%0AFrom:%20${encodeURIComponent(name)}%0D%0AReply-To:%20${encodeURIComponent(email)}`;

            if (formFeedback) {
                formFeedback.textContent = 'Your message is ready. Please click "OK" in your email client to send.';
                formFeedback.className = 'form-feedback success';
                formFeedback.style.display = 'block';
            }
            window.location.href = mailtoLink;
            setTimeout(() => {
                contactForm.reset();
                contactForm.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
                contactForm.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            }, 3000);
        });
    }
    
    /**
     * Update current year in footer
     */
    function updateFooterYear() {
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
    }

    // Initialize all functionalities
    initSmoothScroll();
    initScrollAnimations();
    loadEntries();
    updateFooterYear();
    
    // Setup contact forms for specific pages
    setupContactForm('contact-form-sam', 'Sam Duffy', 'sduffy@lavendercorazon.com');
    setupContactForm('contact-form-rune', 'Rune Soto Ponce', 'rune@lavendercorazon.com'); // Example email
});


(function(){
  const dlg   = document.getElementById('portfolio-lightbox');
  const imgEl = document.getElementById('lb-img');
  const capEl = document.getElementById('lb-cap');
  const prev  = dlg.querySelector('.lb-prev');
  const next  = dlg.querySelector('.lb-next');
  const close = dlg.querySelector('.lb-close');

  // Build an array from your existing carousel
  const cards = Array.from(document.querySelectorAll('.series-carousel .card'));
  const items = cards.map(card => {
    const img = card.querySelector('img');
    const cap = card.querySelector('.card-caption')?.textContent.trim() || '';
    return { src: img.currentSrc || img.src, alt: img.alt || '', cap };
  });

  let i = 0;
  const mod = (n, m) => (n % m + m) % m;

  function render(){
    const it = items[i];
    imgEl.src = it.src;
    imgEl.alt = it.alt;
    capEl.textContent = it.cap;
    // Preload neighbors for snappy nav
    [-1, 1].forEach(d => { const j = mod(i + d, items.length); new Image().src = items[j].src; });
  }

  function openAt(index){
    i = index;
    render();
    dlg.showModal();
    close.focus();
  }

  // Click to open
  cards.forEach((card, idx) => {
    card.querySelector('.card-hero')?.addEventListener('click', () => openAt(idx));
  });

  // Controls
  prev.addEventListener('click', () => { i = mod(i-1, items.length); render(); });
  next.addEventListener('click', () => { i = mod(i+1, items.length); render(); });
  close.addEventListener('click', () => dlg.close());

  // Keyboard
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { i = mod(i-1, items.length); render(); }
    if (e.key === 'ArrowRight') { i = mod(i+1, items.length); render(); }
    if (e.key === 'Escape')     { dlg.close(); }
  });

  // Click backdrop to close
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg.close();
  });
})();
