document.addEventListener('DOMContentLoaded', () => {

    // Force scroll to top on load or reload
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, behavior: 'instant' });

    window.addEventListener('load', () => {
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }, 0);
    });

    /* ==========================================================================
       CANVAS PARTICLE SYSTEM
       ========================================================================== */
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');

    let particlesArray = [];
    const maxParticles = 60;

    // Set canvas sizes
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Particle Class
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 100;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 0.8 - 0.4;
            this.speedY = -(Math.random() * 0.8 + 0.3);
            this.alpha = Math.random() * 0.5 + 0.2;
            // Warm sunset amber/rose/gold hues
            const colors = ['#dfa83d', '#d2527f', '#eccc68', '#ff7f50', '#ffffff'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.swaySpeed = Math.random() * 0.02 + 0.005;
            this.swayOffset = Math.random() * Math.PI * 2;
        }

        update() {
            this.y += this.speedY;
            // Add a gentle side-to-side sway
            this.swayOffset += this.swaySpeed;
            this.x += this.speedX + Math.sin(this.swayOffset) * 0.3;

            // Fade out near the top
            if (this.y < canvas.height * 0.3) {
                this.alpha -= 0.003;
            }

            // Reset particle if off-screen or faded
            if (this.y < -10 || this.alpha <= 0) {
                this.x = Math.random() * canvas.width;
                this.y = canvas.height + 10;
                this.size = Math.random() * 3 + 1;
                this.alpha = Math.random() * 0.5 + 0.2;
                this.speedY = -(Math.random() * 0.8 + 0.3);
            }
        }

        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.shadowBlur = this.size * 2;
            ctx.shadowColor = this.color;
            ctx.fill();
            ctx.restore();
        }
    }

    // Initialize particles
    function initParticles() {
        particlesArray = [];
        for (let i = 0; i < maxParticles; i++) {
            particlesArray.push(new Particle());
            // Pre-distribute them vertically so they don't all start at the bottom
            particlesArray[i].y = Math.random() * canvas.height;
        }
    }

    // Animation Loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Soft background radial glow at bottom center
        const glow = ctx.createRadialGradient(
            canvas.width / 2, canvas.height, 10,
            canvas.width / 2, canvas.height, canvas.height * 0.7
        );
        glow.addColorStop(0, 'rgba(15, 18, 29, 0.4)');
        glow.addColorStop(1, 'rgba(7, 9, 14, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        requestAnimationFrame(animateParticles);
    }

    initParticles();
    animateParticles();


    /* ==========================================================================
       BACKGROUND MUSIC CONTROL
       ========================================================================== */
    const bgMusic = document.getElementById('bgMusic');
    const musicToggle = document.getElementById('musicToggle');
    let hasInteracted = false;

    const MUSIC_STORAGE_KEY = 'tn_music_playing_v1';

    // Update UI helper
    function setMusicUIPlaying(isPlaying) {
        if (isPlaying) {
            musicToggle.classList.add('playing');
            musicToggle.setAttribute('title', 'Jeda Musik');
        } else {
            musicToggle.classList.remove('playing');
            musicToggle.setAttribute('title', 'Mainkan Musik');
        }
    }

    // Toggle play/pause
    function toggleMusic() {
        if (bgMusic.paused) {
            bgMusic.play().then(() => {
                setMusicUIPlaying(true);
                localStorage.setItem(MUSIC_STORAGE_KEY, 'true');
            }).catch(err => {
                console.log("Music play blocked by browser:", err);
            });
        } else {
            bgMusic.pause();
            setMusicUIPlaying(false);
            localStorage.setItem(MUSIC_STORAGE_KEY, 'false');
        }
    }

    musicToggle.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop propagation to page click
        hasInteracted = true;
        toggleMusic();
    });

    // Keep storage in sync if playback is changed externally
    bgMusic.addEventListener('play', () => {
        setMusicUIPlaying(true);
        localStorage.setItem(MUSIC_STORAGE_KEY, 'true');
    });
    bgMusic.addEventListener('pause', () => {
        setMusicUIPlaying(false);
        localStorage.setItem(MUSIC_STORAGE_KEY, 'false');
    });

    // Attempt to restore last user preference
    const storedPref = localStorage.getItem(MUSIC_STORAGE_KEY);
    if (storedPref === 'true') {
        // Try to play; browsers may block until user interacts.
        bgMusic.play().then(() => {
            hasInteracted = true;
            setMusicUIPlaying(true);
        }).catch(() => {
            // If blocked, leave UI as not playing — will start on user interaction
            setMusicUIPlaying(false);
        });
    } else {
        // Ensure UI matches stored false/unknown
        setMusicUIPlaying(false);
    }

    // Play music when clicking Hero button (respect stored preference)
    const heroBtn = document.querySelector('.hero-buttons a');
    if (heroBtn) {
        heroBtn.addEventListener('click', () => {
            if (bgMusic.paused && !hasInteracted) {
                hasInteracted = true;
                toggleMusic();
            }
        });
    }


    /* ==========================================================================
       MOBILE NAVIGATION & ACTIVE STATE ON SCROLL
       ========================================================================== */
    const header = document.querySelector('.main-header');
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    // Sticky Header Class
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Active link on scroll
        let currentSection = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 120)) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    });

    // Toggle Mobile Menu
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('mobile-open');
        const icon = mobileToggle.querySelector('i');
        if (navMenu.classList.contains('mobile-open')) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-bars';
        }
    });

    // Close Mobile Menu on Link Click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('mobile-open');
            mobileToggle.querySelector('i').className = 'fas fa-bars';
        });
    });


    /* ==========================================================================
       SCROLL REVEAL (IntersectionObserver)
       ========================================================================== */
    const revealElements = document.querySelectorAll('.scroll-reveal, .timeline-item');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Once active, we don't need to observe it anymore
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });


    /* ==========================================================================
       INTERACTIVE 3D ENVELOPE & TYPEWRITER LETTER
       ========================================================================== */
    const envelope = document.getElementById('interactiveEnvelope');
    const typewriterTarget = document.getElementById('typewriterTarget');
    const envelopeHint = document.getElementById('envelopeHint');

    let isLetterOpened = false;
    let isTyping = false;

    const letterMessage = `Tidak terasa perjalanan singkat ini telah menghadirkan banyak cerita dan pelajaran berharga. Terima kasih atas kebersamaan, tawa, dukungan, dan semangat yang telah kalian berikan selama kita belajar bersama.\n\nKini saatnya kita melangkah menuju tujuan masing-masing. Apa pun mimpi yang sedang kalian perjuangkan, jangan pernah berhenti berusaha dan percaya pada diri sendiri. Setiap langkah kecil yang kalian ambil hari ini akan membawa kalian lebih dekat pada kesuksesan.\n\nSemoga semua target, cita-cita, dan harapan yang kalian impikan dapat terwujud. Tetap semangat, terus berkembang, dan jangan lupa menikmati setiap prosesnya.\n\nSampai jumpa di puncak kesuksesan, teman-teman!`;

    function typeWriter(text, index) {
        if (index < text.length && isLetterOpened) {
            isTyping = true;
            const char = text.charAt(index);
            if (char === '\n') {
                typewriterTarget.innerHTML += '<br>';
            } else {
                typewriterTarget.innerHTML += char;
            }
            // Auto scroll letter body down as it types
            typewriterTarget.scrollTop = typewriterTarget.scrollHeight;

            setTimeout(() => {
                typeWriter(text, index + 1);
            }, 35); // speed of typing in ms
        } else {
            isTyping = false;
        }
    }

    envelope.addEventListener('click', () => {
        if (!isLetterOpened) {
            // Open letter
            isLetterOpened = true;
            envelope.classList.add('open');
            envelopeHint.innerHTML = '<i class="fas fa-undo"></i> Klik surat untuk melipatnya kembali';

            // Clear content and start typing
            typewriterTarget.innerHTML = '';
            setTimeout(() => {
                typeWriter(letterMessage, 0);
            }, 600); // Wait for open transition to complete
        } else {
            // Close letter
            isLetterOpened = false;
            envelope.classList.remove('open');
            envelopeHint.innerHTML = '<i class="fas fa-hand-pointer"></i> Klik amplop di atas untuk membaca pesan hangat';
            // Stop typing and clear target
            typewriterTarget.innerHTML = '';
        }
    });


    /* ==========================================================================
       GUESTBOOK / WISHES BOARD (LOCALSTORAGE)
       ========================================================================== */
    const wishForm = document.getElementById('wishForm');
    const wishName = document.getElementById('wishName');
    const wishText = document.getElementById('wishText');
    const stickyBoard = document.getElementById('stickyBoard');

    // Preloaded emotional wishes
    const defaultWishes = [];

    // Load wishes from localStorage or use default ones
    function getWishes() {
        const wishes = localStorage.getItem('tn_wishes_v2');
        if (wishes) {
            let parsed = JSON.parse(wishes);
            // Programmatically filter out the Riri test wish if it exists in storage
            const filtered = parsed.filter(w => !(w.name === 'Riri' && w.text.includes('Sukses terus semuanya')));
            if (filtered.length !== parsed.length) {
                localStorage.setItem('tn_wishes_v2', JSON.stringify(filtered));
                parsed = filtered;
            }
            return parsed;
        } else {
            localStorage.setItem('tn_wishes_v2', JSON.stringify(defaultWishes));
            return defaultWishes;
        }
    }

    // Render sticky notes on board
    function renderWishes() {
        stickyBoard.innerHTML = '';
        const wishes = getWishes();

        if (wishes.length === 0) {
            stickyBoard.innerHTML = '<div class="empty-board-msg">Belum ada pesan hangat. Jadilah yang pertama menulis harapan!</div>';
            return;
        }

        wishes.forEach((wish, index) => {
            const note = document.createElement('div');
            note.className = `sticky-note ${wish.color}`;

            // Randomize slight angle rotation for natural look
            const rot = (Math.random() * 8 - 4).toFixed(1); // -4deg to 4deg
            const xShift = (Math.random() * 6 - 3).toFixed(1);
            const yShift = (Math.random() * 6 - 3).toFixed(1);
            note.style.transform = `rotate(${rot}deg) translate(${xShift}px, ${yShift}px)`;

            note.innerHTML = `
                <div class="sticky-note-text">${escapeHTML(wish.text)}</div>
                <div class="sticky-note-author">— ${escapeHTML(wish.name)}</div>
            `;

            stickyBoard.appendChild(note);
        });

        // Auto scroll to the end of the board when a new note is added
        stickyBoard.scrollTop = 0;
    }

    // Form submit listener
    wishForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameVal = wishName.value.trim();
        const textVal = wishText.value.trim();
        const colorVal = document.querySelector('input[name="noteColor"]:checked').value;

        if (nameVal && textVal) {
            const wishes = getWishes();
            wishes.unshift({ // Add to beginning
                name: nameVal,
                text: textVal,
                color: colorVal
            });

            localStorage.setItem('tn_wishes_v2', JSON.stringify(wishes));
            renderWishes();

            // Reset fields
            wishName.value = '';
            wishText.value = '';

            // Trigger feedback effect on board
            stickyBoard.classList.add('highlight');
            setTimeout(() => stickyBoard.classList.remove('highlight'), 500);
        }
    });

    // Helper to escape HTML and prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    renderWishes();


    /* ==========================================================================
       LIGHTBOX POPUP FOR GALLERY (IMAGES & VIDEOS)
       ========================================================================== */
    const lightbox = document.getElementById('galleryLightbox');
    const lightboxContent = lightbox.querySelector('.lightbox-content');
    const lightboxClose = lightbox.querySelector('.lightbox-close');
    const polaroidCards = document.querySelectorAll('.polaroid-card');

    polaroidCards.forEach(card => {
        card.addEventListener('click', () => {
            const src = card.getAttribute('data-src');
            const type = card.getAttribute('data-type');

            lightboxContent.innerHTML = '';

            if (type === 'image') {
                const img = document.createElement('img');
                img.src = src;
                img.alt = "Foto Memori Perpisahan";
                lightboxContent.appendChild(img);
            } else if (type === 'video') {
                const video = document.createElement('video');
                video.src = src;
                video.controls = true;
                video.autoplay = true;
                video.muted = true;
                video.playsInline = true;
                video.preload = 'metadata';
                video.style.width = '100%';
                video.style.maxHeight = '80vh';
                video.style.outline = 'none';
                video.style.background = '#000';

                lightboxContent.appendChild(video);

                video.load();
                video.play().catch(() => {
                    // Autoplay may be blocked, but controls remain available for manual play.
                });
            }

            lightbox.classList.add('open');
        });
    });

    // Close lightbox functions
    function closeLightbox() {
        lightbox.classList.remove('open');
        // Clear content to stop playing audio/video when modal is closed
        setTimeout(() => {
            lightboxContent.innerHTML = '';
        }, 300);
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    // Close on Escape Key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('open')) {
            closeLightbox();
        }
    });


    /* ==========================================================================
       REUNION COUNTDOWN TIMER
       ========================================================================== */
    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    // Target: 27 Juni 2026 jam 08.25
    const targetDate = new Date("2026-06-27T08:25:00");

    function updateCountdown() {
        const currentTime = new Date();
        const diff = targetDate - currentTime;

        if (diff <= 0) {
            document.getElementById('countdownTimer').innerHTML = `<h4 style="color:var(--clr-gold);font-family:var(--font-serif);font-size:1.5rem;text-align:center;width:100%;">Waktu kepulangan telah tiba. Sampai jumpa lagi sahabatku di Titik Nol!</h4>`;
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);

        daysEl.innerText = d.toString().padStart(2, '0');
        hoursEl.innerText = h.toString().padStart(2, '0');
        minutesEl.innerText = m.toString().padStart(2, '0');
        secondsEl.innerText = s.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
});
