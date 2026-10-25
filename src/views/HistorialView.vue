<script setup>
import { onMounted, ref } from 'vue'
import api from '../api'
import { exportarExcel, exportarPDF } from '../utils/exportarHistorial'

const vehiculos = ref([])
const selected = ref('')
const detail = ref(null)
const abiertos = ref([])
const menuExportar = ref(false)
const exportando = ref(false)
const errorExportar = ref('')

function dinero(valor) {
  return `$${Number(valor || 0).toFixed(2)}`
}

function badgeClass(estado) {
  const value = String(estado || '').toLowerCase().replaceAll(' ', '_')
  if (value === 'pendiente') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  if (value === 'en_proceso') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  if (value === 'completado') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
}

function toggle(id) {
  if (abiertos.value.includes(id)) {
    abiertos.value = abiertos.value.filter((x) => x !== id)
  } else {
    abiertos.value = [...abiertos.value, id]
  }
}

// G2DS-25: el usuario elige el formato (pdf o excel)
async function exportar(formato) {
  menuExportar.value = false
  exportando.value = true
  errorExportar.value = ''

  try {
    if (formato === 'pdf') {
      await exportarPDF(detail.value)
    } else {
      await exportarExcel(detail.value)
    }
  } catch {
    errorExportar.value = 'No se pudo exportar el historial. Intenta de nuevo.'
  } finally {
    exportando.value = false
  }
}

async function load() {
  abiertos.value = []
  menuExportar.value = false
  const { data } = await api.get('/historial-vehiculo', { params: selected.value ? { id_vehiculo: selected.value } : {} })
  vehiculos.value = data.vehiculos
  detail.value = data
}

onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div><h1 class="text-2xl font-bold text-white tracking-tight">Historial de Vehículo</h1><p class="text-sm text-slate-400">Consulta mantenimientos y auditoría por unidad.</p></div>

      <!-- G2DS-25: botón Exportar con opción de formato -->
      <div v-if="detail?.vehiculo" class="relative">
        <button :disabled="exportando" class="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition text-slate-900 px-4 py-2 rounded-lg font-semibold text-sm" @click="menuExportar = !menuExportar">
          <i :class="exportando ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-download'" class="mr-1"></i>
          {{ exportando ? 'Exportando...' : 'Exportar historial' }}
          <i class="fa-solid fa-chevron-down ml-1 text-xs"></i>
        </button>
        <div v-if="menuExportar" class="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-10">
          <button class="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2" @click="exportar('pdf')"><i class="fa-solid fa-file-pdf text-rose-400"></i> PDF</button>
          <button class="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800 flex items-center gap-2" @click="exportar('excel')"><i class="fa-solid fa-file-excel text-emerald-400"></i> Excel</button>
        </div>
      </div>
    </div>

    <div class="bg-[#1e293b] p-5 rounded-xl border border-slate-800 shadow-xl">
      <label class="block text-xs font-semibold text-slate-400 mb-1">Vehículo</label>
      <select v-model="selected" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500" @change="load">
        <option value="">Selecciona</option>
        <option v-for="vehiculo in vehiculos" :key="vehiculo.id_vehiculo" :value="vehiculo.id_vehiculo">{{ vehiculo.placa }} - {{ vehiculo.marca }} {{ vehiculo.modelo }} / {{ vehiculo.anio }} - {{ vehiculo.propietario?.nombre || 'Sin propietario' }}</option>
      </select>
    </div>

    <p v-if="errorExportar" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">{{ errorExportar }}</p>

    <div v-if="!selected" class="bg-[#1e293b] rounded-xl border border-slate-800 p-10 text-center text-slate-500"><i class="fa-solid fa-car-side text-3xl mb-3 block text-slate-600"></i>Selecciona un vehículo para consultar mantenimientos y auditoría.</div>

    <!-- G2DS-8: tarjetas de resumen -->
    <div v-if="detail?.resumen" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-xl">
        <span class="block text-xs text-slate-500 uppercase font-bold">Servicios</span>
        <span class="text-2xl text-sky-400 font-mono font-bold">{{ detail.resumen.total_servicios }}</span>
      </div>
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-xl">
        <span class="block text-xs text-slate-500 uppercase font-bold">Mano de obra</span>
        <span class="text-2xl text-slate-200 font-mono font-bold">{{ dinero(detail.resumen.costo_mano_obra) }}</span>
      </div>
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-4 shadow-xl">
        <span class="block text-xs text-slate-500 uppercase font-bold">Repuestos</span>
        <span class="text-2xl text-slate-200 font-mono font-bold">{{ dinero(detail.resumen.costo_repuestos) }}</span>
      </div>
      <div class="bg-[#1e293b] rounded-xl border border-emerald-800/50 p-4 shadow-xl">
        <span class="block text-xs text-slate-500 uppercase font-bold">Costo total</span>
        <span class="text-2xl text-emerald-400 font-mono font-bold">{{ dinero(detail.resumen.costo_total) }}</span>
      </div>
    </div>

    <div v-if="detail?.vehiculo" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Ficha del vehículo -->
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-6 space-y-4 shadow-xl"><div class="text-center pb-4 border-b border-slate-800"><span class="bg-slate-900 text-sky-400 font-mono text-sm px-4 py-1.5 rounded-lg border border-slate-700 tracking-wider">{{ detail.vehiculo.placa }}</span><h3 class="text-lg font-bold text-white mt-4">{{ detail.vehiculo.marca }} {{ detail.vehiculo.modelo }}</h3><p class="text-xs text-slate-500 uppercase tracking-widest mt-1">Año {{ detail.vehiculo.anio }}</p></div><span class="text-xs text-slate-500 block uppercase font-bold tracking-wider">Propietario</span><span class="text-sm text-slate-200 font-medium flex items-center gap-2 mt-1"><i class="fa-solid fa-user text-slate-600 text-xs"></i>{{ detail.vehiculo.propietario?.nombre || 'Sin propietario' }}</span><div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800"><div><span class="block text-xs text-slate-500 uppercase font-bold">Servicios</span><span class="text-sky-400 font-mono font-bold">{{ detail.mantenimientos.length }}</span></div><div><span class="block text-xs text-slate-500 uppercase font-bold">Eventos</span><span class="text-amber-400 font-mono font-bold">{{ detail.historial.length }}</span></div></div></div>

      <!-- G2DS-8: mantenimientos con detalle desplegable -->
      <div class="lg:col-span-2 bg-[#1e293b] rounded-xl border border-slate-800 p-6 shadow-xl">
        <h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><i class="fa-solid fa-wrench text-sky-400"></i> Mantenimientos del vehículo</h4>
        <div class="space-y-3 max-h-[520px] overflow-y-auto pr-2">
          <div v-for="item in detail.mantenimientos" :key="item.id_mantenimiento" class="bg-slate-900/40 rounded-xl border border-slate-800/80 hover:border-slate-700 transition">
            <!-- Fila que se ve siempre (clic para abrir/cerrar) -->
            <button class="w-full p-4 flex justify-between items-center gap-4 text-left" @click="toggle(item.id_mantenimiento)">
              <div>
                <p class="text-sm font-semibold text-white">{{ item.descripcion_falla }}</p>
                <div class="flex flex-wrap items-center gap-2 mt-1">
                  <span class="text-xs text-slate-500 font-mono">{{ item.fecha_servicio }}</span>
                  <span :class="['text-xs px-2 py-0.5 rounded-full border font-medium', badgeClass(item.estado)]">{{ item.estado }}</span>
                  <span class="text-xs text-slate-400"><i class="fa-solid fa-user-gear text-slate-600 mr-1"></i>{{ item.encargado?.username || 'Sin asignar' }}</span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="px-2.5 py-1 rounded bg-sky-500/10 text-sky-400 font-mono text-xs border border-sky-500/20">{{ dinero(item.costo_total) }}</span>
                <i :class="['fa-solid text-slate-500 text-xs', abiertos.includes(item.id_mantenimiento) ? 'fa-chevron-up' : 'fa-chevron-down']"></i>
              </div>
            </button>

            <!-- Detalle (solo si está abierto) -->
            <div v-if="abiertos.includes(item.id_mantenimiento)" class="px-4 pb-4 border-t border-slate-800/80 space-y-4">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                <div><span class="block text-slate-500 uppercase font-bold">Mecánico</span><span class="text-slate-200">{{ item.encargado?.username || 'Sin asignar' }}</span><span v-if="item.encargado?.rol" class="block text-slate-500">{{ item.encargado.rol.nombre_rol }}</span></div>
                <div><span class="block text-slate-500 uppercase font-bold">Mano de obra</span><span class="text-slate-200 font-mono">{{ dinero(item.costo_mano_obra) }}</span></div>
                <div><span class="block text-slate-500 uppercase font-bold">Repuestos</span><span class="text-slate-200 font-mono">{{ dinero(item.total_repuestos) }}</span></div>
                <div><span class="block text-slate-500 uppercase font-bold">Total</span><span class="text-emerald-400 font-mono font-bold">{{ dinero(item.costo_total) }}</span></div>
              </div>
              <div>
                <span class="block text-xs text-slate-500 uppercase font-bold mb-2">Repuestos utilizados</span>
                <table v-if="item.repuestos?.length" class="w-full text-left text-xs">
                  <thead><tr class="text-slate-500 border-b border-slate-800"><th class="py-2">Pieza</th><th class="py-2">Código</th><th class="py-2 text-right">Costo</th></tr></thead>
                  <tbody class="divide-y divide-slate-800/60 text-slate-300">
                    <tr v-for="repuesto in item.repuestos" :key="repuesto.id_repuesto"><td class="py-2">{{ repuesto.nombre_pieza }}</td><td class="py-2 font-mono text-slate-500">{{ repuesto.codigo_pieza || '—' }}</td><td class="py-2 text-right font-mono">{{ dinero(repuesto.costo_unitario) }}</td></tr>
                  </tbody>
                </table>
                <p v-else class="text-xs text-slate-600">No se registraron repuestos en este servicio.</p>
              </div>
            </div>
          </div>
          <div v-if="detail.mantenimientos.length === 0" class="text-center py-12 text-slate-600 text-sm"><i class="fa-solid fa-folder-open text-2xl mb-2 block text-slate-700"></i>Este vehículo aún no cuenta con mantenimientos registrados.</div>
        </div>
      </div>

      <!-- Auditoría -->
      <div class="lg:col-span-3 bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl"><div class="px-6 py-4 bg-slate-900/50 border-b border-slate-800"><h4 class="text-sm font-bold text-slate-400 uppercase tracking-wider"><i class="fa-solid fa-shield-halved text-amber-400 mr-2"></i>Historial de Auditoría</h4></div><div class="overflow-x-auto"><table class="w-full text-left text-xs"><thead><tr class="text-slate-400 border-b border-slate-800"><th class="p-4 uppercase">Fecha</th><th class="p-4 uppercase">Tipo</th><th class="p-4 uppercase">Descripción</th><th class="p-4 uppercase">Usuario</th><th class="p-4 uppercase">IP</th></tr></thead><tbody class="divide-y divide-slate-800/60 text-slate-300"><tr v-for="evento in detail.historial" :key="evento.id_auditoria" class="hover:bg-slate-800/30"><td class="p-4 font-mono">{{ evento.created_at }}</td><td class="p-4"><span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-2 py-0.5 font-mono">{{ evento.tipo_evento }}</span></td><td class="p-4">{{ evento.descripcion_evento }}</td><td class="p-4">{{ evento.usuario?.username || 'Sistema' }}</td><td class="p-4 font-mono text-slate-500">{{ evento.direccion_ip || 'N/A' }}</td></tr><tr v-if="detail.historial.length === 0"><td colspan="5" class="p-8 text-center text-slate-500">No hay eventos de auditoría para este vehículo.</td></tr></tbody></table></div></div>
    </div>
  </section>
</template>