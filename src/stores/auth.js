import { defineStore } from 'pinia'
import api from '../api'

function getStoredItem(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key)
}

function activeStorage() {
  return localStorage.getItem('auth_token') ? localStorage : sessionStorage
}

function clearStoredSession() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  sessionStorage.removeItem('auth_token')
  sessionStorage.removeItem('auth_user')
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(getStoredItem('auth_user') || 'null'),
    token: getStoredItem('auth_token'),
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.rol?.nombre_rol === 'admin',
  },
  actions: {
    async login(credentials) {
      const { data } = await api.post('/login', credentials)
      const storage = credentials.remember ? localStorage : sessionStorage

      clearStoredSession()
      this.token = data.token
      this.user = data.user
      storage.setItem('auth_token', data.token)
      storage.setItem('auth_user', JSON.stringify(data.user))
    },
    async fetchUser() {
      const { data } = await api.get('/me')
      this.user = data
      activeStorage().setItem('auth_user', JSON.stringify(data))
    },
    async logout() {
      if (this.token) {
        await api.post('/logout')
      }

      this.clearSession()
    },
    clearSession() {
      this.token = null
      this.user = null
      clearStoredSession()
    },
  },
})
