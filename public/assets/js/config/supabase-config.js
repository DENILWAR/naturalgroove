// assets/js/supabase-config.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// 🔧 Configuración de Supabase
const supabaseUrl = 'https://nuowxxvczayfdjaoveyj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b3d4eHZjemF5ZmRqYW92ZXlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1Nzc5NjMsImV4cCI6MjA2NzE1Mzk2M30.BD8vdoxDJjthrdq3ixopSzPXHJCc5UKu4iKLsxDXKEU'

export const supabase = createClient(supabaseUrl, supabaseKey)

// 🔐 Sistema de Autenticación
export const auth = {
  // Registrar nuevo usuario
  signUp: async (email, password, userData = {}) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName || '',
            username: userData.username || '',
            favorite_genre: userData.favoriteGenre || ''
          }
        }
      })
      
      if (error) throw error
      return { success: true, data, user: data.user }
    } catch (error) {
      console.error('Error en signup:', error)
      return { success: false, error: error.message }
    }
  },

  // Iniciar sesión
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return { success: true, data, user: data.user }
    } catch (error) {
      console.error('Error en login:', error)
      return { success: false, error: error.message }
    }
  },

  // Cerrar sesión
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error en logout:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener usuario actual
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return { success: true, user }
    } catch (error) {
      console.error('Error obteniendo usuario:', error)
      return { success: false, error: error.message }
    }
  },

  // Escuchar cambios de autenticación
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
  },

  // Resetear contraseña
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password.html'
      })
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error reseteando contraseña:', error)
      return { success: false, error: error.message }
    }
  }
}

// 📊 Sistema de Perfiles
export const profiles = {
  // Crear perfil después del registro
  createProfile: async (userId, profileData) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            username: profileData.username,
            full_name: profileData.fullName,
            bio: profileData.bio || '',
            avatar_url: profileData.avatarUrl || '',
            favorite_genre: profileData.favoriteGenre || '',
            website: profileData.website || '',
            location: profileData.location || '',
            is_premium: false,
            created_at: new Date().toISOString()
          }
        ])
        .select()
        
      if (error) throw error
      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Error creando perfil:', error)
      return { success: false, error: error.message }
    }
  },

  // Obtener perfil por ID
  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error obteniendo perfil:', error)
      return { success: false, error: error.message }
    }
  },

  // Actualizar perfil
  updateProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        
      if (error) throw error
      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      return { success: false, error: error.message }
    }
  },

  // Verificar si username existe
  checkUsernameExists: async (username) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single()
        
      if (error && error.code === 'PGRST116') {
        // No existe el username
        return { success: true, exists: false }
      } else if (error) {
        throw error
      }
      
      return { success: true, exists: true }
    } catch (error) {
      console.error('Error verificando username:', error)
      return { success: false, error: error.message }
    }
  }
}

// 🌐 Estado Global de Usuario
export const userState = {
  currentUser: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  
  // Inicializar estado
  init: async () => {
    try {
      const { success, user } = await auth.getCurrentUser()
      if (success && user) {
        userState.currentUser = user
        userState.isAuthenticated = true
        
        // Cargar perfil
        const profileResult = await profiles.getProfile(user.id)
        if (profileResult.success) {
          userState.profile = profileResult.data
        }
      }
    } catch (error) {
      console.error('Error inicializando estado:', error)
    } finally {
      userState.isLoading = false
    }
    
    return userState.isAuthenticated
  },
  
  // Actualizar estado después de login
  setUser: async (user) => {
    userState.currentUser = user
    userState.isAuthenticated = true
    
    // Cargar perfil
    const profileResult = await profiles.getProfile(user.id)
    if (profileResult.success) {
      userState.profile = profileResult.data
    }
  },
  
  // Limpiar estado después de logout
  clearUser: () => {
    userState.currentUser = null
    userState.profile = null
    userState.isAuthenticated = false
  },

  // Obtener iniciales del usuario
  getUserInitials: () => {
    if (userState.profile?.full_name) {
      return userState.profile.full_name
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    } else if (userState.currentUser?.email) {
      return userState.currentUser.email[0].toUpperCase()
    }
    return 'U'
  },

  // Obtener nombre de display
  getDisplayName: () => {
    if (userState.profile?.full_name) {
      return userState.profile.full_name
    } else if (userState.profile?.username) {
      return userState.profile.username
    } else if (userState.currentUser?.email) {
      return userState.currentUser.email.split('@')[0]
    }
    return 'Usuario'
  }
}

// 🔄 Auto-inicialización
userState.init()

// 👂 Escuchar cambios de autenticación
auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    userState.setUser(session.user)
    console.log('🔓 Usuario logueado:', session.user.email)
  } else if (event === 'SIGNED_OUT') {
    userState.clearUser()
    console.log('🔒 Usuario deslogueado')
  }
})

// 🛠️ Funciones de utilidad
export const utils = {
  // Validar email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Validar contraseña
  isValidPassword: (password) => {
    return password.length >= 6
  },

  // Formatear fecha
  formatDate: (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  },

  // Mostrar toast message
  showToast: (message, type = 'info') => {
    // Crear toast si no existe
    let toast = document.getElementById('toast')
    if (!toast) {
      toast = document.createElement('div')
      toast.id = 'toast'
      document.body.appendChild(toast)
    }

    toast.className = `toast toast-${type}`
    toast.textContent = message
    toast.style.display = 'block'

    // Remover después de 3 segundos
    setTimeout(() => {
      toast.style.display = 'none'
    }, 3000)
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }
}