document.addEventListener("DOMContentLoaded", () => {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // --- Smooth Scrolling (Lenis) ---
    window.lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0, 0);

    // --- Hero Typewriter Effect (Plays Once) ---
    const heroTypewriter = document.getElementById('hero-typewriter');
    if (heroTypewriter) {
        const text1 = "Your idea deserves more than an ";
        const text2 = "ordinary website.";
        
        heroTypewriter.innerHTML = '<span class="typewriter-text"></span><span class="text-accent typewriter-accent"></span><span class="typewriter-cursor" style="display:inline-block; font-weight:300;">|</span>';
        
        const typeText = heroTypewriter.querySelector('.typewriter-text');
        const typeAccent = heroTypewriter.querySelector('.typewriter-accent');
        const cursor = heroTypewriter.querySelector('.typewriter-cursor');
        
        gsap.fromTo(cursor, { opacity: 1 }, { opacity: 0, repeat: -1, yoyo: true, duration: 0.5, ease: "none" });

        setTimeout(() => {
            let i = 0;
            let isAccent = false;

            function typeChar() {
                if (!isAccent) {
                    if (i < text1.length) {
                        typeText.textContent += text1.charAt(i);
                        i++;
                    } else {
                        isAccent = true;
                        i = 0; 
                    }
                } else {
                    if (i < text2.length) {
                        typeAccent.textContent += text2.charAt(i);
                        i++;
                    } else {
                        // Animation stops here, no looping
                        return;
                    }
                }

                let speed = Math.random() > 0.8 ? 150 : (Math.random() > 0.5 ? 70 : 90);
                setTimeout(typeChar, speed);
            }
            typeChar();
        }, 600); 
    }

    // --- Custom Cursor ---
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');
    
    if (window.matchMedia("(pointer: fine)").matches && cursor && follower) {
        document.addEventListener('mousemove', (e) => {
            gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0 });
            gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.15 });
        });

        document.querySelectorAll('a, button, .project-card').forEach(el => {
            el.addEventListener('mouseenter', () => follower.classList.add('active'));
            el.addEventListener('mouseleave', () => follower.classList.remove('active'));
        });
    } else if (cursor && follower) {
        cursor.style.display = 'none';
        follower.style.display = 'none';
    }

    // --- Inject Config & Services ---
    const whatsappLink = document.getElementById('whatsapp-link');
    if (whatsappLink && typeof CONFIG !== 'undefined') {
        whatsappLink.href = `https://wa.me/${CONFIG.whatsapp}`;
    }

    const servicesMarquee = document.getElementById('services-marquee');
    if (servicesMarquee && typeof SERVICES !== 'undefined') {
        const itemsHtml = SERVICES.map(service => `
            <div class="marquee-item">
                <span class="marquee-name">${service.name}</span>
                <span class="marquee-desc">${service.description}</span>
            </div>
        `).join('');
        servicesMarquee.innerHTML = itemsHtml + itemsHtml + itemsHtml;
    }

    // --- Mobile Menu ---
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // --- Section Reveal Animations ---
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.from(title, {
            scrollTrigger: { trigger: title, start: "top 85%" },
            y: 30, opacity: 0, duration: 0.8, ease: "power3.out"
        });
    });

    // --- About Section Text Scrub Animation ---
    const aboutHeadline = document.querySelector('.about-headline');
    if (aboutHeadline) {
        const words = aboutHeadline.textContent.trim().split(/\s+/);
        aboutHeadline.innerHTML = words.map(w => `<span class="word">${w}</span>`).join(" ");

        gsap.to(".about-headline .word", {
            color: "#000000",
            stagger: 0.1,
            ease: "none",
            scrollTrigger: {
                trigger: ".about-headline",
                start: "top 75%",
                end: "bottom 35%",
                scrub: true
            }
        });
    }

    // --- Text Signature Animation ---
    const signatureText = document.querySelector('.signature-text');
    const signatureTitle = document.querySelector('.signature-title');

    if (signatureText && signatureTitle) {
        const fullText = "Aateeb Jilani.";
        
        const textRect = signatureText.getBoundingClientRect();
        signatureText.style.minHeight = (textRect.height || 30) + 'px';
        signatureText.style.minWidth = (textRect.width || 150) + 'px';
        signatureText.style.clipPath = 'inset(0 0 0 0)'; 

        signatureText.textContent = ""; 
        gsap.set(signatureTitle, { opacity: 0, y: 15 });

        let hasTitleAppeared = false; 

        function startSignatureLoop() {
            let i = 0;
            gsap.set(signatureText, { "--underline-scale": 0 });
            signatureText.textContent = ""; 
            
            const typing = setInterval(() => {
                signatureText.textContent += fullText.charAt(i);
                i++;
                if (i >= fullText.length) {
                    clearInterval(typing);
                    gsap.to(signatureText, { "--underline-scale": 1, duration: 0.6, ease: "power2.out" });
                    
                    if (!hasTitleAppeared) {
                        gsap.to(signatureTitle, { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: "power2.out" });
                        hasTitleAppeared = true;
                    }

                    const delay = Math.floor(Math.random() * 3000) + 2000;
                    setTimeout(() => {
                        gsap.to(signatureText, { 
                            "--underline-scale": 0, 
                            duration: 0.3, 
                            onComplete: startSignatureLoop 
                        });
                    }, delay);
                }
            }, 100);
        }

        ScrollTrigger.create({
            trigger: '.founder-signature-wrapper',
            start: "top 85%", 
            once: true,
            onEnter: () => {
                startSignatureLoop();
            }
        });
    }

    // --- Contact Section Animations ---
    if (document.querySelector('.contact-section')) {
        gsap.from('.contact-content', {
            scrollTrigger: { trigger: '.contact-section', start: "top 80%" },
            y: 40, opacity: 0, duration: 0.8, ease: "power3.out"
        });

        gsap.from('.contact-visual', {
            scrollTrigger: { trigger: '.contact-section', start: "top 80%" },
            y: 40, opacity: 0, scale: 0.95, duration: 0.8, delay: 0.2, ease: "power3.out"
        });
    }

    // --- Sci-Fi Target Reticle Effects ---
    const reticleHTML = `
        <div class="reticle">
            <div class="corner top-left"></div><div class="corner top-right"></div>
            <div class="corner bottom-left"></div><div class="corner bottom-right"></div>
            <div class="crosshair-h"></div><div class="crosshair-v"></div>
            <div class="tick tick-h1"></div><div class="tick tick-h2"></div>
            <div class="tick tick-h3"></div><div class="tick tick-h4"></div>
            <div class="tick tick-v1"></div><div class="tick tick-v2"></div>
            <div class="tick tick-v3"></div><div class="tick tick-v4"></div>
        </div>
    `;

    Array.from(document.querySelectorAll('.btn, .nav-link, .footer-links a, .logo')).filter(btn => {
        const text = (btn.innerText || btn.textContent || "").toLowerCase();
        const href = btn.getAttribute('href') || "";
        return !text.includes("let's talk") && href !== "#contact";
    }).forEach(btn => {
        btn.insertAdjacentHTML('beforeend', reticleHTML);
        
        const reticle = btn.querySelector('.reticle');
        const corners = reticle.querySelectorAll('.corner');
        const crossH = reticle.querySelector('.crosshair-h');
        const crossV = reticle.querySelector('.crosshair-v');
        const ticks = reticle.querySelectorAll('.tick');

        gsap.set([corners, crossH, crossV, ticks], { opacity: 0 });
        const tl = gsap.timeline({ paused: true, defaults: { duration: 0.3, ease: "power2.out" } });

        tl.fromTo(corners, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.05 }, 0);
        tl.fromTo(crossH, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 0.3 }, 0.1);
        tl.fromTo(crossV, { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 0.3 }, 0.1);
        tl.fromTo(ticks, { opacity: 0, scale: 0 }, { opacity: 0.6, scale: 1, stagger: 0.02 }, 0.2);

        btn.addEventListener('mouseenter', () => tl.play());
        btn.addEventListener('mouseleave', () => tl.reverse());
    });

    // --- Dynamic Corner Button Injection ---
    document.querySelectorAll('.btn, .nav-link').forEach(btn => {
        const textContent = btn.textContent.trim().toLowerCase();
        if (textContent.includes("let's talk") || textContent.includes("lets talk")) {
            const wrapper = document.createElement('div');
            wrapper.className = 'corner-btn-wrapper';
            
            btn.parentNode.insertBefore(wrapper, btn);
            
            wrapper.innerHTML = `
                <div class="corner-line horizontal top" aria-hidden="true"></div>
                <div class="corner-line vertical right" aria-hidden="true"></div>
                <div class="corner-line horizontal bottom" aria-hidden="true"></div>
                <div class="corner-line vertical left" aria-hidden="true"></div>
                <div class="corner-dot top left" aria-hidden="true"></div>
                <div class="corner-dot top right" aria-hidden="true"></div>
                <div class="corner-dot bottom right" aria-hidden="true"></div>
                <div class="corner-dot bottom left" aria-hidden="true"></div>
            `;
            
            wrapper.appendChild(btn);
            btn.classList.add('corner-btn');
            
            const oldReticle = btn.querySelector('.reticle');
            if (oldReticle) oldReticle.remove();

            btn.innerHTML = `
                <span class="corner-btn-text">Let's Talk</span>
                <svg class="corner-btn-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.6744 11.4075L15.7691 17.1233C15.7072 17.309 15.5586 17.4529 15.3709 17.5087L3.69348 20.9803C3.22819 21.1186 2.79978 20.676 2.95328 20.2155L6.74467 8.84131C6.79981 8.67588 6.92419 8.54263 7.08543 8.47624L12.472 6.25822C12.696 6.166 12.9535 6.21749 13.1248 6.38876L17.5294 10.7935C17.6901 10.9542 17.7463 11.1919 17.6744 11.4075Z" />
                    <path d="M3.2959 20.6016L9.65986 14.2376" />
                    <path d="M17.7917 11.0557L20.6202 8.22724C21.4012 7.44619 21.4012 6.17986 20.6202 5.39881L18.4989 3.27749C17.7178 2.49645 16.4515 2.49645 15.6704 3.27749L12.842 6.10592" />
                    <path d="M11.7814 12.1163C11.1956 11.5305 10.2458 11.5305 9.66004 12.1163C9.07426 12.7021 9.07426 13.6519 9.66004 14.2376C10.2458 14.8234 11.1956 14.8234 11.7814 14.2376C12.3671 13.6519 12.3671 12.7021 11.7814 12.1163Z" />
                </svg>
            `;
        }
    });
});