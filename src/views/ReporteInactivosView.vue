<script setup>
import { onMounted, ref } from 'vue'
import api from '../api'
import { exportarInactivosExcel, exportarInactivosPDF } from '../utils/exportarInactivos'

const periodo = ref(3) // 3, 6, 12 meses
const orden = ref('desc') // 'desc' o 'asc'
const vehiculos = ref([])
const fechaCorte = ref('')
const totalInactivos = ref(0)
const cargando = ref(false)
const exportando = ref(false)
const menuExportar = ref(false)
const error = ref('')

const periodosDisponibles = [
  { valor: 3, etiqueta: '3 Meses', descripcion: 'Inactivos desde hace más de 3 meses' },
  { valor: 6, etiqueta: '6 Meses', descripcion: 'Inactivos desde hace más de 6 meses' },
  { valor: 12, etiqueta: '12 Meses', descripcion: 'Inactivos desde hace más de 1 año' },
]

async function cargarReporte() {
  cargando.value = true
  error.value = ''
  menuExportar.value = false

  try {
    const { data } = await api.get('/reportes/vehiculos-inactivos', {
      params: {
        periodo: periodo.value,
        orden: orden.value,
      },
    })

    vehiculos.value = data.vehiculos || []
    fechaCorte.value = data.fecha_corte || ''
    totalInactivos.value = data.total_inactivos ?? vehiculos.value.length
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al generar el reporte de vehículos inactivos.'
  } finally {
    cargando.value = false
  }
}

// Criterio 4: Cambiar ordenación por fecha del último mantenimiento
function toggleOrden() {
  orden.value = orden.value === 'desc' ? 'asc' : 'desc'
  cargarReporte()
}

function cambiarPeriodo(nuevoPeriodo) {
  if (periodo.value === nuevoPeriodo) return
  periodo.value = nuevoPeriodo
  cargarReporte()
}

// Criterio 5: Exportar reporte a PDF o Excel
async function exportar(formato) {
  menuExportar.value = false
  exportando.value = true
  error.value = ''

  try {
    const payload = {
      vehiculos: vehiculos.value,
      periodo: periodo.value,
      fechaCorte: fechaCorte.value,
    }

    if (formato === 'pdf') {
      await exportarInactivosPDF(payload)
    } else {
      await exportarInactivosExcel(payload)
    }
  } catch {
    error.value = 'No se pudo exportar el reporte. Intenta nuevamente.'
  } finally {
    exportando.value = false
  }
}

onMounted(cargarReporte)
</script>

<template>
  <section class="space-y-6">
    <!-- Encabezado del reporte -->
    <div
      class="bg-[#0f172a] border border-slate-800/60 p-5 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <div class="flex items-center gap-2">
          <span
            class="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
          >
            Solo Administradores
          </span>
          <h1 class="text-xl font-bold text-white tracking-tight">Vehículos sin Mantenimiento Reciente</h1>
        </div>
        <p class="text-slate-400 text-xs mt-1">
          Identifica clientes inactivos para campañas de fidelización y seguimiento preventivo.
        </p>
      </div>

      <!-- Criterio 5: Botón de Exportación -->
      <div class="relative flex items-center gap-2">
        <button
          type="button"
          :disabled="exportando || cargando || vehiculos.length === 0"
          class="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          @click="menuExportar = !menuExportar"
        >
          <i :class="exportando ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-download'"></i>
          <span>{{ exportando ? 'Exportando...' : 'Exportar reporte' }}</span>
          <i class="fa-solid fa-chevron-down text-[10px] ml-0.5"></i>
        </button>

        <div
          v-if="menuExportar"
          class="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-20"
        >
          <button
            class="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition"
            @click="exportar('pdf')"
          >
            <i class="fa-solid fa-file-pdf text-rose-400 text-sm"></i>
            <div>
              <p class="font-semibold">Descargar en PDF</p>
              <p class="text-[10px] text-slate-400">Formato para impresión</p>
            </div>
          </button>
          <button
            class="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition border-t border-slate-800"
            @click="exportar('excel')"
          >
            <i class="fa-solid fa-file-excel text-emerald-400 text-sm"></i>
            <div>
              <p class="font-semibold">Descargar en Excel</p>
              <p class="text-[10px] text-slate-400">Hoja de cálculo (.xlsx)</p>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Mensaje de error si ocurre -->
    <div
      v-if="error"
      class="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl flex items-center justify-between text-xs"
      role="alert"
    >
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-circle-exclamation text-rose-400"></i>
        <span>{{ error }}</span>
      </div>
      <button class="text-rose-400 hover:text-rose-200" @click="error = ''">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- Criterio 1: Selector de Período (3, 6, 12 meses) y Controles -->
    <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">
            Período de Inactividad (Sin Mantenimiento)
          </label>
          <p class="text-slate-500 text-[11px] mt-0.5">
            Selecciona el período para generar automáticamente el listado de vehículos inactivos.
          </p>
        </div>

        <!-- Criterio 4: Control de Ordenación -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-400 font-medium hidden sm:inline">Ordenar por último servicio:</span>
          <button
            type="button"
            class="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            @click="toggleOrden"
          >
            <i
              :class="
                orden === 'desc'
                  ? 'fa-solid fa-arrow-down-wide-short text-sky-400'
                  : 'fa-solid fa-arrow-up-short-wide text-sky-400'
              "
            ></i>
            <span>{{ orden === 'desc' ? 'Más recientes primero' : 'Más antiguos / Nunca' }}</span>
          </button>
        </div>
      </div>

      <!-- Selector de botones para 3, 6 y 12 meses (Criterio 1) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          v-for="p in periodosDisponibles"
          :key="p.valor"
          type="button"
          :class="[
            'p-4 rounded-xl border text-left transition flex flex-col justify-between',
            periodo === p.valor
              ? 'bg-sky-500/10 border-sky-500 text-white shadow-lg shadow-sky-500/10'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200',
          ]"
          @click="cambiarPeriodo(p.valor)"
        >
          <div class="flex items-center justify-between w-full">
            <span class="text-base font-bold tracking-tight">{{ p.etiqueta }}</span>
            <i
              :class="[
                'fa-solid text-sm',
                periodo === p.valor ? 'fa-circle-check text-sky-400' : 'fa-circle text-slate-700',
              ]"
            ></i>
          </div>
          <span class="text-xs text-slate-400 mt-2 block">{{ p.descripcion }}</span>
        </button>
      </div>

      <!-- Resumen de corte actual -->
      <div
        class="bg-slate-900/80 rounded-lg p-3 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div class="flex items-center gap-2 text-slate-300">
          <i class="fa-solid fa-calendar-day text-sky-400"></i>
          <span>
            Fecha de corte seleccionada:
            <strong class="text-white font-mono">{{ fechaCorte || 'Calculando...' }}</strong>
          </span>
          <span class="text-slate-500">(Vehículos sin servicios desde esta fecha)</span>
        </div>

        <div class="text-slate-400">
          Total inactivos: <strong class="text-amber-400 font-mono text-sm">{{ totalInactivos }}</strong>
        </div>
      </div>
    </div>

    <!-- Tabla del reporte generado automáticamente (Criterios 2 y 3) -->
    <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      <div class="px-5 py-3.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <i class="fa-solid fa-table-list text-sky-400"></i>
          Listado de Clientes y Vehículos Inactivos
        </h3>
        <span class="text-xs text-slate-500 font-mono">Período: {{ periodo }} meses</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="bg-slate-900/40 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th scope="col" class="p-4 font-semibold">#</th>
              <!-- Criterio 3: Placa del vehículo -->
              <th scope="col" class="p-4 font-semibold">Placa</th>
              <!-- Vehículo (Marca/Modelo/Año) -->
              <th scope="col" class="p-4 font-semibold">Vehículo</th>
              <!-- Criterio 3: Propietario -->
              <th scope="col" class="p-4 font-semibold">Propietario</th>
              <!-- Criterio 3: Teléfono de contacto -->
              <th scope="col" class="p-4 font-semibold">Teléfono de Contacto</th>
              <!-- Criterio 3 y 4: Fecha del último mantenimiento con ordenación -->
              <th
                scope="col"
                class="p-4 font-semibold cursor-pointer hover:text-white transition select-none"
                title="Haga clic para cambiar orden"
                @click="toggleOrden"
              >
                <div class="flex items-center gap-1.5">
                  <span>Último Mantenimiento</span>
                  <i
                    :class="
                      orden === 'desc' ? 'fa-solid fa-arrow-down text-sky-400' : 'fa-solid fa-arrow-up text-sky-400'
                    "
                  ></i>
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr v-for="(v, index) in vehiculos" :key="v.id_vehiculo" class="hover:bg-slate-800/30 transition">
              <td class="p-4 font-mono text-xs text-slate-500">{{ index + 1 }}</td>

              <!-- Placa -->
              <td class="p-4 font-mono text-xs whitespace-nowrap">
                <span
                  class="bg-slate-900 text-sky-400 px-3 py-1 rounded-md border border-slate-700 font-semibold tracking-wider"
                >
                  {{ v.placa }}
                </span>
              </td>

              <!-- Vehículo -->
              <td class="p-4 text-xs whitespace-nowrap">
                <span class="font-medium text-white">{{ v.marca }} {{ v.modelo }}</span>
                <span v-if="v.anio" class="text-slate-500 text-[11px] ml-1">({{ v.anio }})</span>
              </td>

              <!-- Propietario -->
              <td class="p-4 text-xs text-slate-200">
                <div class="flex items-center gap-1.5">
                  <i class="fa-solid fa-user text-slate-500 text-[11px]"></i>
                  <span class="font-medium">{{ v.propietario }}</span>
                </div>
              </td>

              <!-- Teléfono de contacto -->
              <td class="p-4 text-xs font-mono whitespace-nowrap">
                <a
                  v-if="v.telefono && v.telefono !== 'Sin teléfono'"
                  :href="'tel:' + v.telefono"
                  class="text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1.5 transition"
                  title="Llamar para campaña de fidelización"
                >
                  <i class="fa-solid fa-phone text-[11px]"></i>
                  <span>{{ v.telefono }}</span>
                </a>
                <span v-else class="text-slate-500 italic">Sin teléfono registrado</span>
              </td>

              <!-- Fecha del último mantenimiento -->
              <td class="p-4 font-mono text-xs whitespace-nowrap">
                <span
                  v-if="v.fecha_ultimo_mantenimiento"
                  class="bg-slate-900/80 text-amber-300 border border-slate-700 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5"
                >
                  <i class="fa-regular fa-clock text-[10px]"></i>
                  {{ v.fecha_ultimo_mantenimiento }}
                </span>
                <span
                  v-else
                  class="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[11px] font-medium"
                >
                  Nunca registrado
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Estado vacío si no hay vehículos inactivos en ese período -->
      <div v-if="vehiculos.length === 0 && !cargando" class="p-12 text-center text-slate-500">
        <i class="fa-solid fa-car text-4xl mb-3 block text-slate-600"></i>
        <p class="text-sm font-medium text-slate-400">
          No hay vehículos inactivos en el período de {{ periodo }} meses.
        </p>
        <p class="text-xs text-slate-600 mt-1">Todos los vehículos del taller registran mantenimientos recientes.</p>
      </div>

      <!-- Estado de carga -->
      <div v-if="cargando" class="p-12 text-center text-slate-400">
        <i class="fa-solid fa-spinner fa-spin text-3xl mb-3 block text-sky-400"></i>
        <p class="text-xs">Generando reporte de inactivos...</p>
      </div>
    </div>
  </section>
</template>
