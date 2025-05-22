document.addEventListener('DOMContentLoaded', function() {

    /**
     * Smooth scrolling for navigation links
     */
    function initSmoothScroll() {
        const navLinks = document.querySelectorAll('#main-header nav a[href^="#"], .logo a[href="#"]');
        const header = document.getElementById('main-header');
        const headerOffset = header ? header.offsetHeight : 70; // Fallback if header not found immediately

        navLinks.forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                
                // Special case for logo link to scroll to top
                if (targetId === "#") {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // If mobile menu is open, close it
                    if (mainNav.classList.contains('is-active')) {
                        toggleMobileMenu();
                    }
                    return;
                }

                const targetElement = document.querySelector(targetId);

                if (targetElement) {
                    const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                    const offsetPosition = elementPosition - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // If mobile menu is open, close it after clicking a link
                    if (mainNav.classList.contains('is-active')) {
                        toggleMobileMenu();
                    }
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
        const isActive = mainNav.classList.toggle('is-active');
        menuToggle.classList.toggle('is-active');
        menuToggle.setAttribute('aria-expanded', isActive.toString());
        // Optional: Trap focus within the mobile menu when open
    }

    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    }
    
    /**
     * Close mobile menu when clicking outside of it
     */
    document.addEventListener('click', function(event) {
        if (mainNav && mainNav.classList.contains('is-active')) {
            const isClickInsideNav = mainNav.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
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
        const options = {
            root: null, // relative to document viewport
            rootMargin: '0px',
            threshold: 0.1 // 10% of the section is visible
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Optional: stop observing once visible
                }
            });
        }, options);

        sections.forEach(section => {
            observer.observe(section);
        });
    }


    /**
     * Dynamically load blog entries with lazy loading for images
     */
    function loadEntries() {
        const entriesContainer = document.getElementById('entries-container');
        if (!entriesContainer) return;

        const loadingMessageElement = entriesContainer.querySelector('.loading-message');

        fetch('entries.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (loadingMessageElement) loadingMessageElement.remove();

                if (data.entries && data.entries.length > 0) {
                    data.entries.forEach(entry => {
                        const entryPreview = document.createElement('article');
                        entryPreview.classList.add('entry-preview');

                        // Image handling with placeholder and lazy loading attribute
                        let imageHtml = '';
                        if (entry.imageUrl) {
                            const placeholderUrl = `https://placehold.co/400x300/e8e8e8/666?text=Loading+Image...`;
                            imageHtml = `
                                <img src="${placeholderUrl}" 
                                     data-src="${entry.imageUrl}" 
                                     alt="${entry.title || 'Blog post image'}" 
                                     class="lazy-load"
                                     onerror="this.onerror=null; this.src='https://placehold.co/400x300/eee/ccc?text=Image+Error'; this.classList.remove('lazy-load');">`;
                        }

                        entryPreview.innerHTML = `
                            ${imageHtml}
                            <div class="entry-content">
                                <h3><a href="${entry.substackUrl}" target="_blank" rel="noopener noreferrer">${entry.title}</a></h3>
                                <p class="excerpt">${entry.excerpt}</p>
                                <a href="${entry.substackUrl}" target="_blank" rel="noopener noreferrer" class="read-more">Read Full Entry <span class="sr-only">on Substack for ${entry.title}</span> &rarr;</a>
                            </div>
                        `;
                        entriesContainer.appendChild(entryPreview);
                    });
                    initLazyLoad(); // Initialize lazy loading after entries are added
                } else {
                    entriesContainer.innerHTML = '<p class="error-message-global">No entries found at this time.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching entries:', error);
                if (loadingMessageElement) loadingMessageElement.remove();
                entriesContainer.innerHTML = `<p class="error-message-global">Could not load entries. Please try again later. (${error.message})</p>`;
            });
    }

    /**
     * Lazy Loading for Images
     */
    function initLazyLoad() {
        const lazyImages = document.querySelectorAll('img.lazy-load');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-load');
                    img.classList.add('loaded'); // Optional: for styling loaded images
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: "0px 0px 100px 0px" }); // Load images 100px before they enter viewport

        lazyImages.forEach(img => imageObserver.observe(img));
    }


    /**
     * Contact Form Handling with Client-Side Validation
     */
    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');

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

        if (errorElement) {
            errorElement.textContent = message;
        }
        field.classList.toggle('invalid', !isValid);
        return isValid;
    }
    
    function validateForm(form) {
        let isFormValid = true;
        form.querySelectorAll('input[required], textarea[required]').forEach(field => {
            if (!validateField(field)) {
                isFormValid = false;
            }
        });
        return isFormValid;
    }

    if (contactForm) {
        // Add input event listeners for real-time validation feedback after first submit attempt or blur
        contactForm.querySelectorAll('input[required], textarea[required]').forEach(field => {
            field.addEventListener('blur', () => validateField(field));
            // Or use 'input' for even more immediate feedback, but blur is often less intrusive
        });

        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            if (!validateForm(contactForm)) {
                if (formFeedback) {
                    formFeedback.textContent = 'Please correct the errors in the form.';
                    formFeedback.className = 'form-feedback error';
                    formFeedback.style.display = 'block';
                }
                // Focus the first invalid field
                const firstInvalidField = contactForm.querySelector('.invalid');
                if (firstInvalidField) {
                    firstInvalidField.focus();
                }
                return;
            }

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const messageContent = document.getElementById('message').value;
            const subject = `Message from ${name} via Portfolio Contact Form`;

            const mailtoLink = `mailto:altforduffy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageContent)}%0D%0A%0D%0AFrom:%20${encodeURIComponent(name)}%0D%0AReply-To:%20${encodeURIComponent(email)}`;

            if (formFeedback) {
                formFeedback.textContent = 'Your message is ready. Please click "OK" in your email client to send.';
                formFeedback.className = 'form-feedback success';
                formFeedback.style.display = 'block';
            }
            
            // Attempt to open mail client
            window.location.href = mailtoLink;

            // Reset form after a short delay (user might be navigated away by mailto)
            setTimeout(() => {
                contactForm.reset();
                contactForm.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
                contactForm.querySelectorAll('.error-message').forEach(el => el.textContent = '');
                if (formFeedback) {
                    // Don't hide feedback immediately, user might still be looking at it
                    // formFeedback.style.display = 'none'; 
                }
            }, 3000);
        });
    }

    /**
     * Update current year in footer
     */
    function updateFooterYear() {
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
    }

    // Initialize all functionalities
    initSmoothScroll();
    initScrollAnimations();
    loadEntries(); // This will also call initLazyLoad after entries are populated
    updateFooterYear();
    // Note: Contact form validation is set up via its event listener directly.
});
