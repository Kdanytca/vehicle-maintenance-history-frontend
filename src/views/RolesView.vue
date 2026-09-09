<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '../api'

const roles = ref([])
const permisos = ref([])
const rolForm = reactive({ nombre_rol: '', descripcion: '' })
const permisoForm = reactive({ nombre_permiso: '', descripcion: '' })
const error = ref('')
const success = ref('')

async function load() {
  const { data } = await api.get('/roles-permisos')
  roles.value = data.roles
  permisos.value = data.permisos
}

async function saveRole() {
  await run(async () => {
    await api.post('/roles', rolForm)
    Object.assign(rolForm, { nombre_rol: '', descripcion: '' })
    success.value = 'Rol creado correctamente.'
    await load()
  })
}

async function savePermission() {
  await run(async () => {
    await api.post('/permisos', permisoForm)
    Object.assign(permisoForm, { nombre_permiso: '', descripcion: '' })
    success.value = 'Permiso creado correctamente.'
    await load()
  })
}

async function syncPermissions(rol) {
  await run(async () => {
    await api.put(`/roles/${rol.id_rol}/permisos`, { permisos: rol.permisos.map((item) => item.id_permiso) })
    success.value = 'Permisos actualizados correctamente.'
    await load()
  })
}

function togglePermission(rol, permiso) {
  const index = rol.permisos.findIndex((item) => item.id_permiso === permiso.id_permiso)
  if (index >= 0) rol.permisos.splice(index, 1)
  else rol.permisos.push(permiso)
}

async function deleteRole(rol) {
  if (!confirm(`¿Eliminar por completo el rol ${rol.nombre_rol}? Esto puede afectar a los usuarios vinculados.`)) return
  await run(async () => {
    await api.delete(`/roles/${rol.id_rol}`)
    success.value = 'Rol eliminado correctamente.'
    await load()
  })
}

async function deletePermission(permiso) {
  if (!confirm(`¿Eliminar el permiso ${permiso.nombre_permiso}?`)) return
  await run(async () => {
    await api.delete(`/permisos/${permiso.id_permiso}`)
    success.value = 'Permiso eliminado correctamente.'
    await load()
  })
}

async function run(callback) {
  error.value = ''
  success.value = ''

  try {
    await callback()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo completar la operación.'
  }
}

onMounted(load)
</script>

<template>
  <section>
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0f172a] border border-slate-800/60 p-4 rounded-xl shadow-sm">
      <div class="flex items-center gap-3"><div class="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center"><i class="fa-solid fa-shield-halved text-violet-400 text-sm"></i></div><div><h1 class="text-xl font-bold text-white">Configurar Roles y Permisos</h1><p class="text-slate-400 text-xs mt-0.5">Administra los niveles de acceso y los privilegios de los usuarios del sistema.</p></div></div>
    </div>
    <p v-if="success" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm mb-4">{{ success }}</p>
    <p v-if="error" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm mb-4">{{ error }}</p>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="space-y-6">
      <form class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl space-y-3" @submit.prevent="saveRole">
        <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><i class="fa-solid fa-user-tag text-violet-400"></i> Nuevo Rol de Acceso</h2>
        <div><label class="text-xs text-slate-400 block mb-1">Nombre del rol *</label><input v-model="rolForm.nombre_rol" required placeholder="Ej: supervisor" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-violet-500 transition" /></div>
        <div><label class="text-xs text-slate-400 block mb-1">Descripción</label><input v-model="rolForm.descripcion" placeholder="Funciones asignadas" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-violet-500 transition" /></div>
        <button class="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5"><i class="fa-solid fa-plus text-xs"></i> Crear Rol</button>
      </form>
      <form class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl space-y-3" @submit.prevent="savePermission">
        <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><i class="fa-solid fa-key text-amber-400"></i> Nuevo Permiso Individual</h2>
        <div><label class="text-xs text-slate-400 block mb-1">Nombre del permiso *</label><input v-model="permisoForm.nombre_permiso" required placeholder="Ej: ver_reportes" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition" /></div>
        <div><label class="text-xs text-slate-400 block mb-1">Descripción</label><input v-model="permisoForm.descripcion" placeholder="Qué acción autoriza" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition" /></div>
        <button class="w-full bg-amber-600 hover:bg-amber-700 text-slate-950 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1.5"><i class="fa-solid fa-plus text-xs"></i> Crear Permiso</button>
      </form>
      <div class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl"><h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><i class="fa-solid fa-list-check text-slate-400"></i> Permisos en el Sistema</h2><div class="max-h-[300px] overflow-y-auto pr-1 space-y-1"><div v-for="permiso in permisos" :key="permiso.id_permiso" class="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-0 gap-3"><div><p class="text-sm font-medium text-white truncate">{{ permiso.nombre_permiso }}</p><p v-if="permiso.descripcion" class="text-xs text-slate-500 truncate">{{ permiso.descripcion }}</p></div><button class="text-rose-400 hover:text-rose-300 text-xs" @click="deletePermission(permiso)"><i class="fa-solid fa-trash"></i></button></div><div v-if="permisos.length === 0" class="text-center py-6 text-slate-500"><i class="fa-solid fa-inbox block text-xl mb-2 text-slate-600"></i><p class="text-xs font-medium">No hay permisos registrados.</p></div></div></div>
      </div>

      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between px-1"><h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><i class="fa-solid fa-layer-group text-violet-400"></i> Matriz de Roles y Asignaciones</h2><span class="text-xs text-slate-500 font-mono bg-slate-900/60 border border-slate-800 px-2 py-0.5 rounded-md">{{ roles.length }} Rol(es)</span></div>
        <div v-for="rol in roles" :key="rol.id_rol" class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl transition-all hover:border-slate-700/60"><div class="flex items-start justify-between mb-4 pb-4 border-b border-slate-800/60"><div><div class="flex items-center gap-2.5"><span :class="['text-xs px-2.5 py-0.5 rounded-full font-medium border', rol.nombre_rol === 'admin' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-violet-500/10 text-violet-400 border-violet-500/20']">{{ rol.nombre_rol }}</span><span class="text-xs text-slate-500 font-medium"><i class="fa-solid fa-key text-[10px] mr-1"></i>{{ rol.permisos.length }} permiso(s) otorgado(s)</span></div><p v-if="rol.descripcion" class="text-xs text-slate-400 mt-1.5">{{ rol.descripcion }}</p></div><button class="text-rose-400 hover:text-rose-300 text-xs" @click="deleteRole(rol)"><i class="fa-solid fa-trash"></i></button></div><div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4"><label v-for="permiso in permisos" :key="permiso.id_permiso" class="flex items-center gap-2 bg-slate-900/40 border border-slate-800/80 rounded-lg px-3 py-2 select-none"><input type="checkbox" class="accent-violet-500 w-4 h-4 rounded" :checked="rol.permisos.some((item) => item.id_permiso === permiso.id_permiso)" @change="togglePermission(rol, permiso)"><span class="text-xs text-slate-400 truncate">{{ permiso.nombre_permiso }}</span></label></div><div class="flex justify-end"><button class="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-xs font-semibold" @click="syncPermissions(rol)"><i class="fa-solid fa-floppy-disk mr-1"></i> Guardar Permisos</button></div></div>
      </div>
    </div>
  </section>
</template>
