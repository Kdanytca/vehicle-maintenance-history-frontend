import assert from 'node:assert/strict'
import test from 'node:test'
import axios from 'axios'
import { createRequestActivity, trackApiActivity } from './src/requestActivity.js'

test('las peticiones rapidas no muestran el indicador ni dejan temporizadores activos', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const activity = createRequestActivity()
  const finish = activity.begin()
  t.mock.timers.tick(299)
  assert.equal(activity.state.visible, false)
  finish()
  t.mock.timers.tick(10000)
  assert.deepEqual({ ...activity.state }, { visible: false, prolonged: false })
})

test('espera todas las peticiones simultaneas y admite limpieza repetida', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const activity = createRequestActivity()
  const first = activity.begin()
  const second = activity.begin()
  t.mock.timers.tick(300)
  assert.equal(activity.state.visible, true)
  first()
  first()
  assert.equal(activity.state.visible, true)
  second()
  assert.equal(activity.state.visible, false)
})

test('avisa a los diez segundos y reinicia el estado para la siguiente operacion', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const activity = createRequestActivity()
  const finish = activity.begin()
  t.mock.timers.tick(9999)
  assert.equal(activity.state.prolonged, false)
  t.mock.timers.tick(1)
  assert.equal(activity.state.prolonged, true)
  finish()
  const finishNext = activity.begin()
  assert.deepEqual({ ...activity.state }, { visible: false, prolonged: false })
  t.mock.timers.tick(300)
  assert.deepEqual({ ...activity.state }, { visible: true, prolonged: false })
  finishNext()
})

test('Axios limpia el indicador ante exito, error HTTP, fallo de red y cancelacion', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const activity = createRequestActivity()
  let complete
  const api = axios.create({
    adapter: (config) => new Promise((resolve, reject) => {
      complete = (kind) => {
        if (kind === 'success') resolve({ config, status: 200, data: {} })
        else if (kind === 'cancel') reject(new axios.CanceledError('cancelled', config))
        else reject(new axios.AxiosError('failed', kind === 'network' ? 'ERR_NETWORK' : 'ERR_BAD_RESPONSE', config, null,
          kind === 'http' ? { status: 500, config } : undefined))
      }
    }),
  })
  trackApiActivity(api, activity)

  for (const kind of ['success', 'http', 'network', 'cancel']) {
    const result = api.get('/test').then(() => 'success', (error) => error)
    await Promise.resolve()
    await Promise.resolve()
    t.mock.timers.tick(10000)
    assert.equal(activity.state.visible, true)
    complete(kind)
    const value = await result
    if (kind === 'success') assert.equal(value, 'success')
    else assert.ok(axios.isAxiosError(value))
    assert.deepEqual({ ...activity.state }, { visible: false, prolonged: false })
  }
})
