function hoy() {
  return new Date().toISOString().slice(0, 10)
}

function nombreArchivo(periodo, extension) {
  return `vehiculos_inactivos_${periodo}meses_${hoy()}.${extension}`
}

function armarFilas(vehiculos) {
  return vehiculos.map((v, index) => [
    index + 1,
    v.placa,
    `${v.marca} ${v.modelo} ${v.anio ? '(' + v.anio + ')' : ''}`.trim(),
    v.propietario || 'Sin propietario',
    v.telefono || 'Sin teléfono',
    v.fecha_ultimo_mantenimiento || 'Sin registros',
  ])
}

const COLUMNAS = ['#', 'Placa', 'Vehículo', 'Propietario', 'Teléfono de Contacto', 'Último Mantenimiento']

export async function exportarInactivosPDF({ vehiculos, periodo, fechaCorte }) {
  const { jsPDF } = await import('jspdf')
  const { autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape' })
  const azul = [14, 165, 233]

  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text(`Reporte de Vehículos Inactivos (${periodo} meses sin mantenimiento)`, 14, 16)

  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(
    `Fecha de corte: ${fechaCorte || 'N/A'} | Generado: ${new Date().toLocaleString()} | Total inactivos: ${vehiculos.length}`,
    14,
    22,
  )

  const filas = armarFilas(vehiculos)

  autoTable(doc, {
    startY: 28,
    head: [COLUMNAS],
    body: filas.length ? filas : [['-', '-', 'No se encontraron vehículos inactivos', '-', '-', '-']],
    theme: 'striped',
    styles: { fontSize: 8.5 },
    headStyles: { fillColor: azul, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
  })

  doc.save(nombreArchivo(periodo, 'pdf'))
}

export async function exportarInactivosExcel({ vehiculos, periodo, fechaCorte }) {
  const ExcelJS = (await import('exceljs')).default

  const libro = new ExcelJS.Workbook()
  const ws = libro.addWorksheet(`Inactivos ${periodo}m`)

  // Título
  ws.addRow([`Reporte de Vehículos Inactivos (${periodo} meses sin servicio)`])
  ws.addRow([
    `Fecha de corte: ${fechaCorte || 'N/A'}`,
    `Generado: ${new Date().toLocaleString()}`,
    `Total: ${vehiculos.length}`,
  ])
  ws.addRow([])

  // Encabezados
  const filaHead = ws.addRow(COLUMNAS)
  filaHead.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  filaHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } }

  // Datos
  const filas = armarFilas(vehiculos)
  filas.forEach((fila) => ws.addRow(fila))

  // Anchos
  const anchos = [8, 16, 28, 30, 20, 22]
  anchos.forEach((w, i) => {
    ws.getColumn(i + 1).width = w
  })

  const buffer = await libro.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo(periodo, 'xlsx')
  a.click()
  URL.revokeObjectURL(url)
}
