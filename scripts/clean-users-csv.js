const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const inputPath = path.join(__dirname, '..', 'public', 'screenshot', 'importar usuarios.csv');
const outputPath = path.join(__dirname, '..', 'public', 'screenshot', 'importar_usuarios_clean.csv');

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseDate(val) {
  if (!val) return '';
  const clean = String(val).trim();
  if (!clean) return '';
  const parts = clean.split(/[\/\-]/).map(p => p.trim());
  if (parts.length === 3) {
    const [a,b,c] = parts;
    if (a.length === 4) {
      // YYYY-MM-DD
      return `${a.padStart(4,'0')}-${b.padStart(2,'0')}-${c.padStart(2,'0')}`;
    }
    // assume DD/MM/YYYY or DD/MM/YY
    const day = a.padStart(2,'0');
    const month = b.padStart(2,'0');
    let year = c;
    if (year.length === 2) {
      const y = parseInt(year,10);
      year = y > 30 ? ('19' + year) : ('20' + year);
    }
    return `${year.padStart(4,'0')}-${month}-${day}`;
  }
  // try ISO
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return '';
}

function parseBoolean(val) {
  if (!val) return false;
  const lower = String(val).trim().toLowerCase();
  if (/\d/.test(lower)) return true; // e.g. "3 años"
  return ['si','sí','yes','true','1','y','s'].some(x => lower.includes(x));
}

function extractAges(val) {
  if (!val) return '';
  const found = String(val).match(/\d{1,2}/g);
  if (!found) return '';
  return found.join(',');
}

if (!fs.existsSync(inputPath)) {
  console.error('No existe el CSV de entrada:', inputPath);
  process.exit(1);
}

const src = fs.readFileSync(inputPath, 'utf8');
const sep = src.includes(';') ? ';' : ',';
const parsed = Papa.parse(src, { delimiter: sep, skipEmptyLines: true });
const rows = parsed.data;
if (!rows || rows.length < 2) {
  console.error('CSV vacío o sin filas');
  process.exit(1);
}

const headers = rows[0].map(h => normalize(h));
function idx(keys) {
  for (const k of keys) {
    const i = headers.findIndex(h => h.includes(normalize(k)));
    if (i !== -1) return i;
  }
  return -1;
}

const COL = {
  nombre: idx(['nombre','name']),
  correo: idx(['correo','email','mail']),
  cedula: idx(['cedula','ci']),
  nacimiento: idx(['nacimiento','fecha','dob','fecha de nacimiento']),
  telefono: idx(['telefono','phone']),
  telefonoOpc: idx(['opcional','emergenc','telefono opcional','telefonoopcional']),
  direccion: idx(['direccion','address']),
  ninos: idx(['nino','children','viaja','viaja con ninos']),
  edadesNinos: idx(['edad','age','edades']),
  salud: idx(['enfermedad','lesion','salud','health']),
  haViajado: idx(['viajado','destino','traveled','ha viajado']),
  destino: idx(['destino','cual','cual destino'])
};

const outRows = [];
const headerOut = [
  'Nombre',
  'Correo',
  'Cedula',
  'FechaNacimiento',
  'Telefono',
  'TelefonoOpcional',
  'Direccion',
  'ViajaConNinos',
  'EdadesNinos',
  'CondicionesSalud',
  'HaViajadoConDestinos',
  'UltimoDestino'
];

let created = 0, skipped = 0;
for (let i = 1; i < rows.length; i++) {
  const cols = rows[i].map(c => String(c || '').trim().replace(/^"|"$/g, ''));
  const email = COL.correo >= 0 ? cols[COL.correo] : '';
  if (!email || !email.includes('@')) { skipped++; continue; }
  const nombre = COL.nombre >=0 ? cols[COL.nombre] : '';
  const cedula = COL.cedula >=0 ? cols[COL.cedula].replace(/\s+/g,'') : '';
  const fecha = parseDate(COL.nacimiento >=0 ? cols[COL.nacimiento] : '');
  const tel = COL.telefono >=0 ? cols[COL.telefono] : '';
  const telOpt = COL.telefonoOpc >=0 ? cols[COL.telefonoOpc] : '';
  const dir = COL.direccion >=0 ? cols[COL.direccion] : '';
  const rawNinos = COL.ninos >=0 ? cols[COL.ninos] : '';
  const rawEdades = COL.edadesNinos >=0 ? cols[COL.edadesNinos] : '';
  const travelsWithChildren = parseBoolean(rawNinos) || parseBoolean(rawEdades);
  const childrenAges = extractAges(rawEdades) || extractAges(rawNinos);
  const salud = COL.salud >=0 ? cols[COL.salud] : '';
  const rawViajado = COL.haViajado >=0 ? cols[COL.haViajado] : '';
  const hasViajado = parseBoolean(rawViajado);
  const dest = COL.destino >=0 ? cols[COL.destino] : '';

  outRows.push([
    nombre,
    email,
    cedula,
    fecha,
    tel,
    telOpt,
    dir,
    travelsWithChildren ? 'Si' : 'No',
    childrenAges,
    salud,
    hasViajado ? 'Si' : 'No',
    dest
  ]);
  created++;
}

const csvOut = Papa.unparse({ fields: headerOut, data: outRows });
fs.writeFileSync(outputPath, csvOut, 'utf8');
console.log(`Procesadas: ${rows.length-1}, filas válidas: ${created}, filas omitidas: ${skipped}`);
console.log('Archivo limpio creado en:', outputPath);
