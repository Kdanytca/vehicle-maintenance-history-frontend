<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const historial = ref([])
const cargando = ref(false)
const error = ref('')
const usuario = ref('')
const fecha = ref('')
const rol = ref('')

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
    const { data } = await api.get('/audit-logs', {
      params: {
        usuario: usuario.value || undefined,
        fecha: fecha.value || undefined,
        zona_horaria: fecha.value ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
        rol: rol.value || undefined,
      },
    })
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

function limpiarFiltros() {
  usuario.value = ''
  fecha.value = ''
  rol.value = ''
  cargarHistorial()
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
          <h1 class="text-xl font-bold text-white">Historial de accesos y actividades</h1>
          <p class="text-slate-400 text-xs mt-0.5">
            Consulta de solo lectura para auditar accesos y acciones del sistema.
          </p>
        </div>
      </div>
    </div>

    <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-4 mb-4">
      <form
        class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end"
        @submit.prevent="cargarHistorial"
      >
        <div>
          <label for="filtro-usuario" class="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Filtrar por usuario
          </label>
          <input
            id="filtro-usuario"
            v-model="usuario"
            type="text"
            maxlength="100"
            placeholder="Ej. admin"
            class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label for="filtro-rol" class="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Filtrar por rol
          </label>
          <select
            id="filtro-rol"
            v-model="rol"
            class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="mecanico">Mecánico</option>
          </select>
        </div>
        <div>
          <label for="filtro-fecha" class="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
            Filtrar por fecha
          </label>
          <input
            id="filtro-fecha"
            v-model="fecha"
            type="date"
            class="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            class="rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Filtrar
          </button>
          <button
            type="button"
            class="rounded-lg border border-slate-700 px-4 py-3 text-sm text-slate-300 hover:bg-slate-800"
            @click="limpiarFiltros"
          >
            Limpiar
          </button>
        </div>
      </form>
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
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Rol</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Fecha y hora</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Tipo de acceso</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Actividad / detalle</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr v-for="item in historial" :key="item.id" class="hover:bg-slate-800/30 transition-colors">
              <td class="p-4 whitespace-nowrap text-slate-200 font-medium">
                {{ item.usuario_nombre || item.usuario?.username || 'Sistema' }}
              </td>
              <td class="p-4 whitespace-nowrap text-slate-300">
                {{ item.rol_nombre || item.usuario?.rol?.nombre_rol || '—' }}
              </td>
              <td class="p-4 whitespace-nowrap font-mono text-xs text-slate-400">
                {{ formatearFecha(item.created_at) }}
              </td>
              <td class="p-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium',
                    item.tipo_acceso === 'exitoso'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : item.tipo_acceso === 'fallido'
                        ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                        : 'border-violet-500/20 bg-violet-500/10 text-violet-300',
                  ]"
                >
                  <i
                    :class="[
                      'fa-solid',
                      item.tipo_acceso === 'exitoso'
                        ? 'fa-circle-check'
                        : item.tipo_acceso === 'fallido'
                          ? 'fa-circle-xmark'
                          : 'fa-clock-rotate-left',
                    ]"
                  ></i>
                  {{
                    item.tipo_acceso === 'exitoso'
                      ? 'Acceso exitoso'
                      : item.tipo_acceso === 'fallido'
                        ? 'Acceso fallido'
                        : 'Actividad'
                  }}
                </span>
              </td>
              <td class="p-4 text-slate-300 max-w-md">
                <span v-if="item.tipo_acceso">{{ item.descripcion }}</span>
                <span v-else>
                  {{ item.accion }} · {{ item.modulo }} — {{ item.descripcion || 'Sin descripción' }}
                </span>
              </td>
            </tr>

            <tr v-if="!cargando && historial.length === 0">
              <td colspan="5" class="px-4 py-12 text-center text-slate-500">
                <i class="fa-solid fa-folder-open text-3xl mb-3 block text-slate-600"></i>
                <span class="text-sm font-medium">No hay accesos ni actividades para los filtros seleccionados</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
