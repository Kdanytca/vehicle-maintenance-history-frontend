<script setup>
import { ref } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'
import { validarPlaca } from '../utils/placaValidator'

const auth = useAuthStore()
const placa = ref('')
const result = ref(null)
const message = ref('')
const validationError = ref('')
const isSearching = ref(false)

async function search() {
  message.value = ''
  validationError.value = ''
  result.value = null

  // Criterio 5: El sistema debe validar formatos inválidos de placa antes de realizar la consulta.
  const validacion = validarPlaca(placa.value)
  if (!validacion.valida) {
    validationError.value = validacion.error
    return
  }

  isSearching.value = true
  try {
    const { data } = await api.get('/reportes/placa', {
      params: { placa: validacion.placaNormalizada },
    })
    result.value = data
  } catch (exception) {
    message.value = exception.response?.data?.message || 'No se encontró información para la placa ingresada.'
  } finally {
    isSearching.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <!-- Pestañas de reportes si es administrador -->
    <div v-if="auth.isAdmin" class="flex items-center gap-2">
      <span
        class="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-500 text-slate-950 shadow-sm flex items-center gap-1.5"
      >
        <i class="fa-solid fa-id-card"></i> Reporte por Placa
      </span>
      <RouterLink
        to="/reportes/inactivos"
        class="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 border border-slate-700/60"
      >
        <i class="fa-solid fa-user-clock text-amber-400"></i> Vehículos Inactivos
      </RouterLink>
    </div>

    <div class="bg-[#0f172a] border border-slate-800/60 p-4 rounded-xl shadow-sm">
      <h1 class="text-xl font-bold text-white">Reporte por Placa</h1>
      <p class="text-slate-400 text-xs mt-0.5">Consulta el historial de mantenimientos usando la placa del vehículo.</p>
    </div>

    <form
      class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col sm:flex-row gap-3"
      @submit.prevent="search"
    >
      <input
        v-model="placa"
        required
        placeholder="Ingrese la placa (ej. P123-456)"
        class="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-sky-500 transition"
        @input="placa = placa.toUpperCase()"
      />
      <button
        type="submit"
        :disabled="isSearching"
        class="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 transition text-slate-900 px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
      >
        <i :class="isSearching ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-magnifying-glass'"></i>
        <span>{{ isSearching ? 'Buscando...' : 'Buscar' }}</span>
      </button>
    </form>

    <div
      v-if="validationError"
      class="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2"
    >
      <i class="fa-solid fa-circle-exclamation"></i>
      <span>{{ validationError }}</span>
    </div>

    <div
      v-if="message"
      class="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-xl text-xs flex items-center gap-2"
    >
      <i class="fa-solid fa-circle-info"></i>
      <span>{{ message }}</span>
    </div>

    <div
      v-if="!result && !message && !validationError"
      class="bg-[#1e293b] rounded-xl border border-slate-800 p-10 text-center text-slate-500"
    >
      <i class="fa-solid fa-file-circle-question text-3xl mb-3 block text-slate-600"></i>
      Ingresa una placa para generar el reporte técnico.
    </div>

    <div v-if="result" class="space-y-4">
      <div
        class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <p class="text-xs text-slate-500 uppercase tracking-wider font-bold">Vehículo Encontrado</p>
          <h2 class="text-xl font-bold text-white mt-1">{{ result.vehiculo.marca }} {{ result.vehiculo.modelo }}</h2>
          <p class="text-slate-400 text-sm">{{ result.vehiculo.propietario?.nombre || 'Sin propietario' }}</p>
        </div>
        <div class="text-left sm:text-right">
          <span
            class="bg-slate-900 text-sky-400 font-mono text-sm px-4 py-1.5 rounded-lg border border-slate-700 font-semibold"
            >{{ result.vehiculo.placa }}</span
          >
          <p class="text-xs text-slate-500 mt-2">{{ result.mantenimientos?.length || 0 }} registro(s)</p>
        </div>
      </div>

      <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="bg-slate-900/50 border-b border-slate-800 text-slate-400">
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Fecha</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Mantenimiento</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Mecánico Responsable</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Descripción</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider">Estado</th>
              <th class="p-4 font-semibold text-xs uppercase tracking-wider text-right">Costo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr v-for="item in result.mantenimientos" :key="item.id_mantenimiento">
              <td class="p-4 font-mono text-xs whitespace-nowrap">{{ item.fecha_servicio }}</td>
              <td class="p-4 font-medium text-white">{{ item.tipo_servicio || 'Mantenimiento General' }}</td>
              <td class="p-4 whitespace-nowrap">{{ item.encargado?.username || 'N/A' }}</td>
              <td class="p-4 text-xs text-slate-300">{{ item.descripcion_falla }}</td>
              <td class="p-4 whitespace-nowrap">{{ item.estado }}</td>
              <td class="p-4 font-mono text-right text-xs whitespace-nowrap">
                ${{ Number(item.costo_mano_obra || 0).toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
