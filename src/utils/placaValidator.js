export const REGEX_PLACA = /^(RE|AB|MI|CC|CD|P|A|C|M|D|T|N|V)-?[0-9]{3}-?[0-9]{3}$/i

/**
 * Valida si un texto cumple con el formato válido de placa salvadoreña.
 *
 * @param {string} valor
 * @returns {{ valida: boolean, error: string, placaNormalizada: string }}
 */
export function validarPlaca(valor) {
  if (typeof valor !== 'string') {
    return {
      valida: false,
      error: 'Debes ingresar un número de placa.',
      placaNormalizada: '',
    }
  }

  const limpia = valor.trim()
  if (!limpia) {
    return {
      valida: false,
      error: 'Ingresa un número de placa para realizar la búsqueda.',
      placaNormalizada: '',
    }
  }

  if (!REGEX_PLACA.test(limpia)) {
    return {
      valida: false,
      error: 'Formato de placa inválido. Usa un formato válido, por ejemplo: P123-456.',
      placaNormalizada: limpia.toUpperCase(),
    }
  }

  return {
    valida: true,
    error: '',
    placaNormalizada: limpia.toUpperCase(),
  }
}

