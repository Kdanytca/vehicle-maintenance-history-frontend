<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const usuarios = ref([])
const roles = ref([])
const form = reactive({ username: '', password: '', password_confirmation: '', id_rol: '', estado_activo: true })
const editingId = ref(null)
const error = ref('')
const success = ref('')

async function load() {
  const { data } = await api.get('/usuarios')
  usuarios.value = data.usuarios.data
  roles.value = data.roles
}

async function save() {
  error.value = ''
  success.value = ''

  try {
    const wasCurrentUser = editingId.value === auth.user?.id_usuario

    if (editingId.value) {
      await api.put(`/usuarios/${editingId.value}`, form)
      success.value = 'Usuario actualizado correctamente.'
    } else {
      await api.post('/usuarios', form)
      success.value = 'Usuario creado correctamente.'
    }
    resetForm()
    await load()
    if (wasCurrentUser) await auth.fetchUser()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo guardar el usuario.'
  }
}

function edit(usuario) {
  Object.assign(form, {
    username: usuario.username,
    password: '',
    password_confirmation: '',
    id_rol: usuario.id_rol,
    estado_activo: Boolean(usuario.estado_activo),
  })
  editingId.value = usuario.id_usuario
}

function resetForm() {
  Object.assign(form, { username: '', password: '', password_confirmation: '', id_rol: '', estado_activo: true })
  editingId.value = null
}

async function deactivate(usuario) {
  if (!confirm(`¿Inhabilitar el usuario ${usuario.username}?`)) return
  error.value = ''
  success.value = ''

  try {
    await api.delete(`/usuarios/${usuario.id_usuario}`)
    success.value = 'Usuario inhabilitado correctamente.'
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo inhabilitar el usuario.'
  }
}

onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#0f172a] border border-slate-800/60 p-4 rounded-xl shadow-sm">
      <div class="flex items-center gap-3"><div class="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center"><i class="fa-solid fa-users text-amber-400 text-sm"></i></div><div><h1 class="text-xl font-bold text-white">Gestión de Usuarios</h1><p class="text-slate-400 text-xs mt-0.5">Administra usuarios y roles del sistema.</p></div></div>
      <button form="usuario-form" class="bg-amber-600 hover:bg-amber-700 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"><i class="fa-solid fa-floppy-disk text-xs"></i> {{ editingId ? 'Actualizar Usuario' : 'Crear Usuario' }}</button>
    </div>
    <p v-if="success" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">{{ success }}</p>
    <p v-if="error" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm">{{ error }}</p>
    <form id="usuario-form" class="bg-[#1e293b] rounded-xl border border-slate-800 p-5 shadow-xl grid grid-cols-1 md:grid-cols-6 gap-4" @submit.prevent="save">
      <div class="md:col-span-2"><label class="block text-xs font-semibold text-slate-400 mb-1">Usuario *</label><input v-model="form.username" required class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition" /></div>
      <div class="md:col-span-2"><label class="block text-xs font-semibold text-slate-400 mb-1">Contraseña {{ editingId ? '(opcional)' : '*' }}</label><input v-model="form.password" :required="!editingId" type="password" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition" /></div>
      <div class="md:col-span-2"><label class="block text-xs font-semibold text-slate-400 mb-1">Confirmación {{ editingId ? '(opcional)' : '*' }}</label><input v-model="form.password_confirmation" :required="!editingId" type="password" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-amber-500 transition" /></div>
      <div class="md:col-span-3"><label class="block text-xs font-semibold text-slate-400 mb-1">Rol *</label><select v-model="form.id_rol" required class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"><option value="">Selecciona</option><option v-for="rol in roles" :key="rol.id_rol" :value="rol.id_rol">{{ rol.nombre_rol }}</option></select></div>
      <div class="md:col-span-3"><label class="block text-xs font-semibold text-slate-400 mb-1">Estado *</label><select v-model="form.estado_activo" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition"><option :value="true">Activo</option><option :value="false">Inactivo</option></select></div>
      <div class="md:col-span-6 flex justify-end gap-3"><button v-if="editingId" type="button" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 rounded-lg text-sm font-bold" @click="resetForm">Cancelar</button></div>
    </form>
    <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl"><table class="w-full text-left text-sm"><thead><tr class="bg-slate-900/50 border-b border-slate-800 text-slate-400"><th class="p-4 font-semibold text-xs uppercase tracking-wider">ID</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Usuario</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Rol</th><th class="p-4 font-semibold text-xs uppercase tracking-wider">Estado</th><th class="p-4 font-semibold text-xs uppercase tracking-wider text-right">Acciones</th></tr></thead><tbody class="divide-y divide-slate-800/60 text-slate-300"><tr v-for="usuario in usuarios" :key="usuario.id_usuario" class="hover:bg-slate-800/30 transition-colors"><td class="p-4 font-mono text-xs text-slate-500">{{ usuario.id_usuario }}</td><td class="p-4 font-medium text-white">{{ usuario.username }}<span v-if="usuario.id_usuario === auth.user?.id_usuario" class="ml-2 text-[10px] text-sky-400">(Tú)</span></td><td class="p-4"><span class="text-xs px-2.5 py-0.5 rounded-full font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20">{{ usuario.rol?.nombre_rol }}</span></td><td class="p-4" :class="usuario.estado_activo ? 'text-emerald-400' : 'text-rose-400'">{{ usuario.estado_activo ? 'Activo' : 'Inactivo' }}</td><td class="p-4 text-right space-x-2"><button class="px-2.5 py-1 bg-slate-800 hover:bg-blue-500/10 text-blue-400 rounded text-xs" @click="edit(usuario)"><i class="fa-solid fa-pen"></i> Editar</button><button :disabled="usuario.id_usuario === auth.user?.id_usuario || !usuario.estado_activo" class="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/10 text-amber-400 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed" @click="deactivate(usuario)"><i class="fa-solid fa-user-slash"></i> Inhabilitar</button></td></tr></tbody></table></div>
  </section>
</template>
