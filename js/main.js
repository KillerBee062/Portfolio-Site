document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. Scroll Animations (Intersection Observer)
       ========================================= */
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.hero-left, .hero-right, .section-head, .tl-item, .skills-group').forEach((el, i) => {
        el.classList.add('animate-on-scroll');
        if (i % 3 === 1) el.classList.add('delay-100');
        if (i % 3 === 2) el.classList.add('delay-200');
        observer.observe(el);
    });

    // Bento cards: staggered cascade when grid enters viewport
    const bento = document.querySelector('.bento');
    if (bento) {
        const bentoCards = bento.querySelectorAll('.card');
        bentoCards.forEach(card => card.classList.add('animate-on-scroll'));
        new IntersectionObserver((entries, obs) => {
            if (entries[0].isIntersecting) {
                bentoCards.forEach((card, i) => setTimeout(() => card.classList.add('is-visible'), i * 70));
                obs.disconnect();
            }
        }, { threshold: 0.08 }).observe(bento);
    }

    /* =========================================
       2. Navigation Scroll Spy
       ========================================= */
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            if (window.pageYOffset >= section.offsetTop - section.clientHeight / 3) {
                current = section.getAttribute('id') || '';
            }
        });
        navLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            link.classList.toggle('active', current && href.includes(current));
        });
    }, { passive: true });

    /* =========================================
       3. Dark Mode Toggle
       ========================================= */
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    const sunIcon  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-toggle';
    themeBtn.setAttribute('aria-label', 'Toggle Dark Mode');
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) document.documentElement.classList.add('dark-mode');
    themeBtn.innerHTML = isDark ? sunIcon : moonIcon;

    const navLinksContainer = document.querySelector('.nav-links');
    if (navLinksContainer) navLinksContainer.appendChild(themeBtn);

    themeBtn.addEventListener('click', () => {
        const dark = document.documentElement.classList.toggle('dark-mode');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        themeBtn.innerHTML = dark ? sunIcon : moonIcon;
    });

    /* =========================================
       4. Scroll Progress Bar
       ========================================= */
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        const update = () => {
            const scrolled = window.scrollY;
            const total = document.documentElement.scrollHeight - window.innerHeight;
            scrollProgress.style.width = (total > 0 ? scrolled / total * 100 : 0) + '%';
        };
        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    /* =========================================
       5. Back to Top Button
       ========================================= */
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 500);
        }, { passive: true });
        backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    /* =========================================
       6. Count-up Animation for Stats
       ========================================= */
    const statRow = document.querySelector('.stat-row');
    if (statRow) {
        let counted = false;
        new IntersectionObserver((entries) => {
            if (!entries[0].isIntersecting || counted) return;
            counted = true;
            statRow.querySelectorAll('.stat-cell .num').forEach(el => {
                const pctSpan = el.querySelector('.pct');
                const target = parseInt(el.textContent);
                if (isNaN(target)) return;
                if (pctSpan) pctSpan.remove();
                const t0 = performance.now();
                const duration = 1400;
                (function step(ts) {
                    const p = Math.min((ts - t0) / duration, 1);
                    const eased = 1 - Math.pow(1 - p, 3);
                    el.textContent = Math.round(eased * target);
                    if (p < 1) {
                        requestAnimationFrame(step);
                    } else {
                        el.textContent = target;
                        if (pctSpan) el.appendChild(pctSpan);
                    }
                })(performance.now());
            });
        }, { threshold: 0.8 }).observe(statRow);
    }

    /* =========================================
       7. Typewriter Effect for Hero Role
       ========================================= */
    const twTarget = document.getElementById('typewriter-target');
    if (twTarget) {
        const initial = twTarget.textContent.trim();
        const phrases = [
            initial,
            'Strategy Intelligence Scientist',
            'Quality & Analytics Engineer',
            'Commercial Data Specialist',
        ];

        twTarget.innerHTML = '';
        const textSpan = document.createElement('span');
        const cursor = document.createElement('span');
        cursor.className = 'tw-cursor';
        twTarget.appendChild(textSpan);
        twTarget.appendChild(cursor);

        textSpan.textContent = initial;

        let pi = 0, ci = initial.length, deleting = false, pause = 0;

        function tick() {
            if (pause > 0) { pause--; setTimeout(tick, 50); return; }
            const phrase = phrases[pi];
            if (!deleting) {
                textSpan.textContent = phrase.slice(0, ci);
                if (ci < phrase.length) { ci++; setTimeout(tick, 55 + Math.random() * 30); }
                else { pause = 50; deleting = true; setTimeout(tick, 50); }
            } else {
                textSpan.textContent = phrase.slice(0, ci);
                if (ci > 0) { ci--; setTimeout(tick, 28); }
                else {
                    pi = (pi + 1) % phrases.length;
                    deleting = false;
                    pause = 6;
                    setTimeout(tick, 50);
                }
            }
        }

        // Wait 2.5s on the initial text, then start cycling
        setTimeout(() => { ci = initial.length; deleting = true; pause = 50; tick(); }, 2500);
    }

    /* =========================================
       8. Copy Email to Clipboard (Toast)
       ========================================= */
    const toast = document.getElementById('toast');

    function showToast(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
    }

    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
        link.addEventListener('click', e => {
            if (!navigator.clipboard) return;
            e.preventDefault();
            const email = link.getAttribute('href').replace('mailto:', '');
            navigator.clipboard.writeText(email)
                .then(() => showToast('Email address copied to clipboard'))
                .catch(() => { window.location.href = link.getAttribute('href'); });
        });
    });

    /* =========================================
       9. Bento Card 3D Tilt on Mouse Move
       ========================================= */
    document.querySelectorAll('.bento .card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top)  / r.height - 0.5;
            card.style.setProperty('--tilt-x', `${-y * 7}deg`);
            card.style.setProperty('--tilt-y', `${x * 7}deg`);
        });
        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--tilt-x', '0deg');
            card.style.setProperty('--tilt-y', '0deg');
        });
    });

});
