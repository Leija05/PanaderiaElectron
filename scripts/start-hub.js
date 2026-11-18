const { spawn } = require('child_process');
const path = require('path');
const buildHub = require('./build-hub.js');

async function main() {
  console.log('[DulceHorno Hub Launcher] Preparando entorno de Centro de Mando...');

  // 1. Compilar interfaz React del Hub
  await buildHub();

  // 2. Levantar el broker de soporte en segundo plano si aún no está activo
  try {
    const { startRelayServer } = require('../server/relay-server.js');
    await startRelayServer(4800);
    console.log('[DulceHorno Hub Launcher] Broker de enlace activo en puerto 4800.');
  } catch (e) {
    console.log('[DulceHorno Hub Launcher] Broker activo externamente o advertencia:', e.message);
  }

  // 3. Lanzar la ventana Electron del Hub
  const electronBin = require('electron');
  const hubMainPath = path.join(__dirname, '..', 'src', 'hub', 'main.js');

  console.log('[DulceHorno Hub Launcher] Lanzando ventana de DulceHorno Central Hub...');
  const child = spawn(electronBin, [hubMainPath], {
    stdio: 'inherit'
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error('[DulceHorno Hub Launcher] Error iniciando:', err);
  process.exit(1);
});
