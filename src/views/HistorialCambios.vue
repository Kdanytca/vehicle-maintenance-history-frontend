<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../api";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();
const registros = ref([]);
const busqueda = ref("");
const loading = ref(false);
const error = ref("");

const registrosFiltrados = computed(() => {
  const termino = busqueda.value.trim().toLocaleLowerCase();

  if (!termino) {
    return registros.value;
  }

  return registros.value.filter((registro) =>
    String(registro.user?.username ?? registro.user?.name ?? "")
      .toLocaleLowerCase()
      .includes(termino),
  );
});

function formatDateTime(value) {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(date)
    .replace(",", "");
}

async function load() {
  if (!auth.isAdmin) {
    await router.replace("/vehiculos");
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    const { data } = await api.get("/audit-logs");
    registros.value = Array.isArray(data) ? data : (data.audit_logs ?? []);
  } catch (exception) {
    if (exception.response?.status === 403) {
      await router.replace("/vehiculos");
      return;
    }

    error.value =
      exception.response?.data?.message ||
      "No se pudo cargar el historial de cambios.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="space-y-6">
    <header
      class="flex flex-col gap-4 rounded-xl border border-slate-800/60 bg-[#0f172a] p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10"
        >
          <i class="fa-solid fa-clock-rotate-left text-sm text-amber-400"></i>
        </div>
        <div>
          <h1 class="text-xl font-bold text-white">Historial de cambios</h1>
          <p class="mt-0.5 text-xs text-slate-400">
            Registro de actividad del sistema.
          </p>
        </div>
      </div>

      <label class="relative w-full sm:max-w-sm">
        <span class="sr-only">Buscar por nombre de usuario</span>
        <i
          class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-500"
        ></i>
        <input
          v-model="busqueda"
          type="search"
          placeholder="Buscar por usuario..."
          class="w-full rounded-lg border border-slate-800 bg-slate-900 py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
      </label>
    </header>

    <p
      v-if="error"
      role="alert"
      class="rounded-lg border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400"
    >
      {{ error }}
    </p>

    <div
      class="overflow-hidden rounded-xl border border-slate-800 bg-[#1e293b] shadow-xl"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr
              class="border-b border-slate-800 bg-slate-900/50 text-slate-400"
            >
              <th class="p-4 text-xs font-semibold uppercase tracking-wider">
                Usuario
              </th>
              <th class="p-4 text-xs font-semibold uppercase tracking-wider">
                Acción
              </th>
              <th class="p-4 text-xs font-semibold uppercase tracking-wider">
                Módulo
              </th>
              <th class="p-4 text-xs font-semibold uppercase tracking-wider">
                Descripción
              </th>
              <th class="p-4 text-xs font-semibold uppercase tracking-wider">
                Fecha y hora
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr v-if="loading">
              <td
                colspan="5"
                class="px-4 py-12 text-center text-sky-400"
                role="status"
                aria-live="polite"
              >
                <i class="fa-solid fa-spinner fa-spin mr-2"></i>
                Cargando historial...
              </td>
            </tr>

            <tr v-else-if="registrosFiltrados.length === 0">
              <td colspan="5" class="px-4 py-12 text-center text-slate-500">
                <i
                  class="fa-solid fa-folder-open mb-3 block text-3xl text-slate-600"
                ></i>
                <span class="text-sm font-medium">
                  {{
                    busqueda
                      ? "No hay cambios para el usuario buscado."
                      : "No hay cambios registrados en el sistema"
                  }}
                </span>
              </td>
            </tr>

            <template v-else>
              <tr
                v-for="registro in registrosFiltrados"
                :key="registro.id"
                class="transition-colors hover:bg-slate-800/30"
              >
                <td class="whitespace-nowrap p-4 font-medium text-white">
                  {{
                    registro.user?.username ||
                    registro.user?.name ||
                    "Usuario desconocido"
                  }}
                </td>
                <td class="whitespace-nowrap p-4">
                  <span
                    class="rounded border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400"
                  >
                    {{ registro.accion }}
                  </span>
                </td>
                <td class="whitespace-nowrap p-4 text-slate-300">
                  {{ registro.modulo }}
                </td>
                <td class="max-w-lg p-4 text-slate-400">
                  {{ registro.descripcion || "Sin descripción" }}
                </td>
                <td
                  class="whitespace-nowrap p-4 font-mono text-xs text-slate-400"
                >
                  {{ formatDateTime(registro.created_at) }}
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
