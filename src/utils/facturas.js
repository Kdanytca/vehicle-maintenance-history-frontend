export const MAX_FACTURA_BYTES = 5 * 1024 * 1024

export function validarFacturaPdf(file) {
  if (!file) return 'Adjunta la factura en formato PDF.'
  if (!/\.pdf$/i.test(file.name || '')) return 'Solo se permiten archivos en formato PDF (.pdf).'
  if (file.size > MAX_FACTURA_BYTES) return 'La factura PDF no puede superar 5 MB.'
  return ''
}

export function facturaPdfUrl(path, apiBase = import.meta.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api') {
  if (!path) return null
  const base = apiBase.replace(/\/+$/, '').replace(/\/api$/, '')
  return `${base}/storage/${path}`
}
