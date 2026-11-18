const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function setupAutostart(enable = true) {
  const startupFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  const vbsPath = path.join(startupFolder, 'DulceHorno_AutoStart.vbs');
  const projectDir = path.resolve(__dirname, '..');

  if (!enable) {
    if (fs.existsSync(vbsPath)) {
      fs.unlinkSync(vbsPath);
      console.log('[DulceHorno AutoStart] Inicio automático deshabilitado (archivo VBS eliminado).');
    }
    return { enabled: false };
  }

  if (!fs.existsSync(startupFolder)) {
    fs.mkdirSync(startupFolder, { recursive: true });
  }

  // Script VBS silencioso: inicia MySQL (servicio o XAMPP) y lanza DulceHorno sin ventanas negras
  const vbsLines = [
    'Set WshShell = CreateObject("WScript.Shell")',
    'On Error Resume Next',
    '\' 1. Intentar iniciar servicio MySQL',
    'WshShell.Run "net start mysql", 0, True',
    '\' 2. Si no es servicio, intentar iniciar mysqld de XAMPP de forma silenciosa',
    'Dim fso',
    'Set fso = CreateObject("Scripting.FileSystemObject")',
    'If fso.FileExists("C:\\xampp\\mysql\\bin\\mysqld.exe") Then',
    '  WshShell.Run "C:\\xampp\\mysql\\bin\\mysqld.exe --defaults-file=C:\\xampp\\mysql\\bin\\my.ini --standalone", 0, False',
    'End If',
    'WScript.Sleep 1500',
    '\' 3. Lanzar Punto de Venta DulceHorno',
    `WshShell.CurrentDirectory = "${projectDir}"`,
    'WshShell.Run "cmd /c npm start", 0, False',
    ''
  ];

  fs.writeFileSync(vbsPath, vbsLines.join('\r\n'), 'utf8');
  console.log(`[DulceHorno AutoStart] Inicio automático configurado exitosamente en:`);
  console.log(` -> ${vbsPath}`);
  console.log(`Al encender la computadora, Windows iniciará automáticamente MySQL y DulceHorno POS.`);

  return { enabled: true, path: vbsPath };
}

if (require.main === module) {
  const arg = process.argv[2];
  const enable = arg !== 'disable' && arg !== '--disable';
  setupAutostart(enable);
}

module.exports = { setupAutostart };
