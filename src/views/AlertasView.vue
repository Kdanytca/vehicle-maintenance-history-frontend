<script setup>
import { onMounted, reactive, ref } from 'vue'
import api from '../api'

const alertas = ref([])
const error = ref('')
const success = ref('')
const form = reactive({ destinatario: 'juan.mendoza@email.com', asunto: 'Aviso de Revisión Preventiva - SGA', mensaje: 'Estimado cliente, le saludamos del taller mecánico para informarle que su vehículo está listo para retiro...' })

async function load() {
  const { data } = await api.get('/alertas')
  alertas.value = data
}

async function send() {
  error.value = ''
  success.value = ''

  try {
    await api.post('/notificaciones/enviar', form)
    success.value = 'Notificación enviada y registrada correctamente.'
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo enviar la notificación.'
  }
}

onMounted(load)
</script>

<template>
  <section>
    <div class="mb-6"><h1 class="text-2xl font-bold text-white tracking-tight">Módulo de Alertas Operativas</h1><p class="text-sm text-slate-400">Gestión de comunicaciones, despacho manual y trazabilidad de notificaciones.</p></div>
    <p v-if="success" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm mb-4">{{ success }}</p>
    <p v-if="error" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm mb-4">{{ error }}</p>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form class="bg-[#1e293b] p-5 rounded-xl border border-slate-800 space-y-4 shadow-sm h-fit" @submit.prevent="send">
        <h3 class="font-bold text-slate-200 text-sm tracking-wide uppercase border-b border-slate-800 pb-2"><i class="fa-solid fa-pen-nib text-sky-400 mr-1.5"></i> Configurar Correo Manual</h3>
        <div class="space-y-3"><div><label class="block text-xs font-semibold text-slate-400 mb-1">Destinatario (Cliente)</label><input v-model="form.destinatario" required type="email" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"></div><div><label class="block text-xs font-semibold text-slate-400 mb-1">Asunto predefinido</label><input v-model="form.asunto" required class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"></div><div><label class="block text-xs font-semibold text-slate-400 mb-1">Mensaje o Cuerpo de Plantilla</label><textarea v-model="form.mensaje" required rows="5" class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-sans"></textarea></div></div>
        <button class="w-full bg-sky-500 hover:bg-sky-600 text-slate-900 py-2 rounded-lg font-bold text-xs transition-all"><i class="fa-solid fa-paper-plane mr-1"></i> Despachar Correo Manual</button>
      </form>
      <div class="bg-[#1e293b] p-5 rounded-xl border border-slate-800 lg:col-span-2 space-y-3 shadow-sm h-fit"><h3 class="font-bold text-slate-200 text-sm tracking-wide uppercase border-b border-slate-800 pb-2"><i class="fa-solid fa-clock-rotate-left text-amber-400 mr-1.5"></i> Registro de Trazabilidad de Notificaciones</h3><div class="overflow-x-auto"><table class="w-full text-left text-xs border-collapse"><thead><tr class="bg-slate-900/40 text-slate-400 border-b border-slate-800"><th class="p-3">Fecha / Hora</th><th class="p-3">Tipo</th><th class="p-3">Destinatario</th><th class="p-3">Estado de Envío</th></tr></thead><tbody class="divide-y divide-slate-800/50 text-slate-300"><tr v-for="alerta in alertas" :key="alerta.id_notificacion" class="hover:bg-slate-800/20 transition-colors"><td class="p-3 font-mono">{{ alerta.fecha_envio || alerta.created_at }}</td><td class="p-3"><span class="bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 font-medium font-mono text-[10px]">{{ alerta.tipo_envio }}</span></td><td class="p-3">{{ alerta.destinatario }}</td><td class="p-3 text-emerald-400 font-semibold"><i class="fa-solid fa-circle-check mr-1 text-[10px]"></i>Exitoso</td></tr></tbody></table></div></div>
    </div>
  </section>
</template>
