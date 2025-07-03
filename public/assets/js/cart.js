/**
 * NATURAL GROOVE CART - Sistema de Carrito Completo
 * Gestión de carrito con localStorage, funciones globales y persistencia
 */

(function() {
    'use strict';

    // ===== CONFIGURACIÓN =====
    const CART_CONFIG = {
        storageKey: 'naturalGroove_cart',
        maxQuantity: 10,
        freeShippingThreshold: 50,
        shippingCost: 4.95,
        taxRate: 0.21, // IVA España 21%
        currency: 'EUR',
        currencySymbol: '€'
    };

    // ===== VARIABLES GLOBALES =====
    let cart = [];
    let cartEventListeners = [];

    // ===== INICIALIZACIÓN =====
    function initCart() {
        loadCartFromStorage();
        bindGlobalEvents();
        console.log('🛒 Cart system initialized');
    }

    // ===== GESTIÓN DE ALMACENAMIENTO =====
    function loadCartFromStorage() {
        try {
            const savedCart = localStorage.getItem(CART_CONFIG.storageKey);
            cart = savedCart ? JSON.parse(savedCart) : [];
            
            // Validar estructura del carrito
            cart = cart.filter(item => 
                item && 
                item.id && 
                item.name && 
                typeof item.price === 'number' && 
                typeof item.quantity === 'number'
            );
            
            console.log('Cart loaded from storage:', cart);
        } catch (error) {
            console.error('Error loading cart from storage:', error);
            cart = [];
        }
    }

    function saveCartToStorage() {
        try {
            localStorage.setItem(CART_CONFIG.storageKey, JSON.stringify(cart));
            console.log('Cart saved to storage');
        } catch (error) {
            console.error('Error saving cart to storage:', error);
        }
    }

    // ===== FUNCIONES PRINCIPALES DEL CARRITO =====
    
    /**
     * Añadir producto al carrito
     * @param {Object} product - Objeto del producto
     * @param {string} product.id - ID único del producto
     * @param {string} product.name - Nombre del producto
     * @param {number} product.price - Precio del producto
     * @param {string} product.size - Talla seleccionada
     * @param {string} product.image - URL de la imagen
     * @param {number} [product.quantity=1] - Cantidad a añadir
     */
    function addToCart(product) {
        if (!isValidProduct(product)) {
            console.error('Invalid product data:', product);
            return false;
        }

        // Crear clave única basada en id + size
        const itemKey = `${product.id}_${product.size}`;
        
        // Buscar si ya existe en el carrito
        const existingItemIndex = cart.findIndex(item => 
            item.id === product.id && item.size === product.size
        );

        if (existingItemIndex >= 0) {
            // Actualizar cantidad existente
            const newQuantity = cart[existingItemIndex].quantity + (product.quantity || 1);
            
            if (newQuantity <= CART_CONFIG.maxQuantity) {
                cart[existingItemIndex].quantity = newQuantity;
                cart[existingItemIndex].updatedAt = new Date().toISOString();
            } else {
                console.warn(`Maximum quantity (${CART_CONFIG.maxQuantity}) reached for this item`);
                return false;
            }
        } else {
            // Añadir nuevo item
            const cartItem = {
                id: product.id,
                name: product.name,
                price: product.price,
                size: product.size,
                image: product.image,
                quantity: product.quantity || 1,
                addedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            cart.push(cartItem);
        }

        saveCartToStorage();
        notifyCartChange('added', product);
        return true;
    }

    /**
     * Actualizar cantidad de un item del carrito
     * @param {string} itemId - ID del producto
     * @param {string} size - Talla del producto
     * @param {number} newQuantity - Nueva cantidad
     */
    function updateCartItemQuantity(itemId, size, newQuantity) {
        const itemIndex = cart.findIndex(item => 
            item.id === itemId && item.size === size
        );

        if (itemIndex === -1) {
            console.error('Item not found in cart');
            return false;
        }

        if (newQuantity <= 0) {
            removeFromCart(itemId, size);
            return true;
        }

        if (newQuantity > CART_CONFIG.maxQuantity) {
            console.warn(`Maximum quantity (${CART_CONFIG.maxQuantity}) exceeded`);
            return false;
        }

        const oldQuantity = cart[itemIndex].quantity;
        cart[itemIndex].quantity = newQuantity;
        cart[itemIndex].updatedAt = new Date().toISOString();

        saveCartToStorage();
        notifyCartChange('updated', cart[itemIndex], { oldQuantity, newQuantity });
        return true;
    }

    /**
     * Eliminar item del carrito
     * @param {string} itemId - ID del producto
     * @param {string} size - Talla del producto
     */
    function removeFromCart(itemId, size) {
        const itemIndex = cart.findIndex(item => 
            item.id === itemId && item.size === size
        );

        if (itemIndex === -1) {
            console.error('Item not found in cart');
            return false;
        }

        const removedItem = cart.splice(itemIndex, 1)[0];
        saveCartToStorage();
        notifyCartChange('removed', removedItem);
        return true;
    }

    /**
     * Vaciar carrito completamente
     */
    function clearCart() {
        const itemCount = cart.length;
        cart = [];
        saveCartToStorage();
        notifyCartChange('cleared', null, { itemCount });
        return true;
    }

    // ===== FUNCIONES DE CONSULTA =====

    /**
     * Obtener todos los items del carrito
     * @returns {Array} Array de items del carrito
     */
    function getCartItems() {
        return [...cart]; // Retornar copia para evitar mutaciones externas
    }

    /**
     * Obtener cantidad total de items en el carrito
     * @returns {number} Número total de items
     */
    function getCartItemCount() {
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Obtener número de productos únicos en el carrito
     * @returns {number} Número de productos únicos
     */
    function getUniqueItemCount() {
        return cart.length;
    }

    /**
     * Calcular totales del carrito - VERSIÓN CORREGIDA
     * @returns {Object} Objeto con todos los totales calculados
     */
    function getCartTotals() {
        const subtotal = cart.reduce((total, item) => 
            total + (item.price * item.quantity), 0
        );

        // CORRECCIÓN: Solo calcular envío si hay productos en el carrito
        const shipping = cart.length === 0 ? 0 : 
            (subtotal >= CART_CONFIG.freeShippingThreshold ? 0 : CART_CONFIG.shippingCost);
        
        // CORRECCIÓN: Solo calcular impuestos si hay productos
        const tax = cart.length === 0 ? 0 : (subtotal * CART_CONFIG.taxRate);
        
        const total = subtotal + shipping + tax;

        return {
            subtotal: parseFloat(subtotal.toFixed(2)),
            shipping: parseFloat(shipping.toFixed(2)),
            tax: parseFloat(tax.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            freeShippingRemaining: Math.max(0, CART_CONFIG.freeShippingThreshold - subtotal),
            hasItems: cart.length > 0,
            itemCount: getCartItemCount(),
            uniqueItems: getUniqueItemCount()
        };
    }

    /**
     * Buscar item específico en el carrito
     * @param {string} itemId - ID del producto
     * @param {string} size - Talla del producto
     * @returns {Object|null} Item encontrado o null
     */
    function findCartItem(itemId, size) {
        return cart.find(item => item.id === itemId && item.size === size) || null;
    }

    /**
     * Verificar si un producto está en el carrito
     * @param {string} itemId - ID del producto
     * @param {string} size - Talla del producto (opcional)
     * @returns {boolean} True si está en el carrito
     */
    function isInCart(itemId, size = null) {
        if (size) {
            return cart.some(item => item.id === itemId && item.size === size);
        }
        return cart.some(item => item.id === itemId);
    }

    // ===== FUNCIONES DE VALIDACIÓN =====
    function isValidProduct(product) {
        return product &&
               typeof product.id === 'string' &&
               typeof product.name === 'string' &&
               typeof product.price === 'number' &&
               typeof product.size === 'string' &&
               product.price >= 0;
    }

    // ===== SISTEMA DE EVENTOS =====
    function notifyCartChange(action, item, extraData = {}) {
        const eventData = {
            action,
            item,
            cart: getCartItems(),
            totals: getCartTotals(),
            timestamp: new Date().toISOString(),
            ...extraData
        };

        // Notificar a listeners registrados
        cartEventListeners.forEach(listener => {
            try {
                listener(eventData);
            } catch (error) {
                console.error('Error in cart event listener:', error);
            }
        });

        // Disparar evento personalizado en el document
        const customEvent = new CustomEvent('cartChanged', {
            detail: eventData
        });
        document.dispatchEvent(customEvent);

        console.log('Cart changed:', eventData);
    }

    /**
     * Registrar listener para cambios del carrito
     * @param {Function} callback - Función a ejecutar cuando cambie el carrito
     */
    function onCartChange(callback) {
        if (typeof callback === 'function') {
            cartEventListeners.push(callback);
        }
    }

    /**
     * Desregistrar listener del carrito
     * @param {Function} callback - Función a remover
     */
    function offCartChange(callback) {
        const index = cartEventListeners.indexOf(callback);
        if (index > -1) {
            cartEventListeners.splice(index, 1);
        }
    }

    // ===== FUNCIONES DE UTILIDAD =====

    /**
     * Formatear precio con moneda
     * @param {number} amount - Cantidad a formatear
     * @returns {string} Precio formateado
     */
    function formatPrice(amount) {
        return `${amount.toFixed(2)}${CART_CONFIG.currencySymbol}`;
    }

    /**
     * Generar resumen del carrito para emails
     * @returns {Object} Resumen completo del carrito
     */
    function getCartSummaryForEmail() {
        const totals = getCartTotals();
        
        return {
            items: cart.map(item => ({
                name: item.name,
                size: item.size,
                price: formatPrice(item.price),
                quantity: item.quantity,
                subtotal: formatPrice(item.price * item.quantity)
            })),
            totals: {
                subtotal: formatPrice(totals.subtotal),
                shipping: formatPrice(totals.shipping),
                tax: formatPrice(totals.tax),
                total: formatPrice(totals.total)
            },
            summary: {
                totalItems: totals.itemCount,
                uniqueProducts: totals.uniqueItems,
                freeShipping: totals.shipping === 0,
                freeShippingRemaining: totals.freeShippingRemaining > 0 ? 
                    formatPrice(totals.freeShippingRemaining) : null
            }
        };
    }

    /**
     * Exportar carrito como JSON
     * @returns {string} Carrito en formato JSON
     */
    function exportCart() {
        const exportData = {
            items: cart,
            totals: getCartTotals(),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Importar carrito desde JSON
     * @param {string} jsonData - Datos del carrito en JSON
     * @returns {boolean} True si se importó correctamente
     */
    function importCart(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.items && Array.isArray(data.items)) {
                cart = data.items.filter(isValidProduct);
                saveCartToStorage();
                notifyCartChange('imported', null, { itemCount: cart.length });
                return true;
            }
        } catch (error) {
            console.error('Error importing cart:', error);
        }
        return false;
    }

    // ===== EVENTOS GLOBALES =====
    function bindGlobalEvents() {
        // Limpiar carrito antes de cerrar página (opcional)
        window.addEventListener('beforeunload', function() {
            // Aquí podrías añadir lógica adicional antes de cerrar
        });

        // Sincronizar entre pestañas
        window.addEventListener('storage', function(e) {
            if (e.key === CART_CONFIG.storageKey) {
                loadCartFromStorage();
                notifyCartChange('synced', null);
            }
        });
    }

    // ===== FUNCIONES DE DEBUG =====
    function getCartDebugInfo() {
        return {
            config: CART_CONFIG,
            cart: cart,
            totals: getCartTotals(),
            storage: localStorage.getItem(CART_CONFIG.storageKey),
            listeners: cartEventListeners.length
        };
    }

    // ===== API PÚBLICA =====
    
    // Funciones principales del carrito
    window.addToCart = addToCart;
    window.removeFromCart = removeFromCart;
    window.updateCartItemQuantity = updateCartItemQuantity;
    window.clearCart = clearCart;
    
    // Funciones de consulta
    window.getCartItems = getCartItems;
    window.getCartItemCount = getCartItemCount;
    window.getUniqueItemCount = getUniqueItemCount;
    window.getCartTotals = getCartTotals;
    window.findCartItem = findCartItem;
    window.isInCart = isInCart;
    
    // Sistema de eventos
    window.onCartChange = onCartChange;
    window.offCartChange = offCartChange;
    
    // Utilidades
    window.formatPrice = formatPrice;
    window.getCartSummaryForEmail = getCartSummaryForEmail;
    window.exportCart = exportCart;
    window.importCart = importCart;
    
    // Objeto principal del carrito (API alternativa)
    window.NaturalGrooveCart = {
        // Acciones
        add: addToCart,
        remove: removeFromCart,
        update: updateCartItemQuantity,
        clear: clearCart,
        
        // Consultas
        getItems: getCartItems,
        getCount: getCartItemCount,
        getTotals: getCartTotals,
        find: findCartItem,
        isInCart: isInCart,
        
        // Eventos
        onChange: onCartChange,
        offChange: offCartChange,
        
        // Utilidades
        formatPrice: formatPrice,
        getEmailSummary: getCartSummaryForEmail,
        export: exportCart,
        import: importCart,
        
        // Debug
        debug: getCartDebugInfo,
        
        // Configuración
        config: CART_CONFIG
    };

    // ===== INICIALIZACIÓN AUTOMÁTICA =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCart);
    } else {
        initCart();
    }

})();