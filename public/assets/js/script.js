document.addEventListener('DOMContentLoaded', function() {
    
    // ===== CONFIGURACIÓN Y VARIABLES GLOBALES =====
    const CONFIG = {
        parallaxSpeed: 0.08,
        floatInterval: 4000,
        floatDuration: 2000,
        letterFlickerChance: 0.075,
        letterFlickerDuration: 500,
        mobileBreakpoint: 768,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
    
    // Cache de elementos DOM
    const DOM = {
        navLinks: document.querySelectorAll('nav a[href^="#"]'),
        mainTitles: document.querySelectorAll('#home h1'),
        chromeObjects: null,
        allSections: document.querySelectorAll('.section'),
        productCircle: document.querySelector('.product-circle'),
        productLabels: null,
        productDots: null,
        centerShop: null
    };
    
    // Estados globales
    let ticking = false;
    let isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    let objectStates = new Map();
    let letterFlickerTimeouts = new Map();
    
    // ===== FIX CRÍTICO: ASEGURAR QUE EL OVERLAY ESTÉ OCULTO AL INICIO =====
    function fixMobileOverlay() {
        const mobileOverlay = document.querySelector('.mobile-menu-overlay');
        if (mobileOverlay && !mobileOverlay.classList.contains('active')) {
            mobileOverlay.style.display = 'none';
            mobileOverlay.style.pointerEvents = 'none';
            mobileOverlay.style.visibility = 'hidden';
            mobileOverlay.style.opacity = '0';
        }
        
        // También asegurar que los chrome-objects no bloqueen toques
        document.querySelectorAll('.chrome-object').forEach(obj => {
            obj.style.pointerEvents = 'none';
        });
    }
    
    // Ejecutar fix inmediatamente
    fixMobileOverlay();
    
    // ===== NAVEGACIÓN SUAVE OPTIMIZADA =====
    function initNavigation() {
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    // ===== EFECTO NEON LETRA POR LETRA REALISTA =====
    function createNeonLetters() {
        DOM.mainTitles.forEach((title, titleIndex) => {
            const text = title.textContent;
            title.innerHTML = '';
            title.setAttribute('data-text', text);
            
            const letterContainer = document.createElement('div');
            letterContainer.className = 'neon-letters-container';
            
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const span = document.createElement('span');
                span.className = 'neon-letter';
                span.textContent = char === ' ' ? '\u00A0' : char;
                span.setAttribute('data-letter-index', i);
                span.setAttribute('data-title-index', titleIndex);
                span.setAttribute('data-state', 'normal');
                letterContainer.appendChild(span);
            }
            
            title.appendChild(letterContainer);
        });
        
        startLetterFlickerSystem();
    }
    
    function startLetterFlickerSystem() {
        const allLetters = document.querySelectorAll('.neon-letter');
        
        function randomFlicker() {
            if (CONFIG.reducedMotion) return;
            
            allLetters.forEach(letter => {
                if (letter.textContent.trim() && letter.getAttribute('data-state') === 'normal') {
                    if (Math.random() < CONFIG.letterFlickerChance) {
                        flickerLetter(letter);
                    }
                }
            });
            
            setTimeout(randomFlicker, 1000);
        }
        
        setTimeout(randomFlicker, 300);
    }
    
    function flickerLetter(letter) {
        const letterId = letter.getAttribute('data-letter-index') + '_' + letter.getAttribute('data-title-index');
        
        if (letterFlickerTimeouts.has(letterId)) {
            clearTimeout(letterFlickerTimeouts.get(letterId));
        }
        
        letter.setAttribute('data-state', 'flickering');
        letter.classList.add('letter-flickering');
        
        const timeoutId = setTimeout(() => {
            letter.setAttribute('data-state', 'normal');
            letter.classList.remove('letter-flickering');
            letterFlickerTimeouts.delete(letterId);
        }, CONFIG.letterFlickerDuration);
        
        letterFlickerTimeouts.set(letterId, timeoutId);
    }
    
    // ===== PRELOAD DE IMÁGENES =====
    function preloadCriticalImages() {
        const criticalImages = [
            'images/chrome2.png',
            'images/chrome3.png',
            'images/gold1.png',
            'images/gold2.png'
        ];
        
        const fragment = document.createDocumentFragment();
        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            fragment.appendChild(link);
        });
        document.head.appendChild(fragment);
    }
    
    // ===== CHROME OBJECTS =====
    function initChromeObjects() {
        DOM.chromeObjects = document.querySelectorAll('.chrome-object:not(.obj-right-top)');
        
        DOM.chromeObjects.forEach(obj => {
            // CRÍTICO: Asegurar que no bloqueen toques
            obj.style.pointerEvents = 'none';
            
            objectStates.set(obj, {
                floatX: 0,
                floatY: 0,
                floatRotate: 0,
                parallaxX: 0,
                parallaxY: 0,
                isAnimating: false,
                baseTransform: getComputedStyle(obj).transform
            });
        });
        
        if (!CONFIG.reducedMotion) {
            startFloatingAnimation();
        }
    }
    
    function animateFloating() {
        if (CONFIG.reducedMotion) return;
        
        DOM.chromeObjects.forEach(obj => {
            const state = objectStates.get(obj);
            if (!state || state.isAnimating) return;
            
            state.isAnimating = true;
            
            const maxMovement = isMobile ? 10 : 20;
            const maxRotation = isMobile ? 1.5 : 3;
            
            const targetFloatX = (Math.random() - 0.5) * maxMovement;
            const targetFloatY = (Math.random() - 0.5) * maxMovement;
            const targetRotate = (Math.random() - 0.5) * maxRotation;
            
            animateToPosition(obj, state, targetFloatX, targetFloatY, targetRotate);
        });
    }
    
    function animateToPosition(obj, state, targetX, targetY, targetRotate) {
        const startTime = performance.now();
        const startX = state.floatX;
        const startY = state.floatY;
        const startRotate = state.floatRotate;
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / CONFIG.floatDuration, 1);
            
            const easeProgress = progress < 0.5 
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            state.floatX = startX + (targetX - startX) * easeProgress;
            state.floatY = startY + (targetY - startY) * easeProgress;
            state.floatRotate = startRotate + (targetRotate - startRotate) * easeProgress;
            
            updateObjectTransform(obj);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                state.isAnimating = false;
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    function updateObjectTransform(obj) {
        const state = objectStates.get(obj);
        if (!state) return;
        
        const totalX = state.parallaxX + state.floatX;
        const totalY = state.parallaxY + state.floatY;
        
        obj.style.transform = `translate3d(${totalX}px, ${totalY}px, 0) rotate(${state.floatRotate}deg)`;
    }
    
    function startFloatingAnimation() {
        if (CONFIG.reducedMotion) return;
        
        animateFloating();
        
        const interval = isMobile ? CONFIG.floatInterval * 2 : CONFIG.floatInterval;
        setInterval(animateFloating, interval);
    }
    
    // ===== PARALLAX SCROLL =====
    function updateParallax() {
        if (CONFIG.reducedMotion) return;
        
        const scrollPosition = window.pageYOffset;
        
        DOM.chromeObjects.forEach(obj => {
            const state = objectStates.get(obj);
            if (!state) return;
            
            const parallaxY = -scrollPosition * CONFIG.parallaxSpeed;
            
            let parallaxX = 0;
            const classList = obj.classList;
            if (classList.contains('obj-right') || 
                classList.contains('obj-right-medium') || 
                classList.contains('obj-right-small') ||
                classList.contains('obj-gold-right')) {
                parallaxX = parallaxY * 0.3;
            } else {
                parallaxX = -parallaxY * 0.3;
            }
            
            state.parallaxX = parallaxX;
            state.parallaxY = parallaxY;
            
            if (!state.isAnimating) {
                updateObjectTransform(obj);
            }
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking && !CONFIG.reducedMotion) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    // ===== INTERSECTION OBSERVER =====
    function initSectionObserver() {
        const initialStyles = `
            .section {
                opacity: 0;
                transform: translateY(50px);
                transition: opacity 0.8s ease, transform 0.8s ease;
            }
        `;
        
        if (!document.getElementById('section-initial-styles')) {
            const style = document.createElement('style');
            style.id = 'section-initial-styles';
            style.textContent = initialStyles;
            document.head.appendChild(style);
        }
        
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });
        
        DOM.allSections.forEach(section => {
            sectionObserver.observe(section);
        });
    }
    
    // ===== CÍRCULO DE PRODUCTOS =====
    function initProductCircle() {
        if (!DOM.productCircle) return;
        
        DOM.productLabels = document.querySelectorAll('.product-dot span');
        DOM.productDots = document.querySelectorAll('.product-dot');
        DOM.centerShop = document.querySelector('.product-center');
        
        let rotation = 0;
        let isHovered = false;
        let animationId;
        
        DOM.productCircle.addEventListener('mouseenter', () => {
            isHovered = true;
        }, { passive: true });
        
        DOM.productCircle.addEventListener('mouseleave', () => {
            isHovered = false;
        }, { passive: true });
        
        DOM.productDots.forEach(dot => {
            dot.addEventListener('mouseenter', () => {
                isHovered = true;
            }, { passive: true });
            
            dot.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    if (!DOM.productCircle.matches(':hover')) {
                        isHovered = false;
                    }
                }, 100);
            }, { passive: true });
        });
        
        if (DOM.centerShop) {
            DOM.centerShop.addEventListener('mouseenter', () => {
                isHovered = true;
            }, { passive: true });
            
            DOM.centerShop.addEventListener('mouseleave', () => {
                setTimeout(() => {
                    if (!DOM.productCircle.matches(':hover')) {
                        isHovered = false;
                    }
                }, 100);
            }, { passive: true });
        }
        
        function animateCircle() {
            if (!CONFIG.reducedMotion && !isHovered) {
                rotation += 0.2;
                DOM.productCircle.style.transform = `rotate(${rotation}deg)`;
                
                DOM.productLabels.forEach(label => {
                    label.style.transform = `translateX(-50%) rotate(${-rotation}deg)`;
                });
            }
            
            animationId = requestAnimationFrame(animateCircle);
        }
        
        if (!CONFIG.reducedMotion) {
            animateCircle();
        }
        
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }
    
    // ===== EFECTOS DE HOVER =====
    function initHoverEffects() {
        document.addEventListener('mouseenter', function(e) {
            if (e.target.matches('a:not(nav a):not(.product-dot):not(.product-center), .member, .project')) {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.transition = 'transform 0.3s ease';
            }
        }, true);
        
        document.addEventListener('mouseleave', function(e) {
            if (e.target.matches('a:not(nav a):not(.product-dot):not(.product-center), .member, .project')) {
                e.target.style.transform = 'scale(1)';
            }
        }, true);
    }
    
    // ===== OPTIMIZACIÓN MÓVIL =====
    function handleMobileOptimizations() {
        if (isMobile) {
            CONFIG.letterFlickerChance = 0.008;
            
            const mobileStyles = `
                .chrome-object {
                    opacity: 0.6;
                    pointer-events: none !important;
                }
                .neon-letter {
                    will-change: auto;
                }
                .product-dot:hover,
                .product-center:hover {
                    transform: scale(1.5) !important;
                }
            `;
            
            if (!document.getElementById('mobile-optimizations')) {
                const mobileStyleElement = document.createElement('style');
                mobileStyleElement.id = 'mobile-optimizations';
                mobileStyleElement.textContent = mobileStyles;
                document.head.appendChild(mobileStyleElement);
            }
        }
    }
    
    // ===== RESIZE HANDLER =====
    function initResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newIsMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
                if (newIsMobile !== isMobile) {
                    isMobile = newIsMobile;
                    handleMobileOptimizations();
                }
            }, 250);
        }, { passive: true });
    }
    
    // ===== INICIALIZACIÓN PRINCIPAL =====
    function init() {
        console.log('🚀 Natural Groove - Inicializando...');
        
        // FIX: Asegurar overlay oculto primero
        fixMobileOverlay();
        
        preloadCriticalImages();
        initNavigation();
        createNeonLetters();
        initChromeObjects();
        initSectionObserver();
        initProductCircle();
        initHoverEffects();
        handleMobileOptimizations();
        initResizeHandler();
        
        window.addEventListener('scroll', requestTick, { passive: true });
        
        console.log('✅ Natural Groove - Inicialización completa');
        console.log('📱 Dispositivo móvil:', isMobile);
    }
    
    init();
    
    // ===== API PÚBLICA =====
    if (typeof window !== 'undefined') {
        window.NaturalGroove = {
            flickerLetter: (letterIndex, titleIndex = 0) => {
                const letter = document.querySelector(`[data-letter-index="${letterIndex}"][data-title-index="${titleIndex}"]`);
                if (letter) flickerLetter(letter);
            },
            toggleReducedMotion: () => {
                CONFIG.reducedMotion = !CONFIG.reducedMotion;
                console.log('Movimiento reducido:', CONFIG.reducedMotion);
            },
            getConfig: () => CONFIG,
            getObjectStates: () => objectStates
        };
    }

    // ===== MENÚ MÓVIL RESPONSIVO - CORREGIDO =====
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');
    const body = document.body;
    
    let isMenuOpen = false;
    
    // Función para abrir/cerrar el menú - CORREGIDA
    function toggleMobileMenu() {
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            // Abrir menú
            mobileMenuBtn.classList.add('active');
            mobileMenuOverlay.classList.add('active');
            // CRÍTICO: Cambiar display y pointer-events
            mobileMenuOverlay.style.display = 'flex';
            mobileMenuOverlay.style.pointerEvents = 'auto';
            mobileMenuOverlay.style.visibility = 'visible';
            mobileMenuOverlay.style.opacity = '1';
            body.style.overflow = 'hidden';
        } else {
            // Cerrar menú
            mobileMenuBtn.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            // CRÍTICO: Ocultar completamente
            mobileMenuOverlay.style.opacity = '0';
            mobileMenuOverlay.style.pointerEvents = 'none';
            mobileMenuOverlay.style.visibility = 'hidden';
            // Delay para la animación antes de ocultar
            setTimeout(() => {
                if (!isMenuOpen) {
                    mobileMenuOverlay.style.display = 'none';
                }
            }, 300);
            body.style.overflow = '';
        }
        
        console.log('Menu toggled:', isMenuOpen);
    }
    
    // Inicializar menú móvil
    function initMobileMenu() {
        // Asegurar estado inicial correcto
        if (mobileMenuOverlay) {
            mobileMenuOverlay.style.display = 'none';
            mobileMenuOverlay.style.pointerEvents = 'none';
            mobileMenuOverlay.style.visibility = 'hidden';
            mobileMenuOverlay.style.opacity = '0';
            mobileMenuOverlay.classList.remove('active');
        }
        
        if (mobileMenuBtn) {
            mobileMenuBtn.classList.remove('active');
            mobileMenuBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleMobileMenu();
            });
        }
        
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (isMenuOpen) {
                    toggleMobileMenu();
                }
            });
        });
        
        if (mobileMenuOverlay) {
            mobileMenuOverlay.addEventListener('click', (e) => {
                if (e.target === mobileMenuOverlay) {
                    toggleMobileMenu();
                }
            });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                toggleMobileMenu();
            }
        });
        
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && isMenuOpen) {
                toggleMobileMenu();
            }
        });
        
        console.log('📱 Menú móvil inicializado correctamente');
    }
    
    // ===== DETECCIÓN DE DISPOSITIVO =====
    function initDeviceDetection() {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTabletDevice = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
        const isDesktopDevice = !isMobileDevice && !isTabletDevice;
        
        body.classList.toggle('is-mobile', isMobileDevice);
        body.classList.toggle('is-tablet', isTabletDevice);
        body.classList.toggle('is-desktop', isDesktopDevice);
        
        function handleOrientationChange() {
            if (isMenuOpen) {
                toggleMobileMenu();
            }
            
            const isLandscape = window.innerWidth > window.innerHeight;
            body.classList.toggle('is-landscape', isLandscape);
            body.classList.toggle('is-portrait', !isLandscape);
        }
        
        handleOrientationChange();
        
        window.addEventListener('orientationchange', () => {
            setTimeout(handleOrientationChange, 100);
        });
        
        window.addEventListener('resize', handleOrientationChange);
        
        console.log('🔍 Detección de dispositivo inicializada');
        return { isMobileDevice, isTabletDevice, isDesktopDevice };
    }
    
    // ===== SMOOTH SCROLL =====
    function initEnhancedSmoothScroll() {
        const allNavLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
        
        allNavLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                if (href.startsWith('#') && href.length > 1) {
                    e.preventDefault();
                    
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        const header = document.querySelector('header');
                        const headerHeight = header ? header.offsetHeight : 0;
                        const targetPosition = targetElement.offsetTop - headerHeight - 20;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                        
                        if (isMenuOpen) {
                            toggleMobileMenu();
                        }
                    }
                }
            });
        });
        
        console.log('🎯 Smooth scroll inicializado');
    }
    
    // ===== ERROR HANDLING =====
    function initErrorHandling() {
        if (!window.IntersectionObserver) {
            console.warn('⚠️ IntersectionObserver no soportado');
            DOM.allSections.forEach(section => {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            });
        }
        
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback) {
                return setTimeout(callback, 1000 / 60);
            };
        }
        
        window.addEventListener('error', function(e) {
            console.error('❌ Error:', e.error);
        });
    }
    
    // ===== INICIALIZACIÓN DEL SISTEMA RESPONSIVO =====
    function initResponsiveSystem() {
        console.log('🚀 Inicializando sistema responsivo...');
        
        try {
            initMobileMenu();
            initEnhancedSmoothScroll();
            initDeviceDetection();
            initErrorHandling();
            
            console.log('✅ Sistema responsivo inicializado');
            
        } catch (error) {
            console.error('❌ Error:', error);
        }
    }
    
    initResponsiveSystem();
    
    // Extender API
    if (typeof window !== 'undefined' && window.NaturalGroove) {
        Object.assign(window.NaturalGroove, {
            toggleMobileMenu: () => toggleMobileMenu(),
            isMobileMenuOpen: () => isMenuOpen,
            fixOverlay: () => fixMobileOverlay()
        });
    }
    
    console.log('🎉 Natural Groove - Sistema completo inicializado');

    // ===== FONDO ESTRELLADO =====
    function createStarryBackground() {
        const starryBackground = document.createElement('div');
        starryBackground.className = 'starry-background';
        
        function createStar(type, count) {
            for (let i = 0; i < count; i++) {
                const star = document.createElement('div');
                star.className = `star star-${type}`;
                
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                
                star.style.left = `${left}%`;
                star.style.top = `${top}%`;
                
                const animationDelay = Math.random() * (type === 'large' ? 3 : type === 'medium' ? 4 : 6);
                star.style.animationDelay = `${animationDelay}s`;
                
                if (type === 'large') {
                    const size = Math.random() * 2 + 2;
                    star.style.width = `${size}px`;
                    star.style.height = `${size}px`;
                }
                
                starryBackground.appendChild(star);
            }
        }
        
        createStar('large', 50);
        createStar('medium', 100);
        createStar('small', 200);
        
        function createShootingStar(index) {
            const shootingStar = document.createElement('div');
            shootingStar.className = `shooting-star shooting-star-${index}`;
            starryBackground.appendChild(shootingStar);
        }
        
        createShootingStar(1);
        createShootingStar(2);
        createShootingStar(3);
        
        document.body.insertBefore(starryBackground, document.body.firstChild);
    }
    
    function optimizeStarsForMobile() {
        if (window.innerWidth <= 768) {
            const stars = document.querySelectorAll('.star');
            stars.forEach((star, index) => {
                if (index % 3 === 0) {
                    star.style.display = 'none';
                }
            });
        }
    }
    
    function initStarryBackground() {
        createStarryBackground();
        optimizeStarsForMobile();
        
        window.addEventListener('resize', () => {
            clearTimeout(window.starResizeTimeout);
            window.starResizeTimeout = setTimeout(optimizeStarsForMobile, 500);
        });
    }
    
    initStarryBackground();
    
    // Header scroll effect
    window.addEventListener('scroll', () => {
        const header = document.querySelector('header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });

});