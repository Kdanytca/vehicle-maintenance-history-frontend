<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const mantenimientos = ref([])
const usuarios = ref([])
const vehiculos = ref([])
const form = reactive({ fecha_servicio: '', descripcion_falla: '', estado: 'Pendiente', costo_mano_obra: '', id_vehiculo: '', id_usuario_encargado: '' })
const showForm = ref(false)
const editingId = ref(null)
const error = ref('')
const success = ref('')

function badgeClass(estado) {
  const value = String(estado || '').toLowerCase().replaceAll(' ', '_')
  if (value === 'pendiente') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  if (value === 'en_proceso') return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  if (value === 'completado') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  return 'bg-rose-500/10 text-rose-400 border-rose-500/20'
}

async function load() {
  const { data } = await api.get('/mantenimientos')
  mantenimientos.value = data.mantenimientos
  usuarios.value = data.usuarios
  vehiculos.value = data.vehiculos

  if (!form.id_usuario_encargado && auth.user?.id_usuario) {
    form.id_usuario_encargado = auth.user.id_usuario
  }
}

async function save() {
  error.value = ''

  try {
    if (editingId.value) {
      await api.put(`/mantenimientos/${editingId.value}`, form)
      success.value = 'Mantenimiento actualizado correctamente.'
    } else {
      await api.post('/mantenimientos', form)
      success.value = 'Mantenimiento registrado correctamente.'
    }

    resetForm()
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo guardar el mantenimiento.'
  }
}

async function cancel(id) {
  if (!confirm('¿Está seguro de que desea cancelar esta orden de mantenimiento?')) return
  await api.delete(`/mantenimientos/${id}`)
  success.value = 'Orden de mantenimiento cancelada.'
  await load()
}

function edit(item) {
  Object.assign(form, {
    fecha_servicio: item.fecha_servicio,
    descripcion_falla: item.descripcion_falla,
    estado: item.estado,
    costo_mano_obra: item.costo_mano_obra,
    id_vehiculo: item.id_vehiculo,
    id_usuario_encargado: item.id_usuario_encargado,
  })
  editingId.value = item.id_mantenimiento
  showForm.value = true
}

function resetForm() {
  Object.assign(form, { fecha_servicio: '', descripcion_falla: '', estado: 'Pendiente', costo_mano_obra: '', id_vehiculo: '', id_usuario_encargado: auth.user?.id_usuario || '' })
  editingId.value = null
  showForm.value = false
}

onMounted(load)
</script>

<template>
  <section class="container mx-auto px-4 py-6 max-w-7xl">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0f172a] border border-slate-800/60 p-4 rounded-xl shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center"><i class="fa-solid fa-wrench text-sky-400 text-sm"></i></div>
        <div><h1 class="text-xl font-bold text-white">Listado de Mantenimientos</h1><p class="text-slate-400 text-xs mt-0.5">Historial y órdenes de servicio técnico en el taller.</p></div>
      </div>
      <button class="bg-sky-500 hover:bg-sky-600 transition text-slate-900 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-sky-500/10" @click="showForm = true; editingId = null"><i class="fa-solid fa-plus"></i> Nuevo Mantenimiento</button>
    </div>

    <form v-if="showForm" class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl mb-6 grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="save">
      <div><label class="block text-xs font-semibold text-slate-400 mb-1">Fecha de Servicio *</label><input v-model="form.fecha_servicio" required type="date" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500" /></div>
      <div><label class="block text-xs font-semibold text-slate-400 mb-1">Vehículo *</label><select v-model="form.id_vehiculo" required class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"><option value="">Seleccione el vehículo...</option><option v-for="vehiculo in vehiculos" :key="vehiculo.id_vehiculo" :value="vehiculo.id_vehiculo">{{ vehiculo.placa }} - {{ vehiculo.marca }} {{ vehiculo.modelo }}</option></select></div>
      <div><label class="block text-xs font-semibold text-slate-400 mb-1">Encargado Interno *</label><select v-model="form.id_usuario_encargado" required class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"><option value="">Seleccione el encargado...</option><option v-for="usuario in usuarios" :key="usuario.id_usuario" :value="usuario.id_usuario">{{ usuario.username }}{{ usuario.id_usuario === auth.user?.id_usuario ? ' (Tú)' : '' }}</option></select></div>
      <div><label class="block text-xs font-semibold text-slate-400 mb-1">Estado *</label><select v-model="form.estado" required class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"><option>Pendiente</option><option>En Proceso</option><option>Completado</option><option>Cancelado</option></select></div>
      <div><label class="block text-xs font-semibold text-slate-400 mb-1">Costo Mano de Obra</label><input v-model="form.costo_mano_obra" type="number" step="0.01" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500" /></div>
      <div><label class="block text-xs font-semibold text-slate-400 mb-1">Descripción de Falla *</label><textarea v-model="form.descripcion_falla" required rows="3" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"></textarea></div>
      <p v-if="error" class="md:col-span-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm">{{ error }}</p>
      <div class="md:col-span-2 flex justify-end gap-3"><button type="button" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 text-xs font-bold rounded-lg" @click="resetForm">Cancelar</button><button class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-slate-900 text-xs font-bold rounded-lg"><i class="fa-solid fa-floppy-disk mr-1"></i> {{ editingId ? 'Actualizar Mantenimiento' : 'Guardar Mantenimiento' }}</button></div>
    </form>

    <p v-if="success" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm mb-6">{{ success }}</p>

    <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      <div class="overflow-x-auto"><table class="w-full text-left text-sm">
        <thead><tr class="bg-slate-900/50 border-b border-slate-800 text-slate-400"><th class="p-4 font-semibold text-xs uppercase tracking-wider">ID</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Fecha</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Descripción</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Estado</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Vehículo</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Encargado Interno</th><th class="p-4 font-semibold text-xs uppercase tracking-wider text-right">Acciones</th></tr></thead>
        <tbody class="divide-y divide-slate-800/60 text-slate-300">
          <tr v-for="item in mantenimientos" :key="item.id_mantenimiento" class="hover:bg-slate-800/30 transition-colors">
            <td class="p-4 font-mono text-xs text-slate-400">{{ item.id_mantenimiento }}</td><td class="p-4 whitespace-nowrap text-slate-200 font-mono text-xs">{{ item.fecha_servicio }}</td><td class="p-4 max-w-xs truncate text-slate-300">{{ item.descripcion_falla }}</td>
            <td class="p-4 whitespace-nowrap"><span :class="['text-xs px-2.5 py-0.5 rounded-full border font-medium inline-flex items-center gap-1.5', badgeClass(item.estado)]"><i class="fa-solid fa-circle text-[6px]"></i>{{ item.estado }}</span></td>
            <td class="p-4 whitespace-nowrap font-mono text-xs font-bold text-sky-400">{{ item.vehiculo?.placa || 'N/A' }}</td><td class="p-4 whitespace-nowrap"><span v-if="item.encargado" class="inline-flex items-center gap-1.5 text-xs text-slate-300"><i class="fa-solid fa-user-gear text-[11px] text-slate-500"></i>{{ item.encargado.username }}</span><span v-else class="text-xs text-slate-600 italic">Sin asignar</span></td>
            <td class="p-4 text-right space-x-1.5 whitespace-nowrap"><button class="inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium border border-slate-700/60 transition" @click="edit(item)"><i class="fa-solid fa-pen"></i></button><button class="inline-flex items-center justify-center p-2 bg-slate-800 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-medium border border-slate-700/60 transition" @click="cancel(item.id_mantenimiento)"><i class="fa-solid fa-ban"></i></button></td>
          </tr>
          <tr v-if="mantenimientos.length === 0"><td colspan="7" class="px-4 py-12 text-center text-slate-500"><i class="fa-solid fa-folder-open text-3xl mb-3 block text-slate-600"></i><span class="text-sm font-medium">No se han registrado órdenes de mantenimiento en el sistema.</span></td></tr>
        </tbody>
      </table></div>
    </div>
  </section>
</template>
