'use strict';
/* xlsx-lite.js — GENERADOR DE EXCEL (.xlsx) SIN DEPENDENCIAS
   Arma un libro con varias hojas: encabezado con color, filtros, primera fila fija,
   anchos de columna y celdas de estado resaltadas. Funciona sin internet.
   Uso: XLSX.download('archivo.xlsx', [{ name, cols:[ancho…], head:[…], rows:[[…]], title }])
   Celdas: texto, número o { v, s } con s = 'pct' | 'ok' | 'bad' | 'pend' | 'bold'.
   RS Consultora */

const XLSX = (() => {
  const enc = new TextEncoder();
  const CRC = (() => { const t = new Uint32Array(256); for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for(let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const xml = s => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));

  /** ZIP sin compresión (método "store"): válido para Excel, LibreOffice y Google Sheets. */
  function zip(files){
    const parts = [], central = []; let off = 0;
    const u16 = n => [n & 255, (n >>> 8) & 255], u32 = n => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
    files.forEach(f => {
      const name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
      const head = [0x50,0x4B,0x03,0x04, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)];
      parts.push(new Uint8Array(head), name, data);
      central.push(new Uint8Array([0x50,0x4B,0x01,0x02, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)]), name);
      off += head.length + name.length + data.length;
    });
    const csize = central.reduce((s, p) => s + p.length, 0);
    const end = new Uint8Array([0x50,0x4B,0x05,0x06, 0,0, 0,0, ...u16(files.length), ...u16(files.length), ...u32(csize), ...u32(off), 0,0]);
    return new Blob([...parts, ...central, end], { type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Estilos: 0 normal · 1 encabezado · 2 texto · 3 número · 4 porcentaje · 5 ok · 6 bad · 7 pend · 8 título · 9 negrita
  const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="0&quot; %&quot;"/></numFmts>
<fonts count="4"><font><sz val="10.5"/><name val="Calibri"/></font><font><b/><sz val="10.5"/><name val="Calibri"/></font><font><b/><sz val="10.5"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>
<fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1F2933"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFDCF2E3"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFBE0DE"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF1C7"/></patternFill></fill></fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFD5DAE0"/></left><right style="thin"><color rgb="FFD5DAE0"/></right><top style="thin"><color rgb="FFD5DAE0"/></top><bottom style="thin"><color rgb="FFD5DAE0"/></bottom></border></borders>
<cellStyleXfs count="1"><xf/></cellStyleXfs>
<cellXfs count="10"><xf/>
<xf fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
<xf borderId="1" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
<xf borderId="1" applyBorder="1"/>
<xf numFmtId="164" borderId="1" applyNumberFormat="1" applyBorder="1"/>
<xf fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf fontId="1" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf fillId="5" borderId="1" applyFill="1" applyBorder="1"/>
<xf fontId="3" applyFont="1"/>
<xf fontId="1" borderId="1" applyFont="1" applyBorder="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
  const SID = { pct:4, ok:5, bad:6, pend:7, bold:9 };
  const colName = i => { let s = ''; i++; while(i > 0){ const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };

  function cell(ref, v, s){
    if(v && typeof v === 'object' && !(v instanceof Date)){ s = SID[v.s] ?? s; v = v.v; }
    if(v == null || v === '') return s ? `<c r="${ref}" s="${s}"/>` : '';
    if(typeof v === 'number' && isFinite(v)) return `<c r="${ref}" s="${s === 2 ? 3 : s}"><v>${v}</v></c>`;
    let t = String(v); if(/^[=+\-@]/.test(t)) t = "'" + t;   // evita fórmulas inyectadas
    return `<c r="${ref}" t="inlineStr" s="${s}"><is><t xml:space="preserve">${xml(t)}</t></is></c>`;
  }
  function sheetXML(sh){
    const out = []; let r = 1;
    if(sh.title){ out.push(`<row r="${r}" ht="22" customHeight="1">${cell('A' + r, sh.title, 8)}</row>`); r++;
      if(sh.subtitle){ out.push(`<row r="${r}">${cell('A' + r, sh.subtitle, 0)}</row>`); r++; } r++; }
    const headRow = r, n = sh.head.length;
    out.push(`<row r="${r}" ht="30" customHeight="1">${sh.head.map((h, i) => cell(colName(i) + r, h, 1)).join('')}</row>`); r++;
    sh.rows.forEach(row => { out.push(`<row r="${r}">${row.map((v, i) => cell(colName(i) + r, v, 2)).join('')}</row>`); r++; });
    const cols = (sh.cols || []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
    const last = colName(n - 1) + Math.max(headRow, r - 1);
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="${headRow}" topLeftCell="A${headRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${out.join('')}</sheetData>
${sh.rows.length ? `<autoFilter ref="A${headRow}:${last}"/>` : ''}
<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
  }
  function book(sheets){
    const names = sheets.map((s, i) => String(s.name || 'Hoja ' + (i + 1)).replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
    const files = [
      { name:'[Content_Types].xml', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${names.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
      { name:'_rels/.rels', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { name:'xl/workbook.xml', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${names.map((n, i) => `<sheet name="${xml(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
      { name:'xl/_rels/workbook.xml.rels', data:`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${names.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${names.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name:'xl/styles.xml', data:STYLES },
      ...sheets.map((s, i) => ({ name:`xl/worksheets/sheet${i + 1}.xml`, data:sheetXML(s) }))
    ];
    return zip(files);
  }
  function download(filename, sheets){
    const url = URL.createObjectURL(book(sheets)), a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  return { book, download };
})();
