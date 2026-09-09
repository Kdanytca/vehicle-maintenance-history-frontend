import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'
import AlertasView from './views/AlertasView.vue'
import HistorialView from './views/HistorialView.vue'
import LoginView from './views/LoginView.vue'
import MantenimientosView from './views/MantenimientosView.vue'
import RepuestosView from './views/RepuestosView.vue'
import ReportesView from './views/ReportesView.vue'
import RolesView from './views/RolesView.vue'
import UsuariosView from './views/UsuariosView.vue'
import VehiculosView from './views/VehiculosView.vue'
import VehiculoDetalleView from './views/VehiculoDetalleView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
    { path: '/', redirect: '/vehiculos' },
    { path: '/vehiculos', component: VehiculosView, meta: { auth: true } },
    { path: '/vehiculos/:id', component: VehiculoDetalleView, meta: { auth: true } },
    { path: '/mantenimientos', component: MantenimientosView, meta: { auth: true } },
    { path: '/repuestos', component: RepuestosView, meta: { auth: true } },
    { path: '/alertas', component: AlertasView, meta: { auth: true } },
    { path: '/historial', component: HistorialView, meta: { auth: true } },
    { path: '/reportes', component: ReportesView, meta: { auth: true } },
    { path: '/usuarios', component: UsuariosView, meta: { auth: true, admin: true } },
    { path: '/roles', component: RolesView, meta: { auth: true, admin: true } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.auth && !auth.isAuthenticated) {
    return '/login'
  }

  if (to.meta.admin && !auth.isAdmin) {
    return '/vehiculos'
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return '/vehiculos'
  }
})

export default router
