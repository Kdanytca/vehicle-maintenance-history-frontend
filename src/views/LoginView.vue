<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const form = reactive({ username: '', password: '', remember: false })
const error = ref('')
const showPassword = ref(false)

function autoFill(username, password) {
  form.username = username
  form.password = password
}

async function submit() {
  error.value = ''

  try {
    await auth.login(form)
    router.push('/vehiculos')
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo iniciar sesion'
  }
}
</script>

<template>
  <main class="bg-[#020617] text-slate-100 min-h-screen flex flex-col antialiased">
    <div class="flex min-h-screen w-full transition-all duration-500">
      <div class="hidden lg:flex lg:w-1/2 bg-slate-900 justify-center items-center relative overflow-hidden p-12 border-r border-slate-800">
        <div class="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>

        <div class="max-w-md space-y-8 relative z-10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center text-slate-900 font-bold text-xl shadow-lg shadow-sky-500/20">
              <i class="fa-solid fa-wrench"></i>
            </div>
            <div>
              <span class="font-bold text-white text-lg tracking-wide block">SGA SYSTEM</span>
              <span class="text-[10px] text-sky-400 font-semibold tracking-wider uppercase block">Gestión e Ingeniería Automotriz</span>
            </div>
          </div>

          <div class="space-y-4">
            <h1 class="text-4xl font-extrabold text-white leading-tight tracking-tight">La evolución en el control de tu taller.</h1>
            <p class="text-slate-400 text-sm leading-relaxed">Optimiza el registro de flotas, la trazabilidad de los mantenimientos, el control de repuestos vinculados a facturación y la comunicación directa con tus clientes en una sola plataforma robusta.</p>
          </div>

          <div class="space-y-3 pt-4 border-t border-slate-800">
            <div class="flex items-center gap-3 text-xs text-slate-300"><i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i><span>Validación estricta de Placas Únicas (Sprint 1)</span></div>
            <div class="flex items-center gap-3 text-xs text-slate-300"><i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i><span>Anulación lógica de órdenes para auditoría (Sprint 2)</span></div>
            <div class="flex items-center gap-3 text-xs text-slate-300"><i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i><span>Gestión logística y carga de facturas PDF (Sprint 3)</span></div>
          </div>

          <div class="text-[11px] text-slate-500">Propuesta de Diseño de Sistemas I - FIAUES 2026. Todos los derechos reservados.</div>
        </div>
      </div>

      <div class="w-full lg:w-1/2 flex justify-center items-center p-8 sm:p-12">
        <div class="w-full max-w-md space-y-8">
          <div class="space-y-2">
            <div class="lg:hidden flex items-center gap-2.5 mb-6">
              <div class="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-slate-900 font-bold text-sm"><i class="fa-solid fa-wrench"></i></div>
              <span class="font-bold text-white tracking-wide text-sm">SGA SYSTEM</span>
            </div>
            <h2 class="text-3xl font-bold text-white tracking-tight">Iniciar Sesión</h2>
            <p class="text-sm text-slate-400">Por favor, introduce tus credenciales para ingresar.</p>
          </div>

          <div v-if="error" class="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-start gap-2.5">
            <i class="fa-solid fa-triangle-exclamation mt-0.5 shrink-0"></i>
            <span>{{ error }}</span>
          </div>

          <form class="space-y-5" @submit.prevent="submit">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Nombre de Usuario</label>
              <div class="relative">
                <i class="fa-solid fa-user absolute left-3.5 top-3.5 text-slate-500 text-sm"></i>
                <input v-model="form.username" required class="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors" autocomplete="username" />
              </div>
            </div>
            <div>
              <div class="flex justify-between items-center mb-1.5">
                <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Contraseña</label>
                <a href="#" class="text-xs text-sky-400 hover:underline">¿La olvidó?</a>
              </div>
              <div class="relative">
                <i class="fa-solid fa-lock absolute left-3.5 top-3.5 text-slate-500 text-sm"></i>
                <input v-model="form.password" required :type="showPassword ? 'text' : 'password'" class="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-10 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500 transition-colors" autocomplete="current-password" />
                <button type="button" class="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300" @click="showPassword = !showPassword">
                  <i :class="['fa-solid', showPassword ? 'fa-eye-slash' : 'fa-eye']"></i>
                </button>
              </div>
            </div>
            <div class="flex items-center">
              <input v-model="form.remember" type="checkbox" class="accent-sky-500 rounded border-slate-800 bg-slate-950 text-sky-500 focus:ring-0 w-4 h-4 cursor-pointer">
              <label class="ml-2 text-xs text-slate-400 cursor-pointer select-none">Mantener sesión iniciada en este equipo</label>
            </div>
            <button type="submit" class="w-full bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-slate-900 font-bold py-3 px-4 rounded-lg text-sm transition-all shadow-lg shadow-sky-500/15">
              Ingresar al Portal <i class="fa-solid fa-right-to-bracket ml-1.5 text-xs"></i>
            </button>
          </form>

          <div class="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-2">
            <p class="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5"><i class="fa-solid fa-circle-info text-sky-400"></i> Credenciales de demostración:</p>
            <div class="grid grid-cols-2 gap-3 text-xs text-slate-400">
              <button class="text-left p-2 bg-slate-950/40 rounded border border-slate-800/40 cursor-pointer hover:border-sky-500/30 transition-colors" type="button" @click="autoFill('admin', '12345678')">
                <span class="block font-bold text-sky-400">Administrador:</span><span class="block font-mono text-[10px]">User: admin</span><span class="block font-mono text-[10px]">Pass: 12345678</span>
              </button>
              <button class="text-left p-2 bg-slate-950/40 rounded border border-slate-800/40 cursor-pointer hover:border-emerald-500/30 transition-colors" type="button" @click="autoFill('mecanico', '12345678')">
                <span class="block font-bold text-emerald-400">Mecánico:</span><span class="block font-mono text-[10px]">User: mecanico</span><span class="block font-mono text-[10px]">Pass: 12345678</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
