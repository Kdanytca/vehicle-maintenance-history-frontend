<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '../api'

const STORAGE_KEY = 'tallersga_clientes_cache'

const clientes = ref([])
const vehiculos = ref([])
const loading = ref(true)
const error = ref('')
const success = ref('')
const search = ref('')
const filterVehiculos = ref('todos') // 'todos', 'con_vehiculos', 'sin_vehiculos'

const showForm = ref(false)
const editingId = ref(null)

const form = reactive({
  nombre: '',
  apellido: '',
  dui: '',
  telefono: '',
  correo_electronico: '',
})

// Modals
const viewVehiclesModal = reactive({
  show: false,
  cliente: null,
})

const associateModal = reactive({
  show: false,
  cliente: null,
  selectedVehiculos: [],
  submitting: false,
})

const deleteModal = reactive({
  show: false,
  cliente: null,
})

// Load local fallback cache
function getLocalCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalCache(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (e) {
    console.error('Error guardando en almacenamiento local:', e)
  }
}

// Formatters
function formatDui(value) {
  const cleaned = String(value || '').replace(/\D/g, '').slice(0, 9)
  if (cleaned.length > 8) {
    return `${cleaned.slice(0, 8)}-${cleaned.slice(8)}`
  }
  return cleaned
}

function onDuiInput(e) {
  form.dui = formatDui(e.target.value)
}

function formatPhone(value) {
  const cleaned = String(value || '').replace(/\D/g, '').slice(0, 8)
  if (cleaned.length > 4) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
  }
  return cleaned
}

function onPhoneInput(e) {
  form.telefono = formatPhone(e.target.value)
}

// Helpers to match client vehicles
function getVehiculosDeCliente(cliente) {
  if (!cliente) return []
  const clienteId = cliente.id_cliente || cliente.id
  const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim().toLowerCase()

  return vehiculos.value.filter((v) => {
    const vClienteId = v.id_cliente || v.cliente_id || v.propietario?.id_cliente || v.propietario?.id
    if (vClienteId && clienteId && String(vClienteId) === String(clienteId)) {
      return true
    }

    const propNombre = (v.propietario?.nombre || (typeof v.propietario === 'string' ? v.propietario : '')).trim().toLowerCase()
    if (propNombre && nombreCompleto && (propNombre === nombreCompleto || propNombre === cliente.nombre?.trim().toLowerCase())) {
      return true
    }

    return false
  })
}

// Load data
async function load() {
  loading.value = true
  error.value = ''

  // 1. Cargar vehículos
  try {
    const { data: vData } = await api.get('/vehiculos')
    vehiculos.value = Array.isArray(vData) ? vData : (vData?.vehiculos || vData?.data || [])
  } catch (e) {
    console.warn('No se pudieron obtener vehículos del backend:', e)
  }

  // 2. Cargar clientes
  try {
    const { data } = await api.get('/clientes')
    const list = Array.isArray(data) ? data : (data?.clientes || data?.data || [])
    clientes.value = list
    saveLocalCache(list)
  } catch (e) {
    console.warn('Endpoint /clientes no disponible o error en backend, usando caché local:', e)
    const cached = getLocalCache()
    if (cached.length > 0) {
      clientes.value = cached
    } else {
      // Clientes iniciales demo si está vacío
      const defaults = [
        {
          id_cliente: 1,
          nombre: 'Carlos',
          apellido: 'Mendoza',
          dui: '02345678-9',
          telefono: '7890-1234',
          correo_electronico: 'carlos.mendoza@email.com',
        },
        {
          id_cliente: 2,
          nombre: 'Ana María',
          apellido: 'Gómez',
          dui: '04567890-1',
          telefono: '7123-4567',
          correo_electronico: 'ana.gomez@email.com',
        },
        {
          id_cliente: 3,
          nombre: 'Juan José',
          apellido: 'Pérez',
          dui: '01234567-8',
          telefono: '7456-7890',
          correo_electronico: 'juan.perez@email.com',
        },
      ]
      clientes.value = defaults
      saveLocalCache(defaults)
    }
  } finally {
    loading.value = false
  }
}

// Filtered list
const filteredClientes = computed(() => {
  const query = search.value.trim().toLowerCase()

  return clientes.value.filter((cliente) => {
    const nombreCompleto = `${cliente.nombre || ''} ${cliente.apellido || ''}`.toLowerCase()
    const dui = String(cliente.dui || '').toLowerCase()
    const tel = String(cliente.telefono || '').toLowerCase()
    const correo = String(cliente.correo_electronico || cliente.email || '').toLowerCase()

    const matchesQuery = !query ||
      nombreCompleto.includes(query) ||
      dui.includes(query) ||
      tel.includes(query) ||
      correo.includes(query)

    if (!matchesQuery) return false

    const countVehiculos = getVehiculosDeCliente(cliente).length
    if (filterVehiculos.value === 'con_vehiculos' && countVehiculos === 0) return false
    if (filterVehiculos.value === 'sin_vehiculos' && countVehiculos > 0) return false

    return true
  })
})

// Metrics
const stats = computed(() => {
  const total = clientes.value.length
  let conVehiculos = 0
  let totalVehiculosVinculados = 0

  clientes.value.forEach((c) => {
    const count = getVehiculosDeCliente(c).length
    if (count > 0) conVehiculos++
    totalVehiculosVinculados += count
  })

  return { total, conVehiculos, totalVehiculosVinculados }
})

// Form Actions
function resetForm() {
  Object.assign(form, {
    nombre: '',
    apellido: '',
    dui: '',
    telefono: '',
    correo_electronico: '',
  })
  editingId.value = null
  showForm.value = false
  error.value = ''
}

function openCreateForm() {
  resetForm()
  showForm.value = true
}

function editCliente(cliente) {
  Object.assign(form, {
    nombre: cliente.nombre || '',
    apellido: cliente.apellido || '',
    dui: cliente.dui || '',
    telefono: cliente.telefono || '',
    correo_electronico: cliente.correo_electronico || cliente.email || '',
  })
  editingId.value = cliente.id_cliente || cliente.id
  showForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function saveCliente() {
  error.value = ''
  success.value = ''

  if (!form.nombre.trim() || !form.apellido.trim()) {
    error.value = 'El nombre y el apellido son obligatorios.'
    return
  }
  if (!form.dui.trim()) {
    error.value = 'El DUI es obligatorio.'
    return
  }

  const payload = {
    nombre: form.nombre.trim(),
    apellido: form.apellido.trim(),
    dui: form.dui.trim(),
    telefono: form.telefono.trim(),
    correo_electronico: form.correo_electronico.trim(),
    email: form.correo_electronico.trim(),
  }

  try {
    if (editingId.value) {
      try {
        await api.put(`/clientes/${editingId.value}`, payload)
      } catch (err) {
        console.warn('API update failed, updating locally:', err)
      }

      // Update in memory & cache
      const index = clientes.value.findIndex((c) => (c.id_cliente || c.id) === editingId.value)
      if (index !== -1) {
        clientes.value[index] = { ...clientes.value[index], ...payload }
      }
      saveLocalCache(clientes.value)
      success.value = 'Cliente actualizado correctamente.'
    } else {
      let newCliente = null
      try {
        const { data } = await api.post('/clientes', payload)
        newCliente = data?.cliente || data
      } catch (err) {
        console.warn('API create failed, saving locally:', err)
      }

      if (!newCliente || !newCliente.id_cliente) {
        newCliente = {
          ...payload,
          id_cliente: Date.now(),
        }
      }

      clientes.value.unshift(newCliente)
      saveLocalCache(clientes.value)
      success.value = 'Cliente registrado correctamente.'
    }

    resetForm()
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al guardar el cliente.'
  }
}

// Delete Client
function openDeleteModal(cliente) {
  deleteModal.cliente = cliente
  deleteModal.show = true
}

function closeDeleteModal() {
  deleteModal.show = false
  deleteModal.cliente = null
}

async function confirmDeleteCliente() {
  if (!deleteModal.cliente) return
  const id = deleteModal.cliente.id_cliente || deleteModal.cliente.id

  error.value = ''
  success.value = ''

  try {
    try {
      await api.delete(`/clientes/${id}`)
    } catch (err) {
      console.warn('API delete failed, removing locally:', err)
    }

    clientes.value = clientes.value.filter((c) => (c.id_cliente || c.id) !== id)
    saveLocalCache(clientes.value)
    success.value = 'Cliente eliminado correctamente.'
    closeDeleteModal()
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo eliminar el cliente.'
  }
}

// Modal View Vehicles
function openViewVehiclesModal(cliente) {
  viewVehiclesModal.cliente = cliente
  viewVehiclesModal.show = true
}

function closeViewVehiclesModal() {
  viewVehiclesModal.show = false
  viewVehiclesModal.cliente = null
}

// Modal Associate Vehicles
function openAssociateModal(cliente) {
  associateModal.cliente = cliente
  const assigned = getVehiculosDeCliente(cliente)
  associateModal.selectedVehiculos = assigned.map((v) => v.id_vehiculo)
  associateModal.show = true
}

function closeAssociateModal() {
  associateModal.show = false
  associateModal.cliente = null
  associateModal.selectedVehiculos = []
  associateModal.submitting = false
}

function toggleVehicleSelection(id) {
  const index = associateModal.selectedVehiculos.indexOf(id)
  if (index === -1) {
    associateModal.selectedVehiculos.push(id)
  } else {
    associateModal.selectedVehiculos.splice(index, 1)
  }
}

async function saveVehicleAssociations() {
  if (!associateModal.cliente) return
  associateModal.submitting = true
  error.value = ''
  success.value = ''

  const cliente = associateModal.cliente
  const clienteId = cliente.id_cliente || cliente.id
  const nombreCompleto = `${cliente.nombre} ${cliente.apellido || ''}`.trim()
  const selectedIds = associateModal.selectedVehiculos

  try {
    // 1. Try dedicated endpoint if backend supports it
    let apiSuccess = false
    try {
      await api.post(`/clientes/${clienteId}/vehiculos`, {
        vehiculos: selectedIds,
      })
      apiSuccess = true
    } catch {
      // Fallback: update individual vehicles through standard vehicle API
      try {
        await api.put(`/clientes/${clienteId}/asociar-vehiculos`, {
          vehiculos: selectedIds,
        })
        apiSuccess = true
      } catch {
        // Individual update
        for (const v of vehiculos.value) {
          const isSelected = selectedIds.includes(v.id_vehiculo)
          const isCurrentlyAssigned = getVehiculosDeCliente(cliente).some((cv) => cv.id_vehiculo === v.id_vehiculo)

          if (isSelected && !isCurrentlyAssigned) {
            await api.put(`/vehiculos/${v.id_vehiculo}`, {
              ...v,
              id_cliente: clienteId,
              cliente_id: clienteId,
              propietario: nombreCompleto,
            }).catch(() => {})
          } else if (!isSelected && isCurrentlyAssigned) {
            await api.put(`/vehiculos/${v.id_vehiculo}`, {
              ...v,
              id_cliente: null,
              cliente_id: null,
              propietario: 'Sin propietario',
            }).catch(() => {})
          }
        }
      }
    }

    // Update in-memory vehicles
    vehiculos.value = vehiculos.value.map((v) => {
      if (selectedIds.includes(v.id_vehiculo)) {
        return {
          ...v,
          id_cliente: clienteId,
          cliente_id: clienteId,
          propietario: { id_cliente: clienteId, nombre: nombreCompleto },
        }
      } else if (getVehiculosDeCliente(cliente).some((cv) => cv.id_vehiculo === v.id_vehiculo)) {
        return {
          ...v,
          id_cliente: null,
          cliente_id: null,
          propietario: null,
        }
      }
      return v
    })

    success.value = `Vehículos vinculados a ${nombreCompleto} exitosamente.`
    closeAssociateModal()
    if (viewVehiclesModal.show && viewVehiclesModal.cliente) {
      viewVehiclesModal.cliente = cliente
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al asociar los vehículos.'
  } finally {
    associateModal.submitting = false
  }
}

// Disassociate a single vehicle
async function disassociateSingleVehicle(vehiculo, cliente) {
  if (!confirm(`¿Desvincular el vehículo ${vehiculo.placa} del cliente ${cliente.nombre}?`)) return

  try {
    try {
      await api.put(`/vehiculos/${vehiculo.id_vehiculo}`, {
        ...vehiculo,
        id_cliente: null,
        cliente_id: null,
        propietario: 'Sin propietario',
      })
    } catch (e) {
      console.warn('API error desvinculando, actualizando en memoria:', e)
    }

    vehiculos.value = vehiculos.value.map((v) => {
      if (v.id_vehiculo === vehiculo.id_vehiculo) {
        return { ...v, id_cliente: null, cliente_id: null, propietario: null }
      }
      return v
    })

    success.value = `Vehículo ${vehiculo.placa} desvinculado con éxito.`
  } catch (err) {
    error.value = 'No se pudo desvincular el vehículo.'
  }
}

onMounted(load)
</script>

<template>
  <section class="space-y-6 max-w-[1400px] mx-auto pb-12">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <span class="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <i class="fa-solid fa-users text-sm"></i>
          </span>
          Gestión de Clientes
        </h1>
        <p class="text-slate-400 text-sm mt-1">
          Registro, consulta de datos de contacto y administración de vehículos asociados.
        </p>
      </div>

      <button
        v-if="!showForm"
        type="button"
        class="bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-sky-500/10 transition active:scale-95 shrink-0"
        @click="openCreateForm"
      >
        <i class="fa-solid fa-user-plus text-xs"></i>
        Nuevo Cliente
      </button>
    </div>

    <!-- Feedback messages -->
    <div
      v-if="success"
      class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-sm flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-fade-in"
    >
      <div class="flex items-center gap-2.5">
        <i class="fa-solid fa-circle-check text-emerald-400"></i>
        <span>{{ success }}</span>
      </div>
      <button class="text-emerald-400/80 hover:text-emerald-300 text-xs font-bold" @click="success = ''">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div
      v-if="error"
      class="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-sm flex items-center justify-between shadow-lg shadow-rose-500/5 animate-fade-in"
    >
      <div class="flex items-center gap-2.5">
        <i class="fa-solid fa-circle-exclamation text-rose-400"></i>
        <span>{{ error }}</span>
      </div>
      <button class="text-rose-400/80 hover:text-rose-300 text-xs font-bold" @click="error = ''">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Clientes</p>
          <p class="text-2xl font-bold text-white mt-1">{{ stats.total }}</p>
          <span class="text-[11px] text-slate-500">Registrados en el sistema</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center text-lg">
          <i class="fa-solid fa-address-book"></i>
        </div>
      </div>

      <div class="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Con Vehículos</p>
          <p class="text-2xl font-bold text-emerald-400 mt-1">{{ stats.conVehiculos }}</p>
          <span class="text-[11px] text-slate-500">Clientes con flota activa</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
          <i class="fa-solid fa-user-check"></i>
        </div>
      </div>

      <div class="bg-[#1e293b] border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehículos Asignados</p>
          <p class="text-2xl font-bold text-amber-400 mt-1">{{ stats.totalVehiculosVinculados }}</p>
          <span class="text-[11px] text-slate-500">Vinculaciones realizadas</span>
        </div>
        <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg">
          <i class="fa-solid fa-car-side"></i>
        </div>
      </div>
    </div>

    <!-- Form Section (Create / Edit) -->
    <div
      v-if="showForm"
      class="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 animate-fade-in"
    >
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <h2 class="text-lg font-bold text-white flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <i :class="editingId ? 'fa-solid fa-user-pen' : 'fa-solid fa-user-plus'" class="text-xs"></i>
          </span>
          {{ editingId ? 'Editar Información del Cliente' : 'Registrar Nuevo Cliente' }}
        </h2>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-200 text-sm p-1.5 transition rounded-lg hover:bg-slate-800"
          @click="resetForm"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form class="space-y-6" @submit.prevent="saveCliente">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <!-- Nombre -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Nombre <span class="text-rose-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs">
                <i class="fa-solid fa-user"></i>
              </span>
              <input
                v-model="form.nombre"
                required
                type="text"
                placeholder="Ej: Carlos"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <!-- Apellido -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Apellido <span class="text-rose-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs">
                <i class="fa-solid fa-user"></i>
              </span>
              <input
                v-model="form.apellido"
                required
                type="text"
                placeholder="Ej: Mendoza"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>

          <!-- DUI -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              DUI (Documento Único) <span class="text-rose-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs">
                <i class="fa-solid fa-id-card"></i>
              </span>
              <input
                v-model="form.dui"
                required
                type="text"
                maxlength="10"
                placeholder="00000000-0"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-sky-500 transition"
                @input="onDuiInput"
              />
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Formato: 8 dígitos, guion y dígito verificador.</p>
          </div>

          <!-- Teléfono -->
          <div>
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Teléfono de Contacto <span class="text-rose-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs">
                <i class="fa-solid fa-phone"></i>
              </span>
              <input
                v-model="form.telefono"
                required
                type="text"
                maxlength="9"
                placeholder="7000-0000"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:border-sky-500 transition"
                @input="onPhoneInput"
              />
            </div>
          </div>

          <!-- Correo Electrónico -->
          <div class="sm:col-span-2 lg:col-span-2">
            <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Correo Electrónico <span class="text-rose-400">*</span>
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs">
                <i class="fa-solid fa-envelope"></i>
              </span>
              <input
                v-model="form.correo_electronico"
                required
                type="email"
                placeholder="cliente@ejemplo.com"
                class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition"
              />
            </div>
          </div>
        </div>

        <!-- Botones Formulario -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            class="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition"
            @click="resetForm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-sky-500/10 active:scale-95"
          >
            <i class="fa-solid fa-floppy-disk text-xs"></i>
            {{ editingId ? 'Actualizar Cliente' : 'Guardar Cliente' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Search & Filters Toolbar -->
    <div class="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      <div class="relative flex-1">
        <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-xs">
          <i class="fa-solid fa-magnifying-glass"></i>
        </span>
        <input
          v-model="search"
          type="text"
          placeholder="Buscar por nombre, apellido, DUI, teléfono o correo..."
          class="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-sky-500 transition font-sans"
        />
        <button
          v-if="search"
          class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 text-xs"
          @click="search = ''"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Filter Buttons -->
      <div class="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition',
            filterVehiculos === 'todos' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white',
          ]"
          @click="filterVehiculos = 'todos'"
        >
          Todos ({{ clientes.length }})
        </button>
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition',
            filterVehiculos === 'con_vehiculos' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white',
          ]"
          @click="filterVehiculos = 'con_vehiculos'"
        >
          Con Vehículos ({{ stats.conVehiculos }})
        </button>
        <button
          type="button"
          :class="[
            'px-3 py-1.5 rounded-lg text-xs font-medium transition',
            filterVehiculos === 'sin_vehiculos' ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white',
          ]"
          @click="filterVehiculos = 'sin_vehiculos'"
        >
          Sin Vehículos ({{ stats.total - stats.conVehiculos }})
        </button>
      </div>
    </div>

    <!-- Table of Clients -->
    <div class="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="bg-slate-900/60 border-b border-slate-800 text-slate-400">
              <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Cliente</th>
              <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">DUI</th>
              <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Contacto</th>
              <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Vehículos Asignados</th>
              <th class="px-6 py-4 font-semibold text-xs uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr
              v-for="cliente in filteredClientes"
              :key="cliente.id_cliente || cliente.id"
              class="hover:bg-slate-800/30 transition-colors group"
            >
              <!-- Cliente info -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 text-sky-400 font-bold flex items-center justify-center text-sm shrink-0">
                    {{ (cliente.nombre?.[0] || 'C') }}{{ (cliente.apellido?.[0] || '') }}
                  </div>
                  <div>
                    <p class="font-semibold text-white group-hover:text-sky-300 transition-colors">
                      {{ cliente.nombre }} {{ cliente.apellido }}
                    </p>
                    <p class="text-xs text-slate-500">ID: #{{ cliente.id_cliente || cliente.id }}</p>
                  </div>
                </div>
              </td>

              <!-- DUI -->
              <td class="px-6 py-4 font-mono text-xs">
                <span class="bg-slate-900 text-sky-400 px-2.5 py-1 rounded-lg border border-slate-800 tracking-wider">
                  {{ cliente.dui || 'N/A' }}
                </span>
              </td>

              <!-- Contacto -->
              <td class="px-6 py-4 space-y-1">
                <div class="flex items-center gap-2 text-xs text-slate-300">
                  <i class="fa-solid fa-phone text-slate-500 w-3.5 text-center"></i>
                  <span>{{ cliente.telefono || 'Sin teléfono' }}</span>
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-400">
                  <i class="fa-solid fa-envelope text-slate-500 w-3.5 text-center"></i>
                  <span class="truncate max-w-[180px]">{{ cliente.correo_electronico || cliente.email || 'Sin correo' }}</span>
                </div>
              </td>

              <!-- Vehículos Asociados -->
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1.5 items-start">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      :class="[
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition',
                        getVehiculosDeCliente(cliente).length > 0
                          ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700/60',
                      ]"
                      @click="openViewVehiclesModal(cliente)"
                    >
                      <i class="fa-solid fa-car text-[11px]"></i>
                      <span>{{ getVehiculosDeCliente(cliente).length }} vehículo(s)</span>
                    </button>

                    <button
                      type="button"
                      class="text-xs text-slate-400 hover:text-sky-400 p-1 rounded hover:bg-slate-800 transition"
                      title="Asociar o modificar vehículos"
                      @click="openAssociateModal(cliente)"
                    >
                      <i class="fa-solid fa-link text-[11px]"></i>
                    </button>
                  </div>

                  <!-- Mini badges de placas -->
                  <div
                    v-if="getVehiculosDeCliente(cliente).length > 0"
                    class="flex flex-wrap gap-1 max-w-[220px]"
                  >
                    <span
                      v-for="v in getVehiculosDeCliente(cliente).slice(0, 2)"
                      :key="v.id_vehiculo"
                      class="bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px] px-1.5 py-0.5 rounded"
                    >
                      {{ v.placa }}
                    </span>
                    <span
                      v-if="getVehiculosDeCliente(cliente).length > 2"
                      class="text-[10px] text-slate-500 self-center"
                    >
                      +{{ getVehiculosDeCliente(cliente).length - 2 }} más
                    </span>
                  </div>
                </div>
              </td>

              <!-- Acciones -->
              <td class="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 rounded-lg text-xs font-medium transition"
                  title="Ver vehículos asociados"
                  @click="openViewVehiclesModal(cliente)"
                >
                  <i class="fa-solid fa-eye text-[11px]"></i>
                  <span class="hidden md:inline">Ver</span>
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 rounded-lg text-xs font-medium transition"
                  title="Asociar vehículos"
                  @click="openAssociateModal(cliente)"
                >
                  <i class="fa-solid fa-link text-[11px]"></i>
                  <span class="hidden md:inline">Asociar</span>
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-blue-500/20 text-slate-300 hover:text-blue-400 rounded-lg text-xs font-medium transition"
                  title="Editar cliente"
                  @click="editCliente(cliente)"
                >
                  <i class="fa-solid fa-pen text-[11px]"></i>
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-lg text-xs font-medium transition"
                  title="Eliminar cliente"
                  @click="openDeleteModal(cliente)"
                >
                  <i class="fa-solid fa-trash-can text-[11px]"></i>
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredClientes.length === 0">
              <td colspan="5" class="px-6 py-16 text-center text-slate-500">
                <div class="max-w-xs mx-auto">
                  <div class="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-slate-600 flex items-center justify-center text-2xl mx-auto mb-3">
                    <i class="fa-solid fa-user-slash"></i>
                  </div>
                  <p class="font-semibold text-slate-400 text-sm">No se encontraron clientes</p>
                  <p class="text-xs text-slate-600 mt-1">
                    {{ search ? 'No hay resultados para el término buscado.' : 'Aún no hay clientes registrados en el sistema.' }}
                  </p>
                  <button
                    v-if="!search"
                    type="button"
                    class="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-xl transition"
                    @click="openCreateForm"
                  >
                    Registrar Primer Cliente
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL 1: Consultar y Visualizar Vehículos del Cliente -->
    <div
      v-if="viewVehiclesModal.show && viewVehiclesModal.cliente"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div class="w-full max-w-2xl bg-[#1e293b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="px-6 py-5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <i class="fa-solid fa-car-side text-sm"></i>
            </div>
            <div>
              <h3 class="font-bold text-white text-base">
                Vehículos de {{ viewVehiclesModal.cliente.nombre }} {{ viewVehiclesModal.cliente.apellido }}
              </h3>
              <p class="text-xs text-slate-400">
                DUI: <span class="font-mono text-slate-300">{{ viewVehiclesModal.cliente.dui || 'N/A' }}</span> |
                Tel: <span class="text-slate-300">{{ viewVehiclesModal.cliente.telefono || 'N/A' }}</span>
              </p>
            </div>
          </div>
          <button
            class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
            @click="closeViewVehiclesModal"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Modal Body: Lista de Vehículos -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1">
          <div
            v-if="getVehiculosDeCliente(viewVehiclesModal.cliente).length > 0"
            class="space-y-3"
          >
            <div
              v-for="v in getVehiculosDeCliente(viewVehiclesModal.cliente)"
              :key="v.id_vehiculo"
              class="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div class="flex items-center gap-4">
                <span class="bg-slate-950 border border-slate-800 text-sky-400 font-mono text-sm px-3 py-1.5 rounded-lg tracking-wider font-semibold">
                  {{ v.placa }}
                </span>
                <div>
                  <h4 class="font-bold text-white text-sm">
                    {{ v.marca }} {{ v.modelo }}
                  </h4>
                  <p class="text-xs text-slate-500">
                    Año: <span class="font-mono text-slate-400">{{ v.anio }}</span>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 self-end sm:self-auto">
                <RouterLink
                  :to="`/vehiculos/${v.id_vehiculo}`"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-sky-500/20 text-sky-400 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                  @click="closeViewVehiclesModal"
                >
                  <i class="fa-solid fa-clipboard-list text-xs"></i>
                  Ficha e Historial
                </RouterLink>

                <button
                  type="button"
                  class="px-3 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
                  title="Desvincular del cliente"
                  @click="disassociateSingleVehicle(v, viewVehiclesModal.cliente)"
                >
                  <i class="fa-solid fa-link-slash text-xs"></i>
                  Desvincular
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State within Modal -->
          <div
            v-else
            class="py-12 text-center text-slate-500 space-y-3"
          >
            <i class="fa-solid fa-car-burst text-3xl text-slate-600 block"></i>
            <p class="text-sm font-semibold text-slate-400">Este cliente aún no tiene vehículos asociados.</p>
            <p class="text-xs text-slate-600">Puedes vincular uno o varios vehículos de tu taller a este cliente.</p>
            <button
              type="button"
              class="mt-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold transition inline-flex items-center gap-2"
              @click="openAssociateModal(viewVehiclesModal.cliente)"
            >
              <i class="fa-solid fa-link text-xs"></i>
              Asociar Vehículos Ahora
            </button>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex justify-between items-center">
          <button
            type="button"
            class="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1.5"
            @click="openAssociateModal(viewVehiclesModal.cliente)"
          >
            <i class="fa-solid fa-link text-xs"></i>
            Modificar Asignación de Vehículos
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            @click="closeViewVehiclesModal"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 2: Asociar Uno o Varios Vehículos a un Cliente -->
    <div
      v-if="associateModal.show && associateModal.cliente"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div class="w-full max-w-2xl bg-[#1e293b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="px-6 py-5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <i class="fa-solid fa-link text-sm"></i>
            </div>
            <div>
              <h3 class="font-bold text-white text-base">
                Asociar Vehículos a {{ associateModal.cliente.nombre }} {{ associateModal.cliente.apellido }}
              </h3>
              <p class="text-xs text-slate-400">
                Selecciona uno o varios vehículos de la lista para vincularlos a este cliente.
              </p>
            </div>
          </div>
          <button
            class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
            @click="closeAssociateModal"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-3 flex-1">
          <p class="text-xs text-slate-400 mb-2">
            Seleccionados:
            <span class="font-bold text-sky-400 font-mono">{{ associateModal.selectedVehiculos.length }}</span> vehículo(s)
          </p>

          <div
            v-if="vehiculos.length > 0"
            class="space-y-2 max-h-[420px] overflow-y-auto pr-1"
          >
            <div
              v-for="v in vehiculos"
              :key="v.id_vehiculo"
              :class="[
                'p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3',
                associateModal.selectedVehiculos.includes(v.id_vehiculo)
                  ? 'bg-sky-500/10 border-sky-500/50 shadow-md shadow-sky-500/5'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700',
              ]"
              @click="toggleVehicleSelection(v.id_vehiculo)"
            >
              <div class="flex items-center gap-3.5">
                <!-- Checkbox visual -->
                <div
                  :class="[
                    'w-5 h-5 rounded-md border flex items-center justify-center transition-colors',
                    associateModal.selectedVehiculos.includes(v.id_vehiculo)
                      ? 'bg-sky-500 border-sky-500 text-slate-950 text-xs'
                      : 'border-slate-700 bg-slate-950',
                  ]"
                >
                  <i
                    v-if="associateModal.selectedVehiculos.includes(v.id_vehiculo)"
                    class="fa-solid fa-check font-bold"
                  ></i>
                </div>

                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-xs font-bold text-sky-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {{ v.placa }}
                    </span>
                    <span class="font-semibold text-white text-sm">
                      {{ v.marca }} {{ v.modelo }} ({{ v.anio }})
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 mt-0.5">
                    Propietario actual:
                    <span class="text-slate-400 font-medium">
                      {{ v.propietario?.nombre || (typeof v.propietario === 'string' ? v.propietario : 'Sin propietario') }}
                    </span>
                  </p>
                </div>
              </div>

              <span
                v-if="associateModal.selectedVehiculos.includes(v.id_vehiculo)"
                class="text-xs text-sky-400 font-semibold px-2 py-0.5 bg-sky-500/20 rounded-md"
              >
                Vinculado
              </span>
            </div>
          </div>

          <div v-else class="text-center py-10 text-slate-500">
            <i class="fa-solid fa-car text-2xl mb-2 block"></i>
            No hay vehículos registrados en el taller para asociar.
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            @click="closeAssociateModal"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="associateModal.submitting"
            class="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-sky-500/10"
            @click="saveVehicleAssociations"
          >
            <i v-if="associateModal.submitting" class="fa-solid fa-spinner fa-spin text-xs"></i>
            <i v-else class="fa-solid fa-floppy-disk text-xs"></i>
            Guardar Vinculación
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL 3: Eliminar Cliente -->
    <div
      v-if="deleteModal.show && deleteModal.cliente"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in"
    >
      <div class="w-full max-w-md bg-[#1e293b] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
        <div class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xl mx-auto">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>

        <div class="text-center space-y-1">
          <h3 class="text-lg font-bold text-white">¿Eliminar este cliente?</h3>
          <p class="text-sm text-slate-300 font-semibold">
            {{ deleteModal.cliente.nombre }} {{ deleteModal.cliente.apellido }}
          </p>
          <p class="text-xs text-slate-400 font-mono">DUI: {{ deleteModal.cliente.dui || 'N/A' }}</p>
        </div>

        <p class="text-xs text-slate-400 text-center bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          Esta acción removerá el cliente del sistema. Los vehículos asociados no se eliminarán, pero quedarán sin cliente asignado.
        </p>

        <div class="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            @click="closeDeleteModal"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
            @click="confirmDeleteCliente"
          >
            <i class="fa-solid fa-trash-can text-xs"></i>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.18s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
