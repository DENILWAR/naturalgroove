/**
 * NATURAL GROOVE SHOP - JavaScript Functionality
 * Gestión completa de la tienda: productos, filtros, carrito, favoritos
 * CON FIXES PARA iOS/MÓVIL
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // ===== CONFIGURACIÓN Y VARIABLES GLOBALES =====
    const CONFIG = {
        productsDataUrl: 'data/products.json',
        animationDuration: 300,
        debounceDelay: 300,
        notificationDuration: 3000,
        favoritesKey: 'ng_favorites' // Key para localStorage
    };

    // Detectar si es dispositivo táctil/móvil
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    console.log('📱 Touch device:', isTouchDevice, '| iOS:', isIOS);

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
        noFavorites: document.getElementById('no-favorites'),
        productsShowing: document.getElementById('products-showing'),
        productsTotal: document.getElementById('products-total'),
        
        // Favoritos
        favoritesIndicator: document.getElementById('favorites-indicator'),
        favoritesCount: document.getElementById('favorites-count'),
        clearFavoritesBtn: document.getElementById('clear-favorites'),
        showAllProductsBtn: document.getElementById('show-all-products'),
        
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
    let favorites = []; // Array de IDs de productos favoritos
    let currentFilters = {
        category: 'all',
        price: 'all',
        sort: 'featured',
        search: ''
    };
    let debounceTimer = null;

    // ===== SISTEMA DE FAVORITOS =====
    function loadFavorites() {
        try {
            const saved = localStorage.getItem(CONFIG.favoritesKey);
            favorites = saved ? JSON.parse(saved) : [];
            console.log('💖 Favoritos cargados:', favorites.length);
        } catch (e) {
            console.error('Error cargando favoritos:', e);
            favorites = [];
        }
        updateFavoritesIndicator();
    }

    function saveFavorites() {
        try {
            localStorage.setItem(CONFIG.favoritesKey, JSON.stringify(favorites));
            console.log('💾 Favoritos guardados:', favorites.length);
        } catch (e) {
            console.error('Error guardando favoritos:', e);
        }
        updateFavoritesIndicator();
    }

    function toggleFavorite(productId) {
        const index = favorites.indexOf(productId);
        if (index === -1) {
            favorites.push(productId);
            console.log('❤️ Añadido a favoritos:', productId);
            return true; // Añadido
        } else {
            favorites.splice(index, 1);
            console.log('💔 Eliminado de favoritos:', productId);
            return false; // Eliminado
        }
    }

    function isFavorite(productId) {
        return favorites.includes(productId);
    }

    function clearAllFavorites() {
        favorites = [];
        saveFavorites();
        showNotification('Favoritos eliminados', 'info');
        
        // Actualizar UI de todos los corazones
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            const icon = btn.querySelector('i');
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = '';
        });
        
        // Si estamos viendo favoritos, volver a todos
        if (currentFilters.category === 'favorites') {
            currentFilters.category = 'all';
            if (DOM.categoryFilter) DOM.categoryFilter.value = 'all';
            applyFilters();
        }
    }

    function updateFavoritesIndicator() {
        if (DOM.favoritesIndicator && DOM.favoritesCount) {
            const count = favorites.length;
            DOM.favoritesCount.textContent = count;
            DOM.favoritesIndicator.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // ===== INICIALIZACIÓN =====
    async function init() {
        console.log('🛍️ Natural Groove Shop - Iniciando...');
        
        try {
            // Aplicar fixes de iOS primero
            applyIOSFixes();
            
            // Cargar favoritos desde localStorage
            loadFavorites();
            
            // Cargar productos
            await loadProducts();
            
            // Inicializar componentes
            initEventListeners();
            initCategoryCards();
            initModals();
            initNewsletter();
            initFavoritesListeners();
            updateCartCount();
            
            // Escuchar cambios del carrito
            document.addEventListener('cartChanged', function(e) {
                updateCartCount();
            });
            
            console.log('✅ Shop inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando shop:', error);
            showError('Error cargando la tienda. Por favor, recarga la página.');
        }
    }

    // ===== LISTENERS DE FAVORITOS =====
    function initFavoritesListeners() {
        // Botón limpiar favoritos
        if (DOM.clearFavoritesBtn) {
            DOM.clearFavoritesBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (confirm('¿Eliminar todos los favoritos?')) {
                    clearAllFavorites();
                }
            });
        }
        
        // Botón mostrar todos los productos
        if (DOM.showAllProductsBtn) {
            DOM.showAllProductsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                currentFilters.category = 'all';
                if (DOM.categoryFilter) DOM.categoryFilter.value = 'all';
                applyFilters();
            });
        }
        
        // Links de favoritos en el footer
        document.querySelectorAll('[data-category="favorites"]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                currentFilters.category = 'favorites';
                if (DOM.categoryFilter) DOM.categoryFilter.value = 'favorites';
                applyFilters();
                
                // Scroll a productos
                const productsSection = document.getElementById('products');
                if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // ===== FIXES ESPECÍFICOS PARA iOS =====
    function applyIOSFixes() {
        if (isIOS) {
            document.body.classList.add('is-ios');
            document.addEventListener('touchstart', function() {}, {passive: true});
        }
        
        if (isTouchDevice) {
            document.body.classList.add('is-touch-device');
        }
        
        // Asegurar que los chrome-object no bloqueen toques
        document.querySelectorAll('.chrome-object').forEach(obj => {
            obj.style.pointerEvents = 'none';
            obj.style.zIndex = '-1';
        });
        
        // FIX CRÍTICO: Asegurar que el overlay del menú esté oculto al inicio
        const mobileOverlay = document.querySelector('.mobile-menu-overlay');
        if (mobileOverlay) {
            mobileOverlay.style.display = 'none';
            mobileOverlay.style.pointerEvents = 'none';
            mobileOverlay.style.visibility = 'hidden';
            mobileOverlay.classList.remove('active');
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
            
            applyFilters();
            
        } catch (error) {
            console.error('Error cargando productos:', error);
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
                    front: 'assets/images/camisetanew.jpeg',
                    thumbnail: 'assets/images/camisetanew.jpeg'
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
                    front: 'assets/images/hoodieNG.jpg',
                    thumbnail: 'assets/images/hoodieNG.jpg'
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
        if (DOM.categoryFilter) {
            DOM.categoryFilter.addEventListener('change', handleFilterChange);
        }
        if (DOM.priceFilter) {
            DOM.priceFilter.addEventListener('change', handleFilterChange);
        }
        if (DOM.sortFilter) {
            DOM.sortFilter.addEventListener('change', handleFilterChange);
        }
        
        if (DOM.searchInput) {
            DOM.searchInput.addEventListener('input', handleSearchInput);
            DOM.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                }
            });
        }
        
        if (DOM.searchBtn) {
            DOM.searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                handleSearch();
            });
        }
        
        if (DOM.clearFiltersBtn) {
            DOM.clearFiltersBtn.addEventListener('click', function(e) {
                e.preventDefault();
                clearAllFilters();
            });
        }
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
        currentFilters = {
            category: 'all',
            price: 'all',
            sort: 'featured',
            search: ''
        };
        
        if (DOM.categoryFilter) DOM.categoryFilter.value = 'all';
        if (DOM.priceFilter) DOM.priceFilter.value = 'all';
        if (DOM.sortFilter) DOM.sortFilter.value = 'featured';
        if (DOM.searchInput) DOM.searchInput.value = '';
        
        applyFilters();
    }

    function applyFilters() {
        // Comenzar con todos los productos
        filteredProducts = [...allProducts];
        
        // Filtro especial de favoritos
        if (currentFilters.category === 'favorites') {
            filteredProducts = filteredProducts.filter(product => 
                isFavorite(product.id)
            );
        } else if (currentFilters.category !== 'all') {
            // Aplicar filtro de categoría normal
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
        
        // Ocultar todos los estados
        if (DOM.noResults) DOM.noResults.style.display = 'none';
        if (DOM.noFavorites) DOM.noFavorites.style.display = 'none';
        
        // Mostrar estado apropiado si no hay productos
        if (filteredProducts.length === 0) {
            DOM.productsGrid.style.display = 'none';
            
            // Mostrar mensaje específico para favoritos vacíos
            if (currentFilters.category === 'favorites') {
                if (DOM.noFavorites) DOM.noFavorites.style.display = 'block';
            } else {
                if (DOM.noResults) DOM.noResults.style.display = 'block';
            }
            return;
        }
        
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
        const isFav = isFavorite(product.id);
        
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${mainImage}" alt="${product.name}" loading="lazy" 
                         onerror="this.src='assets/images/placeholder-product.jpg'">
                    ${badgeText ? `<div class="product-badge ${product.badge}">${badgeText}</div>` : ''}
                    <div class="product-actions">
                        <button class="action-btn quick-view-btn" type="button" title="Vista rápida">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn wishlist-btn ${isFav ? 'is-favorite' : ''}" type="button" title="${isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">
                            <i class="${isFav ? 'fas' : 'far'} fa-heart" style="${isFav ? 'color: #ef4444;' : ''}"></i>
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
                            `<button type="button" class="size-option" data-size="${size}">${size}</button>`
                        ).join('')}
                    </div>
                    <button type="button" class="add-to-cart-btn" 
                            ${!product.available ? 'disabled' : ''}>
                        ${product.available ? 'Añadir al carrito' : 'Agotado'}
                    </button>
                </div>
            </div>
        `;
    }

    function addProductEventListeners() {
        document.querySelectorAll('.product-card').forEach(card => {
            // Tallas
            card.querySelectorAll('.size-option').forEach(sizeBtn => {
                sizeBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    card.querySelectorAll('.size-option').forEach(btn => 
                        btn.classList.remove('selected'));
                    
                    this.classList.add('selected');
                    console.log('Talla seleccionada:', this.dataset.size);
                });
            });
            
            // Botón añadir al carrito
            const addBtn = card.querySelector('.add-to-cart-btn');
            if (addBtn) {
                addBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddToCart(card);
                });
            }
            
            // Vista rápida
            const quickViewBtn = card.querySelector('.quick-view-btn');
            if (quickViewBtn) {
                quickViewBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleQuickView(card);
                });
            }
            
            // Wishlist / Favoritos
            const wishlistBtn = card.querySelector('.wishlist-btn');
            if (wishlistBtn) {
                wishlistBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    handleWishlist(this, card);
                });
            }
        });
    }

    // ===== GESTIÓN DEL CARRITO =====
    function handleAddToCart(card) {
        const productId = card.dataset.productId;
        const selectedSize = card.querySelector('.size-option.selected');
        
        console.log('Intentando añadir al carrito:', productId);
        
        if (!selectedSize) {
            showNotification('Por favor, selecciona una talla', 'warning');
            const sizesContainer = card.querySelector('.product-sizes');
            if (sizesContainer) {
                sizesContainer.style.animation = 'shake 0.5s ease';
                setTimeout(() => {
                    sizesContainer.style.animation = '';
                }, 500);
            }
            return;
        }
        
        const product = allProducts.find(p => p.id === productId);
        if (!product) {
            console.error('Producto no encontrado:', productId);
            return;
        }
        
        const cartItem = {
            id: productId,
            name: product.name,
            price: product.price,
            size: selectedSize.dataset.size,
            image: product.images.thumbnail || product.images.front,
            quantity: 1
        };
        
        console.log('Añadiendo al carrito:', cartItem);
        
        if (typeof window.addToCart === 'function') {
            const success = window.addToCart(cartItem);
            if (success) {
                showNotification(`${product.name} añadido al carrito`);
                updateCartCount();
                
                const addBtn = card.querySelector('.add-to-cart-btn');
                if (addBtn) {
                    const originalText = addBtn.textContent;
                    addBtn.textContent = '¡Añadido!';
                    addBtn.style.background = '#10b981';
                    setTimeout(() => {
                        addBtn.textContent = originalText;
                        addBtn.style.background = '';
                    }, 1500);
                }
            }
        } else {
            console.error('Función addToCart no disponible');
            showNotification('Error: Sistema de carrito no disponible', 'error');
        }
    }

    function updateCartCount() {
        if (DOM.cartCount && typeof window.getCartItemCount === 'function') {
            const count = window.getCartItemCount();
            DOM.cartCount.textContent = count;
            DOM.cartCount.style.display = count > 0 ? 'flex' : 'none';
            console.log('Carrito actualizado:', count, 'items');
        }
    }

    // ===== VISTA RÁPIDA =====
    function handleQuickView(card) {
        const productId = card.dataset.productId;
        const product = allProducts.find(p => p.id === productId);
        
        console.log('Vista rápida:', productId);
        
        if (product) {
            showQuickView(product);
        }
    }

    function showQuickView(product) {
        if (!DOM.quickViewModal || !DOM.quickViewBody) return;
        
        DOM.quickViewTitle.textContent = product.name;
        DOM.quickViewBody.innerHTML = createQuickViewContent(product);
        DOM.quickViewModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        addQuickViewEventListeners(product);
    }

    function createQuickViewContent(product) {
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        const isFav = isFavorite(product.id);
        
        return `
            <div class="quick-view-content">
                <div class="quick-view-image">
                    <img src="${product.images.front || product.images.thumbnail}" 
                         alt="${product.name}"
                         onerror="this.src='assets/images/placeholder-product.jpg'">
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
                                `<button type="button" class="size-option" data-size="${size}">${size}</button>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="colors-section">
                        <h4>Colores disponibles:</h4>
                        <div class="color-options">
                            ${product.colors.map(color => 
                                `<span class="color-tag">${color}</span>`
                            ).join('')}
                        </div>
                    </div>
                    <div class="quick-view-actions">
                        <button type="button" class="add-to-cart-btn quick-view-add" data-product-id="${product.id}">
                            Añadir al carrito
                        </button>
                        <button type="button" class="btn-favorite-quick ${isFav ? 'is-favorite' : ''}" data-product-id="${product.id}">
                            <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
                            ${isFav ? 'En favoritos' : 'Añadir a favoritos'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    function addQuickViewEventListeners(product) {
        const modal = DOM.quickViewModal;
        
        // Selección de tallas en modal
        modal.querySelectorAll('.size-option').forEach(sizeBtn => {
            sizeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                modal.querySelectorAll('.size-option').forEach(btn => 
                    btn.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
        
        // Añadir al carrito desde modal
        const addBtn = modal.querySelector('.quick-view-add');
        if (addBtn) {
            addBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const selectedSize = modal.querySelector('.size-option.selected');
                
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
                
                if (typeof window.addToCart === 'function') {
                    window.addToCart(cartItem);
                    showNotification(`${product.name} añadido al carrito`);
                    updateCartCount();
                    closeModal(DOM.quickViewModal);
                }
            });
        }
        
        // Favoritos desde modal
        const favBtn = modal.querySelector('.btn-favorite-quick');
        if (favBtn) {
            favBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const added = toggleFavorite(product.id);
                saveFavorites();
                
                const icon = this.querySelector('i');
                if (added) {
                    this.classList.add('is-favorite');
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    this.innerHTML = '<i class="fas fa-heart"></i> En favoritos';
                    showNotification('Añadido a favoritos ❤️', 'success');
                } else {
                    this.classList.remove('is-favorite');
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    this.innerHTML = '<i class="far fa-heart"></i> Añadir a favoritos';
                    showNotification('Eliminado de favoritos', 'info');
                }
                
                // Actualizar la card en el grid
                updateProductCardFavoriteState(product.id, added);
            });
        }
    }

    // ===== WISHLIST / FAVORITOS =====
    function handleWishlist(btn, card) {
        const productId = card.dataset.productId;
        const icon = btn.querySelector('i');
        
        const added = toggleFavorite(productId);
        saveFavorites();
        
        if (added) {
            btn.classList.add('is-favorite');
            icon.classList.remove('far');
            icon.classList.add('fas');
            icon.style.color = '#ef4444';
            showNotification('Añadido a favoritos ❤️', 'success');
        } else {
            btn.classList.remove('is-favorite');
            icon.classList.remove('fas');
            icon.classList.add('far');
            icon.style.color = '';
            showNotification('Eliminado de favoritos', 'info');
            
            // Si estamos viendo favoritos, re-renderizar
            if (currentFilters.category === 'favorites') {
                applyFilters();
            }
        }
    }

    function updateProductCardFavoriteState(productId, isFav) {
        const card = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (card) {
            const btn = card.querySelector('.wishlist-btn');
            const icon = btn?.querySelector('i');
            if (btn && icon) {
                if (isFav) {
                    btn.classList.add('is-favorite');
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    icon.style.color = '#ef4444';
                } else {
                    btn.classList.remove('is-favorite');
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    icon.style.color = '';
                }
            }
        }
    }

    // ===== CATEGORÍAS =====
    function initCategoryCards() {
        DOM.categoryCards.forEach(card => {
            card.addEventListener('click', function(e) {
                e.preventDefault();
                const category = this.dataset.category;
                console.log('Categoría seleccionada:', category);
                
                if (category && DOM.categoryFilter) {
                    DOM.categoryFilter.value = category;
                    currentFilters.category = category;
                    applyFilters();
                    
                    const productsSection = document.getElementById('products');
                    if (productsSection) {
                        const headerHeight = document.querySelector('header')?.offsetHeight || 0;
                        const offsetTop = productsSection.offsetTop - headerHeight - 20;
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    // ===== MODALES =====
    function initModals() {
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const modal = this.closest('.modal');
                closeModal(modal);
            });
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeModal(this);
                }
            });
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    if (modal.style.display === 'block') {
                        closeModal(modal);
                    }
                });
            }
        });
        
        if (DOM.sizeGuideLink) {
            DOM.sizeGuideLink.addEventListener('click', function(e) {
                e.preventDefault();
                if (DOM.sizeGuideModal) {
                    DOM.sizeGuideModal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                }
            });
        }
        
        if (DOM.shippingInfoLink) {
            DOM.shippingInfoLink.addEventListener('click', function(e) {
                e.preventDefault();
                showShippingInfo();
            });
        }
    }

    function closeModal(modal) {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    function showShippingInfo() {
        const shippingContent = `
            <div class="shipping-info">
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
            document.body.style.overflow = 'hidden';
        }
    }

    // ===== NEWSLETTER =====
    function initNewsletter() {
        if (DOM.newsletterSubmit) {
            DOM.newsletterSubmit.addEventListener('click', function(e) {
                e.preventDefault();
                handleNewsletterSubmit();
            });
        }
        
        if (DOM.newsletterEmail) {
            DOM.newsletterEmail.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleNewsletterSubmit();
                }
            });
        }
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
        
        showNotification('¡Gracias por suscribirte! 🌿', 'success');
        if (DOM.newsletterEmail) DOM.newsletterEmail.value = '';
        
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
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        
        if (!DOM.cartNotification || !DOM.notificationText) {
            console.log('Notification:', message, type);
            return;
        }
        
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
                    <button type="button" onclick="location.reload()" class="btn-secondary">
                        Reintentar
                    </button>
                </div>
            `;
            DOM.productsGrid.style.display = 'block';
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ===== ANIMACIÓN DE SHAKE =====
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-5px); }
            40% { transform: translateX(5px); }
            60% { transform: translateX(-5px); }
            80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    // ===== API PÚBLICA =====
    window.NaturalGrooveShop = {
        getProducts: () => allProducts,
        getFilteredProducts: () => filteredProducts,
        getCurrentFilters: () => currentFilters,
        getFavorites: () => favorites,
        applyFilters: applyFilters,
        showNotification: showNotification,
        updateCartCount: updateCartCount,
        clearFilters: clearAllFilters,
        clearFavorites: clearAllFavorites
    };

    // ===== INICIALIZAR =====
    init();
    
});