const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

/**
 * Generador de Reporte Ejecutivo Único en Excel (.xlsx) para Panadería Dulce Horno
 * Estructura profesional en una sola hoja unificada:
 * - Membrete Corporativo con Logo Oficial
 * - Indicadores Clave de Rendimiento (KPIs)
 * - Distribución de Ventas por Canal (Caja Mostrador vs Autocobro)
 * - Ranking de Panes con Mayor Demanda (Top Vendidos)
 * - Registro Detallado de Ventas con fórmulas de suma nativas y resultados precalculados
 */
async function generateExecutiveExcel({ reportData, auxiliarData = [], storeInfo = {} }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dulce Horno - Punto de Venta';
  workbook.lastModifiedBy = storeInfo.nombrePanaderia || 'Dulce Horno';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Paleta de Identidad Panadería Dulce Horno
  const brandColorPrimary = 'C67F43';   // Caramelo panadero
  const brandColorDark = '8B5A2B';      // Cacao tostado profundo
  const brandColorSecondary = 'E8B882'; // Trigo dorado
  const brandColorCream = 'FFF9F0';     // Crema suave de fondo de filas
  const brandColorSurface = 'FDF6E3';   // Fondo cálido de tarjetas

  const thinBorder = {
    top: { style: 'thin', color: { argb: 'FFE8DCCF' } },
    left: { style: 'thin', color: { argb: 'FFE8DCCF' } },
    bottom: { style: 'thin', color: { argb: 'FFE8DCCF' } },
    right: { style: 'thin', color: { argb: 'FFE8DCCF' } }
  };

  const totalBorder = {
    top: { style: 'thin', color: { argb: 'FF8B5A2B' } },
    bottom: { style: 'double', color: { argb: 'FF8B5A2B' } },
    left: { style: 'thin', color: { argb: 'FFE8DCCF' } },
    right: { style: 'thin', color: { argb: 'FFE8DCCF' } }
  };

  // Hoja única de reporte ejecutivo
  const ws = workbook.addWorksheet('Reporte de Ventas', {
    views: [{ showGridLines: true }]
  });

  // Configuración de anchos de columna (A a H)
  ws.columns = [
    { key: 'colA', width: 12 }, // # Folio
    { key: 'colB', width: 22 }, // Fecha y Hora
    { key: 'colC', width: 18 }, // Canal de Venta
    { key: 'colD', width: 26 }, // Atendido Por
    { key: 'colE', width: 26 }, // Cliente
    { key: 'colF', width: 16 }, // Subtotal ($)
    { key: 'colG', width: 16 }, // IVA ($)
    { key: 'colH', width: 18 }  // Total ($)
  ];

  // 1. Insertar Logo Oficial si existe
  const logoPath = path.resolve(__dirname, '..', '..', 'assets', 'icon.png');
  if (fs.existsSync(logoPath)) {
    try {
      const logoId = workbook.addImage({ filename: logoPath, extension: 'png' });
      ws.addImage(logoId, {
        tl: { col: 0.15, row: 0.5 },
        ext: { width: 62, height: 62 }
      });
    } catch (e) {
      console.warn('Aviso: No se pudo incrustar el logo en Excel:', e.message);
    }
  }

  // Extracción robusta de datos del reporte
  const ventas = reportData?.ventas || [];
  const resumen = reportData?.resumen || reportData?.summary || {};
  const range = reportData?.range || {};
  const startDateStr = range.start ? String(range.start).slice(0, 10) : 'N/A';
  const endDateStr = range.end ? String(range.end).slice(0, 10) : 'N/A';

  const totalIngresos = Number(resumen.totalIngresos || ventas.reduce((acc, v) => acc + Number(v.Total || 0), 0));
  const totalSubtotal = ventas.reduce((acc, v) => acc + Number(v.Subtotal || 0), 0);
  const totalIva = ventas.reduce((acc, v) => acc + Number(v.Iva || 0), 0);
  const totalPiezas = Number(resumen.articulosVendidos || 0);
  const ticketPromedio = ventas.length > 0 ? (totalIngresos / ventas.length) : 0;

  // 2. Membrete Corporativo
  ws.mergeCells('B2:H2');
  const titleCell = ws.getCell('B2');
  titleCell.value = (storeInfo.nombrePanaderia || 'PANADERÍA DULCE HORNO').toUpperCase();
  titleCell.font = { name: 'Georgia', size: 16, bold: true, color: { argb: `FF${brandColorDark}` } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  ws.mergeCells('B3:H3');
  const subCell = ws.getCell('B3');
  subCell.value = 'Reporte Financiero y Operativo de Ventas • Sistema Punto de Venta';
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF7D6B5B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  ws.mergeCells('B4:H4');
  const metaCell = ws.getCell('B4');
  const rfcStr = storeInfo.rfcTienda ? ` | RFC: ${storeInfo.rfcTienda}` : '';
  metaCell.value = `Periodo Analizado: ${startDateStr} al ${endDateStr}${rfcStr} | Emitido: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`;
  metaCell.font = { name: 'Calibri', size: 9, color: { argb: 'FFA89A8C' } };
  metaCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  ws.getRow(5).height = 10;

  // 3. Indicadores Clave de Rendimiento (KPIs)
  ws.mergeCells('A6:H6');
  const kpiTitle = ws.getCell('A6');
  kpiTitle.value = 'INDICADORES CLAVE DE RENDIMIENTO (KPIs)';
  kpiTitle.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
  kpiTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorDark}` } };
  kpiTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(6).height = 22;

  const kpiCards = [
    { col1: 'A', col2: 'B', lbl: 'INGRESOS TOTALES', val: totalIngresos, isMoney: true },
    { col1: 'C', col2: 'D', lbl: 'TICKETS COBRADOS', val: ventas.length, isMoney: false },
    { col1: 'E', col2: 'F', lbl: 'TICKET PROMEDIO', val: ticketPromedio, isMoney: true },
    { col1: 'G', col2: 'H', lbl: 'PIEZAS DE PAN VENDIDAS', val: totalPiezas, isMoney: false }
  ];

  ws.getRow(7).height = 18;
  ws.getRow(8).height = 26;

  kpiCards.forEach(c => {
    ws.mergeCells(`${c.col1}7:${c.col2}7`);
    const lbl = ws.getCell(`${c.col1}7`);
    lbl.value = c.lbl;
    lbl.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF7D6B5B' } };
    lbl.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorSurface}` } };
    lbl.alignment = { vertical: 'middle', horizontal: 'center' };
    lbl.border = thinBorder;

    ws.mergeCells(`${c.col1}8:${c.col2}8`);
    const val = ws.getCell(`${c.col1}8`);
    val.value = c.val;
    val.font = { name: 'Georgia', size: 13, bold: true, color: { argb: `FF${brandColorDark}` } };
    val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    val.alignment = { vertical: 'middle', horizontal: 'center' };
    val.border = thinBorder;
    if (c.isMoney) {
      val.numFmt = '"$"#,##0.00';
    } else {
      val.numFmt = '#,##0';
    }
  });

  ws.getRow(9).height = 12;

  // 4. Secciones Paralelas: Canales de Venta (A-D) y Top Panes Vendidos (E-H)
  ws.mergeCells('A10:D10');
  const chHeader = ws.getCell('A10');
  chHeader.value = 'VENTAS POR CANAL DE VENTA';
  chHeader.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  chHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorPrimary}` } };
  chHeader.alignment = { vertical: 'middle', horizontal: 'center' };

  ws.mergeCells('E10:H10');
  const topHeader = ws.getCell('E10');
  topHeader.value = 'PANES CON MAYOR DEMANDA (TOP VENDIDOS)';
  topHeader.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  topHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorPrimary}` } };
  topHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(10).height = 20;

  // Encabezados Canales
  ws.mergeCells('A11:B11');
  ws.getCell('A11').value = 'Canal';
  ws.getCell('C11').value = 'Tickets';
  ws.getCell('D11').value = 'Total Facturado';
  ['A11', 'B11', 'C11', 'D11'].forEach(c => {
    const cell = ws.getCell(c);
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF5C4A3A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorSecondary}` } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });

  // Encabezados Top Productos
  ws.getCell('E11').value = 'Pos.';
  ws.getCell('F11').value = 'Pan Artesanal';
  ws.getCell('G11').value = 'Piezas';
  ws.getCell('H11').value = 'Total ($)';
  ['E11', 'F11', 'G11', 'H11'].forEach(c => {
    const cell = ws.getCell(c);
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF5C4A3A' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorSecondary}` } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  });
  ws.getRow(11).height = 18;

  // Cálculo preciso de Canales a partir de la lista de ventas
  const mostradorVentas = ventas.filter(v => v.Canal !== 'Autocobro');
  const autocobroVentas = ventas.filter(v => v.Canal === 'Autocobro');
  const mostradorTotal = mostradorVentas.reduce((a, b) => a + Number(b.Total || 0), 0);
  const autocobroTotal = autocobroVentas.reduce((a, b) => a + Number(b.Total || 0), 0);

  const channelData = [
    { name: 'Caja Mostrador (Atendido por Empleado)', tickets: mostradorVentas.length, total: mostradorTotal },
    { name: 'Terminal Autocobro (Clientes)', tickets: autocobroVentas.length, total: autocobroTotal },
    { name: 'TOTAL CANALES', tickets: ventas.length, total: totalIngresos, isTotal: true }
  ];

  channelData.forEach((ch, idx) => {
    const rNum = 12 + idx;
    ws.mergeCells(`A${rNum}:B${rNum}`);
    const nameCell = ws.getCell(`A${rNum}`);
    nameCell.value = ch.name;
    nameCell.font = { name: 'Calibri', size: 9, bold: Boolean(ch.isTotal) };
    nameCell.border = ch.isTotal ? totalBorder : thinBorder;
    if (ch.isTotal) nameCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorSurface}` } };

    const tCell = ws.getCell(`C${rNum}`);
    tCell.value = ch.tickets;
    tCell.font = { name: 'Calibri', size: 9, bold: Boolean(ch.isTotal) };
    tCell.alignment = { horizontal: 'center' };
    tCell.numFmt = '#,##0';
    tCell.border = ch.isTotal ? totalBorder : thinBorder;
    if (ch.isTotal) tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorSurface}` } };

    const totCell = ws.getCell(`D${rNum}`);
    totCell.value = ch.total;
    totCell.font = { name: 'Calibri', size: 9, bold: true, color: ch.isTotal ? { argb: `FF${brandColorDark}` } : undefined };
    totCell.alignment = { horizontal: 'right' };
    totCell.numFmt = '"$"#,##0.00';
    totCell.border = ch.isTotal ? totalBorder : thinBorder;
    if (ch.isTotal) totCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorSurface}` } };
  });

  // Top Productos (extraídos de productosMasVendidos o topProductos)
  const topList = (reportData?.productosMasVendidos || reportData?.topProductos || []).slice(0, 5);
  if (topList.length === 0) {
    ws.mergeCells('E12:H12');
    const emptyCell = ws.getCell('E12');
    emptyCell.value = 'Sin productos registrados en el periodo seleccionado';
    emptyCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF8C8C8C' } };
    emptyCell.alignment = { horizontal: 'center' };
    ['E12', 'F12', 'G12', 'H12'].forEach(c => ws.getCell(c).border = thinBorder);
  } else {
    topList.forEach((tp, idx) => {
      const rNum = 12 + idx;
      const posCell = ws.getCell(`E${rNum}`);
      posCell.value = `#${idx + 1}`;
      posCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: `FF${brandColorDark}` } };
      posCell.alignment = { horizontal: 'center' };
      posCell.border = thinBorder;

      const prodCell = ws.getCell(`F${rNum}`);
      prodCell.value = tp.producto || tp.nombre || `Art #${tp.idArticulo}`;
      prodCell.font = { name: 'Calibri', size: 9 };
      prodCell.border = thinBorder;

      const pzCell = ws.getCell(`G${rNum}`);
      pzCell.value = Number(tp.cantidadVendida || tp.cantidad || 0);
      pzCell.font = { name: 'Calibri', size: 9, bold: true };
      pzCell.alignment = { horizontal: 'center' };
      pzCell.numFmt = '#,##0';
      pzCell.border = thinBorder;

      const impCell = ws.getCell(`H${rNum}`);
      impCell.value = Number(tp.importe || tp.total || 0);
      impCell.font = { name: 'Calibri', size: 9, bold: true };
      impCell.alignment = { horizontal: 'right' };
      impCell.numFmt = '"$"#,##0.00';
      impCell.border = thinBorder;
    });
  }

  const nextSectionRow = Math.max(12 + channelData.length, 12 + Math.max(topList.length, 1)) + 1;
  ws.getRow(nextSectionRow).height = 14;

  // 5. Registro Detallado de Ventas (Auditoría de Tickets)
  const vHeaderRow = nextSectionRow + 1;
  ws.mergeCells(`A${vHeaderRow}:H${vHeaderRow}`);
  const vTitle = ws.getCell(`A${vHeaderRow}`);
  vTitle.value = `REGISTRO DETALLADO DE TICKETS (${startDateStr} al ${endDateStr})`;
  vTitle.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
  vTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorDark}` } };
  vTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(vHeaderRow).height = 22;

  const colNames = ['# Folio', 'Fecha y Hora', 'Canal de Venta', 'Atendido Por', 'Cliente', 'Subtotal ($)', 'IVA 16% ($)', 'Total ($)'];
  const vColsRow = vHeaderRow + 1;
  colNames.forEach((name, i) => {
    const colLetter = String.fromCharCode(65 + i);
    const cell = ws.getCell(`${colLetter}${vColsRow}`);
    cell.value = name;
    cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorPrimary}` } };
    cell.alignment = { vertical: 'middle', horizontal: i >= 5 ? 'right' : 'center' };
    cell.border = thinBorder;
  });
  ws.getRow(vColsRow).height = 20;

  let curRow = vColsRow + 1;
  const startDataRow = curRow;

  if (ventas.length === 0) {
    ws.mergeCells(`A${curRow}:H${curRow}`);
    const emptyVentas = ws.getCell(`A${curRow}`);
    emptyVentas.value = 'No se encontraron tickets de venta en el rango de fechas seleccionado.';
    emptyVentas.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF8C8C8C' } };
    emptyVentas.alignment = { horizontal: 'center' };
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => ws.getCell(`${col}${curRow}`).border = thinBorder);
    curRow++;
  } else {
    ventas.forEach((v, idx) => {
      const isEven = idx % 2 === 0;
      const bgArgb = isEven ? 'FFFFFFFF' : `FF${brandColorCream}`;

      const c1 = ws.getCell(`A${curRow}`);
      c1.value = Number(v.IdVenta);
      c1.alignment = { horizontal: 'center' };

      const c2 = ws.getCell(`B${curRow}`);
      c2.value = v.FechaVenta ? new Date(v.FechaVenta).toLocaleString('es-MX') : '-';
      c2.alignment = { horizontal: 'center' };

      const c3 = ws.getCell(`C${curRow}`);
      c3.value = v.Canal === 'Autocobro' ? 'Autocobro' : 'Caja Mostrador';
      c3.alignment = { horizontal: 'center' };

      const c4 = ws.getCell(`D${curRow}`);
      c4.value = v.EmpleadoNombre || (v.Canal === 'Autocobro' ? 'Terminal Autocobro' : 'Cajero');

      const c5 = ws.getCell(`E${curRow}`);
      c5.value = v.ClienteNombre || 'Público General';

      const c6 = ws.getCell(`F${curRow}`);
      c6.value = Number(v.Subtotal || 0);
      c6.numFmt = '"$"#,##0.00';
      c6.alignment = { horizontal: 'right' };

      const c7 = ws.getCell(`G${curRow}`);
      c7.value = Number(v.Iva || 0);
      c7.numFmt = '"$"#,##0.00';
      c7.alignment = { horizontal: 'right' };

      const c8 = ws.getCell(`H${curRow}`);
      c8.value = Number(v.Total || 0);
      c8.numFmt = '"$"#,##0.00';
      c8.font = { bold: true };
      c8.alignment = { horizontal: 'right' };

      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
        const cell = ws.getCell(`${col}${curRow}`);
        cell.border = thinBorder;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.font = { name: 'Calibri', size: 9, bold: cell.font?.bold || false };
      });

      ws.getRow(curRow).height = 18;
      curRow++;
    });

    const endDataRow = curRow - 1;

    // Fila final de TOTALES GENERALES con fórmulas nativas y resultados precálculados
    ws.mergeCells(`A${curRow}:E${curRow}`);
    const totLbl = ws.getCell(`A${curRow}`);
    totLbl.value = `TOTALES (${ventas.length} tickets cobrados):`;
    totLbl.font = { name: 'Georgia', size: 10, bold: true, color: { argb: `FF${brandColorDark}` } };
    totLbl.alignment = { vertical: 'middle', horizontal: 'right' };

    const totSub = ws.getCell(`F${curRow}`);
    totSub.value = { formula: `SUM(F${startDataRow}:F${endDataRow})`, result: totalSubtotal };
    totSub.numFmt = '"$"#,##0.00';
    totSub.font = { name: 'Calibri', size: 10, bold: true };
    totSub.alignment = { horizontal: 'right' };

    const totIva = ws.getCell(`G${curRow}`);
    totIva.value = { formula: `SUM(G${startDataRow}:G${endDataRow})`, result: totalIva };
    totIva.numFmt = '"$"#,##0.00';
    totIva.font = { name: 'Calibri', size: 10, bold: true };
    totIva.alignment = { horizontal: 'right' };

    const totTot = ws.getCell(`H${curRow}`);
    totTot.value = { formula: `SUM(H${startDataRow}:H${endDataRow})`, result: totalIngresos };
    totTot.numFmt = '"$"#,##0.00';
    totTot.font = { name: 'Georgia', size: 11, bold: true, color: { argb: `FF${brandColorDark}` } };
    totTot.alignment = { horizontal: 'right' };

    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
      const cell = ws.getCell(`${col}${curRow}`);
      cell.border = totalBorder;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${brandColorSurface}` } };
    });
    ws.getRow(curRow).height = 24;
  }

  // Generar Buffer del libro Excel
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = {
  generateExecutiveExcel
};
