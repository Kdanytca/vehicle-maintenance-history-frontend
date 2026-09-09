<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '../api'

const vehiculos = ref([])
const error = ref('')
const success = ref('')
const showForm = ref(false)
const editingId = ref(null)
const termino = ref('')
const form = reactive({ placa: '', marca: '', modelo: '', anio: '', propietario: '' })

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

onMounted(load)
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

    <form class="bg-[#1e293b] rounded-xl border border-slate-800 shadow-xl p-4 mb-6 flex flex-col sm:flex-row gap-3" @submit.prevent="search">
      <input v-model="termino" placeholder="Buscar por placa o propietario" class="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-sky-500 transition" />
      <button class="bg-slate-800 hover:bg-slate-700 text-sky-400 px-4 py-2 rounded-lg font-semibold text-sm"><i class="fa-solid fa-magnifying-glass mr-1"></i> Buscar</button>
      <button type="button" class="bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg font-semibold text-sm" @click="termino = ''; load()">Limpiar</button>
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
              <td class="px-6 py-4 text-right space-x-2 whitespace-nowrap"><RouterLink :to="`/vehiculos/${vehiculo.id_vehiculo}`" class="inline-block px-2.5 py-1 bg-slate-800 hover:bg-sky-500/10 text-sky-400 rounded text-xs"><i class="fa-solid fa-eye"></i> Ver</RouterLink><button class="inline-block px-2.5 py-1 bg-slate-800 hover:bg-blue-500/10 text-blue-400 rounded text-xs" @click="edit(vehiculo)"><i class="fa-solid fa-pen"></i> Editar</button></td>
            </tr>
            <tr v-if="vehiculos.length === 0"><td colspan="6" class="px-6 py-12 text-center text-slate-500"><i class="fa-solid fa-car-burst text-3xl mb-3 block text-slate-600"></i>No hay vehículos registrados en el sistema.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
