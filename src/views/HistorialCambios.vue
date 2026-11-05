<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const historial = ref([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')

const historialFiltrado = computed(() => {
  if (!busqueda.value.trim()) {
    return historial.value
  }

  const texto = busqueda.value.trim().toLowerCase()

  return historial.value.filter((item) => {
    const nombreUsuario = item.usuario?.username?.toLowerCase() ?? ''
    return nombreUsuario.includes(texto)
  })
})

function formatearFecha(fecha) {
  if (!fecha) {
    return 'Sin fecha'
  }

  const fechaObj = new Date(fecha)

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fechaObj)
}

async function cargarHistorial() {
  cargando.value = true
  error.value = ''

  try {
    const { data } = await api.get('/audit-logs')
    historial.value = data
  } catch (exception) {
    if (exception.response?.status === 403) {
      router.push('/vehiculos')
      return
    }

    error.value = exception.response?.data?.message || 'No se pudo cargar el historial del sistema.'
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  if (!auth.isAdmin) {
    router.push('/vehiculos')
    return
  }

  cargarHistorial()
})
</script>

<template>
  <section class="container mx-auto px-4 py-6 max-w-7xl">
    <div
      class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0f172a] border border-slate-800/60 p-4 rounded-xl shadow-sm"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center">
          <i class="fa-solid fa-clock-rotate-left text-violet-400 text-sm"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold text-white">Historial de Cambios</h1>
          <p class="text-slate-400 text-xs mt-0.5">Registro de acciones realizadas en el sistema.</p>
        </div>
      </div>
    </div>

    <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-4 mb-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex-1">
          <label class="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Buscar por usuario
          </label>
          <input
            v-model="busqueda"
            type="text"
            placeholder="Ej. admin"
            class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>
    </div>

    <div v-if="error" class="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">
      {{ error }}
    </div>

    <div v-if="cargando" class="mb-4 flex items-center gap-2 text-violet-400 text-sm">
      <span
        class="inline-block h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"
      ></span>
      Cargando historial...
    </div>

    <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="bg-slate-900/50 border-b border-slate-800 text-slate-400">
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Usuario</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Acción</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Módulo</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Descripción</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Fecha y hora</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr v-for="item in historialFiltrado" :key="item.id" class="hover:bg-slate-800/30 transition-colors">
              <td class="p-4 whitespace-nowrap text-slate-200 font-medium">
                {{ item.usuario?.username || 'Sistema' }}
              </td>
              <td class="p-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300"
                >
                  {{ item.accion }}
                </span>
              </td>
              <td class="p-4 whitespace-nowrap text-slate-300">{{ item.modulo }}</td>
              <td class="p-4 text-slate-300 max-w-md">
                {{ item.descripcion || 'Sin descripción' }}
              </td>
              <td class="p-4 whitespace-nowrap font-mono text-xs text-slate-400">
                {{ formatearFecha(item.created_at) }}
              </td>
            </tr>

            <tr v-if="!cargando && historialFiltrado.length === 0">
              <td colspan="5" class="px-4 py-12 text-center text-slate-500">
                <i class="fa-solid fa-folder-open text-3xl mb-3 block text-slate-600"></i>
                <span class="text-sm font-medium">No hay cambios registrados en el sistema</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
