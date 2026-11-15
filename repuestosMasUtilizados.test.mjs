import test from 'node:test'
import assert from 'node:assert/strict'
import {
  procesarRepuestosMasUtilizados,
  obtenerEstiloRanking,
} from './src/utils/repuestosMasUtilizados.js'

test('procesarRepuestosMasUtilizados limita a exactamente 5 ordenados de mayor a menor', () => {
  const entrada = [
    { nombre_pieza: 'Bujía', cantidad_utilizado: 4, proveedor: 'NGK' },
    { nombre_pieza: 'Filtro Aceite', cantidad_utilizado: 15, proveedor: 'Bosch' },
    { nombre_pieza: 'Pastillas Freno', cantidad_utilizado: 10, proveedor: 'Brembo' },
    { nombre_pieza: 'Líquido Freno', cantidad_utilizado: 7, proveedor: 'Motul' },
    { nombre_pieza: 'Bomba Agua', cantidad_utilizado: 5, proveedor: 'GMB' },
    { nombre_pieza: 'Amortiguador', cantidad_utilizado: 2, proveedor: 'Monroe' },
    { nombre_pieza: 'Filtro Aire', cantidad_utilizado: 1, proveedor: 'Mann' },
  ]

  const resultado = procesarRepuestosMasUtilizados(entrada, 5)

  // Debe retornar los 5 primeros
  assert.equal(resultado.length, 5)

  // Orden descendente
  assert.equal(resultado[0].nombre_repuesto, 'Filtro Aceite')
  assert.equal(resultado[0].cantidad_utilizado, 15)
  assert.equal(resultado[0].ranking, 1)
  assert.equal(resultado[0].proveedor, 'Bosch')

  assert.equal(resultado[1].nombre_repuesto, 'Pastillas Freno')
  assert.equal(resultado[1].cantidad_utilizado, 10)
  assert.equal(resultado[1].ranking, 2)

  assert.equal(resultado[2].nombre_repuesto, 'Líquido Freno')
  assert.equal(resultado[2].cantidad_utilizado, 7)
  assert.equal(resultado[2].ranking, 3)

  assert.equal(resultado[3].nombre_repuesto, 'Bomba Agua')
  assert.equal(resultado[3].cantidad_utilizado, 5)
  assert.equal(resultado[3].ranking, 4)

  assert.equal(resultado[4].nombre_repuesto, 'Bujía')
  assert.equal(resultado[4].cantidad_utilizado, 4)
  assert.equal(resultado[4].ranking, 5)
})

test('procesarRepuestosMasUtilizados asigna proveedor por defecto cuando es nulo o indefinido', () => {
  const entrada = [
    { nombre_pieza: 'Tornillo Grado 8', cantidad_utilizado: 3, proveedor: null },
  ]

  const resultado = procesarRepuestosMasUtilizados(entrada)
  assert.equal(resultado[0].proveedor, 'Proveedor no especificado')
})

test('procesarRepuestosMasUtilizados maneja lista vacia', () => {
  assert.deepEqual(procesarRepuestosMasUtilizados([]), [])
  assert.deepEqual(procesarRepuestosMasUtilizados(null), [])
})

test('obtenerEstiloRanking devuelve configuracion visual para ranking 1 a 5', () => {
  for (let r = 1; r <= 5; r++) {
    const estilo = obtenerEstiloRanking(r)
    assert.ok(estilo.badgeClass)
    assert.ok(estilo.colorHex)
    assert.ok(estilo.barGradient)
  }
})

