<script setup>
import { onMounted, ref } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const estado = ref('activas')
const alertas = ref([])
const loading = ref(false)
const atendiendo = ref(null)
const error = ref('')
const success = ref('')
let requestId = 0

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

onMounted(load)
</script>

<template>
  <section class="mb-8 space-y-4 rounded-xl border border-slate-800 bg-[#1e293b] p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-bold text-white">Alertas de garantía de repuestos</h2>
        <p class="text-xs text-slate-400">Avisos 30 días antes y al vencer. La fecha indicada es el primer día sin cobertura.</p>
      </div>
      <label class="text-sm text-slate-300">
        Mostrar
        <select v-model="estado" class="ml-2 rounded-lg bg-slate-900 p-2" @change="success = ''; load()">
          <option value="activas">Alertas activas</option>
          <option value="atendidas">Historial de atendidas</option>
        </select>
      </label>
    </div>
    <p v-if="success" role="status" class="rounded-lg bg-emerald-500/10 p-3 text-emerald-400">{{ success }}</p>
    <p v-if="error" role="alert" class="rounded-lg bg-rose-500/10 p-3 text-rose-400">{{ error }}</p>
    <p v-if="loading" role="status" class="text-sm text-slate-400">Cargando alertas...</p>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm text-slate-300">
        <thead class="border-b border-slate-700 text-xs uppercase text-slate-400">
          <tr><th class="p-3">Repuesto / Vehículo</th><th class="p-3">Aviso</th><th class="p-3">Vencimiento</th><th class="p-3">Gestión</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          <tr v-if="!alertas.length"><td colspan="4" class="p-6 text-center text-slate-400">{{ estado === 'activas' ? 'No hay alertas activas.' : 'No hay alertas atendidas.' }}</td></tr>
          <tr v-for="alerta in alertas" :key="alerta.id">
            <td class="p-3">
              <p class="font-medium text-white">{{ alerta.repuesto?.nombre_pieza || 'Repuesto no disponible' }}</p>
              <p class="text-xs text-slate-400">{{ alerta.repuesto?.factura?.vehiculo?.placa || 'Sin vehículo asociado' }} · {{ alerta.repuesto?.codigo_pieza || 'Sin código' }}</p>
            </td>
            <td class="p-3" :class="alerta.tipo === 'vencida' ? 'text-rose-400' : 'text-amber-400'">{{ alerta.tipo === 'vencida' ? 'Garantía vencida' : 'Garantía próxima a vencer' }}</td>
            <td class="p-3 font-mono">{{ alerta.fecha_vencimiento }}</td>
            <td class="p-3">
              <template v-if="alerta.atendida_at">
                <p>{{ new Date(alerta.atendida_at).toLocaleString() }}</p>
                <p class="text-xs text-slate-400">Por {{ alerta.atendida_por?.username || 'Usuario no disponible' }}</p>
              </template>
              <button v-else-if="auth.isAdmin" type="button" :disabled="atendiendo !== null" class="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" @click="atender(alerta)">{{ atendiendo === alerta.id ? 'Guardando...' : 'Marcar como atendida' }}</button>
              <span v-else class="text-xs text-slate-400">Pendiente de atención por administrador</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
