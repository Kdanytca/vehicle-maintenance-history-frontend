<script setup>
import { onMounted, ref } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const estado = ref('activas')
const alertas = ref([])
const loading = ref(false)
const atendiendo = ref(null)
const diasPrevios = ref(15)
const configuracionCargada = ref(false)
const guardandoUmbral = ref(false)
const errorUmbral = ref('')
const estadoUmbral = ref('')
const error = ref('')
const success = ref('')
let requestId = 0

async function cargarConfiguracion() {
  errorUmbral.value = ''
  try {
    const { data } = await api.get('/configuracion-alertas-garantia')
    diasPrevios.value = data.dias_previos
    configuracionCargada.value = true
  } catch (exception) {
    errorUmbral.value = exception.response?.data?.message || 'No se pudo cargar la configuración de alertas.'
  }
}

async function load() {
  const current = ++requestId
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/alertas-garantia', { params: { estado: estado.value } })
    if (current === requestId) alertas.value = data
  } catch (exception) {
    if (current === requestId) {
      alertas.value = []
      error.value = exception.response?.data?.message || 'No se pudieron cargar las alertas de garantía.'
    }
  } finally {
    if (current === requestId) loading.value = false
  }
}

async function guardarUmbral() {
  errorUmbral.value = ''
  estadoUmbral.value = ''
  if (!Number.isInteger(diasPrevios.value) || diasPrevios.value < 1) {
    errorUmbral.value = 'Ingresa un número entero mayor que cero.'
    return
  }

  guardandoUmbral.value = true
  try {
    const { data } = await api.put('/configuracion-alertas-garantia', {
      dias_previos: diasPrevios.value,
    })
    diasPrevios.value = data.dias_previos
    estadoUmbral.value = 'Configuración guardada automáticamente.'
    await load()
  } catch (exception) {
    errorUmbral.value = exception.response?.data?.message || 'No se pudo guardar la configuración de alertas.'
  } finally {
    guardandoUmbral.value = false
  }
}

function cambiarEstado() {
  success.value = ''
  load()
}

async function atender(alerta) {
  atendiendo.value = alerta.id
  error.value = ''
  success.value = ''
  try {
    const { data } = await api.patch(`/alertas-garantia/${alerta.id}/atender`)
    success.value = data.message
    await load()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo marcar la alerta como atendida.'
  } finally {
    atendiendo.value = null
  }
}

onMounted(() => {
  load()
  if (auth.isAdmin) cargarConfiguracion()
})
</script>

<template>
  <section class="mb-8 space-y-4 rounded-xl border border-slate-800 bg-[#1e293b] p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-white">Alertas de garantía de repuestos</h2>
        <p class="text-xs text-slate-400">
          Avisos según el umbral configurado y al vencer. La fecha indicada es el primer día sin cobertura.
        </p>
      </div>
      <label class="text-sm text-slate-300">
        Mostrar
        <select v-model="estado" class="ml-2 rounded-lg bg-slate-900 p-2" @change="cambiarEstado">
          <option value="activas">Alertas activas</option>
          <option value="atendidas">Historial de atendidas</option>
        </select>
      </label>
    </div>
    <div
      v-if="auth.isAdmin"
      class="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-slate-700 bg-slate-900/50 p-4"
    >
      <div>
        <label for="dias-previos-garantia" class="block text-sm font-semibold text-slate-200">
          Días previos para alertar
        </label>
        <p id="dias-previos-ayuda" class="mt-1 text-xs text-slate-400">
          Las garantías próximas a vencer se avisarán dentro de este plazo.
        </p>
        <p v-if="errorUmbral" role="alert" class="mt-2 text-xs text-rose-400">{{ errorUmbral }}</p>
        <p v-else-if="estadoUmbral" role="status" class="mt-2 text-xs text-emerald-400">{{ estadoUmbral }}</p>
      </div>
      <div class="flex items-center gap-2">
        <input
          id="dias-previos-garantia"
          v-model.number="diasPrevios"
          type="number"
          min="1"
          step="1"
          required
          :disabled="!configuracionCargada || guardandoUmbral"
          aria-describedby="dias-previos-ayuda"
          class="w-24 rounded-lg border border-slate-700 bg-slate-950 p-2 text-center text-white disabled:opacity-50"
          @change="guardarUmbral"
        />
        <span class="text-sm text-slate-400">días</span>
        <span v-if="guardandoUmbral" role="status" class="text-xs text-sky-400">Guardando...</span>
      </div>
    </div>
    <p v-if="success" role="status" class="rounded-lg bg-emerald-500/10 p-3 text-emerald-400">{{ success }}</p>
    <p v-if="error" role="alert" class="rounded-lg bg-rose-500/10 p-3 text-rose-400">{{ error }}</p>
    <p v-if="loading" role="status" class="text-sm text-slate-400">Cargando alertas...</p>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="border-b border-slate-700 text-xs uppercase text-slate-400">
          <tr>
            <th class="p-3">Repuesto / Vehículo</th>
            <th class="p-3">Aviso</th>
            <th class="p-3">Vencimiento</th>
            <th class="p-3">Gestión</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          <tr v-if="!alertas.length">
            <td colspan="4" class="p-6 text-center text-slate-400">
              {{ estado === 'activas' ? 'No hay alertas activas.' : 'No hay alertas atendidas.' }}
            </td>
          </tr>
          <tr v-for="alerta in alertas" :key="alerta.id">
            <td class="p-3">
              <p class="font-medium text-white">{{ alerta.repuesto?.nombre_pieza || 'Repuesto no disponible' }}</p>
              <p class="text-xs text-slate-400">
                {{ alerta.repuesto?.factura?.vehiculo?.placa || 'Sin vehículo asociado' }} ·
                {{ alerta.repuesto?.codigo_pieza || 'Sin código' }}
              </p>
            </td>
            <td class="p-3" :class="alerta.tipo === 'vencida' ? 'text-rose-400' : 'text-amber-400'">
              {{ alerta.tipo === 'vencida' ? 'Garantía vencida' : 'Garantía próxima a vencer' }}
            </td>
            <td class="p-3 font-mono">{{ alerta.fecha_vencimiento }}</td>
            <td class="p-3">
              <template v-if="alerta.atendida_at">
                <p>{{ new Date(alerta.atendida_at).toLocaleString() }}</p>
                <p class="text-xs text-slate-400">Por {{ alerta.atendida_por?.username || 'Usuario no disponible' }}</p>
              </template>
              <button
                v-else-if="auth.isAdmin"
                type="button"
                :disabled="atendiendo !== null"
                class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                @click="atender(alerta)"
              >
                {{ atendiendo === alerta.id ? 'Guardando...' : 'Marcar como atendida' }}
              </button>
              <span v-else class="text-xs text-slate-400">Pendiente de atención por administrador</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
