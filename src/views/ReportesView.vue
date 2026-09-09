<script setup>
import { ref } from 'vue'
import api from '../api'

const placa = ref('')
const result = ref(null)
const message = ref('')

async function search() {
  message.value = ''
  result.value = null

  try {
    const { data } = await api.get('/reportes/placa', { params: { placa: placa.value } })
    result.value = data
  } catch (exception) {
    message.value = exception.response?.data?.message || 'No se encontro informacion'
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="bg-[#0f172a] border border-slate-800/60 p-4 rounded-xl shadow-sm"><h1 class="text-xl font-bold text-white">Reporte por Placa</h1><p class="text-slate-400 text-xs mt-0.5">Consulta el historial de mantenimientos usando la placa del vehículo.</p></div>
    <form class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col sm:flex-row gap-3" @submit.prevent="search">
      <input v-model="placa" required placeholder="Ingrese la placa" class="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-sky-500 transition" />
      <button class="bg-sky-500 hover:bg-sky-600 transition text-slate-900 px-4 py-2 rounded-lg font-semibold text-sm"><i class="fa-solid fa-magnifying-glass mr-1"></i> Buscar</button>
    </form>
    <p v-if="message" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl">{{ message }}</p>
    <div v-if="!result && !message" class="bg-[#1e293b] rounded-xl border border-slate-800 p-10 text-center text-slate-500"><i class="fa-solid fa-file-circle-question text-3xl mb-3 block text-slate-600"></i>Ingresa una placa para generar el reporte técnico.</div>
    <div v-if="result" class="space-y-4">
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><p class="text-xs text-slate-500 uppercase tracking-wider font-bold">Vehículo Encontrado</p><h2 class="text-xl font-bold text-white mt-1">{{ result.vehiculo.marca }} {{ result.vehiculo.modelo }}</h2><p class="text-slate-400 text-sm">{{ result.vehiculo.propietario?.nombre || 'Sin propietario' }}</p></div><div class="text-left sm:text-right"><span class="bg-slate-900 text-sky-400 font-mono text-sm px-4 py-1.5 rounded-lg border border-slate-700">{{ result.vehiculo.placa }}</span><p class="text-xs text-slate-500 mt-2">{{ result.mantenimientos.length }} registro(s)</p></div></div>
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl"><table class="w-full text-left text-sm"><thead><tr class="bg-slate-900/50 border-b border-slate-800 text-slate-400"><th class="p-4 font-semibold text-xs uppercase tracking-wider">Fecha</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Descripción</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Estado</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Encargado Interno</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Costo</th></tr></thead><tbody class="divide-y divide-slate-800/60 text-slate-300"><tr v-for="item in result.mantenimientos" :key="item.id_mantenimiento"><td class="p-4 font-mono text-xs">{{ item.fecha_servicio }}</td><td class="p-4">{{ item.descripcion_falla }}</td><td class="p-4">{{ item.estado }}</td><td class="p-4">{{ item.encargado?.username || 'N/A' }}</td><td class="p-4 font-mono">${{ Number(item.costo_mano_obra || 0).toFixed(2) }}</td></tr></tbody></table></div>
    </div>
  </section>
</template>
