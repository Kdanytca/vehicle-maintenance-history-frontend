// G2DS-25: exportar el historial completo de un vehículo en PDF o Excel.
// Recibe el mismo objeto `detail` que usa la pantalla de Historial.

function dinero(valor) {
  return `$${Number(valor || 0).toFixed(2)}`
}

function hoy() {
  return new Date().toISOString().slice(0, 10)
}

function fechaHora(valor) {
  return valor ? String(valor).slice(0, 16).replace('T', ' ') : ''
}

function nombreArchivo(detail, extension) {
  const placa = String(detail.vehiculo.placa).replace(/[^A-Za-z0-9-]/g, '')
  return `historial_${placa}_${hoy()}.${extension}`
}

// Arma las filas una sola vez para que el PDF y el Excel muestren lo mismo
function armarDatos(detail) {
  const { vehiculo, mantenimientos, historial, resumen } = detail

  return {
    vehiculo: [
      ['Placa', vehiculo.placa],
      ['Marca', vehiculo.marca],
      ['Modelo', vehiculo.modelo],
      ['Año', vehiculo.anio ?? ''],
      ['Propietario', vehiculo.propietario?.nombre || 'Sin propietario'],
      ['Teléfono', vehiculo.propietario?.telefono || ''],
      ['Correo', vehiculo.propietario?.correo || ''],
    ],
    resumen: [
      ['Total de servicios', resumen.total_servicios],
      ['Costo mano de obra', dinero(resumen.costo_mano_obra)],
      ['Costo repuestos', dinero(resumen.costo_repuestos)],
      ['Costo total', dinero(resumen.costo_total)],
      ['Último servicio', resumen.ultimo_servicio || 'N/A'],
      ...Object.entries(resumen.por_estado || {}).map(([estado, cantidad]) => [`Servicios ${estado}`, cantidad]),
    ],
    mantenimientos: mantenimientos.map((m, i) => [
      i + 1,
      m.fecha_servicio,
      m.descripcion_falla,
      m.estado,
      m.encargado?.username || 'N/A',
      dinero(m.costo_mano_obra),
      dinero(m.total_repuestos),
      dinero(m.costo_total),
    ]),
    repuestos: mantenimientos.flatMap((m, i) =>
      (m.repuestos || []).map((r) => [i + 1, m.fecha_servicio, r.nombre_pieza, r.codigo_pieza || '', dinero(r.costo_unitario)]),
    ),
    auditoria: historial.map((e) => [
      fechaHora(e.created_at),
      e.tipo_evento,
      e.descripcion_evento,
      e.usuario?.username || 'Sistema',
      e.direccion_ip || 'N/A',
    ]),
  }
}

const COLUMNAS = {
  mantenimientos: ['#', 'Fecha', 'Descripción', 'Estado', 'Mecánico', 'Mano de obra', 'Repuestos', 'Total'],
  repuestos: ['Mant. #', 'Fecha', 'Pieza', 'Código', 'Costo unitario'],
  auditoria: ['Fecha', 'Tipo', 'Descripción', 'Usuario', 'IP'],
}

export async function crearPDF(detail) {
  // Se cargan solo cuando el usuario exporta, para no hacer más pesada la página
  const { jsPDF } = await import('jspdf')
  const { autoTable } = await import('jspdf-autotable')

  const datos = armarDatos(detail)
  const doc = new jsPDF({ orientation: 'landscape' })
  const azul = [14, 165, 233]

  doc.setFontSize(16)
  doc.text(`Historial del vehículo ${detail.vehiculo.placa}`, 14, 16)
  doc.setFontSize(9)
  doc.setTextColor(120)
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 22)
  doc.setTextColor(0)

  let y = 28
  const seccion = (titulo, head, body, vacio) => {
    // Si queda poco espacio en la hoja, empieza la sección en una página nueva
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      y = 16
    }
    doc.setFontSize(11)
    doc.text(titulo, 14, y)
    autoTable(doc, {
      startY: y + 2,
      head: head ? [head] : undefined,
      body: body.length ? body : [[vacio]],
      theme: head ? 'striped' : 'plain',
      tableWidth: head ? 'auto' : 'wrap',
      columnStyles: head ? {} : { 0: { fontStyle: 'bold', cellWidth: 45 } },
      styles: { fontSize: 8 },
      headStyles: { fillColor: azul },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 8
  }

  seccion('Datos del vehículo', null, datos.vehiculo)
  seccion('Resumen', null, datos.resumen)
  seccion('Mantenimientos', COLUMNAS.mantenimientos, datos.mantenimientos, 'Sin mantenimientos registrados')
  seccion('Repuestos utilizados', COLUMNAS.repuestos, datos.repuestos, 'Sin repuestos registrados')
  seccion('Auditoría', COLUMNAS.auditoria, datos.auditoria, 'Sin eventos de auditoría')

  return doc
}

export async function exportarPDF(detail) {
  const doc = await crearPDF(detail)
  doc.save(nombreArchivo(detail, 'pdf'))
}

export async function crearExcel(detail) {
  const ExcelJS = (await import('exceljs')).default

  const datos = armarDatos(detail)
  const libro = new ExcelJS.Workbook()

  // Cada sección va en su propia hoja del Excel
  const hoja = (nombre, head, body, anchos) => {
    const ws = libro.addWorksheet(nombre)
    if (head) {
      const fila = ws.addRow(head)
      fila.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      fila.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0EA5E9' } }
    }
    body.forEach((row) => ws.addRow(row))
    anchos.forEach((ancho, i) => { ws.getColumn(i + 1).width = ancho })
    return ws
  }

  const general = hoja('Vehículo', null, [
    [`Historial del vehículo ${detail.vehiculo.placa}`],
    [`Generado: ${new Date().toLocaleString()}`],
    [],
    ...datos.vehiculo,
    [],
    ['RESUMEN'],
    ...datos.resumen,
  ], [22, 40])
  general.getCell('A1').font = { bold: true, size: 14 }
  general.getRow(datos.vehiculo.length + 5).font = { bold: true }

  hoja('Mantenimientos', COLUMNAS.mantenimientos, datos.mantenimientos, [5, 12, 45, 14, 16, 14, 12, 12])
  hoja('Repuestos', COLUMNAS.repuestos, datos.repuestos, [9, 12, 35, 18, 15])
  hoja('Auditoría', COLUMNAS.auditoria, datos.auditoria, [18, 20, 60, 15, 15])

  return libro
}

export async function exportarExcel(detail) {
  const libro = await crearExcel(detail)
  const buffer = await libro.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo(detail, 'xlsx')
  link.click()
  URL.revokeObjectURL(url)
}