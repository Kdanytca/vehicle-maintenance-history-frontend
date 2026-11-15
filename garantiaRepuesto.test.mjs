import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calcularEstadoGarantia,
  filtrarRepuestosPorGarantia,
  obtenerMensajeVacio,
  obtenerVehiculoAsociado,
} from './src/utils/garantiaRepuesto.js'

test('calcularEstadoGarantia evalua vigencia dinamicamente segun la fecha', () => {
  const hoy = '2026-11-08'

  // Fecha posterior a hoy -> Vigente
  assert.equal(calcularEstadoGarantia('2026-12-01', hoy), 'Vigente')
  // Mismo día -> Vigente
  assert.equal(calcularEstadoGarantia('2026-11-08', hoy), 'Vigente')
  // Fecha anterior a hoy -> Vencida
  assert.equal(calcularEstadoGarantia('2026-11-07', hoy), 'Vencida')
  assert.equal(calcularEstadoGarantia('2025-05-10', hoy), 'Vencida')
  // Sin fecha -> Sin garantía
  assert.equal(calcularEstadoGarantia(null, hoy), 'Sin garantía')
  assert.equal(calcularEstadoGarantia('', hoy), 'Sin garantía')
})

test('filtrarRepuestosPorGarantia filtra unicamente repuestos vigentes', () => {
  const hoy = '2026-11-08'
  const lista = [
    { id: 1, nombre_pieza: 'Amortiguador', garantia_fin: '2026-12-31' },
    { id: 2, nombre_pieza: 'Freno', garantia_fin: '2026-10-01' },
    { id: 3, nombre_pieza: 'Tornillo', garantia_fin: null },
  ]

  const resultado = filtrarRepuestosPorGarantia(lista, 'vigente', hoy)
  assert.equal(resultado.length, 1)
  assert.equal(resultado[0].nombre_pieza, 'Amortiguador')
})

test('filtrarRepuestosPorGarantia filtra unicamente repuestos vencidos', () => {
  const hoy = '2026-11-08'
  const lista = [
    { id: 1, nombre_pieza: 'Amortiguador', garantia_fin: '2026-12-31' },
    { id: 2, nombre_pieza: 'Freno', garantia_fin: '2026-10-01' },
    { id: 3, nombre_pieza: 'Tornillo', garantia_fin: null },
  ]

  const resultado = filtrarRepuestosPorGarantia(lista, 'vencida', hoy)
  assert.equal(resultado.length, 1)
  assert.equal(resultado[0].nombre_pieza, 'Freno')
})

test('obtenerMensajeVacio retorna mensaje informativo segun el filtro', () => {
  assert.equal(
    obtenerMensajeVacio('vigente'),
    'No se encontraron repuestos con garantía vigente.'
  )
  assert.equal(
    obtenerMensajeVacio('vencida'),
    'No se encontraron repuestos con garantía vencida.'
  )
  assert.equal(
    obtenerMensajeVacio('todas'),
    'No hay repuestos registrados en la base de datos.'
  )
})

test('obtenerVehiculoAsociado formatea correctamente los datos del vehiculo', () => {
  const repuestoConVehiculo = {
    vehiculo: { placa: 'P123-456', marca: 'Toyota', modelo: 'Corolla' },
  }
  const info = obtenerVehiculoAsociado(repuestoConVehiculo)
  assert.equal(info.placa, 'P123-456')
  assert.equal(info.descripcion, 'Toyota Corolla')
  assert.equal(info.textoCompleto, 'Toyota Corolla (P123-456)')

  const repuestoSinVehiculo = {}
  const infoVacia = obtenerVehiculoAsociado(repuestoSinVehiculo)
  assert.equal(infoVacia.placa, 'Sin placa')
})

