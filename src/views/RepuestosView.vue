<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '../api'
import { facturaPdfUrl as pdfUrl, validarFacturaPdf } from '../utils/facturas'
import {
  calcularEstadoGarantia,
  filtrarRepuestosPorGarantia,
  obtenerMensajeVacio,
  obtenerVehiculoAsociado,
} from '../utils/garantiaRepuesto'

const repuestos = ref([])
const vehiculos = ref([])
const mantenimientos = ref([])
const showModal = ref(false)
const error = ref('')
const success = ref('')
const conGarantia = ref(false)
const uploading = ref(false)
const fileInput = ref(null)
const filtroGarantia = ref('todas')
const busquedaTexto = ref('')
const loading = ref(false)

const emptyForm = () => ({
  id_vehiculo: '',
  id_mantenimiento: '',
  numero_factura: '',
  nombre_pieza: '',
  codigo_pieza: '',
  comprobante_pdf: null,
  cantidad_recibida: 1,
  costo_unitario: 0,
  garantia_inicio: '',
  garantia_fin: '',
})
const form = reactive(emptyForm())

const mantenimientosDelVehiculo = computed(() =>
  mantenimientos.value.filter((m) => String(m.id_vehiculo) === String(form.id_vehiculo))
)

const conteos = computed(() => {
  let vigentes = 0
  let vencidas = 0
  let sinGarantia = 0
  repuestos.value.forEach((r) => {
    const estado = calcularEstadoGarantia(r.garantia_fin)
    if (estado === 'Vigente') vigentes++
    else if (estado === 'Vencida') vencidas++
    else sinGarantia++
  })
  return {
    todas: repuestos.value.length,
    vigentes,
    vencidas,
    sinGarantia,
  }
})

const repuestosFiltrados = computed(() => {
  let list = filtrarRepuestosPorGarantia(repuestos.value, filtroGarantia.value)
  if (busquedaTexto.value.trim()) {
    const q = busquedaTexto.value.toLowerCase().trim()
    list = list.filter((r) => {
      const v = obtenerVehiculoAsociado(r)
      return (
        r.nombre_pieza?.toLowerCase().includes(q) ||
        r.codigo_pieza?.toLowerCase().includes(q) ||
        v.placa.toLowerCase().includes(q) ||
        v.descripcion.toLowerCase().includes(q)
      )
    })
  }
  return list
})

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/repuestos')
    repuestos.value = data.repuestos || []
    vehiculos.value = data.vehiculos || []
    mantenimientos.value = data.mantenimientos || []
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al cargar el inventario de repuestos.'
  } finally {
    loading.value = false
  }
}

function cambiarFiltro(nuevoFiltro) {
  filtroGarantia.value = nuevoFiltro
}

function openModal() {
  error.value = ''
  success.value = ''
  showModal.value = true
}

function onVehiculoChange() {
  form.id_mantenimiento = ''
}

function onFileChange(event) {
  const file = event.target.files?.[0] || null
  const message = validarFacturaPdf(file)
  if (file && message) {
    error.value = message
    form.comprobante_pdf = null
    event.target.value = ''
    return
  }
  error.value = ''
  form.comprobante_pdf = file
}

async function upload() {
  if (uploading.value) return
  error.value = validarFacturaPdf(form.comprobante_pdf)
  success.value = ''
  if (error.value) return
  uploading.value = true

  try {
    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (!key.startsWith('garantia_') || conGarantia.value) payload.append(key, value)
    })
    const { data } = await api.post('/repuestos/cargar-pdf', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    Object.assign(form, emptyForm())
    if (fileInput.value) fileInput.value.value = ''
    conGarantia.value = false
    success.value = data.message || 'Factura cargada correctamente.'
    showModal.value = false
    await load()
  } catch (exception) {
    const errors = exception.response?.data?.errors
    error.value =
      (errors && Object.values(errors).flat()[0]) ||
      exception.response?.data?.message ||
      'No se pudo procesar la factura.'
  } finally {
    uploading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Inventario de Repuestos y Reposición</h1>
        <p class="text-sm text-slate-400">Control de stock, garantías vigentes/vencidas y facturas de compra.</p>
      </div>
      <button
        class="bg-sky-500 hover:bg-sky-600 transition-all text-slate-900 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-sky-500/20 active:scale-95"
        @click="openModal"
      >
        <i class="fa-solid fa-file-arrow-up text-xs"></i>
        <span>Cargar Factura de Compra</span>
      </button>
    </div>

    <!-- Alertas -->
    <p v-if="success" role="status" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-2">
      <i class="fa-solid fa-circle-check text-emerald-400"></i>
      <span>{{ success }}</span>
    </p>
    <p v-if="error" role="alert" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm flex items-center gap-2">
      <i class="fa-solid fa-circle-exclamation text-rose-400"></i>
      <span>{{ error }}</span>
    </p>

    <!-- Barra de Filtros de Garantía y Búsqueda -->
    <div class="bg-[#1e293b] p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtro de garantías">
        <span class="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
          <i class="fa-solid fa-filter text-slate-500"></i>
          <span>Filtrar por garantía:</span>
        </span>
        <button
          type="button"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
            filtroGarantia === 'todas'
              ? 'bg-slate-700 text-white shadow-sm ring-1 ring-slate-600'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          ]"
          @click="cambiarFiltro('todas')"
        >
          <span>Todos los repuestos</span>
          <span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">{{ conteos.todas }}</span>
        </button>

        <button
          type="button"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
            filtroGarantia === 'vigente'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400'
              : 'bg-slate-900/60 text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
          ]"
          @click="cambiarFiltro('vigente')"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Garantía vigente</span>
          <span
            :class="[
              'px-1.5 py-0.5 rounded-full text-[10px] font-mono',
              filtroGarantia === 'vigente' ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-800 text-slate-300'
            ]"
          >
            {{ conteos.vigentes }}
          </span>
        </button>

        <button
          type="button"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2',
            filtroGarantia === 'vencida'
              ? 'bg-rose-500 text-white font-bold shadow-md shadow-rose-500/20 ring-1 ring-rose-400'
              : 'bg-slate-900/60 text-slate-400 hover:text-rose-400 hover:bg-slate-800'
          ]"
          @click="cambiarFiltro('vencida')"
        >
          <span class="w-2 h-2 rounded-full bg-rose-400"></span>
          <span>Garantía vencida</span>
          <span
            :class="[
              'px-1.5 py-0.5 rounded-full text-[10px] font-mono',
              filtroGarantia === 'vencida' ? 'bg-rose-950 text-rose-200' : 'bg-slate-800 text-slate-300'
            ]"
          >
            {{ conteos.vencidas }}
          </span>
        </button>
      </div>

      <!-- Buscador en tiempo real -->
      <div class="relative w-full md:w-64">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
        <input
          v-model="busquedaTexto"
          type="text"
          placeholder="Buscar repuesto, placa..."
          class="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
        >
      </div>
    </div>

    <!-- Indicador de filtro activo -->
    <div v-if="filtroGarantia !== 'todas'" class="flex items-center justify-between text-xs px-1 text-slate-400">
      <p>
        Mostrando solo repuestos con
        <span class="font-semibold" :class="filtroGarantia === 'vigente' ? 'text-emerald-400' : 'text-rose-400'">
          {{ filtroGarantia === 'vigente' ? 'Garantía Vigente' : 'Garantía Vencida' }}
        </span>
        ({{ repuestosFiltrados.length }} {{ repuestosFiltrados.length === 1 ? 'registro' : 'registros' }})
      </p>
      <button
        type="button"
        class="text-sky-400 hover:text-sky-300 underline flex items-center gap-1"
        @click="cambiarFiltro('todas')"
      >
        <i class="fa-solid fa-xmark text-[10px]"></i>
        <span>Quitar filtro</span>
      </button>
    </div>

    <!-- Tabla de Repuestos -->
    <div class="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-sm">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <th class="p-4">Nombre del Repuesto</th>
              <th class="p-4">Vehículo Asociado</th>
              <th class="p-4">Fecha de Vencimiento</th>
              <th class="p-4">Estado</th>
              <th class="p-4">Precio Costo</th>
              <th class="p-4">Factura (PDF)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <!-- Mensaje informativo cuando no hay resultados -->
            <tr v-if="repuestosFiltrados.length === 0">
              <td colspan="6" class="p-12 text-center">
                <div class="max-w-md mx-auto space-y-3">
                  <div class="w-12 h-12 rounded-full bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto text-xl">
                    <i v-if="filtroGarantia === 'vigente'" class="fa-solid fa-shield-halved text-emerald-400/80"></i>
                    <i v-else-if="filtroGarantia === 'vencida'" class="fa-solid fa-calendar-xmark text-rose-400/80"></i>
                    <i v-else class="fa-solid fa-box-open text-slate-400"></i>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-slate-200">
                      {{ obtenerMensajeVacio(filtroGarantia) }}
                    </h3>
                    <p class="text-xs text-slate-400 mt-1">
                      <span v-if="filtroGarantia === 'vigente'">
                        No se registran piezas cuya garantía continúe vigente a la fecha actual.
                      </span>
                      <span v-else-if="filtroGarantia === 'vencida'">
                        No existen repuestos cuya fecha de vencimiento haya superado la fecha de hoy.
                      </span>
                      <span v-else>
                        No hay repuestos registrados en el inventario actualmente.
                      </span>
                    </p>
                  </div>
                  <div v-if="filtroGarantia !== 'todas'" class="pt-2">
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      @click="cambiarFiltro('todas')"
                    >
                      <i class="fa-solid fa-arrow-rotate-left mr-1.5 text-[10px]"></i>
                      <span>Ver todos los repuestos</span>
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Filas de repuestos -->
            <tr
              v-for="repuesto in repuestosFiltrados"
              :key="repuesto.id_repuesto"
              class="hover:bg-slate-800/30 transition-colors"
            >
              <!-- 1. Nombre del repuesto -->
              <td class="p-4">
                <div class="font-medium text-white">{{ repuesto.nombre_pieza }}</div>
                <div class="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span class="text-slate-500">SKU:</span>
                  <span>{{ repuesto.codigo_pieza || 'S/N' }}</span>
                </div>
              </td>

              <!-- 2. Vehículo asociado -->
              <td class="p-4">
                <template v-if="repuesto.vehiculo || repuesto.factura?.vehiculo || repuesto.mantenimiento?.vehiculo">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded font-mono text-xs font-bold bg-slate-900 border border-slate-700 text-sky-400">
                      {{ obtenerVehiculoAsociado(repuesto).placa }}
                    </span>
                    <span class="text-xs text-slate-300">
                      {{ obtenerVehiculoAsociado(repuesto).descripcion }}
                    </span>
                  </div>
                  <p v-if="repuesto.vehiculo?.propietario?.nombre || repuesto.factura?.vehiculo?.propietario?.nombre" class="text-[11px] text-slate-400 mt-0.5">
                    Propietario: {{ repuesto.vehiculo?.propietario?.nombre || repuesto.factura?.vehiculo?.propietario?.nombre }}
                  </p>
                </template>
                <span v-else class="text-xs text-slate-500 italic">No asociado</span>
              </td>

              <!-- 3. Fecha de vencimiento -->
              <td class="p-4 whitespace-nowrap">
                <div v-if="repuesto.garantia_fin" class="flex items-center gap-1.5 font-mono text-xs text-slate-200">
                  <i class="fa-regular fa-calendar text-[11px] text-slate-400"></i>
                  <span>{{ repuesto.garantia_fin }}</span>
                </div>
                <span v-else class="text-xs text-slate-500">Sin garantía</span>
              </td>

              <!-- 4. Estado (actualizado dinámicamente según la fecha actual) -->
              <td class="p-4 whitespace-nowrap">
                <span
                  v-if="calcularEstadoGarantia(repuesto.garantia_fin) === 'Vigente'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Vigente</span>
                </span>
                <span
                  v-else-if="calcularEstadoGarantia(repuesto.garantia_fin) === 'Vencida'"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                  <span>Vencida</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400"
                >
                  Sin garantía
                </span>
              </td>

              <!-- Costo unitario -->
              <td class="p-4 font-mono text-slate-300 whitespace-nowrap">
                ${{ Number(repuesto.costo_unitario || 0).toFixed(2) }}
              </td>

              <!-- Factura asociada (PDF) -->
              <td class="p-4 whitespace-nowrap">
                <a
                  v-if="repuesto.factura"
                  :href="pdfUrl(repuesto.factura.ruta_pdf_almacenamiento)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 text-xs"
                >
                  <i class="fa-solid fa-file-pdf text-xs text-rose-400"></i>
                  <span>{{ repuesto.factura.numero_factura }}.pdf</span>
                </a>
                <span v-else class="text-slate-500 text-xs">Sin documento</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Carga de Factura PDF -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300 p-4"
    >
      <form
        class="bg-[#1e293b] border border-slate-800 w-full max-w-md rounded-xl overflow-y-auto max-h-[90vh] shadow-2xl"
        @submit.prevent="upload"
      >
        <div class="px-6 py-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
          <h3 class="font-bold text-white text-base">Cargar Repuesto vía Factura PDF</h3>
          <button type="button" class="text-slate-400 hover:text-white text-sm" @click="showModal = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-400 mb-1">Vehículo a Vincular *</label>
            <select
              v-model="form.id_vehiculo"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
              required
              @change="onVehiculoChange"
            >
              <option value="">Seleccione el vehículo...</option>
              <option v-for="v in vehiculos" :key="v.id_vehiculo" :value="v.id_vehiculo">
                {{ v.placa }} - {{ v.marca }} {{ v.modelo }}
              </option>
            </select>
          </div>

          <div>
            <label for="repuesto-mantenimiento" class="block text-xs font-semibold text-slate-400 mb-1">Mantenimiento realizado *</label>
            <select
              id="repuesto-mantenimiento"
              v-model="form.id_mantenimiento"
              :disabled="!form.id_vehiculo || mantenimientosDelVehiculo.length === 0"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer disabled:opacity-50"
              required
            >
              <option value="">
                {{
                  !form.id_vehiculo
                    ? 'Primero seleccione el vehículo...'
                    : mantenimientosDelVehiculo.length
                      ? 'Seleccione el mantenimiento...'
                      : 'Este vehículo no tiene mantenimientos disponibles'
                }}
              </option>
              <option v-for="m in mantenimientosDelVehiculo" :key="m.id_mantenimiento" :value="m.id_mantenimiento">
                #{{ m.id_mantenimiento }} · {{ m.fecha_servicio }} · {{ m.descripcion_falla }} ({{ m.estado }})
              </option>
            </select>
            <p class="text-[10px] text-slate-500 mt-1">La factura aparecerá en el historial del vehículo, dentro de este mantenimiento.</p>
          </div>

          <div>
            <label for="repuesto-numero-factura" class="block text-xs font-semibold text-slate-400 mb-1">Número de factura *</label>
            <input
              id="repuesto-numero-factura"
              v-model.trim="form.numero_factura"
              type="text"
              maxlength="50"
              required
              placeholder="Ej. FAC-2026-0042"
              class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
            >
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="repuesto-nombre-pieza" class="block text-xs font-semibold text-slate-400 mb-1">Nombre de la pieza *</label>
              <input
                id="repuesto-nombre-pieza"
                v-model.trim="form.nombre_pieza"
                type="text"
                maxlength="100"
                required
                placeholder="Ej. Filtro de aceite Bosch"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
            </div>
            <div>
              <label for="repuesto-codigo-pieza" class="block text-xs font-semibold text-slate-400 mb-1">Código de pieza (opcional)</label>
              <input
                id="repuesto-codigo-pieza"
                v-model.trim="form.codigo_pieza"
                type="text"
                maxlength="50"
                placeholder="Ej. SKU del proveedor"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
            </div>
            <p class="col-span-2 text-[10px] text-slate-500">Cada factura registra una sola pieza. Para otra pieza del mismo mantenimiento, registra otra factura.</p>
          </div>

          <div class="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl p-6 text-center cursor-pointer transition-all bg-slate-900/30 relative">
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,application/pdf"
              required
              aria-label="Factura en PDF"
              class="absolute inset-0 opacity-0 cursor-pointer"
              @change="onFileChange"
            >
            <i class="fa-solid fa-file-pdf text-3xl text-slate-500 mb-2 transition-colors"></i>
            <p class="text-xs font-medium text-slate-300">
              {{ form.comprobante_pdf?.name ? 'Archivo listo: ' + form.comprobante_pdf.name : 'Selecciona o arrastra el archivo legal (.pdf)' }}
            </p>
            <p class="text-[10px] text-slate-500 mt-1">Solo archivos .pdf · Tamaño máximo: 5 MB</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Cantidad Recibida *</label>
              <input
                v-model="form.cantidad_recibida"
                type="number"
                min="1"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-400 mb-1">Costo Unitario ($) *</label>
              <input
                v-model="form.costo_unitario"
                type="number"
                step="0.01"
                class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
            </div>
          </div>
        </div>

        <fieldset class="px-6 pb-6 space-y-3 text-sm text-slate-300">
          <label class="flex items-center gap-2">
            <input v-model="conGarantia" type="checkbox">
            <span>Registrar garantía del repuesto</span>
          </label>
          <p v-if="!conGarantia" class="text-xs text-slate-400">Se registrará sin garantía.</p>
          <template v-else>
            <label class="block">
              <span class="text-xs text-slate-400">Inicio de garantía</span>
              <input v-model="form.garantia_inicio" type="date" required class="mt-1 block w-full rounded-lg bg-slate-900 p-2 text-xs text-slate-200 border border-slate-800">
            </label>
            <label class="block">
              <span class="text-xs text-slate-400">Fecha de vencimiento</span>
              <input v-model="form.garantia_fin" type="date" :min="form.garantia_inicio" required class="mt-1 block w-full rounded-lg bg-slate-900 p-2 text-xs text-slate-200 border border-slate-800">
            </label>
            <p class="text-xs text-slate-400">Confirma las fechas del proveedor. El vencimiento indica el primer día sin cobertura.</p>
          </template>
          <p v-if="error" role="alert" class="text-rose-400 text-xs">{{ error }}</p>
        </fieldset>

        <div class="px-6 py-4 bg-slate-900 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            :disabled="uploading"
            class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 text-xs font-bold rounded-lg"
            @click="showModal = false"
          >
            Cancelar
          </button>
          <button
            :disabled="uploading"
            class="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-slate-900 text-xs font-bold rounded-lg disabled:opacity-50"
          >
            {{ uploading ? 'Guardando...' : 'Vincular al Stock' }}
          </button>
        </div>
      </form>
    </div>
  </section>
</template>
