/**
 * Utilidades para el filtrado y cálculo dinámico del estado de garantías de repuestos.
 */

/**
 * Normaliza una fecha a medianoche local (00:00:00.000) para comparaciones sin desfase horario.
 * @param {string|Date} fecha
 * @returns {Date|null}
 */
export function normalizarFecha(fecha) {
  if (!fecha) return null
  if (fecha instanceof Date) {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  }
  if (typeof fecha === 'string') {
    const limpia = fecha.trim().split('T')[0]
    const partes = limpia.split('-')
    if (partes.length === 3) {
      const anio = parseInt(partes[0], 10)
      const mes = parseInt(partes[1], 10) - 1
      const dia = parseInt(partes[2], 10)
      if (!Number.isNaN(anio) && !Number.isNaN(mes) && !Number.isNaN(dia)) {
        return new Date(anio, mes, dia)
      }
    }
    const d = new Date(fecha)
    if (!Number.isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }
  }
  return null
}

/**
 * Determina automáticamente el estado de la garantía según la fecha actual/referencia.
 * @param {string|Date|null} garantiaFin
 * @param {string|Date} [fechaReferencia=new Date()]
 * @returns {'Vigente'|'Vencida'|'Sin garantía'}
 */
export function calcularEstadoGarantia(garantiaFin, fechaReferencia = new Date()) {
  if (!garantiaFin) return 'Sin garantía'
  const fechaFin = normalizarFecha(garantiaFin)
  if (!fechaFin) return 'Sin garantía'
  const ref = normalizarFecha(fechaReferencia) || normalizarFecha(new Date())

  return fechaFin.getTime() >= ref.getTime() ? 'Vigente' : 'Vencida'
}

/**
 * Filtra un listado de repuestos según el filtro seleccionado ('vigente', 'vencida', o 'todas').
 * @param {Array} repuestos
 * @param {'vigente'|'vencida'|'todas'|string} filtro
 * @param {string|Date} [fechaReferencia=new Date()]
 * @returns {Array}
 */
export function filtrarRepuestosPorGarantia(repuestos, filtro, fechaReferencia = new Date()) {
  if (!Array.isArray(repuestos)) return []
  const f = String(filtro || 'todas').toLowerCase().trim()

  if (f === 'vigente' || f === 'garantia vigente') {
    return repuestos.filter((r) => calcularEstadoGarantia(r?.garantia_fin, fechaReferencia) === 'Vigente')
  }
  if (f === 'vencida' || f === 'garantia vencida') {
    return repuestos.filter((r) => calcularEstadoGarantia(r?.garantia_fin, fechaReferencia) === 'Vencida')
  }
  return repuestos
}

/**
 * Retorna el mensaje informativo para mostrar cuando no existan resultados.
 * @param {'vigente'|'vencida'|'todas'|string} filtro
 * @returns {string}
 */
export function obtenerMensajeVacio(filtro) {
  const f = String(filtro || 'todas').toLowerCase().trim()
  if (f === 'vigente' || f === 'garantia vigente') {
    return 'No se encontraron repuestos con garantía vigente.'
  }
  if (f === 'vencida' || f === 'garantia vencida') {
    return 'No se encontraron repuestos con garantía vencida.'
  }
  return 'No hay repuestos registrados en la base de datos.'
}

/**
 * Formatea la información del vehículo asociado a un repuesto.
 * @param {Object} repuesto
 * @returns {{ placa: string, descripcion: string, textoCompleto: string }}
 */
export function obtenerVehiculoAsociado(repuesto) {
  const v = repuesto?.vehiculo || repuesto?.factura?.vehiculo || repuesto?.mantenimiento?.vehiculo
  if (!v) {
    return {
      placa: 'Sin placa',
      descripcion: 'Sin vehículo vinculado',
      textoCompleto: 'Sin vehículo vinculado',
    }
  }
  const marcaModelo = [v.marca, v.modelo].filter(Boolean).join(' ') || 'Vehículo'
  const placa = v.placa || 'S/P'
  return {
    placa,
    descripcion: marcaModelo,
    textoCompleto: `${marcaModelo} (${placa})`,
  }
}

