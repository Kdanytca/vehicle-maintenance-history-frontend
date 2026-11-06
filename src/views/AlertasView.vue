
<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../api'
import AlertasGarantia from '../components/AlertasGarantia.vue'

const alertas = ref([])
const clientes = ref([])
const error = ref('')
const success = ref('')
const loading = ref(false)
const sending = ref(false)

const form = reactive({
  id_cliente: '',
  asunto: 'Recordatorio de mantenimiento preventivo - SGA',
  mensaje: `Estimado cliente:

Le saludamos cordialmente de parte de nuestro taller mecánico. Le recordamos que es importante realizar el mantenimiento preventivo de su vehículo para garantizar su buen funcionamiento y seguridad.

Puede comunicarse con nosotros para programar su próxima revisión.

Atentamente,
Equipo de Servicio Técnico SGA.`
})

const clienteSeleccionado = computed(() => {
  return clientes.value.find(
    cliente => String(cliente.id ?? cliente.id_cliente) === String(form.id_cliente)
  ) || null
})

function obtenerLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta
  if (Array.isArray(respuesta?.data)) return respuesta.data
  if (Array.isArray(respuesta?.clientes)) return respuesta.clientes
  return []
}

async function load() {
  loading.value = true
  error.value = ''

  const errores = []

  try {
    const respuesta = await api.get('/clientes-notificacion')
    clientes.value = obtenerLista(respuesta.data)
  } catch (exception) {
    clientes.value = []
    errores.push(
      exception.response?.data?.message ||
      'No se pudieron cargar los clientes.'
    )
  }

  try {
    const respuesta = await api.get('/alertas')
    alertas.value = obtenerLista(respuesta.data)
  } catch (exception) {
    alertas.value = []
    errores.push(
      exception.response?.data?.message ||
      'No se pudo cargar el historial.'
    )
  }

  if (errores.length) {
    error.value = errores.join(' ')
  }

  loading.value = false
}

async function send() {
  error.value = ''
  success.value = ''

  const cliente = clienteSeleccionado.value

  if (!cliente) {
    error.value = 'Debes seleccionar un cliente registrado.'
    return
  }

  if (!cliente.correo_electronico) {
    error.value = 'El cliente no tiene un correo registrado.'
    return
  }

  if (!form.asunto.trim() || !form.mensaje.trim()) {
    error.value = 'El asunto y el mensaje son obligatorios.'
    return
  }

  if (!confirm(
    `¿Enviar el recordatorio a ${cliente.nombre} ${cliente.apellido} (${cliente.correo_electronico})?`
  )) return

  sending.value = true

  try {
    const respuesta = await api.post('/notificaciones/enviar', {
      id_cliente: cliente.id ?? cliente.id_cliente,
      asunto: form.asunto.trim(),
      mensaje: form.mensaje.trim()
    })

    success.value = respuesta.data.message ||
      'Recordatorio enviado y registrado correctamente.'

    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message ||
      'No se pudo enviar el recordatorio.'
  } finally {
    sending.value = false
  }
}

onMounted(load)
</script>

<template>
  <section>
    <AlertasGarantia />

    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white tracking-tight">
        Módulo de Alertas Operativas
      </h1>
      <p class="text-sm text-slate-400">
        Gestión de comunicaciones, despacho manual y trazabilidad de notificaciones.
      </p>
    </div>

    <p v-if="success" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm mb-4">
      {{ success }}
    </p>

    <p v-if="error" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm mb-4">
      {{ error }}
    </p>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <form
        class="bg-[#1e293b] p-5 rounded-xl border border-slate-800 space-y-4 shadow-sm h-fit"
        @submit.prevent="send"
      >
        <h3 class="font-bold text-slate-200 text-sm tracking-wide uppercase border-b border-slate-800 pb-2">
          <i class="fa-solid fa-pen-nib text-sky-400 mr-1.5"></i>
          Configurar Correo Manual
        </h3>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">
            Cliente registrado
          </label>

          <select
            v-model="form.id_cliente"
            required
            :disabled="loading"
            class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="" disabled>
              {{ loading ? 'Cargando clientes...' : 'Selecciona un cliente' }}
            </option>

            <option
              v-for="cliente in clientes"
              :key="cliente.id ?? cliente.id_cliente"
              :value="cliente.id ?? cliente.id_cliente"
            >
              {{ cliente.nombre }} {{ cliente.apellido }}
            </option>
          </select>

          <p v-if="!loading && clientes.length === 0" class="text-xs text-amber-400 mt-2">
            No hay clientes disponibles. Verifica el registro en la base de datos.
          </p>
        </div>

        <div v-if="clienteSeleccionado">
          <label class="block text-xs font-semibold text-slate-400 mb-1">
            Correo electrónico del destinatario
          </label>

          <input
            :value="clienteSeleccionado.correo_electronico || 'Sin correo registrado'"
            readonly
            class="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-400"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">
            Asunto del correo
          </label>

          <input
            v-model="form.asunto"
            required
            maxlength="150"
            class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-400 mb-1">
            Mensaje del correo
          </label>

          <textarea
            v-model="form.mensaje"
            required
            rows="8"
            class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-sans"
          ></textarea>
        </div>

        <button
          type="submit"
          :disabled="sending || loading || !clienteSeleccionado"
          class="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 py-2 rounded-lg font-bold text-xs transition-all"
        >
          <i :class="sending ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'" class="mr-1"></i>
          {{ sending ? 'Enviando...' : 'Enviar Recordatorio' }}
        </button>

        <button
          type="button"
          @click="load"
          :disabled="loading || sending"
          class="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded-lg font-semibold text-xs"
        >
          <i class="fa-solid fa-rotate mr-1"></i>
          Actualizar clientes
        </button>
      </form>

      <div class="bg-[#1e293b] p-5 rounded-xl border border-slate-800 lg:col-span-2 shadow-sm h-fit">
        <h3 class="font-bold text-slate-200 text-sm tracking-wide uppercase border-b border-slate-800 pb-2 mb-4">
          <i class="fa-solid fa-eye text-sky-400 mr-1.5"></i>
          Vista Previa del Correo
        </h3>

        <div class="bg-slate-900 rounded-lg border border-slate-700 p-5 space-y-4">
          <div class="border-b border-slate-700 pb-3 space-y-2">
            <p class="text-xs text-slate-400">
              Para: {{ clienteSeleccionado?.correo_electronico || 'Selecciona un cliente' }}
            </p>
            <p class="text-xs text-slate-400">
              Asunto: {{ form.asunto || 'Sin asunto' }}
            </p>
          </div>

          <div class="min-h-48">
            <p class="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{{ form.mensaje }}</p>
          </div>

          <div class="border-t border-slate-700 pt-3">
            <p class="text-xs text-slate-500">
              Vista previa del mensaje antes de enviarlo.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-[#1e293b] p-5 rounded-xl border border-slate-800 mt-6 space-y-3 shadow-sm">
      <h3 class="font-bold text-slate-200 text-sm tracking-wide uppercase border-b border-slate-800 pb-2">
        <i class="fa-solid fa-clock-rotate-left text-amber-400 mr-1.5"></i>
        Registro de Trazabilidad de Notificaciones
      </h3>

      <div v-if="loading" class="text-sm text-slate-400 py-4">
        Cargando información...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-900/40 text-slate-400 border-b border-slate-800">
              <th class="p-3">Fecha / Hora</th>
              <th class="p-3">Tipo</th>
              <th class="p-3">Destinatario</th>
              <th class="p-3">Estado de Envío</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800/50 text-slate-300">
            <tr
              v-for="alerta in alertas"
              :key="alerta.id_notificacion"
              class="hover:bg-slate-800/20 transition-colors"
            >
              <td class="p-3 font-mono">
                {{ alerta.fecha_envio || alerta.created_at }}
              </td>
              <td class="p-3">
                <span class="bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/20 font-medium font-mono text-[10px]">
                  {{ alerta.tipo_envio }}
                </span>
              </td>
              <td class="p-3">{{ alerta.destinatario }}</td>
              <td class="p-3 text-emerald-400 font-semibold">
                <i class="fa-solid fa-circle-check mr-1 text-[10px]"></i>
                Registrado
              </td>
            </tr>

            <tr v-if="alertas.length === 0">
              <td colspan="4" class="p-5 text-center text-slate-500">
                No hay notificaciones registradas.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
