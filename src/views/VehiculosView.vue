<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import api from '../api'

const vehiculos = ref([])
const error = ref('')
const success = ref('')
const showForm = ref(false)
const editingId = ref(null)
const termino = ref('')
const form = reactive({ placa: '', marca: '', modelo: '', anio: '', propietario: '' })
const deleteModal = reactive({ show: false, vehiculo: null, impacto: null, cancelarPendientes: false })
const simpleDeleteModal = reactive({ show: false, vehiculo: null })
let searchTimeout = null

async function load() {
  const { data } = await api.get('/vehiculos')
  vehiculos.value = data
}

function resetForm() {
  Object.assign(form, { placa: '', marca: '', modelo: '', anio: '', propietario: '' })
  editingId.value = null
  showForm.value = false
}

function edit(vehiculo) {
  Object.assign(form, {
    placa: vehiculo.placa,
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    anio: vehiculo.anio,
    propietario: vehiculo.propietario?.nombre || '',
  })
  editingId.value = vehiculo.id_vehiculo
  showForm.value = true
}

async function search() {
  error.value = ''
  if (!termino.value.trim()) return load()

  const { data } = await api.get('/vehiculos-buscar', { params: { termino: termino.value } })
  vehiculos.value = data
}

async function save() {
  error.value = ''

  try {
    if (editingId.value) {
      await api.put(`/vehiculos/${editingId.value}`, form)
      success.value = 'Vehiculo actualizado correctamente.'
    } else {
      await api.post('/vehiculos', form)
      success.value = 'Vehiculo registrado correctamente.'
    }
    resetForm()
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo guardar el vehículo'
  }
}

async function remove(vehiculo) {
  error.value = ''
  success.value = ''

  try {
    await api.delete(`/vehiculos/${vehiculo.id_vehiculo}`, { params: { solo_validar: true } })
    Object.assign(simpleDeleteModal, { show: true, vehiculo })
  } catch (exception) {
    const response = exception.response

    if (response?.status !== 409 || !response.data?.impacto) {
      error.value = response?.data?.message || 'No se pudo eliminar el vehículo.'
      return
    }

    Object.assign(deleteModal, {
      show: true,
      vehiculo,
      impacto: response.data.impacto,
      cancelarPendientes: response.data.impacto.mantenimientos_pendientes === 0,
    })
  }
}

function closeSimpleDeleteModal() {
  Object.assign(simpleDeleteModal, { show: false, vehiculo: null })
}

async function confirmSimpleDelete() {
  if (!simpleDeleteModal.vehiculo) return

  error.value = ''
  success.value = ''

  try {
    const { data } = await api.delete(`/vehiculos/${simpleDeleteModal.vehiculo.id_vehiculo}`, {
      params: { confirmar_eliminacion: true },
    })

    success.value = data.message || 'Vehículo eliminado correctamente.'
    closeSimpleDeleteModal()
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo eliminar el vehículo.'
  }
}

function closeDeleteModal() {
  Object.assign(deleteModal, { show: false, vehiculo: null, impacto: null, cancelarPendientes: false })
}

async function confirmDelete() {
  if (!deleteModal.vehiculo) return

  error.value = ''
  success.value = ''

  try {
    const { data } = await api.delete(`/vehiculos/${deleteModal.vehiculo.id_vehiculo}`, {
      params: {
        confirmar_eliminacion: true,
        cancelar_pendientes: deleteModal.cancelarPendientes,
      },
    })

    success.value = data.message || 'Vehículo eliminado correctamente.'
    closeDeleteModal()
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo eliminar el vehículo.'
  }
}

onMounted(load)

watch(termino, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(search, 300)
})
</script>

<template>
  <section>
    <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <p class="text-slate-400 text-sm">Listado de todos los vehículos registrados en el taller.</p>
      </div>
      <button class="bg-sky-500 hover:bg-sky-600 transition text-slate-900 px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/10" @click="showForm = true; editingId = null">
        <i class="fa-solid fa-plus text-xs"></i> Nuevo Vehículo
      </button>
    </div>

    <form class="bg-[#1e293b] rounded-xl border border-slate-800 shadow-xl p-4 mb-6 flex flex-col sm:flex-row gap-3" @submit.prevent>
      <input v-model="termino" placeholder="Buscar por placa o propietario" class="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-sky-500 transition" />
      <button type="button" class="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg font-semibold text-sm" @click="termino = ''">Limpiar</button>
    </form>

    <form v-if="showForm" class="bg-[#1e293b] rounded-xl border border-slate-800 shadow-xl overflow-hidden p-6 space-y-6 mb-6" @submit.prevent="save">
      <h2 class="text-xl font-bold text-white flex items-center gap-2"><i class="fa-solid fa-car bg-sky-500/10 text-sky-400 p-2 rounded-lg text-sm"></i> {{ editingId ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo' }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Placa</label><input v-model="form.placa" required placeholder="P123-456" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-sky-500 transition" /></div>
        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Marca</label><input v-model="form.marca" required placeholder="Ej: Toyota" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition" /></div>
        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Modelo</label><input v-model="form.modelo" required placeholder="Ej: Corolla" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition" /></div>
        <div><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Año</label><input v-model="form.anio" required type="number" min="1900" :max="new Date().getFullYear() + 1" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-sky-500 transition" /></div>
        <div class="md:col-span-2"><label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre del Propietario</label><input v-model="form.propietario" required placeholder="Ej: Juan Pérez" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition" /></div>
      </div>
      <p v-if="error" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg text-sm">{{ error }}</p>
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
        <button type="button" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 rounded-lg text-sm font-bold transition" @click="resetForm">Cancelar</button>
        <button class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-slate-900 rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-sky-500/10"><i class="fa-solid fa-floppy-disk text-xs"></i> {{ editingId ? 'Actualizar Vehículo' : 'Guardar Vehículo' }}</button>
      </div>
    </form>

    <p v-if="success" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-sm mb-6">{{ success }}</p>

    <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead><tr class="bg-slate-900/50 border-b border-slate-800"><th class="px-6 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Placa</th><th class="px-6 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Marca</th><th class="px-6 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Modelo</th><th class="px-6 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Año</th><th class="px-6 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">Propietario</th><th class="px-6 py-3 text-slate-400 font-semibold text-xs uppercase tracking-wider text-right">Acciones</th></tr></thead>
          <tbody class="divide-y divide-slate-800/60">
            <tr v-for="vehiculo in vehiculos" :key="vehiculo.id_vehiculo" class="hover:bg-slate-800/30 transition-colors">
              <td class="px-6 py-4"><span class="bg-slate-900 text-sky-400 font-mono text-xs px-2.5 py-1 rounded border border-slate-800">{{ vehiculo.placa }}</span></td>
              <td class="px-6 py-4 font-medium text-white">{{ vehiculo.marca }}</td>
              <td class="px-6 py-4 text-slate-300">{{ vehiculo.modelo }}</td>
              <td class="px-6 py-4 font-mono text-slate-400 text-xs">{{ vehiculo.anio }}</td>
              <td class="px-6 py-4"><div class="flex items-center gap-2"><i class="fa-solid fa-user text-xs text-slate-500"></i><span class="text-slate-300">{{ vehiculo.propietario?.nombre || 'Sin propietario' }}</span></div></td>
              <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap"><RouterLink :to="`/vehiculos/${vehiculo.id_vehiculo}`" class="inline-block px-2.5 py-1 bg-slate-800 hover:bg-sky-500/10 text-sky-400 rounded text-xs"><i class="fa-solid fa-eye"></i> Ver</RouterLink><button class="inline-block px-2.5 py-1 bg-slate-800 hover:bg-blue-500/10 text-blue-400 rounded text-xs" @click="edit(vehiculo)"><i class="fa-solid fa-pen"></i> Editar</button><button class="inline-block px-2.5 py-1 bg-slate-800 hover:bg-rose-500/10 text-rose-400 rounded text-xs" @click="remove(vehiculo)"><i class="fa-solid fa-trash-can"></i> Eliminar</button></td>
            </tr>
            <tr v-if="vehiculos.length === 0"><td colspan="6" class="px-6 py-12 text-center text-slate-500"><i class="fa-solid fa-car-burst text-3xl mb-3 block text-slate-600"></i>No hay vehículos registrados en el sistema.</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="deleteModal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      <div class="w-full max-w-lg rounded-xl border border-slate-800 bg-[#1e293b] shadow-2xl overflow-hidden">
        <div class="px-5 py-4 bg-slate-900/70 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-rose-400">Eliminar vehículo</p>
            <h3 class="text-lg font-bold text-white mt-1">{{ deleteModal.vehiculo?.placa }} - {{ deleteModal.vehiculo?.marca }} {{ deleteModal.vehiculo?.modelo }}</h3>
          </div>
          <button class="text-slate-500 hover:text-slate-200 transition" type="button" @click="closeDeleteModal"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="p-5 space-y-4">
          <p class="text-sm text-slate-300">Esta acción eliminará el vehículo y los registros relacionados en cascada. Revisa el impacto antes de continuar.</p>

          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-3"><span class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Pendientes</span><strong class="text-amber-400 font-mono text-lg">{{ deleteModal.impacto?.mantenimientos_pendientes || 0 }}</strong></div>
            <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-3"><span class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Mantenimientos</span><strong class="text-sky-400 font-mono text-lg">{{ deleteModal.impacto?.mantenimientos_total || 0 }}</strong></div>
            <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-3"><span class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Facturas</span><strong class="text-violet-400 font-mono text-lg">{{ deleteModal.impacto?.facturas_total || 0 }}</strong></div>
            <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-3"><span class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Repuestos</span><strong class="text-rose-400 font-mono text-lg">{{ deleteModal.impacto?.repuestos_total || 0 }}</strong></div>
          </div>

          <label v-if="(deleteModal.impacto?.mantenimientos_pendientes || 0) > 0" class="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 cursor-pointer">
            <input v-model="deleteModal.cancelarPendientes" type="checkbox" class="mt-1 accent-amber-500">
            <span class="text-xs text-amber-200 leading-relaxed">Cancelar mantenimientos pendientes o en proceso antes de eliminar el vehículo.</span>
          </label>

          <p class="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
        </div>

        <div class="px-5 py-4 bg-slate-900/70 border-t border-slate-800 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition" @click="closeDeleteModal">Cancelar</button>
          <button type="button" :disabled="(deleteModal.impacto?.mantenimientos_pendientes || 0) > 0 && !deleteModal.cancelarPendientes" class="px-4 py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition" @click="confirmDelete">Eliminar definitivamente</button>
        </div>
      </div>
    </div>

    <div v-if="simpleDeleteModal.show" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      <div class="w-full max-w-sm rounded-xl border border-slate-800 bg-[#1e293b] shadow-2xl overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-800 bg-slate-900/70">
          <p class="text-xs font-bold uppercase tracking-wider text-rose-400">Confirmar eliminación</p>
          <h3 class="text-base font-bold text-white mt-1">{{ simpleDeleteModal.vehiculo?.placa }}</h3>
        </div>
        <div class="p-5 space-y-3">
          <p class="text-sm text-slate-300">Este vehículo no tiene registros vinculados. ¿Deseas eliminarlo?</p>
          <p class="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
        </div>
        <div class="px-5 py-4 bg-slate-900/70 border-t border-slate-800 flex justify-end gap-3">
          <button type="button" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition" @click="closeSimpleDeleteModal">Cancelar</button>
          <button type="button" class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold transition" @click="confirmSimpleDelete">Eliminar</button>
        </div>
      </div>
    </div>
  </section>
</template>
