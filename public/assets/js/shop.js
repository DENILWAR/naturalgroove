/**
 * NATURAL GROOVE SHOP - JavaScript Functionality
 * Gestión completa de la tienda: productos, filtros, carrito, modales
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== CONFIGURACIÓN Y VARIABLES GLOBALES =====
    const CONFIG = {
        productsDataUrl: '../data/products.json',
        animationDuration: 300,
        debounceDelay: 300,
        notificationDuration: 3000
    };

    // Cache de elementos DOM
    const DOM = {
        // Filtros
        categoryFilter: document.getElementById('category-filter'),
        priceFilter: document.getElementById('price-filter'),
        sortFilter: document.getElementById('sort-filter'),
        searchInput: document.getElementById('search-input'),
        searchBtn: document.getElementById('search-btn'),
        clearFiltersBtn: document.getElementById('clear-filters'),
        
        // Productos
        productsGrid: document.getElementById('products-grid'),
        loadingProducts: document.getElementById('loading-products'),
        noResults: document.getElementById('no-results'),
        productsShowing: document.getElementById('products-showing'),
        productsTotal: document.getElementById('products-total'),
        
        // Categorías
        categoryCards: document.querySelectorAll('.category-card'),
        
        // Modales
        sizeGuideModal: document.getElementById('size-guide-modal'),
        quickViewModal: document.getElementById('quick-view-modal'),
        quickViewTitle: document.getElementById('quick-view-title'),
        quickViewBody: document.getElementById('quick-view-body'),
        
        // Newsletter
        newsletterEmail: document.getElementById('newsletter-email'),
        newsletterSubmit: document.getElementById('newsletter-submit'),
        
        // Links del footer
        sizeGuideLink: document.getElementById('size-guide-link'),
        shippingInfoLink: document.getElementById('shipping-info-link'),
        
        // Notificaciones
        cartNotification: document.getElementById('cart-notification'),
        notificationText: document.getElementById('notification-text'),
        
        // Carrito
        cartCount: document.getElementById('cart-count')
    };

    // Variables de estado
    let allProducts = [];
    let filteredProducts = [];
    let currentFilters = {
        category: 'all',
        price: 'all',
        sort: 'featured',
        search: ''
    };
    let debounceTimer = null;

    // ===== INICIALIZACIÓN =====
    async function init() {
        console.log('🛍️ Natural Groove Shop - Iniciando...');
        
        try {
            // Cargar productos
            await loadProducts();
            
            // Inicializar componentes
            initEventListeners();
            initCategoryCards();
            initModals();
            initNewsletter();
            updateCartCount();
            
            console.log('✅ Shop inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando shop:', error);
            showError('Error cargando la tienda. Por favor, recarga la página.');
        }
    }

    // ===== CARGA DE PRODUCTOS =====
    async function loadProducts() {
        try {
            showLoading(true);
            
            const response = await fetch(CONFIG.productsDataUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            allProducts = data.products || [];
            
            // Aplicar filtros y mostrar productos
            applyFilters();
            
        } catch (error) {
            console.error('Error cargando productos:', error);
            // Fallback con productos de ejemplo si falla la carga
            loadFallbackProducts();
        } finally {
            showLoading(false);
        }
    }

    // Productos de ejemplo como fallback
    function loadFallbackProducts() {
        allProducts = [
            {
                id: 'ng-shirt-001',
                name: 'Natural Groove Logo Tee',
                category: 'camisetas',
                price: 25,
                originalPrice: null,
                currency: 'EUR',
                images: {
                    front: '../assets/images/products/shirt-001-front.jpg',
                    back: '../assets/images/products/shirt-001-back.jpg',
                    thumbnail: '../assets/images/products/shirt-001-thumb.jpg'
                },
                sizes: ['S', 'M', 'L', 'XL'],
                colors: ['Negro', 'Blanco'],
                description: 'Camiseta 100% algodón con logo Natural Groove',
                material: '100% Algodón orgánico',
                featured: true,
                available: true,
                badge: 'new'
            },
            {
                id: 'ng-hoodie-001',
                name: 'NG Classic Hoodie',
                category: 'hoodies',
                price: 45,
                originalPrice: 55,
                currency: 'EUR',
                images: {
                    front: '../assets/images/products/hoodie-001-front.jpg',
                    thumbnail: '../assets/images/products/hoodie-001-thumb.jpg'
                },
                sizes: ['S', 'M', 'L', 'XL'],
                colors: ['Negro', 'Gris'],
                description: 'Hoodie cómodo perfecto para sesiones nocturnas',
                material: '80% Algodón, 20% Poliéster',
                featured: true,
                available: true,
                badge: 'sale'
            }
        ];
        
        applyFilters();
    }

    // ===== FILTROS Y BÚSQUEDA =====
    function initEventListeners() {
        // Filtros
        DOM.categoryFilter?.addEventListener('change', handleFilterChange);
        DOM.priceFilter?.addEventListener('change', handleFilterChange);
        DOM.sortFilter?.addEventListener('change', handleFilterChange);
        
        // Búsqueda
        DOM.searchInput?.addEventListener('input', handleSearchInput);
        DOM.searchBtn?.addEventListener('click', handleSearch);
        DOM.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        
        // Limpiar filtros
        DOM.clearFiltersBtn?.addEventListener('click', clearAllFilters);
    }

    function handleFilterChange(event) {
        const filterType = event.target.id.replace('-filter', '');
        currentFilters[filterType] = event.target.value;
        applyFilters();
    }

    function handleSearchInput(event) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentFilters.search = event.target.value.toLowerCase().trim();
            applyFilters();
        }, CONFIG.debounceDelay);
    }

    function handleSearch() {
        if (DOM.searchInput) {
            currentFilters.search = DOM.searchInput.value.toLowerCase().trim();
            applyFilters();
        }
    }

    function clearAllFilters() {
        // Resetear filtros
        currentFilters = {
            category: 'all',
            price: 'all',
            sort: 'featured',
            search: ''
        };
        
        // Resetear elementos DOM
        if (DOM.categoryFilter) DOM.categoryFilter.value = 'all';
        if (DOM.priceFilter) DOM.priceFilter.value = 'all';
        if (DOM.sortFilter) DOM.sortFilter.value = 'featured';
        if (DOM.searchInput) DOM.searchInput.value = '';
        
        applyFilters();
    }

    function applyFilters() {
        // Comenzar con todos los productos
        filteredProducts = [...allProducts];
        
        // Aplicar filtro de categoría
        if (currentFilters.category !== 'all') {
            filteredProducts = filteredProducts.filter(product => 
                product.category === currentFilters.category
            );
        }
        
        // Aplicar filtro de precio
        if (currentFilters.price !== 'all') {
            const [min, max] = currentFilters.price.split('-').map(p => 
                p === '+' ? Infinity : parseInt(p)
            );
            filteredProducts = filteredProducts.filter(product => {
                if (max === undefined) return product.price >= min;
                return product.price >= min && product.price <= max;
            });
        }
        
        // Aplicar búsqueda
        if (currentFilters.search) {
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(currentFilters.search) ||
                product.description.toLowerCase().includes(currentFilters.search) ||
                product.category.toLowerCase().includes(currentFilters.search)
            );
        }
        
        // Aplicar ordenación
        applySorting();
        
        // Renderizar productos
        renderProducts();
        updateProductsCount();
    }

    function applySorting() {
        switch (currentFilters.sort) {
            case 'price-low':
                filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'featured':
            default:
                filteredProducts.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return 0;
                });
                break;
        }
    }

    // ===== RENDERIZADO DE PRODUCTOS =====
    function renderProducts() {
        if (!DOM.productsGrid) return;
        
        // Mostrar/ocultar estado de "sin resultados"
        if (filteredProducts.length === 0) {
            DOM.productsGrid.style.display = 'none';
            if (DOM.noResults) DOM.noResults.style.display = 'block';
            return;
        }
        
        if (DOM.noResults) DOM.noResults.style.display = 'none';
        DOM.productsGrid.style.display = 'grid';
        
        // Generar HTML de productos
        DOM.productsGrid.innerHTML = filteredProducts.map(product => 
            createProductCard(product)
        ).join('');
        
        // Añadir event listeners a las nuevas cards
        addProductEventListeners();
    }

    function createProductCard(product) {
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        const mainImage = product.images.front || product.images.thumbnail;
        const badgeText = product.badge === 'new' ? 'Nuevo' : 
                         product.badge === 'sale' ? 'Oferta' : '';
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${mainImage}" alt="${product.name}" loading="lazy" 
                         onerror="this.src='../assets/images/placeholder-product.jpg'">
                    ${badgeText ? `<div class="product-badge ${product.badge}">${badgeText}</div>` : ''}
                    <div class="product-actions">
                        <button class="action-btn quick-view-btn" title="Vista rápida">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn wishlist-btn" title="Agregar a favoritos">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">
                        <span class="price-current">${product.price}€</span>
                        ${hasDiscount ? `<span class="price-original">${product.originalPrice}€</span>` : ''}
                    </div>
                    <div class="product-sizes">
                        ${product.sizes.map(size => 
                            `<div class="size-option" data-size="${size}">${size}</div>`
                        ).join('')}
                    </div>
                    <button class="add-to-cart-btn" 
                            ${!product.available ? 'disabled' : ''}>
                        ${product.available ? 'Añadir al carrito' : 'Agotado'}
                    </button>
                </div>
            </div>
        `;
    }

    function addProductEventListeners() {
        // Selección de tallas
        document.querySelectorAll('.size-option').forEach(sizeBtn => {
            sizeBtn.addEventListener('click', function() {
                // Deseleccionar otras tallas en la misma card
                const card = this.closest('.product-card');
                card.querySelectorAll('.size-option').forEach(btn => 
                    btn.classList.remove('selected'));
                
                // Seleccionar esta talla
                this.classList.add('selected');
                
                // Habilitar botón de añadir al carrito
                const addBtn = card.querySelector('.add-to-cart-btn');
                if (addBtn && !addBtn.disabled) {
                    addBtn.style.opacity = '1';
                }
            });
        });
        
        // Botones de añadir al carrito
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', handleAddToCart);
        });
        
        // Vista rápida
        document.querySelectorAll('.quick-view-btn').forEach(btn => {
            btn.addEventListener('click', handleQuickView);
        });
        
        // Wishlist (placeholder por ahora)
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', handleWishlist);
        });
    }

    // ===== GESTIÓN DEL CARRITO =====
    function handleAddToCart(event) {
        event.preventDefault();
        const card = event.target.closest('.product-card');
        const productId = card.dataset.productId;
        const selectedSize = card.querySelector('.size-option.selected');
        
        if (!selectedSize) {
            showNotification('Por favor, selecciona una talla', 'warning');
            return;
        }
        
        const product = allProducts.find(p => p.id === productId);
        if (!product) return;
        
        const cartItem = {
            id: productId,
            name: product.name,
            price: product.price,
            size: selectedSize.dataset.size,
            image: product.images.thumbnail || product.images.front,
            quantity: 1
        };
        
        // Usar la función del carrito global
        if (typeof addToCart === 'function') {
            addToCart(cartItem);
            showNotification(`${product.name} añadido al carrito`);
            updateCartCount();
        } else {
            console.warn('Función addToCart no disponible');
        }
    }

    function updateCartCount() {
        if (DOM.cartCount && typeof getCartItemCount === 'function') {
            const count = getCartItemCount();
            DOM.cartCount.textContent = count;
            DOM.cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // ===== VISTA RÁPIDA =====
    function handleQuickView(event) {
        event.preventDefault();
        const card = event.target.closest('.product-card');
        const productId = card.dataset.productId;
        const product = allProducts.find(p => p.id === productId);
        
        if (product) {
            showQuickView(product);
        }
    }

    function showQuickView(product) {
        if (!DOM.quickViewModal || !DOM.quickViewBody) return;
        
        DOM.quickViewTitle.textContent = product.name;
        DOM.quickViewBody.innerHTML = createQuickViewContent(product);
        DOM.quickViewModal.style.display = 'block';
        
        // Añadir event listeners al contenido del modal
        addQuickViewEventListeners(product);
    }

    function createQuickViewContent(product) {
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        
        return `
            <div class="quick-view-content">
                <div class="quick-view-image">
                    <img src="${product.images.front || product.images.thumbnail}" 
                         alt="${product.name}">
                </div>
                <div class="quick-view-info">
                    <div class="product-category">${product.category}</div>
                    <h2>${product.name}</h2>
                    <p class="description">${product.description}</p>
                    <div class="material-info">
                        <strong>Material:</strong> ${product.material || 'No especificado'}
                    </div>
                    <div class="price-section">
                        <span class="price-current">${product.price}€</span>
                        ${hasDiscount ? `<span class="price-original">${product.originalPrice}€</span>` : ''}
                    </div>
                    <div class="sizes-section">
                        <h4>Tallas disponibles:</h4>
                        <div class="product-sizes">
                            ${product.sizes.map(size => 
                                `<div class="size-option" data-size="${size}">${size}</div>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="colors-section">
                        <h4>Colores disponibles:</h4>
                        <div class="color-options">
                            ${product.colors.map(color => 
                                `<span class="color-option">${color}</span>`
                            ).join(', ')}
                        </div>
                    </div>
                    <button class="add-to-cart-btn quick-view-add" data-product-id="${product.id}">
                        Añadir al carrito
                    </button>
                </div>
            </div>
        `;
    }

    function addQuickViewEventListeners(product) {
        // Selección de tallas en modal
        document.querySelectorAll('#quick-view-modal .size-option').forEach(sizeBtn => {
            sizeBtn.addEventListener('click', function() {
                document.querySelectorAll('#quick-view-modal .size-option').forEach(btn => 
                    btn.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
        
        // Añadir al carrito desde modal
        const addBtn = document.querySelector('.quick-view-add');
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                const selectedSize = document.querySelector('#quick-view-modal .size-option.selected');
                
                if (!selectedSize) {
                    showNotification('Por favor, selecciona una talla', 'warning');
                    return;
                }
                
                const cartItem = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    size: selectedSize.dataset.size,
                    image: product.images.thumbnail || product.images.front,
                    quantity: 1
                };
                
                if (typeof addToCart === 'function') {
                    addToCart(cartItem);
                    showNotification(`${product.name} añadido al carrito`);
                    updateCartCount();
                    closeModal(DOM.quickViewModal);
                }
            });
        }
    }

    // ===== WISHLIST (PLACEHOLDER) =====
    function handleWishlist(event) {
        event.preventDefault();
        const btn = event.target.closest('.wishlist-btn');
        const icon = btn.querySelector('i');
        
        // Toggle estado visual
        if (icon.classList.contains('fas')) {
            icon.classList.remove('fas');
            icon.classList.add('far');
            showNotification('Eliminado de favoritos', 'info');
        } else {
            icon.classList.remove('far');
            icon.classList.add('fas');
            showNotification('Añadido a favoritos', 'success');
        }
    }

    // ===== CATEGORÍAS =====
    function initCategoryCards() {
        DOM.categoryCards.forEach(card => {
            card.addEventListener('click', function() {
                const category = this.dataset.category;
                if (category && DOM.categoryFilter) {
                    DOM.categoryFilter.value = category;
                    currentFilters.category = category;
                    applyFilters();
                    
                    // Scroll al grid de productos
                    document.getElementById('products')?.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ===== MODALES =====
    function initModals() {
        // Cerrar modales con X
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                closeModal(modal);
            });
        });
        
        // Cerrar modales clickeando fuera
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this);
                }
            });
        });
        
        // Enlaces de modales
        DOM.sizeGuideLink?.addEventListener('click', function(e) {
            e.preventDefault();
            if (DOM.sizeGuideModal) {
                DOM.sizeGuideModal.style.display = 'block';
            }
        });
        
        DOM.shippingInfoLink?.addEventListener('click', function(e) {
            e.preventDefault();
            showShippingInfo();
        });
    }

    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function showShippingInfo() {
        // Crear modal dinámico para info de envíos
        const shippingContent = `
            <div class="shipping-info">
                <h3>Información de Envíos</h3>
                <div class="shipping-options">
                    <div class="shipping-option">
                        <h4>🚚 Envío Estándar</h4>
                        <p>3-5 días laborables | Gratuito en pedidos >50€</p>
                        <p><strong>Precio:</strong> 4.95€</p>
                    </div>
                    <div class="shipping-option">
                        <h4>⚡ Envío Express</h4>
                        <p>1-2 días laborables</p>
                        <p><strong>Precio:</strong> 9.95€</p>
                    </div>
                    <div class="shipping-option">
                        <h4>📦 Recogida en Tienda</h4>
                        <p>Disponible en 24-48h</p>
                        <p><strong>Precio:</strong> Gratuito</p>
                    </div>
                </div>
                <p class="shipping-note">
                    Los pedidos realizados antes de las 14:00 se procesan el mismo día.
                </p>
            </div>
        `;
        
        if (DOM.quickViewModal && DOM.quickViewBody) {
            DOM.quickViewTitle.textContent = 'Información de Envíos';
            DOM.quickViewBody.innerHTML = shippingContent;
            DOM.quickViewModal.style.display = 'block';
        }
    }

    // ===== NEWSLETTER =====
    function initNewsletter() {
        DOM.newsletterSubmit?.addEventListener('click', handleNewsletterSubmit);
        DOM.newsletterEmail?.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleNewsletterSubmit();
            }
        });
    }

    function handleNewsletterSubmit() {
        const email = DOM.newsletterEmail?.value.trim();
        
        if (!email) {
            showNotification('Por favor, introduce tu email', 'warning');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Por favor, introduce un email válido', 'warning');
            return;
        }
        
        // Simular suscripción (aquí integrarías con tu servicio de email)
        showNotification('¡Gracias por suscribirte! 🌿', 'success');
        if (DOM.newsletterEmail) DOM.newsletterEmail.value = '';
        
        // Aquí añadirías la integración real con tu servicio de newsletter
        console.log('Newsletter subscription:', email);
    }

    // ===== UTILIDADES =====
    function showLoading(show) {
        if (DOM.loadingProducts) {
            DOM.loadingProducts.style.display = show ? 'block' : 'none';
        }
        if (DOM.productsGrid) {
            DOM.productsGrid.style.display = show ? 'none' : 'grid';
        }
    }

    function updateProductsCount() {
        if (DOM.productsTotal) {
            DOM.productsTotal.textContent = filteredProducts.length;
        }
    }

    function showNotification(message, type = 'success') {
        if (!DOM.cartNotification || !DOM.notificationText) return;
        
        DOM.notificationText.textContent = message;
        DOM.cartNotification.className = `cart-notification ${type}`;
        DOM.cartNotification.classList.add('show');
        
        setTimeout(() => {
            DOM.cartNotification.classList.remove('show');
        }, CONFIG.notificationDuration);
    }

    function showError(message) {
        console.error(message);
        if (DOM.productsGrid) {
            DOM.productsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error cargando productos</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn-secondary">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ===== API PÚBLICA =====
    window.NaturalGrooveShop = {
        // Métodos públicos para debugging y extensión
        getProducts: () => allProducts,
        getFilteredProducts: () => filteredProducts,
        getCurrentFilters: () => currentFilters,
        applyFilters: applyFilters,
        showNotification: showNotification,
        updateCartCount: updateCartCount
    };

    // ===== INICIALIZAR =====
    init();
    
});