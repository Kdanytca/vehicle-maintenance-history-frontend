<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../api'

const garantias = ref([])
const resumen = reactive({
  total: 0,
  pendientes: 0,
  gestionadas: 0,
})

const filtros = reactive({
  fecha_desde: '',
  fecha_hasta: '',
  propietario: '',
  estado: 'todas',
})

const cargando = ref(false)
const gestionandoId = ref(null)
const successMessage = ref('')
const errorMessage = ref('')

function getVehiculoTexto(item) {
  const v = item.repuesto?.factura?.vehiculo || item.repuesto?.mantenimiento?.vehiculo
  if (!v) return 'No asignado'
  return `${v.marca} ${v.modelo} (${v.placa})`
}

function getVehiculoPlaca(item) {
  const v = item.repuesto?.factura?.vehiculo || item.repuesto?.mantenimiento?.vehiculo
  return v?.placa || ''
}

function getPropietarioTexto(item) {
  const v = item.repuesto?.factura?.vehiculo || item.repuesto?.mantenimiento?.vehiculo
  return v?.propietario?.nombre || v?.cliente?.nombre || 'Sin propietario'
}

function getDiasVencidos(item) {
  if (typeof item.dias_vencidos === 'number' && item.dias_vencidos > 0) {
    return item.dias_vencidos
  }
  if (!item.fecha_vencimiento) return 0
  const vencimiento = new Date(String(item.fecha_vencimiento).slice(0, 10) + 'T00:00:00')
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const diff = Math.floor((hoy - vencimiento) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff)
}

const garantiasFiltradas = computed(() => {
  return garantias.value.filter((item) => {
    // Criterio 2: Solo deben mostrarse garantías cuya fecha haya superado la fecha actual
    const fechaStr = String(item.fecha_vencimiento || '').slice(0, 10)
    const hoyStr = new Date().toISOString().slice(0, 10)
    if (fechaStr > hoyStr) {
      return false
    }

    // Filtro reactivo local adicional por estado
    if (filtros.estado === 'pendientes' && item.atendida_at) {
      return false
    }
    if (filtros.estado === 'gestionadas' && !item.atendida_at) {
      return false
    }

    // Filtro por propietario
    if (filtros.propietario.trim()) {
      const termino = filtros.propietario.trim().toLowerCase()
      const prop = getPropietarioTexto(item).toLowerCase()
      if (!prop.includes(termino)) {
        return false
      }
    }

    // Filtro por rango de fechas
    if (filtros.fecha_desde && fechaStr < filtros.fecha_desde) {
      return false
    }
    if (filtros.fecha_hasta && fechaStr > filtros.fecha_hasta) {
      return false
    }

    return true
  })
})

async function cargarGarantias() {
  cargando.value = true
  errorMessage.value = ''

  try {
    const params = {}
    if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
    if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta
    if (filtros.propietario.trim()) params.propietario = filtros.propietario.trim()
    if (filtros.estado !== 'todas') params.estado = filtros.estado

    const { data } = await api.get('/garantias-vencidas', { params })

    garantias.value = data.garantias || []
    resumen.total = data.total ?? garantias.value.length
    resumen.pendientes = data.pendientes ?? garantias.value.filter((g) => !g.atendida_at).length
    resumen.gestionadas = data.gestionadas ?? garantias.value.filter((g) => !!g.atendida_at).length
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'Error al cargar las garantías vencidas.'
  } finally {
    cargando.value = false
  }
}

function limpiarFiltros() {
  filtros.fecha_desde = ''
  filtros.fecha_hasta = ''
  filtros.propietario = ''
  filtros.estado = 'todas'
  cargarGarantias()
}

// Criterios 4 y 5: Marcar como Gestionada y actualizar automáticamente el estado
async function marcarGestionada(item) {
  gestionandoId.value = item.id
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const { data } = await api.patch(`/alertas-garantia/${item.id}/gestionar`)

    // Actualización automática inmediata del estado en la vista
    item.atendida_at = data.alerta?.atendida_at || new Date().toISOString()
    item.atendida_por = data.alerta?.atendida_por || { username: 'admin' }
    item.estado = 'Gestionada'

    // Actualizar conteos
    resumen.pendientes = Math.max(0, resumen.pendientes - 1)
    resumen.gestionadas += 1

    successMessage.value = `Garantía del repuesto "${item.repuesto?.nombre_pieza || 'Repuesto'}" marcada como Gestionada correctamente.`
  } catch (err) {
    errorMessage.value = err.response?.data?.message || 'No se pudo actualizar el estado de la garantía.'
  } finally {
    gestionandoId.value = null
  }
}

onMounted(cargarGarantias)
</script>

<template>
  <section class="space-y-6">
    <!-- Encabezado exclusivo para Garantías Vencidas (Criterio 1) -->
    <div
      class="bg-[#0f172a] border border-slate-800/60 p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <div class="flex items-center gap-2">
          <span
            class="bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
          >
            Sección Exclusiva
          </span>
          <h1 class="text-xl font-bold text-white tracking-tight">Panel de Garantías Vencidas</h1>
        </div>
        <p class="text-slate-400 text-xs mt-1">
          Identifica repuestos no reclamados cuya garantía ha expirado y gestiona el seguimiento oportuno de casos
          pendientes.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          :disabled="cargando"
          class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3.5 py-2 rounded-lg font-medium transition flex items-center gap-1.5"
          @click="cargarGarantias"
        >
          <i :class="cargando ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'"></i>
          Actualizar panel
        </button>
      </div>
    </div>

    <!-- Mensajes de éxito y error -->
    <div
      v-if="successMessage"
      class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-center justify-between text-sm shadow-lg"
      role="status"
    >
      <div class="flex items-center gap-2.5">
        <i class="fa-solid fa-circle-check text-emerald-400 text-base"></i>
        <span>{{ successMessage }}</span>
      </div>
      <button class="text-emerald-400 hover:text-emerald-200" @click="successMessage = ''">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div
      v-if="errorMessage"
      class="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl flex items-center justify-between text-sm shadow-lg"
      role="alert"
    >
      <div class="flex items-center gap-2.5">
        <i class="fa-solid fa-triangle-exclamation text-rose-400 text-base"></i>
        <span>{{ errorMessage }}</span>
      </div>
      <button class="text-rose-400 hover:text-rose-200" @click="errorMessage = ''">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- Tarjetas de resumen (KPIs) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-xl">
        <span class="block text-xs text-slate-500 uppercase font-bold tracking-wider">Total Garantías Vencidas</span>
        <span class="text-2xl text-slate-100 font-mono font-bold mt-1 block">{{ resumen.total }}</span>
        <span class="text-[11px] text-slate-500 mt-0.5 block">Fecha de vencimiento superada</span>
      </div>

      <div class="bg-[#1e293b] rounded-xl border border-amber-500/30 p-4 shadow-xl">
        <span class="block text-xs text-amber-400 uppercase font-bold tracking-wider">Casos Pendientes</span>
        <span class="text-2xl text-amber-400 font-mono font-bold mt-1 block">{{ resumen.pendientes }}</span>
        <span class="text-[11px] text-slate-500 mt-0.5 block">Requieren gestión o seguimiento</span>
      </div>

      <div class="bg-[#1e293b] rounded-xl border border-emerald-500/30 p-4 shadow-xl">
        <span class="block text-xs text-emerald-400 uppercase font-bold tracking-wider">Casos Gestionados</span>
        <span class="text-2xl text-emerald-400 font-mono font-bold mt-1 block">{{ resumen.gestionadas }}</span>
        <span class="text-[11px] text-slate-500 mt-0.5 block">Atendidas por administradores</span>
      </div>
    </div>

    <!-- Panel de filtros por Rango de Fechas o Propietario (Criterio 6) -->
    <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl space-y-4">
      <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <i class="fa-solid fa-filter text-sky-400"></i>
          Filtros de Búsqueda
        </h3>
        <span class="text-xs text-slate-500">Filtrar por rango de fechas o propietario</span>
      </div>

      <form class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" @submit.prevent="cargarGarantias">
        <!-- Filtro Rango de Fechas: Desde -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Fecha Vencimiento (Desde)</label>
          <input
            v-model="filtros.fecha_desde"
            type="date"
            class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <!-- Filtro Rango de Fechas: Hasta -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Fecha Vencimiento (Hasta)</label>
          <input
            v-model="filtros.fecha_hasta"
            type="date"
            class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <!-- Filtro por Propietario -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Propietario</label>
          <div class="relative">
            <input
              v-model="filtros.propietario"
              type="text"
              placeholder="Buscar por nombre..."
              class="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition"
            />
            <i class="fa-solid fa-user absolute left-2.5 top-3 text-slate-500 text-xs"></i>
          </div>
        </div>

        <!-- Filtro por Estado -->
        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">Estado</label>
          <select
            v-model="filtros.estado"
            class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition"
          >
            <option value="todas">Todos los estados</option>
            <option value="pendientes">Solo Pendientes</option>
            <option value="gestionadas">Solo Gestionadas</option>
          </select>
        </div>

        <!-- Botones de acción de filtros -->
        <div class="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
          <button
            type="button"
            class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg font-medium transition"
            @click="limpiarFiltros"
          >
            Limpiar filtros
          </button>
          <button
            type="submit"
            :disabled="cargando"
            class="bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs px-5 py-2 rounded-lg font-semibold transition flex items-center gap-1.5 shadow-md shadow-sky-500/20"
          >
            <i class="fa-solid fa-magnifying-glass"></i>
            Filtrar resultados
          </button>
        </div>
      </form>
    </div>

    <!-- Tabla exclusiva de garantías vencidas (Criterios 2 y 3) -->
    <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      <div class="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <i class="fa-solid fa-shield-halved text-rose-400"></i>
          Listado de Repuestos con Garantía Vencida
        </h3>
        <span class="text-xs text-slate-400 font-mono"> {{ garantiasFiltradas.length }} caso(s) encontrado(s) </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="bg-slate-900/40 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <!-- Criterio 3: nombre del repuesto -->
              <th scope="col" class="p-4 font-semibold">Repuesto</th>
              <!-- Criterio 3: vehículo asociado -->
              <th scope="col" class="p-4 font-semibold">Vehículo Asociado</th>
              <!-- Criterio 3: propietario -->
              <th scope="col" class="p-4 font-semibold">Propietario</th>
              <!-- Criterio 3: fecha de vencimiento -->
              <th scope="col" class="p-4 font-semibold">Fecha Vencimiento</th>
              <!-- Criterio 3: cantidad de días vencidos -->
              <th scope="col" class="p-4 font-semibold">Días Vencidos</th>
              <!-- Estado -->
              <th scope="col" class="p-4 font-semibold">Estado</th>
              <!-- Criterio 4: acción de gestión -->
              <th scope="col" class="p-4 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr v-for="item in garantiasFiltradas" :key="item.id" class="hover:bg-slate-800/30 transition">
              <!-- Nombre del repuesto -->
              <td class="p-4 font-medium text-white">
                <div class="flex flex-col">
                  <span class="text-sm font-semibold text-white">
                    {{ item.repuesto?.nombre_pieza || 'Repuesto no especificado' }}
                  </span>
                  <span v-if="item.repuesto?.codigo_pieza" class="text-xs font-mono text-slate-400">
                    Cód: {{ item.repuesto.codigo_pieza }}
                  </span>
                </div>
              </td>

              <!-- Vehículo asociado -->
              <td class="p-4 text-xs whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <i class="fa-solid fa-car-side text-slate-500"></i>
                  <span class="text-slate-200 font-medium">{{ getVehiculoTexto(item) }}</span>
                </div>
                <span v-if="getVehiculoPlaca(item)" class="text-[10px] font-mono text-sky-400 ml-5 block mt-0.5">
                  {{ getVehiculoPlaca(item) }}
                </span>
              </td>

              <!-- Propietario -->
              <td class="p-4 text-xs text-slate-300 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <i class="fa-solid fa-user text-slate-500"></i>
                  <span>{{ getPropietarioTexto(item) }}</span>
                </div>
              </td>

              <!-- Fecha de vencimiento -->
              <td class="p-4 font-mono text-xs text-rose-300 whitespace-nowrap">
                <div class="flex items-center gap-1.5">
                  <i class="fa-regular fa-calendar-xmark text-rose-400"></i>
                  {{ String(item.fecha_vencimiento || '').slice(0, 10) }}
                </div>
              </td>

              <!-- Cantidad de días vencidos -->
              <td class="p-4 whitespace-nowrap">
                <span
                  class="bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono font-bold text-xs px-2.5 py-1 rounded-md"
                >
                  <i class="fa-solid fa-triangle-exclamation mr-1 text-[10px]"></i>
                  {{ getDiasVencidos(item) }} {{ getDiasVencidos(item) === 1 ? 'día vencido' : 'días vencidos' }}
                </span>
              </td>

              <!-- Estado -->
              <td class="p-4 whitespace-nowrap">
                <span
                  v-if="item.atendida_at"
                  class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                >
                  <i class="fa-solid fa-circle-check text-[10px]"></i>
                  Gestionada
                </span>
                <span
                  v-else
                  class="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                >
                  <i class="fa-solid fa-clock text-[10px]"></i>
                  Pendiente
                </span>
              </td>

              <!-- Acción: Marcar como Gestionada (Criterio 4 y 5) -->
              <td class="p-4 text-right whitespace-nowrap">
                <button
                  v-if="!item.atendida_at"
                  type="button"
                  :disabled="gestionandoId === item.id"
                  class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5 shadow-sm"
                  @click="marcarGestionada(item)"
                >
                  <i
                    :class="gestionandoId === item.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check-double'"
                  ></i>
                  <span>{{ gestionandoId === item.id ? 'Guardando...' : 'Marcar como Gestionada' }}</span>
                </button>

                <div v-else class="text-right">
                  <span class="text-slate-400 text-[11px] block">
                    Por: {{ item.atendida_por?.username || 'admin' }}
                  </span>
                  <span class="text-slate-500 text-[10px] block font-mono">
                    {{ String(item.atendida_at).slice(0, 10) }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Estado vacío si no hay garantías vencidas -->
      <div v-if="garantiasFiltradas.length === 0 && !cargando" class="p-12 text-center text-slate-500">
        <i class="fa-solid fa-clipboard-check text-4xl mb-3 block text-slate-600"></i>
        <p class="text-sm font-medium text-slate-400">
          No se encontraron garantías vencidas con los filtros aplicados.
        </p>
        <p class="text-xs text-slate-600 mt-1">
          Todos los casos están al día o no coinciden con los criterios de búsqueda.
        </p>
      </div>

      <!-- Estado de carga -->
      <div v-if="cargando" class="p-12 text-center text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-3xl mb-3 block text-sky-400"></i>
        <p class="text-xs">Cargando panel de garantías vencidas...</p>
      </div>
    </div>
  </section>
</template>
