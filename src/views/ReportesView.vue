<script setup>
import { ref } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const placa = ref('')
const result = ref(null)
const message = ref('')
const success = ref('')
const searching = ref(false)
const exporting = ref(false)

async function search() {
  if (searching.value || exporting.value) return
  searching.value = true
  message.value = ''
  success.value = ''
  result.value = null

  try {
    const { data } = await api.get('/reportes/placa', { params: { placa: placa.value } })
    result.value = data
  } catch (exception) {
    message.value = exception.response?.data?.message || 'No se encontro informacion'
  } finally {
    searching.value = false
  }
}

async function exportPdf() {
  if (exporting.value || searching.value || !result.value?.mantenimientos?.length) return
  exporting.value = true
  message.value = ''
  success.value = ''
  // La placa del resultado conserva el filtro aplicado, aunque se edite el input.
  const appliedPlaca = result.value.vehiculo.placa
  try {
    const { data } = await api.get('/reportes/placa/pdf', {
      params: { placa: appliedPlaca },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-${appliedPlaca.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`
    document.body.appendChild(link)
    try {
      link.click()
    } finally {
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    success.value = 'PDF generado correctamente. Descarga iniciada.'
  } catch (exception) {
    let detail = exception.response?.data
    if (detail instanceof Blob) {
      try {
        detail = JSON.parse(await detail.text())
      } catch {
        detail = null
      }
    }
    message.value = detail?.message || 'No se pudo exportar el reporte. Intenta nuevamente.'
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <section class="space-y-6">
    <div class="bg-[#0f172a] border border-slate-800/60 p-4 rounded-xl shadow-sm"><h1 class="text-xl font-bold text-white">Reporte por Placa</h1><p class="text-slate-400 text-xs mt-0.5">Consulta el historial de mantenimientos usando la placa del vehículo.</p></div>
    <form class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col sm:flex-row gap-3" @submit.prevent="search">
      <input v-model="placa" required placeholder="Ingrese la placa" class="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-sky-500 transition" />
      <button :disabled="searching || exporting" class="bg-sky-500 hover:bg-sky-600 transition text-slate-900 px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"><i class="fa-solid fa-magnifying-glass mr-1"></i> {{ searching ? 'Buscando...' : 'Buscar' }}</button>
    </form>
    <p v-if="message" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl">{{ message }}</p>
    <p v-if="success" role="status" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl">{{ success }}</p>
    <div v-if="!result && !message" class="bg-[#1e293b] rounded-xl border border-slate-800 p-10 text-center text-slate-500"><i class="fa-solid fa-file-circle-question text-3xl mb-3 block text-slate-600"></i>Ingresa una placa para generar el reporte técnico.</div>
    <div v-if="result" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-slate-400">Filtro aplicado: placa {{ result.vehiculo.placa }}</p>
        <button v-if="auth.isAdmin" type="button" :disabled="exporting || searching || !result.mantenimientos.length" class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" @click="exportPdf">
          <i class="fa-solid fa-file-pdf mr-1"></i> {{ exporting ? 'Generando PDF...' : 'Exportar PDF' }}
        </button>
      </div>
      <p v-if="result.vehiculo.deleted_at" class="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">Vehículo archivado el {{ new Date(result.vehiculo.deleted_at).toLocaleString() }}. El reporte conserva sus registros y costos.</p>
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"><div><p class="text-xs text-slate-500 uppercase tracking-wider font-bold">Vehículo Encontrado</p><h2 class="text-xl font-bold text-white mt-1">{{ result.vehiculo.marca }} {{ result.vehiculo.modelo }}</h2><p class="text-slate-400 text-sm">{{ result.vehiculo.propietario?.nombre || 'Sin propietario' }}</p></div><div class="text-left sm:text-right"><span class="bg-slate-900 text-sky-400 font-mono text-sm px-4 py-1.5 rounded-lg border border-slate-700">{{ result.vehiculo.placa }}</span><p class="text-xs text-slate-500 mt-2">{{ result.mantenimientos.length }} registro(s)</p></div></div>
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl"><table class="w-full text-left text-sm"><thead><tr class="bg-slate-900/50 border-b border-slate-800 text-slate-400"><th class="p-4 font-semibold text-xs uppercase tracking-wider">Fecha</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Descripción</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Estado</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Encargado Interno</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Costo</th></tr></thead><tbody class="divide-y divide-slate-800/60 text-slate-300"><tr v-for="item in result.mantenimientos" :key="item.id_mantenimiento"><td class="p-4 font-mono text-xs">{{ item.fecha_servicio }}</td><td class="p-4">{{ item.descripcion_falla }}</td><td class="p-4">{{ item.estado }}</td><td class="p-4">{{ item.encargado?.username || 'N/A' }}</td><td class="p-4 font-mono">${{ Number(item.costo_mano_obra || 0).toFixed(2) }}</td></tr></tbody></table></div>
    </div>
  </section>
</template>
