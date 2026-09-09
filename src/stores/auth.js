import { defineStore } from 'pinia'
import api from '../api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
    token: localStorage.getItem('auth_token'),
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    isAdmin: (state) => state.user?.rol?.nombre_rol === 'admin',
  },
  actions: {
    async login(credentials) {
      const { data } = await api.post('/login', credentials)
      this.token = data.token
      this.user = data.user
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
    },
    async fetchUser() {
      const { data } = await api.get('/me')
      this.user = data
      localStorage.setItem('auth_user', JSON.stringify(data))
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
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
    },
  },
})
