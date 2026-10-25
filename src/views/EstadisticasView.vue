
<script setup>
import { onMounted, ref } from 'vue'
import api from '../api'

const totalMantenimientos = ref(0)
const vehiculosConMasServicios = ref([])
const cargando = ref(true)
const error = ref('')

async function cargarEstadisticas() {
  cargando.value = true
  error.value = ''

  try {
    const response = await api.get('/estadisticas/mantenimientos')

    totalMantenimientos.value = response.data.total_mantenimientos
    vehiculosConMasServicios.value = response.data.vehiculos_con_mas_servicios
  } catch (e) {
    console.error('Error al cargar las estadísticas:', e)
    error.value = 'No se pudieron cargar las estadísticas. Intenta nuevamente.'
  } finally {
    cargando.value = false
  }
}

onMounted(cargarEstadisticas)
</script>

<template>
  <section class="max-w-7xl mx-auto space-y-6 text-slate-100">
    <header class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p class="text-sm text-sky-400 font-medium">Panel de análisis</p>
        <h1 class="text-2xl sm:text-3xl font-bold text-white mt-1">
          Estadísticas de mantenimiento
        </h1>
        <p class="text-slate-400 mt-2">
          Resumen de los mantenimientos registrados y los vehículos con más servicios.
        </p>
      </div>

      <button
        type="button"
        class="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition disabled:opacity-50"
        :disabled="cargando"
        @click="cargarEstadisticas"
      >
        <i class="fa-solid fa-rotate-right mr-2"></i>
        Actualizar
      </button>
    </header>

    <div
      v-if="error"
      class="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300"
      role="alert"
    >
      {{ error }}
      <button
        type="button"
        class="ml-2 underline"
        @click="cargarEstadisticas"
      >
        Reintentar
      </button>
    </div>

    <div
      v-if="cargando"
      class="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400"
    >
      Cargando estadísticas...
    </div>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <article class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-400">Total de mantenimientos</p>
              <p class="text-4xl font-bold text-white mt-3">
                {{ totalMantenimientos }}
              </p>
              <p class="text-sm text-slate-500 mt-2">
                Registros en el sistema
              </p>
            </div>
            <div class="w-14 h-14 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <i class="fa-solid fa-wrench text-2xl"></i>
            </div>
          </div>
        </article>

        <article class="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-400">Vehículos con servicios</p>
              <p class="text-4xl font-bold text-white mt-3">
                {{ vehiculosConMasServicios.length }}
              </p>
              <p class="text-sm text-slate-500 mt-2">
                En el listado de los cinco primeros
              </p>
            </div>
            <div class="w-14 h-14 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <i class="fa-solid fa-car text-2xl"></i>
            </div>
          </div>
        </article>
      </div>

      <section class="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div class="p-5 sm:p-6 border-b border-slate-800">
          <h2 class="text-lg font-semibold text-white">
            Vehículos con más servicios
          </h2>
          <p class="text-sm text-slate-400 mt-1">
            Los cinco vehículos con mayor cantidad de mantenimientos registrados.
          </p>
        </div>

        <div v-if="vehiculosConMasServicios.length === 0" class="p-8 text-center text-slate-400">
          No hay mantenimientos asociados a vehículos para mostrar.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-800/60 text-slate-400 uppercase text-xs">
              <tr>
                <th class="px-5 py-4">#</th>
                <th class="px-5 py-4">Placa</th>
                <th class="px-5 py-4">Marca</th>
                <th class="px-5 py-4">Modelo</th>
                <th class="px-5 py-4 text-right">Total de servicios</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-slate-800">
              <tr
                v-for="(vehiculo, index) in vehiculosConMasServicios"
                :key="vehiculo.id_vehiculo"
                class="hover:bg-slate-800/40 transition"
              >
                <td class="px-5 py-4 text-slate-500">{{ index + 1 }}</td>
                <td class="px-5 py-4 font-medium text-sky-300">
                  {{ vehiculo.placa }}
                </td>
                <td class="px-5 py-4 text-slate-200">{{ vehiculo.marca }}</td>
                <td class="px-5 py-4 text-slate-200">{{ vehiculo.modelo }}</td>
                <td class="px-5 py-4 text-right">
                  <span class="inline-flex min-w-10 justify-center rounded-full bg-sky-500/10 px-3 py-1 font-semibold text-sky-300">
                    {{ vehiculo.total_servicios }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </section>
</template>
