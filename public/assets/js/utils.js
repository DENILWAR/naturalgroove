/**
 * NATURAL GROOVE - Utilidades Globales
 * Funciones de utilidad, helpers y fixes para móvil
 */

(function() {
    'use strict';

    // ===== DETECCIÓN DE DISPOSITIVO =====
    const DeviceDetection = {
        isMobile: function() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        },
        
        isIOS: function() {
            return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        },
        
        isSafari: function() {
            return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        },
        
        isTouch: function() {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },
        
        getDeviceType: function() {
            if (this.isMobile()) {
                return window.innerWidth < 768 ? 'mobile' : 'tablet';
            }
            return 'desktop';
        }
    };

    // ===== FIX PARA iOS - 300ms DELAY =====
    function initIOSFixes() {
        if (DeviceDetection.isIOS()) {
            // Añadir clase al body para CSS específico
            document.body.classList.add('is-ios');
            
            // Fix para el viewport en iOS Safari
            const metaViewport = document.querySelector('meta[name="viewport"]');
            if (metaViewport) {
                metaViewport.setAttribute('content', 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            }
        }
        
        if (DeviceDetection.isMobile()) {
            document.body.classList.add('is-mobile-device');
        }
        
        if (DeviceDetection.isTouch()) {
            document.body.classList.add('is-touch-device');
        }
    }

    // ===== HELPER PARA EVENTOS TÁCTILES =====
    function addTapEvent(element, callback, options = {}) {
        if (!element) return;
        
        const { preventDefault = true, stopPropagation = false } = options;
        
        // Para dispositivos táctiles
        if (DeviceDetection.isTouch()) {
            let touchStartY = 0;
            let touchStartX = 0;
            
            element.addEventListener('touchstart', function(e) {
                touchStartY = e.touches[0].clientY;
                touchStartX = e.touches[0].clientX;
            }, { passive: true });
            
            element.addEventListener('touchend', function(e) {
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndX = e.changedTouches[0].clientX;
                
                // Solo ejecutar si no fue un scroll (movimiento < 10px)
                const deltaY = Math.abs(touchEndY - touchStartY);
                const deltaX = Math.abs(touchEndX - touchStartX);
                
                if (deltaY < 10 && deltaX < 10) {
                    if (preventDefault) e.preventDefault();
                    if (stopPropagation) e.stopPropagation();
                    callback.call(this, e);
                }
            }, { passive: !preventDefault });
        }
        
        // También añadir click para desktop
        element.addEventListener('click', function(e) {
            if (preventDefault) e.preventDefault();
            if (stopPropagation) e.stopPropagation();
            callback.call(this, e);
        });
    }

    // ===== FORMATEO DE PRECIOS =====
    function formatPrice(amount, currency = 'EUR') {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    }

    // ===== VALIDACIONES =====
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidPhone(phone) {
        const phoneRegex = /^[+]?[\d\s-]{9,}$/;
        return phoneRegex.test(phone);
    }

    // ===== DEBOUNCE Y THROTTLE =====
    function debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ===== NOTIFICACIONES TOAST =====
    function showToast(message, type = 'info', duration = 3000) {
        // Remover toast existente
        const existingToast = document.querySelector('.ng-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Crear nuevo toast
        const toast = document.createElement('div');
        toast.className = `ng-toast ng-toast-${type}`;
        toast.innerHTML = `
            <div class="ng-toast-content">
                <i class="fas ${getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Añadir estilos inline si no existen
        if (!document.getElementById('ng-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'ng-toast-styles';
            styles.textContent = `
                .ng-toast {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    padding: 12px 24px;
                    border-radius: 8px;
                    background: #333;
                    color: white;
                    z-index: 10000;
                    opacity: 0;
                    transition: all 0.3s ease;
                    max-width: 90%;
                    text-align: center;
                }
                .ng-toast.show {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                .ng-toast-success { background: #10b981; }
                .ng-toast-error { background: #ef4444; }
                .ng-toast-warning { background: #f59e0b; }
                .ng-toast-info { background: #3b82f6; }
                .ng-toast-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(toast);
        
        // Mostrar con animación
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Ocultar después del tiempo
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    function getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // ===== LOCAL STORAGE HELPERS =====
    const Storage = {
        set: function(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error saving to localStorage:', e);
                return false;
            }
        },
        
        get: function(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return defaultValue;
            }
        },
        
        remove: function(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage:', e);
                return false;
            }
        },
        
        clear: function() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Error clearing localStorage:', e);
                return false;
            }
        }
    };

    // ===== SCROLL HELPERS =====
    function scrollToElement(selector, offset = 0) {
        const element = typeof selector === 'string' 
            ? document.querySelector(selector) 
            : selector;
            
        if (element) {
            const headerHeight = document.querySelector('header')?.offsetHeight || 0;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - headerHeight - offset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }

    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // ===== URL HELPERS =====
    function getUrlParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    function setUrlParam(param, value) {
        const url = new URL(window.location);
        url.searchParams.set(param, value);
        window.history.pushState({}, '', url);
    }

    // ===== INICIALIZACIÓN =====
    function init() {
        initIOSFixes();
        console.log('🔧 Utils initialized | Device:', DeviceDetection.getDeviceType());
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ===== API PÚBLICA =====
    window.NGUtils = {
        // Detección
        device: DeviceDetection,
        
        // Eventos
        addTapEvent: addTapEvent,
        
        // Formateo
        formatPrice: formatPrice,
        
        // Validaciones
        isValidEmail: isValidEmail,
        isValidPhone: isValidPhone,
        
        // Funciones de tiempo
        debounce: debounce,
        throttle: throttle,
        
        // UI
        showToast: showToast,
        
        // Storage
        storage: Storage,
        
        // Scroll
        scrollToElement: scrollToElement,
        isInViewport: isInViewport,
        
        // URL
        getUrlParam: getUrlParam,
        setUrlParam: setUrlParam
    };

    // Alias globales para compatibilidad
    window.showToast = showToast;
    window.formatPrice = formatPrice;
    window.isValidEmail = isValidEmail;
    window.debounce = debounce;
    window.throttle = throttle;

})();