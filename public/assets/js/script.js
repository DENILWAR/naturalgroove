document.addEventListener('DOMContentLoaded', function() {
    
    // ===== CONFIGURACIÓN Y VARIABLES GLOBALES =====
    const CONFIG = {
        parallaxSpeed: 0.08,
        floatInterval: 4000,
        floatDuration: 2000,
        letterFlickerChance: 0.075, // 1.5% de probabilidad por letra cada segundo
        letterFlickerDuration: 500,
        mobileBreakpoint: 768,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
    
    // Cache de elementos DOM
    const DOM = {
        navLinks: document.querySelectorAll('nav a[href^="#"]'), // Solo links que empiecen con #
        mainTitles: document.querySelectorAll('#home h1'),
        chromeObjects: null, // Se inicializa después
        allSections: document.querySelectorAll('.section'),
        productCircle: document.querySelector('.product-circle'),
        productLabels: null, // Se inicializa después
        productDots: null, // Se inicializa después
        centerShop: null // Se inicializa después
    };
    
    // Estados globales
    let ticking = false;
    let isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
    let objectStates = new Map();
    let letterFlickerTimeouts = new Map();
    
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
            
            // Crear contenedor para las letras
            const letterContainer = document.createElement('div');
            letterContainer.className = 'neon-letters-container';
            
            // Crear cada letra como elemento independiente
            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                const span = document.createElement('span');
                span.className = 'neon-letter';
                span.textContent = char === ' ' ? '\u00A0' : char; // Preservar espacios
                span.setAttribute('data-letter-index', i);
                span.setAttribute('data-title-index', titleIndex);
                
                // Estado inicial normal
                span.setAttribute('data-state', 'normal');
                
                letterContainer.appendChild(span);
            }
            
            title.appendChild(letterContainer);
        });
        
        // Iniciar sistema de parpadeo aleatorio
        startLetterFlickerSystem();
    }
    
    // Sistema de parpadeo aleatorio por letras
    function startLetterFlickerSystem() {
        const allLetters = document.querySelectorAll('.neon-letter');
        
        function randomFlicker() {
            if (CONFIG.reducedMotion) return;
            
            allLetters.forEach(letter => {
                // Solo aplicar a letras que no están espacios y no están ya parpadeando
                if (letter.textContent.trim() && letter.getAttribute('data-state') === 'normal') {
                    if (Math.random() < CONFIG.letterFlickerChance) {
                        flickerLetter(letter);
                    }
                }
            });
            
            // Siguiente check en 1 segundo
            setTimeout(randomFlicker, 1000);
        }
        
        // Iniciar después de 2 segundos para dar tiempo a cargar
        setTimeout(randomFlicker, 300);
    }
    
    // Función para hacer parpadear una letra específica
    function flickerLetter(letter) {
        const letterId = letter.getAttribute('data-letter-index') + '_' + letter.getAttribute('data-title-index');
        
        // Evitar múltiples parpadeos simultáneos en la misma letra
        if (letterFlickerTimeouts.has(letterId)) {
            clearTimeout(letterFlickerTimeouts.get(letterId));
        }
        
        // Cambiar estado a flickering
        letter.setAttribute('data-state', 'flickering');
        letter.classList.add('letter-flickering');
        
        // Volver a normal después del tiempo definido
        const timeoutId = setTimeout(() => {
            letter.setAttribute('data-state', 'normal');
            letter.classList.remove('letter-flickering');
            letterFlickerTimeouts.delete(letterId);
        }, CONFIG.letterFlickerDuration);
        
        letterFlickerTimeouts.set(letterId, timeoutId);
    }
    
    // ===== PRELOAD DE IMÁGENES OPTIMIZADO =====
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
    
    // ===== CHROME OBJECTS OPTIMIZADOS =====
    function initChromeObjects() {
        // Filtrar objetos que no sean obj-right-top
        DOM.chromeObjects = document.querySelectorAll('.chrome-object:not(.obj-right-top)');
        
        // Inicializar estados solo una vez
        DOM.chromeObjects.forEach(obj => {
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
        
        // Iniciar animaciones si no está en modo reducido
        if (!CONFIG.reducedMotion) {
            startFloatingAnimation();
        }
    }
    
    // Función de animación de flotación optimizada
    function animateFloating() {
        if (CONFIG.reducedMotion) return;
        
        DOM.chromeObjects.forEach(obj => {
            const state = objectStates.get(obj);
            if (!state || state.isAnimating) return;
            
            state.isAnimating = true;
            
            // Valores aleatorios más suaves para móvil
            const maxMovement = isMobile ? 10 : 20;
            const maxRotation = isMobile ? 1.5 : 3;
            
            const targetFloatX = (Math.random() - 0.5) * maxMovement;
            const targetFloatY = (Math.random() - 0.5) * maxMovement;
            const targetRotate = (Math.random() - 0.5) * maxRotation;
            
            // Animación usando requestAnimationFrame con easing
            animateToPosition(obj, state, targetFloatX, targetFloatY, targetRotate);
        });
    }
    
    // Función de animación suave con easing
    function animateToPosition(obj, state, targetX, targetY, targetRotate) {
        const startTime = performance.now();
        const startX = state.floatX;
        const startY = state.floatY;
        const startRotate = state.floatRotate;
        
        function animate(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / CONFIG.floatDuration, 1);
            
            // Easing suave (easeInOutCubic)
            const easeProgress = progress < 0.5 
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // Interpolación
            state.floatX = startX + (targetX - startX) * easeProgress;
            state.floatY = startY + (targetY - startY) * easeProgress;
            state.floatRotate = startRotate + (targetRotate - startRotate) * easeProgress;
            
            // Aplicar transformación
            updateObjectTransform(obj);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                state.isAnimating = false;
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    // Función para actualizar transformación combinada optimizada
    function updateObjectTransform(obj) {
        const state = objectStates.get(obj);
        if (!state) return;
        
        const totalX = state.parallaxX + state.floatX;
        const totalY = state.parallaxY + state.floatY;
        
        // Usar transform3d para activar aceleración GPU
        obj.style.transform = `translate3d(${totalX}px, ${totalY}px, 0) rotate(${state.floatRotate}deg)`;
    }
    
    // Iniciar animación de flotación
    function startFloatingAnimation() {
        if (CONFIG.reducedMotion) return;
        
        // Ejecutar inmediatamente
        animateFloating();
        
        // Configurar intervalo (menos frecuente en móvil)
        const interval = isMobile ? CONFIG.floatInterval * 2 : CONFIG.floatInterval;
        setInterval(animateFloating, interval);
    }
    
    // ===== PARALLAX SCROLL OPTIMIZADO =====
    function updateParallax() {
        if (CONFIG.reducedMotion) return;
        
        const scrollPosition = window.pageYOffset;
        
        DOM.chromeObjects.forEach(obj => {
            const state = objectStates.get(obj);
            if (!state) return;
            
            const parallaxY = -scrollPosition * CONFIG.parallaxSpeed;
            
            // Parallax X basado en clase del objeto
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
            
            // Actualizar solo si no está animando flotación
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
    
    // ===== INTERSECTION OBSERVER OPTIMIZADO =====
    function initSectionObserver() {
        // Configurar estilos iniciales de manera más eficiente
        const initialStyles = `
            .section {
                opacity: 0;
                transform: translateY(50px);
                transition: opacity 0.8s ease, transform 0.8s ease;
            }
        `;
        
        // Agregar estilos solo si no existe
        if (!document.getElementById('section-initial-styles')) {
            const style = document.createElement('style');
            style.id = 'section-initial-styles';
            style.textContent = initialStyles;
            document.head.appendChild(style);
        }
        
        // Intersection Observer con configuración optimizada
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    // Opcional: dejar de observar después de animar
                    // sectionObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // Observar todas las secciones
        DOM.allSections.forEach(section => {
            sectionObserver.observe(section);
        });
    }
    
    // ===== CÍRCULO DE PRODUCTOS OPTIMIZADO =====
    function initProductCircle() {
        if (!DOM.productCircle) return;
        
        // Cachear elementos de productos
        DOM.productLabels = document.querySelectorAll('.product-dot span');
        DOM.productDots = document.querySelectorAll('.product-dot');
        DOM.centerShop = document.querySelector('.product-center');
        
        let rotation = 0;
        let isHovered = false;
        let animationId;
        
        // Event listeners optimizados para el círculo
        DOM.productCircle.addEventListener('mouseenter', () => {
            isHovered = true;
        }, { passive: true });
        
        DOM.productCircle.addEventListener('mouseleave', () => {
            isHovered = false;
        }, { passive: true });
        
        // Event listeners específicos para productos (pausar rotación en hover individual)
        DOM.productDots.forEach(dot => {
            dot.addEventListener('mouseenter', () => {
                isHovered = true;
            }, { passive: true });
            
            dot.addEventListener('mouseleave', () => {
                // Pequeño delay antes de reanudar rotación
                setTimeout(() => {
                    if (!DOM.productCircle.matches(':hover')) {
                        isHovered = false;
                    }
                }, 100);
            }, { passive: true });
        });
        
        // Event listener para el botón central
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
        
        // Función de animación unificada
        function animateCircle() {
            if (!CONFIG.reducedMotion && !isHovered) {
                rotation += 0.2;
                DOM.productCircle.style.transform = `rotate(${rotation}deg)`;
                
                // Actualizar etiquetas para que se mantengan legibles
                DOM.productLabels.forEach(label => {
                    label.style.transform = `translateX(-50%) rotate(${-rotation}deg)`;
                });
            }
            
            animationId = requestAnimationFrame(animateCircle);
        }
        
        // Iniciar animación solo si no hay movimiento reducido
        if (!CONFIG.reducedMotion) {
            animateCircle();
        }
        
        // Limpieza en caso de necesidad
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }
    
    // ===== EFECTOS DE HOVER CON DELEGACIÓN =====
    function initHoverEffects() {
        // Usar delegación de eventos para mejor performance
        // Excluir los product-dot y product-center ya que tienen sus propios efectos
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
    
    // ===== OPTIMIZACIÓN PARA MÓVILES =====
    function handleMobileOptimizations() {
        if (isMobile) {
            // Reducir la frecuencia de parpadeo de letras en móvil
            CONFIG.letterFlickerChance = 0.008; // Reducir a la mitad
            
            // Agregar estilos específicos para móvil
            const mobileStyles = `
                .chrome-object {
                    opacity: 0.6;
                }
                .neon-letter {
                    will-change: auto;
                }
                .product-dot:hover,
                .product-center:hover {
                    transform: scale(1.5) !important;
                }
            `;
            
            const mobileStyleElement = document.createElement('style');
            mobileStyleElement.id = 'mobile-optimizations';
            mobileStyleElement.textContent = mobileStyles;
            document.head.appendChild(mobileStyleElement);
        }
    }
    
    // ===== MANEJO DE RESIZE OPTIMIZADO =====
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
        console.log('🚀 Natural Groove - Inicializando optimizado...');
        
        // Preload crítico
        preloadCriticalImages();
        
        // Inicializar componentes en orden de prioridad
        initNavigation();
        createNeonLetters();
        initChromeObjects();
        initSectionObserver();
        initProductCircle();
        initHoverEffects();
        handleMobileOptimizations();
        initResizeHandler();
        
        // Event listeners optimizados
        window.addEventListener('scroll', requestTick, { passive: true });
        
        console.log('✅ Natural Groove - Inicialización completa');
        console.log('📱 Dispositivo móvil:', isMobile);
        console.log('🎭 Animaciones reducidas:', CONFIG.reducedMotion);
    }
    
    // Ejecutar inicialización
    init();
    
    // ===== API PÚBLICA PARA DEBUGGING =====
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
            getObjectStates: () => objectStates,
            // Nuevas funciones para productos
            getProductElements: () => ({
                circle: DOM.productCircle,
                dots: DOM.productDots,
                labels: DOM.productLabels,
                centerShop: DOM.centerShop
            })
        };
    }

    
    

// ===== MENÚ MÓVIL RESPONSIVO =====
    
    // Elementos del menú móvil
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');
    const body = document.body;
    
    // Variable para controlar el estado del menú
    let isMenuOpen = false;
    
    // Función para abrir/cerrar el menú
    function toggleMobileMenu() {
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            // Abrir menú
            mobileMenuBtn.classList.add('active');
            mobileMenuOverlay.classList.add('active');
            body.style.overflow = 'hidden'; // Prevenir scroll del body
        } else {
            // Cerrar menú
            mobileMenuBtn.classList.remove('active');
            mobileMenuOverlay.classList.remove('active');
            body.style.overflow = ''; // Restaurar scroll del body
        }
    }
    
    // Función para inicializar el menú móvil
    function initMobileMenu() {
        // Event listener para el botón del menú
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        }
        
        // Event listener para cerrar menú al hacer clic en un enlace
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', () => {
                toggleMobileMenu();
            });
        });
        
        // Event listener para cerrar menú al hacer clic fuera del contenido
        if (mobileMenuOverlay) {
            mobileMenuOverlay.addEventListener('click', (e) => {
                if (e.target === mobileMenuOverlay) {
                    toggleMobileMenu();
                }
            });
        }
        
        // Event listener para cerrar menú con la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                toggleMobileMenu();
            }
        });
        
        // Función para manejar el resize de la ventana
        function handleMenuResize() {
            // Si la pantalla es grande, cerrar el menú móvil
            if (window.innerWidth > 768 && isMenuOpen) {
                toggleMobileMenu();
            }
        }
        
        // Event listener para el resize
        window.addEventListener('resize', handleMenuResize);
        
        console.log('📱 Menú móvil inicializado');
    }
    
    // ===== DETECCIÓN DE DISPOSITIVO Y ORIENTACIÓN =====
    function initDeviceDetection() {
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isTabletDevice = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
        const isDesktopDevice = !isMobileDevice && !isTabletDevice;
        
        // Agregar clases al body para CSS específico
        body.classList.toggle('is-mobile', isMobileDevice);
        body.classList.toggle('is-tablet', isTabletDevice);
        body.classList.toggle('is-desktop', isDesktopDevice);
        
        // Función para manejar cambios de orientación
        function handleOrientationChange() {
            // Cerrar menú móvil en cambio de orientación
            if (isMenuOpen) {
                toggleMobileMenu();
            }
            
            // Detectar orientación
            const isLandscape = window.innerWidth > window.innerHeight;
            body.classList.toggle('is-landscape', isLandscape);
            body.classList.toggle('is-portrait', !isLandscape);
        }
        
        // Inicializar orientación
        handleOrientationChange();
        
        // Event listeners para orientación
        window.addEventListener('orientationchange', () => {
            setTimeout(handleOrientationChange, 100); // Delay para que la orientación se actualice
        });
        
        window.addEventListener('resize', handleOrientationChange);
        
        console.log('🔍 Detección de dispositivo inicializada');
        return { isMobileDevice, isTabletDevice, isDesktopDevice };
    }
    
    // ===== SMOOTH SCROLL MEJORADO PARA NAVEGACIÓN =====
    function initEnhancedSmoothScroll() {
        const allNavLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
        
        allNavLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Si es un enlace interno (empieza con #)
                if (href.startsWith('#') && href.length > 1) {
                    e.preventDefault();
                    
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        // Calcular offset para el header fijo
                        const header = document.querySelector('header');
                        const headerHeight = header ? header.offsetHeight : 0;
                        const targetPosition = targetElement.offsetTop - headerHeight - 20;
                        
                        // Smooth scroll
                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                        
                        // Cerrar menú móvil si está abierto
                        if (isMenuOpen) {
                            toggleMobileMenu();
                        }
                    }
                }
            });
        });
        
        console.log('🎯 Smooth scroll mejorado inicializado');
    }
    
    // ===== OPTIMIZACIÓN DE RENDIMIENTO PARA MÓVILES =====
    function initMobilePerformanceOptimizations() {
        const deviceInfo = initDeviceDetection();
        
        if (deviceInfo.isMobileDevice) {
            // Reducir animaciones en móviles para mejor rendimiento
            const chromeObjects = document.querySelectorAll('.chrome-object');
            chromeObjects.forEach(obj => {
                obj.style.willChange = 'auto';
            });
            
            // Optimizar efectos de lava para móviles
            if (window.innerWidth < 480) {
                // Reducir la frecuencia de actualización de animaciones
                CONFIG.floatInterval = CONFIG.floatInterval * 1.5;
                CONFIG.letterFlickerChance = CONFIG.letterFlickerChance * 0.7;
            }
            
            console.log('📱 Optimizaciones móviles aplicadas');
        }
    }
    
    // ===== MANEJO DE ERRORES Y FALLBACKS =====
    function initErrorHandling() {
        // Fallback para navegadores que no soportan IntersectionObserver
        if (!window.IntersectionObserver) {
            console.warn('⚠️ IntersectionObserver no soportado, usando fallback');
            // Mostrar todas las secciones inmediatamente
            DOM.allSections.forEach(section => {
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
            });
        }
        
        // Fallback para requestAnimationFrame
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback) {
                return setTimeout(callback, 1000 / 60);
            };
        }
        
        // Manejo de errores globales
        window.addEventListener('error', function(e) {
            console.error('❌ Error en Natural Groove:', e.error);
        });
        
        console.log('🛡️ Manejo de errores inicializado');
    }
    
    // ===== INICIALIZACIÓN DEL SISTEMA RESPONSIVO =====
    function initResponsiveSystem() {
        console.log('🚀 Inicializando sistema responsivo...');
        
        try {
            // Inicializar componentes responsivos
            initMobileMenu();
            initEnhancedSmoothScroll();
            initMobilePerformanceOptimizations();
            initErrorHandling();
            
            console.log('✅ Sistema responsivo inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar sistema responsivo:', error);
        }
    }
    
    // Ejecutar inicialización del sistema responsivo
    initResponsiveSystem();
    
    // ===== ACTUALIZAR API PÚBLICA =====
    // Extender la API existente con nuevas funciones móviles
    if (typeof window !== 'undefined' && window.NaturalGroove) {
        Object.assign(window.NaturalGroove, {
            // Funciones del menú móvil
            toggleMobileMenu: () => toggleMobileMenu(),
            isMobileMenuOpen: () => isMenuOpen,
            
            // Funciones de dispositivo
            getDeviceInfo: () => ({
                isMobile: body.classList.contains('is-mobile'),
                isTablet: body.classList.contains('is-tablet'),
                isDesktop: body.classList.contains('is-desktop'),
                isLandscape: body.classList.contains('is-landscape'),
                isPortrait: body.classList.contains('is-portrait')
            }),
            
            // Funciones de debug
            debugResponsive: () => {
                console.log('📱 Info del dispositivo:', window.NaturalGroove.getDeviceInfo());
                console.log('📱 Menú móvil abierto:', isMenuOpen);
                console.log('📱 Ancho de ventana:', window.innerWidth);
                console.log('📱 Alto de ventana:', window.innerHeight);
            }
        });
    }
    
    console.log('🎉 Natural Groove - Sistema completo inicializado');

});