<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const isMenuOpen = ref(false)

const showShell = computed(() => route.path !== '/login')

const links = computed(() => [
  { to: '/vehiculos', label: 'Vehículos', icon: 'fa-car-side' },
  { to: '/mantenimientos', label: 'Mantenimientos', icon: 'fa-wrench' },
  { to: '/repuestos', label: 'Repuestos', icon: 'fa-box' },
  { to: '/alertas', label: 'Alertas', icon: 'fa-bell' },
  { to: '/historial', label: 'Historial', icon: 'fa-clock-rotate-left' },
  { to: '/reportes', label: 'Reportes', icon: 'fa-file-invoice' },
  ...(auth.isAdmin ? [
    { to: '/usuarios', label: 'Usuarios', icon: 'fa-users', admin: true },
    { to: '/roles', label: 'Permisos', icon: 'fa-shield-halved', admin: true },
  ] : []),
])

async function logout() {
  isMenuOpen.value = false
  await auth.logout()
  router.push('/login')
}

function closeMenu() {
  isMenuOpen.value = false
}

onMounted(async () => {
  if (!auth.token) return

  try {
    await auth.fetchUser()
  } catch {
    auth.clearSession()
    router.push('/login')
  }
})
</script>

<template>
  <div v-if="showShell" class="bg-[#020617] text-slate-100 min-h-screen flex flex-col">
    <div class="bg-[#0f172a] border-b border-slate-800 px-3 py-3 sm:px-6 sm:py-4 relative">
      <div class="flex items-center justify-between gap-3 max-w-[1400px] mx-auto relative">
        <div class="flex items-center gap-6 min-w-0 flex-1">
          <RouterLink to="/vehiculos" class="flex items-center gap-3 group shrink-0" @click="closeMenu">
            <div class="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center group-hover:bg-sky-400 transition">
              <i class="fa-solid fa-car text-slate-900 text-sm"></i>
            </div>
            <span class="text-xl font-bold text-white tracking-tight">Taller<span class="text-sky-400">SGA</span></span>
          </RouterLink>

          <nav :class="[
            'text-sm font-medium text-slate-400 lg:flex lg:items-center lg:gap-2',
            'absolute lg:static top-[calc(100%+12px)] left-0 right-0 z-40 lg:z-auto',
            'grid-cols-2 gap-2 rounded-2xl border border-slate-700/80 bg-slate-950/95 p-3 shadow-2xl shadow-black/40 lg:grid-cols-none lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none',
            isMenuOpen ? 'grid' : 'hidden',
          ]">
            <RouterLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              :class="[
                'px-3 py-2 lg:py-1.5 rounded-lg hover:text-white hover:bg-slate-800/50 transition flex items-center justify-center lg:justify-start gap-1.5 border border-slate-800/80 lg:border-0 bg-slate-900/60 lg:bg-transparent text-xs lg:text-sm',
                link.admin ? 'hover:text-amber-400' : '',
                route.path.startsWith(link.to) ? 'text-sky-400 bg-slate-800/40' : '',
              ]"
              @click="closeMenu"
            >
              <i :class="['fa-solid text-xs', link.icon]"></i> {{ link.label }}
            </RouterLink>
          </nav>
        </div>

        <div class="flex items-center gap-2 sm:gap-4 shrink-0">
          <div class="text-right text-xs min-w-0">
            <p class="font-medium text-white max-w-24 sm:max-w-none truncate">{{ auth.user?.username || 'Usuario' }}</p>
            <p class="text-slate-400 hidden sm:block">{{ auth.isAdmin ? 'Administrador' : 'Mecánico' }}</p>
          </div>
          <button
            class="lg:hidden w-10 h-10 border border-slate-700/80 bg-slate-900/80 rounded-xl text-slate-300 hover:text-sky-400 hover:border-sky-500/40 transition flex flex-col items-center justify-center gap-1"
            :class="isMenuOpen ? 'text-sky-400 border-sky-500/40' : ''"
            type="button"
            aria-label="Abrir menú"
            @click="isMenuOpen = !isMenuOpen"
          >
            <span :class="['block w-4 h-0.5 rounded-full bg-current transition', isMenuOpen ? 'translate-y-1.5 rotate-45' : '']"></span>
            <span :class="['block w-4 h-0.5 rounded-full bg-current transition', isMenuOpen ? 'opacity-0' : '']"></span>
            <span :class="['block w-4 h-0.5 rounded-full bg-current transition', isMenuOpen ? '-translate-y-1.5 -rotate-45' : '']"></span>
          </button>
          <div class="w-px h-6 bg-slate-800 hidden sm:block"></div>
          <button class="w-10 h-10 sm:w-auto sm:h-auto sm:px-0 text-slate-400 hover:text-rose-400 transition text-sm flex items-center justify-center gap-1.5 font-medium border border-slate-700/80 sm:border-0 bg-slate-900/80 sm:bg-transparent rounded-xl sm:rounded-none" @click="logout">
            <i class="fa-solid fa-sign-out-alt"></i> <span class="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </div>
    <main class="p-3 sm:p-6 flex-1 overflow-x-hidden">
      <RouterView />
    </main>
  </div>
  <RouterView v-else />
</template>
