const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 4800);
const DEV_SECRET = process.env.DEV_SECRET || 'dulcehorno_master_key_2026';

// Registro en memoria de sucursales conectadas
// Map<clientId, { socket, info, connectedAt, lastPing, ip }>
const clients = new Map();

// Registro de Hubs (aplicaciones master del programador)
// Set<WebSocket>
const hubs = new Set();

// Mapa de comandos en vuelo: Map<commandId, { hubSocket, timeoutId }>
const pendingCommands = new Map();

const server = http.createServer((req, res) => {
  // Encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health' || url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ONLINE',
      service: 'DulceHorno Cloud Relay Broker',
      version: '1.1.0',
      connectedBranches: clients.size,
      connectedHubs: hubs.size,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    }, null, 2));
    return;
  }

  if (url.pathname === '/api/branches') {
    const authHeader = req.headers.authorization || '';
    if (authHeader !== `Bearer ${DEV_SECRET}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Acceso no autorizado al broker.' }));
      return;
    }

    const branchList = Array.from(clients.values()).map((c) => ({
      ...c.info,
      ip: c.ip,
      connectedAt: c.connectedAt,
      lastPing: c.lastPing
    }));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: branchList.length, branches: branchList }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

const wss = new WebSocketServer({ server });

// Evitar que errores como EADDRINUSE generen 'Unhandled error' en la instancia WebSocketServer
wss.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    return;
  }
  console.warn('[Relay WebSocket] Error en servidor WebSocket:', err.message);
});

function broadcastClientListToHubs() {
  if (hubs.size === 0) return;
  const branchList = Array.from(clients.values()).map((c) => ({
    ...c.info,
    ip: c.ip,
    connectedAt: c.connectedAt,
    lastPing: c.lastPing,
    online: true
  }));

  const payload = JSON.stringify({
    type: 'branch_list',
    branches: branchList,
    timestamp: new Date().toISOString()
  });

  for (const hubSocket of hubs) {
    if (hubSocket.readyState === WebSocket.OPEN) {
      hubSocket.send(payload);
    }
  }
}

wss.on('connection', (ws, req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  let clientRole = null;
  let registeredClientId = null;

  console.log(`[Relay] Nueva conexión entrante desde ${ip}`);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      // 1. Registro de Sucursal POS (Cliente)
      if (data.type === 'register_branch') {
        clientRole = 'branch';
        registeredClientId = String(data.branchId || crypto.randomUUID());

        const clientInfo = {
          branchId: registeredClientId,
          branchName: data.branchName || 'Panadería Dulce Horno - Sucursal',
          version: data.version || '1.1.0',
          sessionPin: data.sessionPin || 'DH-0000',
          system: data.system || {},
          license: data.license || {}
        };

        // Si ya existía conexión previa con ese ID, cerrar la anterior limpiamente
        if (clients.has(registeredClientId)) {
          try {
            clients.get(registeredClientId).socket.close();
          } catch (_) {}
        }

        clients.set(registeredClientId, {
          socket: ws,
          info: clientInfo,
          connectedAt: new Date().toISOString(),
          lastPing: Date.now(),
          ip
        });

        console.log(`[Relay] Sucursal registrada: "${clientInfo.branchName}" (ID: ${registeredClientId})`);

        ws.send(JSON.stringify({
          type: 'registered_ack',
          branchId: registeredClientId,
          status: 'CONNECTED',
          message: 'Conectado exitosamente al broker de soporte DulceHorno.'
        }));

        broadcastClientListToHubs();
        return;
      }

      // 2. Autenticación de App Master del Programador (Hub)
      if (data.type === 'auth_hub') {
        if (data.secretKey !== DEV_SECRET) {
          ws.send(JSON.stringify({
            type: 'auth_error',
            message: 'Clave de seguridad del Hub incorrecta.'
          }));
          ws.close();
          return;
        }

        clientRole = 'hub';
        hubs.add(ws);
        console.log(`[Relay] DulceHorno Hub Central autenticado exitosamente.`);

        ws.send(JSON.stringify({
          type: 'auth_ok',
          message: 'Autenticación exitosa. Canal de control remoto activo.'
        }));

        broadcastClientListToHubs();
        return;
      }

      // 3. Heartbeat / Ping de Sucursal
      if (data.type === 'ping') {
        if (registeredClientId && clients.has(registeredClientId)) {
          clients.get(registeredClientId).lastPing = Date.now();
        }
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        return;
      }

      // 4. El Hub envía un comando a una Sucursal
      if (data.type === 'remote_command') {
        if (clientRole !== 'hub') {
          ws.send(JSON.stringify({ type: 'error', message: 'Solo el Hub puede enviar comandos remotos.' }));
          return;
        }

        const { targetBranchId, commandId = crypto.randomUUID(), action, payload } = data;
        const targetClient = clients.get(targetBranchId);

        if (!targetClient || targetClient.socket.readyState !== WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'command_response',
            commandId,
            success: false,
            error: `La sucursal destino (${targetBranchId}) no está en línea en este momento.`
          }));
          return;
        }

        // Guardar referencia para reenviar la respuesta cuando la sucursal termine
        const timeoutId = setTimeout(() => {
          if (pendingCommands.has(commandId)) {
            pendingCommands.delete(commandId);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'command_response',
                commandId,
                success: false,
                error: 'Tiempo de espera agotado (timeout de 35s) esperando respuesta de la sucursal.'
              }));
            }
          }
        }, 35000);

        pendingCommands.set(commandId, { hubSocket: ws, timeoutId });

        // Enviar a la sucursal cliente
        targetClient.socket.send(JSON.stringify({
          type: 'execute_action',
          commandId,
          action,
          payload
        }));
        return;
      }

      // 5. La Sucursal responde con el resultado del comando
      if (data.type === 'action_result') {
        const { commandId, success, result, error } = data;
        const pending = pendingCommands.get(commandId);
        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingCommands.delete(commandId);

          if (pending.hubSocket.readyState === WebSocket.OPEN) {
            pending.hubSocket.send(JSON.stringify({
              type: 'command_response',
              commandId,
              success,
              result,
              error
            }));
          }
        }
        return;
      }
    } catch (err) {
      console.error('[Relay] Error procesando mensaje WebSocket:', err.message);
    }
  });

  ws.on('close', () => {
    if (clientRole === 'branch' && registeredClientId) {
      console.log(`[Relay] Sucursal desconectada: ID ${registeredClientId}`);
      clients.delete(registeredClientId);
      broadcastClientListToHubs();
    } else if (clientRole === 'hub') {
      console.log('[Relay] Hub desconectado.');
      hubs.delete(ws);
    }
  });

  ws.on('error', (err) => {
    console.warn('[Relay] Error de socket:', err.message);
  });
});

// Limpieza periódica de clientes zombis que no respondan ping (> 45s)
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  let changed = false;
  for (const [id, client] of clients.entries()) {
    if (now - client.lastPing > 45000) {
      console.log(`[Relay] Expulsando cliente inactivo por timeout de ping: ${id}`);
      try {
        client.socket.terminate();
      } catch (_) {}
      clients.delete(id);
      changed = true;
    }
  }
  if (changed) {
    broadcastClientListToHubs();
  }
}, 20000);
if (cleanupTimer.unref) cleanupTimer.unref();

let isRunning = false;

function startRelayServer(port = PORT) {
  if (isRunning) return Promise.resolve(server);

  return new Promise((resolve) => {
    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        resolve(server);
      }
    };

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Relay] Puerto ${port} ya está en uso. Broker activo externamente.`);
        isRunning = true;
      } else {
        console.error('[Relay] Error en servidor HTTP/WS:', err.message);
      }
      done();
    });

    try {
      server.listen(port, '0.0.0.0', () => {
        isRunning = true;
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log(`║   DULCE HORNO CLOUD RELAY BROKER - EN LÍNEA           ║`);
        console.log(`║   Puerto: ${port} (0.0.0.0:${port})                   ║`);
        console.log(`║   Health: http://localhost:${port}/health                 ║`);
        console.log('╚════════════════════════════════════════════════════════╝');
        done();
      });
    } catch (e) {
      if (e.code === 'EADDRINUSE') {
        isRunning = true;
      }
      done();
    }
  });
}

function getRelayServerStatus() {
  return {
    isRunning,
    port: PORT,
    connectedBranches: clients.size,
    connectedHubs: hubs.size
  };
}

if (require.main === module) {
  startRelayServer(PORT);
}

module.exports = {
  server,
  startRelayServer,
  getRelayServerStatus
};
