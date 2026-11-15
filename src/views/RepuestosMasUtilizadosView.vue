<script setup>
import { computed, onMounted, ref } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'
import {
  procesarRepuestosMasUtilizados,
  obtenerEstiloRanking,
} from '../utils/repuestosMasUtilizados'

const auth = useAuthStore()

const repuestosRaw = ref([])
const cargando = ref(true)
const error = ref('')
const ultimaActualizacion = ref(null)

// Formato de visualización: 'grafico' | 'lista'
const formatoVisualizacion = ref('grafico')

const repuestosProcesados = computed(() =>
  procesarRepuestosMasUtilizados(repuestosRaw.value, 5)
)

const totalUsosTop5 = computed(() =>
  repuestosProcesados.value.reduce((acc, r) => acc + r.cantidad_utilizado, 0)
)

const repuestoLider = computed(() =>
  repuestosProcesados.value.length > 0 ? repuestosProcesados.value[0] : null
)

const proveedoresUnicos = computed(() => {
  const set = new Set(repuestosProcesados.value.map((r) => r.proveedor).filter((p) => p && p !== 'Proveedor no especificado'))
  return set.size
})

async function cargarDatos() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get('/repuestos/mas-utilizados')
    repuestosRaw.value = data.repuestos || []
    ultimaActualizacion.value = new Date().toLocaleTimeString('es-SV', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch (err) {
    if (err.response?.status === 403) {
      error.value = 'Acceso restringido: Solo los administradores pueden consultar este informe.'
    } else {
      error.value = err.response?.data?.message || 'Error al cargar los repuestos más utilizados.'
    }
  } finally {
    cargando.value = false
  }
}

onMounted(() => {
  cargarDatos()
})
</script>

<template>
  <section class="max-w-7xl mx-auto space-y-6 text-slate-100">
    <!-- Header -->
    <header class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <i class="fa-solid fa-crown text-[10px]"></i>
            <span>Top 5 Insumos</span>
          </span>
          <span class="text-xs text-slate-400">· Solo Administradores</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
          Repuestos Más Utilizados en el Taller
        </h1>
        <p class="text-sm text-slate-400 mt-1">
          Insumos de alta rotación para optimización de compras, inventario y relaciones con proveedores.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <!-- Selector de formato Lista / Gráfico -->
        <div class="inline-flex bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner" role="group" aria-label="Formato de visualización">
          <button
            type="button"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
              formatoVisualizacion === 'lista'
                ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            ]"
            @click="formatoVisualizacion = 'lista'"
          >
            <i class="fa-solid fa-list text-xs"></i>
            <span>Lista</span>
          </button>
          <button
            type="button"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
              formatoVisualizacion === 'grafico'
                ? 'bg-sky-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            ]"
            @click="formatoVisualizacion = 'grafico'"
          >
            <i class="fa-solid fa-chart-column text-xs"></i>
            <span>Gráfico</span>
          </button>
        </div>

        <!-- Botón de actualización manual -->
        <button
          type="button"
          :disabled="cargando"
          class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-700 disabled:opacity-50"
          @click="cargarDatos"
        >
          <i class="fa-solid fa-rotate-right text-xs" :class="{ 'animate-spin': cargando }"></i>
          <span>Actualizar</span>
        </button>
      </div>
    </header>

    <!-- Error / Alerta de Permisos -->
    <div
      v-if="error"
      class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300 text-sm flex items-center justify-between gap-3"
      role="alert"
    >
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation text-rose-400 text-base"></i>
        <span>{{ error }}</span>
      </div>
      <button
        v-if="auth.isAdmin"
        type="button"
        class="text-xs font-semibold underline hover:text-rose-200"
        @click="cargarDatos"
      >
        Reintentar
      </button>
    </div>

    <!-- Verificación de rol administrativo en frontend -->
    <div
      v-if="!auth.isAdmin"
      class="bg-[#1e293b] border border-rose-500/30 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4"
    >
      <div class="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-2xl">
        <i class="fa-solid fa-lock"></i>
      </div>
      <h2 class="text-xl font-bold text-white">Acceso Denegado</h2>
      <p class="text-sm text-slate-400">
        Esta sección de inteligencia de inventario contiene información estratégica reservada exclusivamente para administradores.
      </p>
      <RouterLink
        to="/vehiculos"
        class="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs font-semibold transition"
      >
        Volver a inicio
      </RouterLink>
    </div>

    <!-- Contenido para Administradores -->
    <template v-else>
      <!-- Indicador de carga -->
      <div
        v-if="cargando"
        class="bg-[#1e293b] rounded-2xl border border-slate-800 p-12 text-center text-slate-400 space-y-3"
      >
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-sky-400"></i>
        <p class="text-sm">Analizando y cargando los repuestos más utilizados...</p>
      </div>

      <!-- Estado vacío si no hay repuestos registrados -->
      <div
        v-else-if="repuestosProcesados.length === 0"
        class="bg-[#1e293b] rounded-2xl border border-slate-800 p-12 text-center max-w-lg mx-auto space-y-3"
      >
        <div class="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-2xl">
          <i class="fa-solid fa-box-open"></i>
        </div>
        <h3 class="text-base font-bold text-white">No hay datos de repuestos todavía</h3>
        <p class="text-xs text-slate-400">
          Aún no se han registrado repuestos utilizados en los mantenimientos del taller. Al cargar facturas de repuestos o vincularlos a servicios, aparecerán automáticamente en este ranking.
        </p>
        <div class="pt-2">
          <RouterLink
            to="/repuestos"
            class="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-bold transition"
          >
            <i class="fa-solid fa-file-arrow-up"></i>
            <span>Ir al inventario de repuestos</span>
          </RouterLink>
        </div>
      </div>

      <!-- Datos disponibles -->
      <template v-else>
        <!-- Tarjetas resumen de métricas clave -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <article class="bg-[#1e293b] rounded-2xl border border-slate-800 p-5 flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-400">Insumo #1 Más Demandado</p>
              <h4 class="text-lg font-bold text-white mt-1 truncate max-w-[220px]" :title="repuestoLider?.nombre_repuesto">
                {{ repuestoLider?.nombre_repuesto }}
              </h4>
              <p class="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <i class="fa-solid fa-fire text-[10px]"></i>
                <span>{{ repuestoLider?.cantidad_utilizado }} instalaciones realizadas</span>
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl shrink-0">
              <i class="fa-solid fa-trophy"></i>
            </div>
          </article>

          <article class="bg-[#1e293b] rounded-2xl border border-slate-800 p-5 flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-400">Total Instalaciones (Top 5)</p>
              <h4 class="text-2xl font-bold text-white mt-1">
                {{ totalUsosTop5 }}
              </h4>
              <p class="text-xs text-slate-500 mt-1">
                Veces utilizados en el taller
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center text-xl shrink-0">
              <i class="fa-solid fa-wrench"></i>
            </div>
          </article>

          <article class="bg-[#1e293b] rounded-2xl border border-slate-800 p-5 flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-400">Proveedores Involucrados</p>
              <h4 class="text-2xl font-bold text-white mt-1">
                {{ proveedoresUnicos }}
              </h4>
              <p class="text-xs text-slate-500 mt-1">
                Marcas / Proveedores clave
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl shrink-0">
              <i class="fa-solid fa-truck-ramp-box"></i>
            </div>
          </article>
        </div>

        <!-- MODO 1: FORMATO GRÁFICO (Chart Visual) -->
        <div v-if="formatoVisualizacion === 'grafico'" class="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-lg p-6 space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-chart-column text-sky-400"></i>
                <span>Gráfico Comparativo de Demanda (Top 5)</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                Volumen relativo de utilización ordenado de mayor a menor.
              </p>
            </div>
            <span v-if="ultimaActualizacion" class="text-[11px] text-slate-500 font-mono">
              Actualizado: {{ ultimaActualizacion }}
            </span>
          </div>

          <!-- Barras Horizontales con Escala y Porcentaje -->
          <div class="space-y-5 pt-2">
            <div
              v-for="repuesto in repuestosProcesados"
              :key="repuesto.nombre_repuesto"
              class="group space-y-2"
            >
              <div class="flex flex-wrap items-center justify-between text-xs gap-2">
                <div class="flex items-center gap-2 min-w-0">
                  <!-- Badge del Ranking -->
                  <span
                    :class="[
                      'w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center border shrink-0',
                      obtenerEstiloRanking(repuesto.ranking).badgeClass
                    ]"
                  >
                    #{{ repuesto.ranking }}
                  </span>
                  <!-- Nombre del Repuesto -->
                  <span class="font-semibold text-white text-sm truncate max-w-sm" :title="repuesto.nombre_repuesto">
                    {{ repuesto.nombre_repuesto }}
                  </span>
                  <!-- Badge del Proveedor -->
                  <span class="px-2 py-0.5 rounded text-[11px] bg-slate-900 border border-slate-700/80 text-slate-300 flex items-center gap-1 shrink-0">
                    <i class="fa-solid fa-tag text-[9px] text-sky-400"></i>
                    <span>{{ repuesto.proveedor }}</span>
                  </span>
                </div>

                <!-- Métricas numéricas -->
                <div class="flex items-center gap-3 font-mono text-xs">
                  <span class="text-slate-400">
                    {{ repuesto.porcentajeTotal }}% del total
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                    {{ repuesto.cantidad_utilizado }} {{ repuesto.cantidad_utilizado === 1 ? 'vez' : 'veces' }}
                  </span>
                </div>
              </div>

              <!-- Barra Gráfica Proporcional -->
              <div class="w-full bg-slate-900/80 rounded-full h-4 overflow-hidden p-0.5 border border-slate-800">
                <div
                  class="h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out flex items-center justify-end pr-1.5"
                  :class="obtenerEstiloRanking(repuesto.ranking).barGradient"
                  :style="{ width: `${Math.max(repuesto.porcentajeRelativo, 4)}%` }"
                >
                  <span
                    v-if="repuesto.porcentajeRelativo >= 15"
                    class="text-[9px] font-bold text-slate-950 font-mono tracking-wider drop-shadow-sm"
                  >
                    {{ repuesto.cantidad_utilizado }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Leyenda del gráfico -->
          <div class="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span class="flex items-center gap-1.5">
              <i class="fa-solid fa-circle-info text-sky-400"></i>
              <span>El porcentaje relativo se calcula contra el insumo de mayor consumo (#1).</span>
            </span>
            <span class="font-mono text-[11px] text-slate-500">
              Total representativo: {{ totalUsosTop5 }} instalaciones
            </span>
          </div>
        </div>

        <!-- MODO 2: FORMATO LISTA (Tabla Detallada) -->
        <div v-else class="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
          <div class="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-white flex items-center gap-2">
                <i class="fa-solid fa-list-ol text-sky-400"></i>
                <span>Tabla de Repuestos Más Utilizados (Top 5)</span>
              </h2>
              <p class="text-xs text-slate-400 mt-0.5">
                Listado jerárquico desde el más utilizado hasta el menos utilizado.
              </p>
            </div>
            <span v-if="ultimaActualizacion" class="text-[11px] text-slate-500 font-mono">
              Actualizado: {{ ultimaActualizacion }}
            </span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th class="p-4 text-center w-16">Ranking</th>
                  <th class="p-4">Nombre del Repuesto</th>
                  <th class="p-4">Proveedor Asociado</th>
                  <th class="p-4 text-right">Cantidad de Veces Utilizado</th>
                  <th class="p-4 text-right">Participación (%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                <tr
                  v-for="repuesto in repuestosProcesados"
                  :key="repuesto.nombre_repuesto"
                  class="hover:bg-slate-800/30 transition-colors"
                >
                  <!-- Posición Ranking -->
                  <td class="p-4 text-center">
                    <span
                      :class="[
                        'inline-flex w-7 h-7 rounded-lg text-xs font-bold items-center justify-center border',
                        obtenerEstiloRanking(repuesto.ranking).badgeClass
                      ]"
                    >
                      #{{ repuesto.ranking }}
                    </span>
                  </td>

                  <!-- 1. Nombre del repuesto -->
                  <td class="p-4">
                    <div class="font-semibold text-white text-sm">
                      {{ repuesto.nombre_repuesto }}
                    </div>
                    <div class="text-[11px] text-slate-500 mt-0.5">
                      Insumo para servicios de mantenimiento
                    </div>
                  </td>

                  <!-- 2. Proveedor asociado -->
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700 text-slate-200">
                      <i class="fa-solid fa-truck-field text-sky-400 text-[10px]"></i>
                      <span>{{ repuesto.proveedor }}</span>
                    </span>
                  </td>

                  <!-- 3. Cantidad de veces utilizado -->
                  <td class="p-4 text-right">
                    <span class="inline-flex items-center justify-center min-w-[50px] px-3 py-1 rounded-full text-xs font-bold font-mono bg-sky-500/10 text-sky-300 border border-sky-500/30">
                      {{ repuesto.cantidad_utilizado }}
                    </span>
                  </td>

                  <!-- Participación % -->
                  <td class="p-4 text-right font-mono text-xs text-slate-300">
                    <div class="flex items-center justify-end gap-2">
                      <span>{{ repuesto.porcentajeTotal }}%</span>
                      <div class="w-16 bg-slate-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          class="h-full bg-sky-400 rounded-full"
                          :style="{ width: `${repuesto.porcentajeTotal}%` }"
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>
  </section>
</template>

