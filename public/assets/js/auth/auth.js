// assets/js/auth.js
import { auth, profiles, userState, utils } from './supabase-config.js'

// 🔐 Clase para manejar la autenticación
class AuthManager {
  constructor() {
    this.isLoading = false
    this.init()
  }

  // Inicializar el manager
  init() {
    this.bindEvents()
    this.checkAuthState()
  }

  // Enlazar eventos
  bindEvents() {
    // Escuchar cambios de autenticación
    auth.onAuthStateChange((event, session) => {
      this.handleAuthStateChange(event, session)
    })

    // Cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', (e) => {
      this.handleOutsideClick(e)
    })
  }

  // Verificar estado de autenticación
  async checkAuthState() {
    const isAuthenticated = await userState.init()
    this.updateUI()
    return isAuthenticated
  }

  // Manejar cambios de estado de autenticación
  handleAuthStateChange(event, session) {
    if (event === 'SIGNED_IN' && session?.user) {
      utils.showToast('¡Sesión iniciada exitosamente!', 'success')
      this.updateUI()
    } else if (event === 'SIGNED_OUT') {
      utils.showToast('Sesión cerrada', 'info')
      this.updateUI()
    }
  }

  // Actualizar interfaz de usuario
  updateUI() {
    const userSystemContainer = document.getElementById('userSystem')
    if (!userSystemContainer) return

    if (userState.isAuthenticated) {
      this.renderAuthenticatedUI(userSystemContainer)
    } else {
      this.renderUnauthenticatedUI(userSystemContainer)
    }
  }

  // Renderizar UI para usuario autenticado
  renderAuthenticatedUI(container) {
    const initials = userState.getUserInitials()
    const displayName = userState.getDisplayName()

    container.innerHTML = `
      <div class="user-menu">
        <span class="user-welcome">Hola, ${displayName}</span>
        <div class="user-avatar" onclick="authManager.toggleUserDropdown()">
          ${initials}
        </div>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-header">
            <div class="user-avatar-large">${initials}</div>
            <div class="user-info">
              <div class="user-name">${displayName}</div>
              <div class="user-email">${userState.currentUser?.email}</div>
            </div>
          </div>
          <div class="user-dropdown-divider"></div>
          <a href="#" class="user-dropdown-item" onclick="authManager.viewProfile()">
            <i class="fas fa-user"></i> Mi Perfil
          </a>
          <a href="#" class="user-dropdown-item" onclick="authManager.viewDashboard()">
            <i class="fas fa-tachometer-alt"></i> Dashboard
          </a>
          <a href="#" class="user-dropdown-item" onclick="authManager.viewSettings()">
            <i class="fas fa-cog"></i> Configuración
          </a>
          <div class="user-dropdown-divider"></div>
          <a href="#" class="user-dropdown-item logout" onclick="authManager.logout()">
            <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
          </a>
        </div>
      </div>
    `
  }

  // Renderizar UI para usuario no autenticado
  renderUnauthenticatedUI(container) {
    container.innerHTML = `
      <div class="auth-buttons">
        <a href="login.html" class="auth-button">Login</a>
        <a href="register.html" class="auth-button primary">Únete</a>
      </div>
    `
  }

  // Toggle del dropdown de usuario
  toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown')
    if (dropdown) {
      dropdown.classList.toggle('show')
    }
  }

  // Cerrar dropdown al hacer clic fuera
  handleOutsideClick(event) {
    const dropdown = document.getElementById('userDropdown')
    const avatar = document.querySelector('.user-avatar')
    
    if (dropdown && dropdown.classList.contains('show')) {
      if (!dropdown.contains(event.target) && !avatar?.contains(event.target)) {
        dropdown.classList.remove('show')
      }
    }
  }

  // Ver perfil
  viewProfile() {
    this.toggleUserDropdown()
    // TODO: Implementar en FASE 2
    utils.showToast('Perfil - Próximamente', 'info')
  }

  // Ver dashboard
  viewDashboard() {
    this.toggleUserDropdown()
    // TODO: Implementar en FASE 2
    utils.showToast('Dashboard - Próximamente', 'info')
  }

  // Ver configuración
  viewSettings() {
    this.toggleUserDropdown()
    // TODO: Implementar en FASE 3
    utils.showToast('Configuración - Próximamente', 'info')
  }

  // Cerrar sesión
  async logout() {
    this.toggleUserDropdown()
    
    if (this.isLoading) return
    this.isLoading = true

    try {
      const result = await auth.signOut()
      if (result.success) {
        userState.clearUser()
        this.updateUI()
        
        // Redirigir a home si está en página protegida
        if (window.location.pathname.includes('dashboard') || 
            window.location.pathname.includes('profile')) {
          window.location.href = '/index.html'
        }
      } else {
        utils.showToast('Error al cerrar sesión', 'error')
      }
    } catch (error) {
      utils.showToast('Error de conexión', 'error')
      console.error('Error en logout:', error)
    } finally {
      this.isLoading = false
    }
  }

  // Funciones para las páginas de auth
  async handleLogin(email, password) {
    if (this.isLoading) return

    // Validaciones
    if (!utils.isValidEmail(email)) {
      return { success: false, error: 'Email inválido' }
    }

    if (!utils.isValidPassword(password)) {
      return { success: false, error: 'Contraseña debe tener al menos 6 caracteres' }
    }

    this.isLoading = true

    try {
      const result = await auth.signIn(email, password)
      
      if (result.success) {
        // Esperar un poco para que se actualice el estado
        await new Promise(resolve => setTimeout(resolve, 1000))
        return { success: true, user: result.user }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' }
    } finally {
      this.isLoading = false
    }
  }

  async handleRegister(userData) {
    if (this.isLoading) return

    // Validaciones
    const { email, password, username, fullName } = userData

    if (!utils.isValidEmail(email)) {
      return { success: false, error: 'Email inválido' }
    }

    if (!utils.isValidPassword(password)) {
      return { success: false, error: 'Contraseña debe tener al menos 6 caracteres' }
    }

    if (!username || username.length < 3) {
      return { success: false, error: 'Username debe tener al menos 3 caracteres' }
    }

    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'Nombre completo es requerido' }
    }

    this.isLoading = true

    try {
      // Verificar si el username ya existe
      const usernameCheck = await profiles.checkUsernameExists(username)
      if (usernameCheck.success && usernameCheck.exists) {
        return { success: false, error: 'Username ya existe, elige otro' }
      }

      // Crear usuario
      const authResult = await auth.signUp(email, password, userData)
      
      if (authResult.success) {
        // Crear perfil
        const profileResult = await profiles.createProfile(authResult.user.id, userData)
        
        if (profileResult.success) {
          return { 
            success: true, 
            user: authResult.user,
            needsVerification: !authResult.user.email_confirmed_at
          }
        } else {
          return { 
            success: false, 
            error: 'Usuario creado pero error al crear perfil. Intenta hacer login.' 
          }
        }
      } else {
        return { success: false, error: authResult.error }
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' }
    } finally {
      this.isLoading = false
    }
  }

  async handleForgotPassword(email) {
    if (this.isLoading) return

    if (!utils.isValidEmail(email)) {
      return { success: false, error: 'Email inválido' }
    }

    this.isLoading = true

    try {
      const result = await auth.resetPassword(email)
      return result
    } catch (error) {
      return { success: false, error: 'Error de conexión' }
    } finally {
      this.isLoading = false
    }
  }

  // Proteger páginas que requieren autenticación
  requireAuth() {
    if (!userState.isAuthenticated) {
      const currentPath = window.location.pathname
      const redirectUrl = encodeURIComponent(currentPath)
      window.location.href = `/login.html?redirect=${redirectUrl}`
      return false
    }
    return true
  }

  // Redirigir usuario autenticado
  redirectIfAuthenticated() {
    if (userState.isAuthenticated) {
      const urlParams = new URLSearchParams(window.location.search)
      const redirect = urlParams.get('redirect')
      
      if (redirect) {
        window.location.href = decodeURIComponent(redirect)
      } else {
        window.location.href = '/index.html'
      }
      return true
    }
    return false
  }
}

// 🌐 Instancia global
export const authManager = new AuthManager()

// 🔄 Hacer disponible globalmente para onclick handlers
window.authManager = authManager

// 🛡️ Funciones de utilidad para proteger páginas
export const requireAuth = () => authManager.requireAuth()
export const redirectIfAuthenticated = () => authManager.redirectIfAuthenticated()

// 📄 Auto-inicialización basada en la página
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname
  
  // Páginas que requieren autenticación
  const protectedPages = ['/dashboard.html', '/profile.html', '/settings.html']
  
  // Páginas que redirigen si ya está autenticado
  const authPages = ['/login.html', '/register.html']
  
  if (protectedPages.some(page => path.includes(page))) {
    authManager.requireAuth()
  } else if (authPages.some(page => path.includes(page))) {
    authManager.redirectIfAuthenticated()
  }
})