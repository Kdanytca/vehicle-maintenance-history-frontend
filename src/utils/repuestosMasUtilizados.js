/**
 * Utilidades para el procesamiento y visualización de repuestos más utilizados.
 */

/**
 * Ordena y formatea la lista de repuestos más utilizados (máximo 5) de mayor a menor.
 * @param {Array} repuestos
 * @param {number} [limite=5]
 * @returns {Array}
 */
export function procesarRepuestosMasUtilizados(repuestos, limite = 5) {
  if (!Array.isArray(repuestos)) return []

  const ordenados = [...repuestos]
    .map((item) => ({
      nombre_repuesto: item.nombre_repuesto || item.nombre_pieza || 'Repuesto sin nombre',
      cantidad_utilizado: Number(item.cantidad_utilizado || 0),
      proveedor: item.proveedor || 'Proveedor no especificado',
    }))
    .sort((a, b) => b.cantidad_utilizado - a.cantidad_utilizado)
    .slice(0, limite)

  const totalUsos = ordenados.reduce((acc, curr) => acc + curr.cantidad_utilizado, 0)
  const maxUso = ordenados.length > 0 ? Math.max(...ordenados.map((r) => r.cantidad_utilizado), 1) : 1

  return ordenados.map((item, index) => ({
    ...item,
    ranking: index + 1,
    porcentajeTotal: totalUsos > 0 ? Math.round((item.cantidad_utilizado / totalUsos) * 100) : 0,
    porcentajeRelativo: Math.round((item.cantidad_utilizado / maxUso) * 100),
  }))
}

/**
 * Retorna las clases de estilo e icono para el ranking de los repuestos.
 * @param {number} ranking (1-5)
 * @returns {{ badgeClass: string, textClass: string, borderClass: string, colorHex: string }}
 */
export function obtenerEstiloRanking(ranking) {
  switch (ranking) {
    case 1:
      return {
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        textClass: 'text-amber-400',
        borderClass: 'border-amber-500/30',
        colorHex: '#f59e0b',
        barGradient: 'from-amber-500 to-amber-400',
      }
    case 2:
      return {
        badgeClass: 'bg-slate-300/20 text-slate-200 border-slate-300/40',
        textClass: 'text-slate-300',
        borderClass: 'border-slate-400/30',
        colorHex: '#cbd5e1',
        barGradient: 'from-slate-400 to-slate-300',
      }
    case 3:
      return {
        badgeClass: 'bg-amber-700/20 text-amber-600 border-amber-700/40',
        textClass: 'text-amber-600',
        borderClass: 'border-amber-700/30',
        colorHex: '#d97706',
        barGradient: 'from-amber-700 to-amber-600',
      }
    case 4:
      return {
        badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        textClass: 'text-sky-400',
        borderClass: 'border-sky-500/30',
        colorHex: '#0ea5e9',
        barGradient: 'from-sky-500 to-sky-400',
      }
    default:
      return {
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        textClass: 'text-indigo-400',
        borderClass: 'border-indigo-500/30',
        colorHex: '#6366f1',
        barGradient: 'from-indigo-500 to-indigo-400',
      }
  }
}

