// Immediate Theme Detection (avoids flash of light mode)
(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    /* ===== TOAST NOTIFICATION UTILITIES ===== */
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    window.showToast = function(message, type = 'success') {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = message;
        toast.className = 'toast-notification'; // Reset classes
        toast.classList.add('active', type);

        if (toastIcon) {
            if (type === 'success') {
                toastIcon.className = 'fa-solid fa-circle-check';
                toastIcon.style.color = '#10B981';
            } else if (type === 'error') {
                toastIcon.className = 'fa-solid fa-circle-exclamation';
                toastIcon.style.color = '#EF4444';
            } else {
                toastIcon.className = 'fa-solid fa-circle-info';
                toastIcon.style.color = '#C9A84C';
            }
        }

        setTimeout(hideToast, 5000);
    };

    window.hideToast = function() {
        if (toast) toast.classList.remove('active');
    };

    /* ===== PERSISTENT AUTHENTICATION STATE ===== */
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const loginBtn = document.getElementById('openLoginModalBtn');
    const loggedInState = document.getElementById('loggedInState');
    const userNameSpan = document.querySelector('.user-name');
    const userAvatar = document.querySelector('.user-avatar');

    if (isLoggedIn) {
        const userData = JSON.parse(localStorage.getItem('patientUser') || '{}');
        if (loginBtn) loginBtn.style.display = 'none';
        if (loggedInState) loggedInState.style.display = 'block';
        if (userNameSpan) userNameSpan.textContent = userData.name || 'Patient';
        if (userAvatar && userData.name) {
            userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0A1628&color=C9A84C`;
        }
    } else {
        if (loginBtn) loginBtn.style.display = 'inline-flex';
        if (loggedInState) loggedInState.style.display = 'none';
    }

    /* ===== LOGOUT HANDLER ===== */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('patientUser');
            showToast('Logged out successfully.', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }

    /* ===== PATIENT PORTAL DASHBOARD MODAL ===== */
    const myAppointmentsBtn = document.getElementById('myAppointmentsBtn');
    const dashboardModal = document.getElementById('dashboardModal');
    const closeDashboardBtn = document.getElementById('closeDashboardBtn');

    if (myAppointmentsBtn && dashboardModal) {
        myAppointmentsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dashboardModal.classList.add('active');
            // Close dropdown menu if active
            const dropdown = document.querySelector('.user-dropdown');
            if (dropdown) dropdown.classList.remove('active');
        });
    }

    if (closeDashboardBtn && dashboardModal) {
        closeDashboardBtn.addEventListener('click', () => {
            dashboardModal.classList.remove('active');
        });
        
        // Close modal when clicking on overlay background
        dashboardModal.addEventListener('click', (e) => {
            if (e.target === dashboardModal) {
                dashboardModal.classList.remove('active');
            }
        });
    }

    /* ===== SCROLL ANIMATIONS (Intersection Observer) ===== */
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        scrollObserver.observe(el);
    });

    /* ===== NAVBAR SCROLL EFFECT ===== */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    /* ===== DARK MODE TOGGLE ===== */
    const darkModeToggle = document.getElementById('darkModeToggle');
    const themeIcon = darkModeToggle ? darkModeToggle.querySelector('i') : null;

    // Set initial icon based on theme
    function updateThemeIcon() {
        if (!themeIcon) return;
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            themeIcon.className = 'fa-solid fa-sun';
            themeIcon.style.color = '#F59E0B'; // Warm amber sun
        } else {
            themeIcon.className = 'fa-solid fa-moon';
            themeIcon.style.color = 'var(--color-navbar-links)'; // Default moon color
        }
    }
    updateThemeIcon();

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            let newTheme = 'light';
            if (currentTheme === 'light') {
                newTheme = 'dark';
            }
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon();
            showToast(`Switched to ${newTheme} mode!`, 'info');
        });
    }

    /* ===== MOBILE MENU TOGGLE ===== */
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    /* ===== SMOOTH SCROLLING FOR NAV LINKS ===== */
    document.querySelectorAll('.nav-link, .nav-book-btn, .hero-buttons .btn-gold, .hero-buttons .btn-outline').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#') && targetId !== '#') {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const navHeight = navbar ? navbar.offsetHeight : 80;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navHeight;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
                // Close mobile menu on click
                if (navLinks && navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                }
            }
        });
    });

    /* ===== USER DROPDOWN TOGGLE ===== */
    const userBtn = document.getElementById('userBtn');
    if (userBtn) {
        userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = userBtn.closest('.user-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('active');
            }
        });
    }

    // Close user dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const activeDropdown = document.querySelector('.user-dropdown.active');
        if (activeDropdown && !activeDropdown.contains(e.target)) {
            activeDropdown.classList.remove('active');
        }
    });

    /* ===== STATS COUNTER ANIMATION ===== */
    const statsSection = document.querySelector('.stats-bar');
    const statNumbers = document.querySelectorAll('.stat-number');
    let animatedStats = false;

    function animateCounters() {
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const suffix = stat.getAttribute('data-suffix') || '';
            const duration = 2000; // Animation duration in ms
            const stepTime = 30; // Step update time in ms
            const steps = Math.ceil(duration / stepTime);
            const increment = target / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    clearInterval(timer);
                    stat.textContent = target.toLocaleString() + suffix;
                } else {
                    stat.textContent = Math.floor(current).toLocaleString() + suffix;
                }
            }, stepTime);
        });
    }

    if (statsSection && statNumbers.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !animatedStats) {
                    animateCounters();
                    animatedStats = true;
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        statsObserver.observe(statsSection);
    }

    /* ===== PUBLICATIONS CATEGORY FILTER ===== */
    const pubFilters = document.querySelectorAll('#research .filter-tabs .filter-btn');
    const pubCards = document.querySelectorAll('#research .pub-card');

    if (pubFilters.length > 0 && pubCards.length > 0) {
        pubFilters.forEach(filterBtn => {
            filterBtn.addEventListener('click', () => {
                // Remove active class from all filter buttons
                pubFilters.forEach(btn => btn.classList.remove('active'));
                filterBtn.classList.add('active');

                const selectedCategory = filterBtn.textContent.trim().toLowerCase();

                pubCards.forEach(card => {
                    const cardBadge = card.querySelector('.pub-badge').textContent.trim().toLowerCase();
                    
                    if (selectedCategory === 'all publications' || cardBadge === selectedCategory) {
                        card.style.display = 'flex';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0) scale(1)';
                        }, 50);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px) scale(0.95)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    /* ===== MEDIA FILTER ===== */
    const mediaFilters = document.querySelectorAll('#media .filter-tabs .filter-btn');
    const mediaRows = document.querySelectorAll('#media .media-row');

    if (mediaFilters.length > 0 && mediaRows.length > 0) {
        mediaFilters.forEach(filterBtn => {
            filterBtn.addEventListener('click', () => {
                mediaFilters.forEach(btn => btn.classList.remove('active'));
                filterBtn.classList.add('active');

                const selectedType = filterBtn.textContent.trim().toLowerCase();

                mediaRows.forEach(row => {
                    let shouldShow = false;
                    if (selectedType === 'all coverage') {
                        shouldShow = true;
                    } else if (selectedType === 'videos' && row.classList.contains('videos-row')) {
                        shouldShow = true;
                    } else if (selectedType === 'articles' && row.classList.contains('articles-row')) {
                        shouldShow = true;
                    } else if (selectedType === 'podcasts' && row.classList.contains('podcasts-row')) {
                        shouldShow = true;
                    }

                    if (shouldShow) {
                        row.style.display = 'grid';
                        setTimeout(() => {
                            row.style.opacity = '1';
                            row.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        row.style.opacity = '0';
                        row.style.transform = 'translateY(15px)';
                        setTimeout(() => {
                            row.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    /* ===== STAR RATING SELECTOR (Feedback Form) ===== */
    const ratingStars = document.querySelectorAll('.star-selector i');
    let selectedRating = 0;

    if (ratingStars.length > 0) {
        ratingStars.forEach(star => {
            // Hover effect preview
            star.addEventListener('mouseover', () => {
                const val = parseInt(star.getAttribute('data-val'));
                highlightStars(val);
            });

            // Restore selection on mouse out
            star.addEventListener('mouseout', () => {
                highlightStars(selectedRating);
            });

            // Click to lock rating
            star.addEventListener('click', () => {
                selectedRating = parseInt(star.getAttribute('data-val'));
                highlightStars(selectedRating);
            });
        });
    }

    function highlightStars(count) {
        ratingStars.forEach((star, index) => {
            if (index < count) {
                star.className = 'fa-solid fa-star active';
            } else {
                star.className = 'fa-regular fa-star';
            }
        });
    }

    /* ===== APPOINTMENT BOOKING FORM VALIDATION ===== */
    const bookingForm = document.querySelector('.booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Collect form info
            const name = bookingForm.querySelector('input[type="text"]').value.trim();
            const phone = bookingForm.querySelector('input[type="tel"]').value.trim();
            const email = bookingForm.querySelector('input[type="email"]').value.trim();
            const clinicSelect = bookingForm.querySelector('select.custom-select').value;
            const date = bookingForm.querySelector('input[type="date"]').value;

            if (!name || !phone || !email || !clinicSelect || !date) {
                showToast('Please fill out all required fields.', 'error');
                return;
            }

            showToast(`Appointment request successfully sent for ${name}! We will contact you soon.`, 'success');
            bookingForm.reset();
        });
    }

    /* ===== FEEDBACK SUBMISSION ===== */
    const feedbackSubmitBtn = document.querySelector('.feedback-form button');
    const feedbackForm = document.querySelector('.feedback-form');

    if (feedbackSubmitBtn && feedbackForm) {
        feedbackSubmitBtn.addEventListener('click', (e) => {
            e.preventDefault();

            const name = feedbackForm.querySelector('input[placeholder="Your name"]').value.trim();
            const email = feedbackForm.querySelector('input[placeholder="Your email"]').value.trim();
            const message = feedbackForm.querySelector('textarea').value.trim();

            if (!name || !email || !message || selectedRating === 0) {
                showToast('Please fill out all fields and provide a rating.', 'error');
                return;
            }

            showToast('Thank you for sharing your experience! Your feedback has been submitted.', 'success');
            feedbackForm.reset();
            selectedRating = 0;
            highlightStars(0);
        });
    }

    /* ===== NEWSLETTER SUBMISSION ===== */
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (emailInput && emailInput.value.trim()) {
                showToast(`Thank you for subscribing with ${emailInput.value.trim()}!`, 'success');
                newsletterForm.reset();
            }
        });
    }

    /* ===== MOCK CANCEL APPOINTMENTS ===== */
    const cancelButtons = document.querySelectorAll('.btn-cancel');
    cancelButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const date = row.cells[0].textContent;
            
            if (confirm(`Are you sure you want to cancel your appointment on ${date}?`)) {
                // Update badge to Cancelled
                const badge = row.querySelector('.status-badge');
                if (badge) {
                    badge.textContent = 'Cancelled';
                    badge.className = 'status-badge pending';
                    badge.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                    badge.style.color = '#EF4444';
                }
                // Hide action button
                e.target.style.display = 'none';
                showToast('Appointment has been cancelled.', 'info');
            }
        });
    });
});
