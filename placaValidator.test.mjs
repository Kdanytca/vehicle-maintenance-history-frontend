import assert from 'node:assert/strict'
import test from 'node:test'
import { validarPlaca } from './src/utils/placaValidator.js'

test('validarPlaca acepta formatos validos de placa', () => {
  const casosValidos = ['P123-456', 'p123-456', 'P-123456', 'P-123-456', 'RE123-456', 'M987-654', 'C111-222', 'A333-444']

  for (const placa of casosValidos) {
    const res = validarPlaca(placa)
    assert.equal(res.valida, true, `La placa ${placa} debió ser válida`)
    assert.equal(res.error, '')
    assert.equal(res.placaNormalizada, placa.trim().toUpperCase())
  }
})

test('validarPlaca rechaza formatos invalidos antes de consultar', () => {
  const casosInvalidos = [
    '',
    '   ',
    '123-456',
    'INVALIDA',
    'XYZ-123456',
    'P12',
    'P12345678',
    'P-ABC-DEF',
    null,
    undefined,
  ]

  for (const placa of casosInvalidos) {
    const res = validarPlaca(placa)
    assert.equal(res.valida, false, `La placa ${placa} debió ser inválida`)
    assert.ok(res.error.length > 0)
  }
})

