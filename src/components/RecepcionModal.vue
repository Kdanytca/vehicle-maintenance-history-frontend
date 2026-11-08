<script setup>
// G2DS-16: ver en qué estado llegó el vehículo, registrar una nueva recepción
// y corregirla (solo admin, solo el mismo día y con motivo).
import { computed, reactive, ref, watch } from 'vue'
import api from '../api'

const props = defineProps({
  vehiculo: { type: Object, default: null },
})
const emit = defineEmits(['close', 'saved'])

const NIVELES = ['Vacío', '1/4', '1/2', '3/4', 'Lleno']
const VACIO = { kilometraje: '', nivel_combustible: '', danos_visibles: '', observaciones: '', motivo: '' }

const recepciones = ref([])
const cargando = ref(false)
const error = ref('')
const guardando = ref(false)
// modo: null (solo ver), 'nueva' o 'editar'
const modo = ref(null)
const editandoId = ref(null)
const form = reactive({ ...VACIO })

const ultima = computed(() => recepciones.value[0] || null)
const anteriores = computed(() => recepciones.value.slice(1))

function fecha(valor) {
  return valor ? new Date(valor).toLocaleString('es-SV', { dateStyle: 'medium', timeStyle: 'short' }) : ''
}

function km(valor) {
  return `${Number(valor || 0).toLocaleString('es-SV')} km`
}

// Porcentaje para dibujar la barra del combustible
function porcentaje(nivel) {
  return { Vacío: 0, '1/4': 25, '1/2': 50, '3/4': 75, Lleno: 100 }[nivel] ?? 0
}

function cerrarFormulario() {
  modo.value = recepciones.value.length === 0 ? 'nueva' : null
  editandoId.value = null
  error.value = ''
  Object.assign(form, VACIO)
}

function nuevaRecepcion() {
  cerrarFormulario()
  modo.value = 'nueva'
}

function editar(recepcion) {
  error.value = ''
  modo.value = 'editar'
  editandoId.value = recepcion.id_recepcion
  Object.assign(form, {
    kilometraje: recepcion.kilometraje,
    nivel_combustible: recepcion.nivel_combustible,
    danos_visibles: recepcion.danos_visibles || '',
    observaciones: recepcion.observaciones || '',
    motivo: '',
  })
}

async function cargar() {
  if (!props.vehiculo) return
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/vehiculos/${props.vehiculo.id_vehiculo}/recepciones`)
    recepciones.value = data.recepciones
    cerrarFormulario()
  } catch (exception) {
    error.value = exception.response?.data?.message || 'No se pudo cargar la recepción.'
  } finally {
    cargando.value = false
  }
}

async function guardar() {
  guardando.value = true
  error.value = ''
  const base = `/vehiculos/${props.vehiculo.id_vehiculo}/recepciones`
  try {
    if (modo.value === 'editar') {
      await api.put(`${base}/${editandoId.value}`, form)
    } else {
      const datos = { ...form }
      delete datos.motivo // el motivo solo aplica al editar
      await api.post(base, datos)
    }
    await cargar()
    emit('saved')
  } catch (exception) {
    const errores = exception.response?.data?.errors
    error.value =
      errores?.motivo?.[0] ||
      errores?.kilometraje?.[0] ||
      errores?.nivel_combustible?.[0] ||
      exception.response?.data?.message ||
      'No se pudo guardar la recepción.'
  } finally {
    guardando.value = false
  }
}

watch(() => props.vehiculo, cargar, { immediate: true })
</script>

<template>
  <div
    v-if="vehiculo"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4 py-6"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-2xl max-h-full overflow-y-auto rounded-xl border border-slate-800 bg-[#1e293b] shadow-2xl">
      <div class="px-5 py-4 bg-slate-900/70 border-b border-slate-800 flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-sky-400">Recepción del vehículo</p>
          <h3 class="text-lg font-bold text-white mt-1">
            {{ vehiculo.placa }} - {{ vehiculo.marca }} {{ vehiculo.modelo }}
          </h3>
          <p class="text-xs text-slate-500 mt-0.5">{{ vehiculo.propietario?.nombre || 'Sin propietario' }}</p>
        </div>
        <button class="text-slate-500 hover:text-slate-200 transition" type="button" @click="emit('close')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="p-5 space-y-5">
        <p v-if="cargando" class="text-center text-slate-500 text-sm py-6">
          <i class="fa-solid fa-spinner fa-spin mr-2"></i>Cargando recepción...
        </p>

        <!-- Última recepción -->
        <div v-else-if="ultima && modo !== 'editar'" class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs text-slate-500 uppercase font-bold tracking-wider">Estado en que llegó</span>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-400 font-mono">
                <i class="fa-regular fa-calendar mr-1"></i>{{ fecha(ultima.fecha_recepcion) }}
              </span>
              <button
                v-if="ultima.puede_editar"
                type="button"
                class="px-2.5 py-1 bg-slate-800 hover:bg-blue-500/10 text-blue-400 rounded text-xs"
                @click="editar(ultima)"
              >
                <i class="fa-solid fa-pen"></i> Editar
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <span class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Kilometraje</span>
              <strong class="text-sky-400 font-mono text-xl">{{ km(ultima.kilometraje) }}</strong>
            </div>
            <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <span class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold">Combustible</span>
              <strong class="text-amber-400 font-mono text-xl">{{ ultima.nivel_combustible }}</strong>
              <div class="mt-2 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div class="h-full bg-amber-400" :style="{ width: porcentaje(ultima.nivel_combustible) + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <span class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Daños visibles</span>
            <p class="text-sm text-slate-200 whitespace-pre-line">
              {{ ultima.danos_visibles || 'Sin daños visibles registrados.' }}
            </p>
          </div>
          <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <span class="block text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Observaciones</span>
            <p class="text-sm text-slate-200 whitespace-pre-line">{{ ultima.observaciones || 'Sin observaciones.' }}</p>
          </div>
          <p class="text-xs text-slate-500">
            <i class="fa-solid fa-user-pen mr-1"></i>Registrado por {{ ultima.usuario?.username || 'Sistema' }}
          </p>
          <p
            v-if="ultima.editado_at"
            class="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200 leading-relaxed"
          >
            <i class="fa-solid fa-triangle-exclamation mr-1"></i>Corregida el {{ fecha(ultima.editado_at) }} por
            {{ ultima.editor?.username || 'un administrador' }}. Motivo: {{ ultima.motivo_edicion }}
          </p>

          <!-- Recepciones anteriores -->
          <div v-if="anteriores.length" class="pt-3 border-t border-slate-800">
            <span class="block text-xs text-slate-500 uppercase font-bold tracking-wider mb-2"
              >Recepciones anteriores</span
            >
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-500 border-b border-slate-800">
                  <th class="py-2 pr-4">Fecha</th>
                  <th class="py-2 pr-4">Kilometraje</th>
                  <th class="py-2 pr-4">Combustible</th>
                  <th class="py-2 pr-4">Daños</th>
                  <th class="py-2"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60 text-slate-300">
                <tr v-for="r in anteriores" :key="r.id_recepcion">
                  <td class="py-2 pr-4 font-mono whitespace-nowrap">
                    {{ fecha(r.fecha_recepcion) }}
                    <span v-if="r.editado_at" class="text-amber-400" :title="`Motivo: ${r.motivo_edicion}`">
                      (corregida)</span
                    >
                  </td>
                  <td class="py-2 pr-4 font-mono whitespace-nowrap">{{ km(r.kilometraje) }}</td>
                  <td class="py-2 pr-4">{{ r.nivel_combustible }}</td>
                  <td class="py-2 pr-4">{{ r.danos_visibles || '—' }}</td>
                  <td class="py-2 text-right">
                    <button
                      v-if="r.puede_editar"
                      type="button"
                      class="text-blue-400 hover:text-blue-300"
                      @click="editar(r)"
                    >
                      <i class="fa-solid fa-pen"></i> Editar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p v-else-if="!modo" class="text-center text-slate-500 text-sm py-6">
          Este vehículo no tiene recepciones registradas.
        </p>

        <p v-if="error" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm">
          {{ error }}
        </p>

        <!-- Formulario: nueva recepción o corrección -->
        <form v-if="modo" class="space-y-4 pt-3 border-t border-slate-800" @submit.prevent="guardar">
          <p class="text-sm font-semibold text-white">
            <i
              :class="modo === 'editar' ? 'fa-solid fa-pen text-blue-400' : 'fa-solid fa-clipboard-check text-sky-400'"
              class="mr-1"
            ></i>
            <template v-if="modo === 'editar'">Corregir recepción</template>
            <template v-else-if="ultima">Registrar nueva recepción</template>
            <template v-else>Este vehículo no tiene recepción. Regístrala ahora:</template>
          </p>
          <p v-if="modo === 'editar'" class="text-[11px] text-slate-400">
            Solo el administrador puede corregir, y solo el mismo día en que se registró. El cambio y su motivo quedan
            en Auditoría.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >Kilometraje</label
              >
              <input
                v-model="form.kilometraje"
                required
                type="number"
                min="0"
                max="9999999"
                placeholder="Ej: 45200"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-sky-500 transition"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
                >Nivel de combustible</label
              >
              <select
                v-model="form.nivel_combustible"
                required
                class="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500 transition"
              >
                <option value="" disabled>Seleccionar</option>
                <option v-for="nivel in NIVELES" :key="nivel" :value="nivel">{{ nivel }}</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >Daños visibles</label
            >
            <textarea
              v-model="form.danos_visibles"
              rows="2"
              maxlength="1000"
              placeholder="Ej: Rayón en puerta trasera derecha"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition"
            ></textarea>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2"
              >Observaciones</label
            >
            <textarea
              v-model="form.observaciones"
              rows="2"
              maxlength="1000"
              placeholder="Ej: Cliente reporta ruido al frenar"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition"
            ></textarea>
          </div>
          <div v-if="modo === 'editar'">
            <label class="block text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2"
              >Motivo de la modificación</label
            >
            <textarea
              v-model="form.motivo"
              required
              minlength="5"
              rows="2"
              maxlength="500"
              placeholder="Ej: Error de digitación en el kilometraje"
              class="w-full bg-slate-900 border border-amber-500/40 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-amber-400 transition"
            ></textarea>
          </div>
          <p class="text-[11px] text-slate-500">
            <i class="fa-regular fa-clock mr-1"></i>
            {{
              modo === 'editar'
                ? 'La fecha de recepción no cambia al corregir.'
                : 'La fecha de recepción se guarda automáticamente.'
            }}
          </p>
          <div class="flex justify-end gap-3">
            <button
              v-if="ultima"
              type="button"
              class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition"
              @click="cerrarFormulario"
            >
              Cancelar
            </button>
            <button
              :disabled="guardando"
              class="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-slate-900 rounded-lg text-sm font-semibold transition"
            >
              <i class="fa-solid fa-floppy-disk mr-1"></i>
              {{ guardando ? 'Guardando...' : modo === 'editar' ? 'Guardar corrección' : 'Guardar recepción' }}
            </button>
          </div>
        </form>
      </div>

      <div v-if="ultima && !modo" class="px-5 py-4 bg-slate-900/70 border-t border-slate-800 flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition"
          @click="nuevaRecepcion"
        >
          <i class="fa-solid fa-plus mr-1"></i>Nueva recepción
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-slate-900 rounded-lg text-sm font-semibold transition"
          @click="emit('close')"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>