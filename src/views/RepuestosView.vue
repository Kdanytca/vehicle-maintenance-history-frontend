<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '../api'

const repuestos = ref([])
const vehiculos = ref([])
const showModal = ref(false)
const error = ref('')
const success = ref('')
const form = reactive({ id_vehiculo: '', comprobante_pdf: null, cantidad_recibida: 1, costo_unitario: 0 })

function pdfUrl(path) {
  if (!path) return '#'
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace('/api', '')
  return `${base}/storage/${path}`
}

async function load() {
  const { data } = await api.get('/repuestos')
  repuestos.value = data.repuestos
  vehiculos.value = data.vehiculos
}

async function upload() {
  error.value = ''
  success.value = ''

  try {
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => payload.append(key, value))
    const { data } = await api.post('/repuestos/cargar-pdf', payload, { headers: { 'Content-Type': 'multipart/form-data' } })
    Object.assign(form, { id_vehiculo: '', comprobante_pdf: null, cantidad_recibida: 1, costo_unitario: 0 })
    success.value = data.message || 'Factura procesada correctamente.'
    showModal.value = false
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo procesar la factura.'
  }
}

onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div><h1 class="text-2xl font-bold text-white tracking-tight">Inventario de Repuestos y Reposición</h1><p class="text-sm text-slate-400">Registro de Repuestos a través de facturas de compra.</p></div>
      <button class="bg-sky-500 hover:bg-sky-600 transition-all text-slate-900 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-md" @click="showModal = true"><i class="fa-solid fa-file-arrow-up text-xs"></i> Cargar Factura de Compra</button>
    </div>
    <p v-if="success" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">{{ success }}</p>
    <p v-if="error" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">{{ error }}</p>

    <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      <table class="w-full text-left text-sm border-collapse"><thead><tr class="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider"><th class="p-4">Código Pieza</th><th class="p-4">Nombre / Descripción</th><th class="p-4">Precio Unitario de Costo</th><th class="p-4">Factura Asociada (PDF)</th></tr></thead>
        <tbody class="divide-y divide-slate-800/60 text-slate-300"><tr v-if="repuestos.length === 0"><td colspan="4" class="p-8 text-center text-slate-500 text-xs uppercase tracking-wider">No hay repuestos registrados en la base de datos.</td></tr><tr v-for="repuesto in repuestos" :key="repuesto.id_repuesto" class="hover:bg-slate-800/30 transition-colors"><td class="p-4 font-mono font-medium text-slate-400">{{ repuesto.codigo_pieza || 'S/N' }}</td><td class="p-4 text-white font-medium">{{ repuesto.nombre_pieza }}</td><td class="p-4 font-mono">${{ Number(repuesto.costo_unitario || 0).toFixed(2) }}</td><td class="p-4"><a v-if="repuesto.factura" :href="pdfUrl(repuesto.factura.ruta_pdf_almacenamiento)" target="_blank" class="text-sky-400 hover:underline"><i class="fa-solid fa-paperclip mr-1 text-xs"></i>{{ repuesto.factura.numero_factura }}.pdf</a><span v-else class="text-slate-500">Sin documento</span></td></tr></tbody>
      </table>
    </div>

    <div v-if="showModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300">
      <form class="bg-[#1e293b] border border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl" @submit.prevent="upload">
        <div class="px-6 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center"><h3 class="font-bold text-white text-base">Cargar Repuestos vía Factura PDF</h3><button type="button" class="text-slate-400 hover:text-white text-sm" @click="showModal = false"><i class="fa-solid fa-xmark"></i></button></div>
        <div class="p-6 space-y-4"><div><label class="block text-xs font-semibold text-slate-400 mb-1">Vehículo a Vincular *</label><select v-model="form.id_vehiculo" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer" required><option value="">Seleccione el vehículo...</option><option v-for="v in vehiculos" :key="v.id_vehiculo" :value="v.id_vehiculo">{{ v.placa }} - {{ v.marca }} {{ v.modelo }}</option></select></div><div class="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-900/30 relative"><input type="file" accept=".pdf" required class="absolute inset-0 opacity-0 cursor-pointer" @change="form.comprobante_pdf = $event.target.files[0]"><i class="fa-solid fa-file-pdf text-3xl text-slate-500 mb-2 transition-colors"></i><p class="text-xs font-medium text-slate-300">{{ form.comprobante_pdf?.name ? 'Archivo listo: ' + form.comprobante_pdf.name : 'Selecciona o arrastra el archivo legal (.pdf)' }}</p><p class="text-[10px] text-slate-500 mt-1">Tamaño máximo recomendado: 5MB</p></div><div class="grid grid-cols-2 gap-3"><div><label class="block text-xs font-semibold text-slate-400 mb-1">Cantidad Recibida *</label><input v-model="form.cantidad_recibida" type="number" min="1" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"></div><div><label class="block text-xs font-semibold text-slate-400 mb-1">Costo Unitario ($) *</label><input v-model="form.costo_unitario" type="number" step="0.01" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"></div></div></div>
        <div class="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3"><button type="button" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 text-xs font-bold rounded-lg" @click="showModal = false">Cancelar</button><button class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-slate-900 text-xs font-bold rounded-lg">Vincular al Stock</button></div>
      </form>
    </div>
  </section>
</template>
