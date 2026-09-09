<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'

const route = useRoute()
const vehiculo = ref(null)
const mantenimientos = ref([])
const error = ref('')

function badgeClass(estado) {
  const value = String(estado || '').toLowerCase().replaceAll(' ', '_')
  if (value === 'pendiente') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  if (value === 'en_proceso') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  if (value === 'completado') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
}

async function load() {
  try {
    const { data } = await api.get(`/vehiculos/${route.params.id}`)
    vehiculo.value = data.vehiculo
    mantenimientos.value = data.mantenimientos
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo cargar la ficha del vehículo.'
  }
}

onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <RouterLink to="/vehiculos" class="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:text-sky-300"><i class="fa-solid fa-arrow-left"></i> Volver al listado</RouterLink>
    <p v-if="error" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">{{ error }}</p>

    <div v-if="vehiculo" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <div class="text-center pb-4 border-b border-slate-800">
          <span class="bg-slate-900 text-sky-400 font-mono text-sm px-4 py-1.5 rounded-lg border border-slate-700 tracking-wider">{{ vehiculo.placa }}</span>
          <h1 class="text-xl font-bold text-white mt-4">{{ vehiculo.marca }} {{ vehiculo.modelo }}</h1>
          <p class="text-xs text-slate-500 uppercase tracking-widest mt-1">Año {{ vehiculo.anio }}</p>
        </div>
        <div><span class="text-xs text-slate-500 block uppercase font-bold tracking-wider">Propietario</span><span class="text-sm text-slate-200 font-medium flex items-center gap-2 mt-1"><i class="fa-solid fa-user text-slate-600 text-xs"></i>{{ vehiculo.propietario?.nombre || 'Sin propietario' }}</span></div>
        <div><span class="text-xs text-slate-500 block uppercase font-bold tracking-wider">Registros</span><span class="text-sm text-sky-400 font-mono font-bold">{{ mantenimientos.length }} mantenimiento(s)</span></div>
      </div>

      <div class="lg:col-span-2 bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div class="px-6 py-4 bg-slate-900/50 border-b border-slate-800"><h2 class="text-sm font-bold text-slate-300 uppercase tracking-wider"><i class="fa-solid fa-clipboard-list text-sky-400 mr-2"></i>Ficha Técnica e Historial</h2></div>
        <div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead><tr class="text-slate-400 border-b border-slate-800"><th class="p-4 text-xs uppercase">Fecha</th><th class="p-4 text-xs uppercase">Descripción</th><th class="p-4 text-xs uppercase">Estado</th><th class="p-4 text-xs uppercase">Costo</th></tr></thead><tbody class="divide-y divide-slate-800/60 text-slate-300"><tr v-for="item in mantenimientos" :key="item.id_mantenimiento" class="hover:bg-slate-800/30"><td class="p-4 font-mono text-xs">{{ item.fecha_servicio }}</td><td class="p-4">{{ item.descripcion_falla }}</td><td class="p-4"><span :class="['text-xs px-2.5 py-0.5 rounded-full border font-medium', badgeClass(item.estado)]">{{ item.estado }}</span></td><td class="p-4 font-mono text-sky-400">${{ Number(item.costo_mano_obra || 0).toFixed(2) }}</td></tr><tr v-if="mantenimientos.length === 0"><td colspan="4" class="p-10 text-center text-slate-500">Este vehículo aún no cuenta con mantenimientos registrados.</td></tr></tbody></table></div>
      </div>
    </div>
  </section>
</template>
