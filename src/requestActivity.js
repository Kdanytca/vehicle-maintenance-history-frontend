import { reactive, readonly } from 'vue'

export function createRequestActivity() {
  const state = reactive({ visible: false, prolonged: false })
  let pending = 0
  let showTimer
  let prolongedTimer

  function begin() {
    pending += 1
    if (pending === 1) {
      showTimer = setTimeout(() => { state.visible = true }, 300)
      prolongedTimer = setTimeout(() => { state.prolonged = true }, 10000)
    }

    let finished = false
    return () => {
      if (finished) return
      finished = true
      pending -= 1
      if (pending === 0) {
        clearTimeout(showTimer)
        clearTimeout(prolongedTimer)
        state.visible = false
        state.prolonged = false
      }
    }
  }

  return { state: readonly(state), begin }
}

export const requestActivity = createRequestActivity()

export function trackApiActivity(api, activity = requestActivity) {
  api.interceptors.request.use((config) => {
    config.finishRequestActivity = activity.begin()
    return config
  })

  api.interceptors.response.use(
    (response) => {
      response.config.finishRequestActivity?.()
      return response
    },
    (error) => {
      error.config?.finishRequestActivity?.()
      return Promise.reject(error)
    },
  )
}
