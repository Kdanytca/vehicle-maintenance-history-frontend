<script setup>
import { onMounted, ref } from 'vue'
import api from '../api'

const vehiculos = ref([])
const selected = ref('')
const detail = ref(null)

async function load() {
  const { data } = await api.get('/historial-vehiculo', { params: selected.value ? { id_vehiculo: selected.value } : {} })
  vehiculos.value = data.vehiculos
  detail.value = data
}

onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <div class="mb-6"><h1 class="text-2xl font-bold text-white tracking-tight">Historial de Vehículo</h1><p class="text-sm text-slate-400">Consulta mantenimientos y auditoría por unidad.</p></div>
    <div class="bg-[#1e293b] p-5 rounded-xl border border-slate-800 shadow-xl">
      <label class="block text-xs font-semibold text-slate-400 mb-1">Vehículo</label>
      <select v-model="selected" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500" @change="load">
        <option value="">Selecciona</option>
        <option v-for="vehiculo in vehiculos" :key="vehiculo.id_vehiculo" :value="vehiculo.id_vehiculo">{{ vehiculo.placa }} - {{ vehiculo.marca }} {{ vehiculo.modelo }} / {{ vehiculo.anio }} - {{ vehiculo.propietario?.nombre || 'Sin propietario' }}</option>
      </select>
    </div>

    <div v-if="!selected" class="bg-[#1e293b] rounded-xl border border-slate-800 p-10 text-center text-slate-500"><i class="fa-solid fa-car-side text-3xl mb-3 block text-slate-600"></i>Selecciona un vehículo para consultar mantenimientos y auditoría.</div>

    <div v-if="detail?.vehiculo" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-6 space-y-4 shadow-xl"><div class="text-center pb-4 border-b border-slate-800"><span class="bg-slate-900 text-sky-400 font-mono text-sm px-4 py-1.5 rounded-lg border border-slate-700 tracking-wider">{{ detail.vehiculo.placa }}</span><h3 class="text-lg font-bold text-white mt-4">{{ detail.vehiculo.marca }} {{ detail.vehiculo.modelo }}</h3><p class="text-xs text-slate-500 uppercase tracking-widest mt-1">Año {{ detail.vehiculo.anio }}</p></div><span class="text-xs text-slate-500 block uppercase font-bold tracking-wider">Propietario</span><span class="text-sm text-slate-200 font-medium flex items-center gap-2 mt-1"><i class="fa-solid fa-user text-slate-600 text-xs"></i>{{ detail.vehiculo.propietario?.nombre || 'Sin propietario' }}</span><div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800"><div><span class="block text-xs text-slate-500 uppercase font-bold">Servicios</span><span class="text-sky-400 font-mono font-bold">{{ detail.mantenimientos.length }}</span></div><div><span class="block text-xs text-slate-500 uppercase font-bold">Eventos</span><span class="text-amber-400 font-mono font-bold">{{ detail.historial.length }}</span></div></div></div>
      <div class="lg:col-span-2 bg-[#1e293b] rounded-xl border border-slate-800 p-6 shadow-xl"><h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><i class="fa-solid fa-wrench text-sky-400"></i> Historial Reciente de Mantenimientos</h4><div class="space-y-3 max-h-[350px] overflow-y-auto pr-2"><div v-for="item in detail.mantenimientos" :key="item.id_mantenimiento" class="p-4 bg-slate-900/40 rounded-xl border border-slate-800/80 flex justify-between items-center hover:border-slate-700 transition"><div><p class="text-sm font-semibold text-white">{{ item.descripcion_falla }}</p><span class="text-xs text-slate-500 font-mono block mt-1">{{ item.fecha_servicio }}</span></div><span class="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 font-mono text-xs border border-sky-500/20">${{ Number(item.costo_mano_obra || 0).toFixed(2) }}</span></div><div v-if="detail.mantenimientos.length === 0" class="text-center py-12 text-slate-600 text-sm"><i class="fa-solid fa-folder-open text-2xl mb-2 block text-slate-700"></i>Este vehículo aún no cuenta con mantenimientos registrados.</div></div></div>
      <div class="lg:col-span-3 bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl"><div class="px-6 py-4 bg-slate-900/50 border-b border-slate-800"><h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider"><i class="fa-solid fa-shield-halved text-amber-400 mr-2"></i>Historial de Auditoría</h4></div><div class="overflow-x-auto"><table class="w-full text-left text-xs"><thead><tr class="text-slate-400 border-b border-slate-800"><th class="p-4 uppercase">Fecha</th><th class="p-4 uppercase">Tipo</th><th class="p-4 uppercase">Descripción</th><th class="p-4 uppercase">Usuario</th><th class="p-4 uppercase">IP</th></tr></thead><tbody class="divide-y divide-slate-800/60 text-slate-300"><tr v-for="evento in detail.historial" :key="evento.id_auditoria" class="hover:bg-slate-800/30"><td class="p-4 font-mono">{{ evento.created_at }}</td><td class="p-4"><span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-2 py-0.5 font-mono">{{ evento.tipo_evento }}</span></td><td class="p-4">{{ evento.descripcion_evento }}</td><td class="p-4">{{ evento.usuario?.username || 'Sistema' }}</td><td class="p-4 font-mono text-slate-500">{{ evento.direccion_ip || 'N/A' }}</td></tr><tr v-if="detail.historial.length === 0"><td colspan="5" class="p-8 text-center text-slate-500">No hay eventos de auditoría para este vehículo.</td></tr></tbody></table></div></div>
    </div>
  </section>
</template>
