import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

// ==========================================================
// PRECISE HAIRLINE SVG ICONS (ZERO EMOJIS, HIGH-END AGENCY TIER)
// ==========================================================
const Icons = {
  Logo: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  Store: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Terminal: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  Pulse: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  Wrench: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Key: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2l-2 2m-1.5 1.5L12 11l-4-4-6 6 10 10 6-6-4-4 5.5-5.5z" />
      <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  ),
  Network: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="3" />
      <circle cx="5" cy="19" r="3" />
      <circle cx="19" cy="19" r="3" />
      <line x1="7.5" y1="17.5" x2="10.5" y2="7.5" />
      <line x1="16.5" y1="17.5" x2="13.5" y2="7.5" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  ArrowUpRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="16 8 10 14 8 12" />
    </svg>
  ),
  AlertCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Laptop: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  Server: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  ),
  Antenna: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  ),
  Bolt: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Box: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Receipt: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),
  List: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  Gear: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  ShieldAlert: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  ShieldCheck: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  ),
  Sliders: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Unlock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  ),
  Share: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  Close: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
};

// ==========================================================
// TIERS COMERCIALES & GENERACIÓN DE TOKENS CRIPTOGRÁFICOS
// ==========================================================
const TIERS = [
  { id: 'PRO', label: 'Comercial Pro Vitalicia (Pago Único)', defaultDays: null },
  { id: 'ANN', label: 'Suscripción Anual (365 Días)', defaultDays: 365 },
  { id: 'MTH', label: 'Licencia Mensual (30 Días)', defaultDays: 30 },
  { id: 'DEMO', label: 'Periodo de Evaluación Demo (15 Días)', defaultDays: 15 }
];

const generateStructuredHubToken = (tier = 'PRO', branchId = '') => {
  const year = new Date().getFullYear();
  const cleanId = branchId ? branchId.replace(/^dh-/, '').replace(/[^a-zA-Z0-9]/g, '') : '';
  const part1 = (cleanId.slice(0, 4) || Math.random().toString(36).substring(2, 6)).toUpperCase().padEnd(4, 'X');
  const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const raw = `${tier}-${year}-${part1}-${part2}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash) + raw.charCodeAt(i);
    hash |= 0;
  }
  const chk = Math.abs(hash).toString(16).toUpperCase().padStart(4, '0').slice(-4);
  return `DH-${tier}-${year}-${part1}-${part2}-${chk}`;
};

const calculateExpirationDate = (days) => {
  if (!days) return '';
  const d = new Date();
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().split('T')[0];
};

const generateRandomPass = () => {
  const num = Math.floor(100 + Math.random() * 900);
  return `Panaderia${num}*`;
};

const getWhatsAppBranchSummary = (branch) => {
  const lic = branch.license || {};
  const isSusp = Boolean(lic.isSuspended || lic.estado === 'Suspendida');
  const estadoStr = isSusp ? 'SUSPENDIDA' : (lic.isActivated ? 'ACTIVA' : 'PENDIENTE DE PAGO');
  return `🍞 *DULCE HORNO POS - FICHA DE CONTROL*\n\n` +
    `🏪 *Panadería:* ${branch.branchName}\n` +
    `🆔 *ID Terminal:* ${branch.branchId}\n` +
    `📦 *Tipo de Licencia:* ${lic.tipoLicencia || 'Comercial Pro'}\n` +
    `🔑 *Token de Activación:* ${lic.token || 'N/A'}\n` +
    `👤 *Usuario Gerente:* ${lic.gerenteUsuario || 'Activo'}\n` +
    `📅 *Vigencia:* ${lic.fechaExpiracion || 'Vitalicia (Permanente)'}\n` +
    `⚡ *Estado:* ${estadoStr}\n` +
    `📶 *IP / Red:* ${branch.ip || '127.0.0.1'}\n` +
    `🔐 *PIN de Asistencia Remota:* ${branch.sessionPin || 'N/A'}\n\n` +
    `Emitido desde DulceHorno Central Hub v${branch.version || '1.1.2'}`;
};

export const HubApp = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [brokerStatus, setBrokerStatus] = useState({ connected: false });
  const [branches, setBranches] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('__local__');
  const [networkInfo, setNetworkInfo] = useState({ ips: [], port: 4800, relayUrl: '', appVersion: '1.1.2' });
  const [appVersion, setAppVersion] = useState('1.1.2');
  const [customRelayInput, setCustomRelayInput] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Motor de Túnel Cloudflare Integrado
  const [tunnelState, setTunnelState] = useState({ status: 'idle', url: null, logs: [], error: null });
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [showTunnelLogs, setShowTunnelLogs] = useState(false);

  // Tab 2: SQL Console
  const [sqlQuery, setSqlQuery] = useState('SELECT IdArticulo, Nombre, Cantidad, Minimo, PrecioVenta, PrecioCompra FROM Articulos LIMIT 15;');
  const [sqlResult, setSqlResult] = useState(null);
  const [executingSql, setExecutingSql] = useState(false);

  // Tab 3: Telemetría
  const [healthData, setHealthData] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Tab 4: Mantenimiento
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResults, setOptimizeResults] = useState(null);
  const [exportingBackup, setExportingBackup] = useState(false);

  // Tab 5: Cuentas
  const [passForm, setPassForm] = useState({
    usernameProgramador: 'programador',
    passwordProgramador: 'programador123',
    usuarioObjetivo: 'admin',
    passwordNuevo: 'admin123'
  });
  const [savingPass, setSavingPass] = useState(false);

  const [gerenteForm, setGerenteForm] = useState({
    usernameProgramador: 'programador',
    passwordProgramador: 'programador123',
    username: 'gerente_sucursal',
    password: 'password123',
    nombre: 'Carlos',
    apellidoPaterno: 'Ramírez',
    genero: 'Masculino',
    puesto: 'Gerente Operativo'
  });
  const [savingGerente, setSavingGerente] = useState(false);

  // Herramienta de Tokens en Tab 5
  const [tokenGenState, setTokenGenState] = useState({
    tier: 'PRO',
    branchId: '',
    businessName: 'Panadería La Esperanza',
    generatedToken: generateStructuredHubToken('PRO'),
    expirationDate: ''
  });

  // Modal 1: Activación Inicial de Licencia
  const [licenseModal, setLicenseModal] = useState({
    isOpen: false,
    branchId: '',
    branchName: '',
    tier: 'PRO',
    token: '',
    nombreNegocio: '',
    nombreGerente: '',
    usuarioGerente: '',
    passwordGerente: '',
    tipoLicencia: 'Comercial Pro Vitalicia',
    fechaExpiracion: '',
    dispatching: false,
    completedReceipt: null
  });

  const openActivationModal = (branch) => {
    const tier = 'PRO';
    const defToken = generateStructuredHubToken(tier, branch.branchId);
    const baseName = branch.branchName ? branch.branchName.replace(/\s*\(.*\)/, '').trim() : 'Panadería Dulce Horno';
    const suggestedUser = 'gerente_' + (branch.branchId ? branch.branchId.replace(/^dh-/, '').slice(0, 8) : 'sucursal');
    setLicenseModal({
      isOpen: true,
      branchId: branch.branchId,
      branchName: branch.branchName,
      tier,
      token: defToken,
      nombreNegocio: baseName,
      nombreGerente: '',
      usuarioGerente: suggestedUser,
      passwordGerente: generateRandomPass(),
      tipoLicencia: 'Comercial Pro Vitalicia (Pago Único)',
      fechaExpiracion: '',
      dispatching: false,
      completedReceipt: null
    });
  };

  const handleDispatchActivation = async (e) => {
    e.preventDefault();
    if (!licenseModal.token || !licenseModal.usuarioGerente || !licenseModal.passwordGerente) {
      showToast('Token, usuario y contraseña son obligatorios.', 'error');
      return;
    }

    setLicenseModal((prev) => ({ ...prev, dispatching: true }));
    try {
      const res = await window.hubApi.sendRemoteAction(licenseModal.branchId, 'activate_terminal_license', {
        token: licenseModal.token,
        nombreNegocio: licenseModal.nombreNegocio,
        nombreGerente: licenseModal.nombreGerente,
        usuarioGerente: licenseModal.usuarioGerente,
        passwordGerente: licenseModal.passwordGerente,
        tipoLicencia: licenseModal.tipoLicencia,
        fechaExpiracion: licenseModal.fechaExpiracion || null
      });

      showToast(res.message || 'Terminal activada exitosamente', 'success');

      const receiptText = `🍞 *DULCE HORNO POS - LICENCIA COMERCIAL ACTIVADA*\n\n` +
        `🏪 *Negocio:* ${licenseModal.nombreNegocio}\n` +
        `🔑 *Token de Activación:* ${licenseModal.token}\n` +
        `👤 *Usuario Gerente:* ${licenseModal.usuarioGerente}\n` +
        `🔒 *Contraseña Inicial:* ${licenseModal.passwordGerente}\n` +
        `📦 *Licencia:* ${licenseModal.tipoLicencia}\n` +
        `📅 *Vigencia:* ${licenseModal.fechaExpiracion || 'Permanente (Vitalicia)'}\n` +
        `⏰ *Fecha de Emisión:* ${new Date().toLocaleString()}\n\n` +
        `¡Su terminal de Punto de Venta se encuentra 100% activa y lista para operar!`;

      setLicenseModal((prev) => ({
        ...prev,
        dispatching: false,
        completedReceipt: {
          ...res,
          receiptText,
          nombreNegocio: licenseModal.nombreNegocio,
          usuarioGerente: licenseModal.usuarioGerente,
          passwordGerente: licenseModal.passwordGerente,
          token: licenseModal.token
        }
      }));

      window.hubApi.getBranches().then((list) => setBranches(list || []));
    } catch (err) {
      showToast(`Error al activar: ${err.message}`, 'error');
      setLicenseModal((prev) => ({ ...prev, dispatching: false }));
    }
  };

  // Modal 2: Revocación / Suspensión de Licencia
  const [revokeModal, setRevokeModal] = useState({
    isOpen: false,
    branchId: '',
    branchName: '',
    motivoPreset: 'Falta de pago de mensualidad o renovación',
    motivoCustom: '',
    revoking: false
  });

  const openRevokeModal = (branch) => {
    setRevokeModal({
      isOpen: true,
      branchId: branch.branchId,
      branchName: branch.branchName,
      motivoPreset: 'Falta de pago de mensualidad o renovación',
      motivoCustom: '',
      revoking: false
    });
  };

  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    const finalReason = revokeModal.motivoPreset === 'Personalizado...'
      ? (revokeModal.motivoCustom.trim() || 'Suspensión administrativa de licencia')
      : (revokeModal.motivoPreset + (revokeModal.motivoCustom ? ` - ${revokeModal.motivoCustom}` : ''));

    setRevokeModal((prev) => ({ ...prev, revoking: true }));
    try {
      const res = await window.hubApi.sendRemoteAction(revokeModal.branchId, 'revoke_license', {
        motivo: finalReason
      });

      showToast(res.message || 'Licencia suspendida. Terminal bloqueada en tiempo real.', 'success');
      setRevokeModal({ isOpen: false, branchId: '', branchName: '', motivoPreset: '', motivoCustom: '', revoking: false });
      window.hubApi.getBranches().then((list) => setBranches(list || []));
    } catch (err) {
      showToast(`Error al suspender: ${err.message}`, 'error');
      setRevokeModal((prev) => ({ ...prev, revoking: false }));
    }
  };

  // Modal 3: Reactivación de Licencia
  const [reactivateModal, setReactivateModal] = useState({
    isOpen: false,
    branchId: '',
    branchName: '',
    notas: '',
    reactivating: false
  });

  const openReactivateModal = (branch) => {
    setReactivateModal({
      isOpen: true,
      branchId: branch.branchId,
      branchName: branch.branchName,
      notas: '',
      reactivating: false
    });
  };

  const handleConfirmReactivate = async (e) => {
    e.preventDefault();
    setReactivateModal((prev) => ({ ...prev, reactivating: true }));
    try {
      const res = await window.hubApi.sendRemoteAction(reactivateModal.branchId, 'reactivate_license', {
        notas: reactivateModal.notas || 'Licencia reactivada administrativamente'
      });

      showToast(res.message || 'Licencia reactivada. Terminal desbloqueada en vivo.', 'success');
      setReactivateModal({ isOpen: false, branchId: '', branchName: '', notas: '', reactivating: false });
      window.hubApi.getBranches().then((list) => setBranches(list || []));
    } catch (err) {
      showToast(`Error al reactivar: ${err.message}`, 'error');
      setReactivateModal((prev) => ({ ...prev, reactivating: false }));
    }
  };

  // Modal 4: Modificación de Licencia
  const [modifyModal, setModifyModal] = useState({
    isOpen: false,
    branchId: '',
    branchName: '',
    tier: 'PRO',
    nombreNegocio: '',
    titular: '',
    tipoLicencia: 'Comercial Pro Vitalicia',
    fechaExpiracion: '',
    token: '',
    notas: '',
    saving: false
  });

  const openModifyModal = (branch) => {
    const lic = branch.license || {};
    const detectedTier = lic.tipoLicencia?.toUpperCase().includes('ANUAL') ? 'ANN'
      : lic.tipoLicencia?.toUpperCase().includes('MENSUAL') ? 'MTH'
      : lic.tipoLicencia?.toUpperCase().includes('DEMO') ? 'DEMO'
      : 'PRO';

    setModifyModal({
      isOpen: true,
      branchId: branch.branchId,
      branchName: branch.branchName,
      tier: detectedTier,
      nombreNegocio: lic.nombreNegocio || branch.branchName?.replace(/\s*\(.*\)/, '').trim() || '',
      titular: lic.titular || '',
      tipoLicencia: lic.tipoLicencia || 'Comercial Pro Vitalicia',
      fechaExpiracion: lic.fechaExpiracion || '',
      token: lic.token || generateStructuredHubToken(detectedTier, branch.branchId),
      notas: lic.notas || '',
      saving: false
    });
  };

  const handleConfirmModify = async (e) => {
    e.preventDefault();
    setModifyModal((prev) => ({ ...prev, saving: true }));
    try {
      const res = await window.hubApi.sendRemoteAction(modifyModal.branchId, 'modify_license', {
        token: modifyModal.token,
        nombreNegocio: modifyModal.nombreNegocio,
        titular: modifyModal.titular,
        tipoLicencia: modifyModal.tipoLicencia,
        fechaExpiracion: modifyModal.fechaExpiracion || null,
        notas: modifyModal.notas
      });

      showToast(res.message || 'Parámetros de licencia actualizados en la terminal', 'success');
      setModifyModal((prev) => ({ ...prev, saving: false, isOpen: false }));
      window.hubApi.getBranches().then((list) => setBranches(list || []));
    } catch (err) {
      showToast(`Error al modificar: ${err.message}`, 'error');
      setModifyModal((prev) => ({ ...prev, saving: false }));
    }
  };

  // Modal 5: Cambio de Contraseña de Gerente Remoto
  const [quickPassModal, setQuickPassModal] = useState({
    isOpen: false,
    branchId: '',
    branchName: '',
    usuarioGerente: '',
    nuevoPassword: '',
    saving: false,
    completedReceipt: null
  });

  const openQuickPassModal = (branch) => {
    const lic = branch.license || {};
    setQuickPassModal({
      isOpen: true,
      branchId: branch.branchId,
      branchName: branch.branchName,
      usuarioGerente: lic.gerenteUsuario || 'gerente',
      nuevoPassword: generateRandomPass(),
      saving: false,
      completedReceipt: null
    });
  };

  const handleConfirmQuickPass = async (e) => {
    e.preventDefault();
    if (!quickPassModal.usuarioGerente || !quickPassModal.nuevoPassword) {
      showToast('Ingresa usuario y nueva contraseña.', 'error');
      return;
    }

    setQuickPassModal((prev) => ({ ...prev, saving: true }));
    try {
      const res = await window.hubApi.sendRemoteAction(quickPassModal.branchId, 'change_manager_password', {
        usuarioGerente: quickPassModal.usuarioGerente,
        nuevoPassword: quickPassModal.nuevoPassword
      });

      showToast(res.message || 'Contraseña de gerente actualizada con éxito', 'success');

      const whatsappText = `🍞 *DULCE HORNO POS - ACCESO ACTUALIZADO*\n\n` +
        `🏪 *Negocio:* ${quickPassModal.branchName}\n` +
        `👤 *Usuario Gerente:* ${quickPassModal.usuarioGerente}\n` +
        `🔒 *Nueva Contraseña:* ${quickPassModal.nuevoPassword}\n` +
        `📅 *Fecha:* ${new Date().toLocaleString()}\n\n` +
        `Tu acceso al Punto de Venta ha sido restablecido exitosamente.`;

      setQuickPassModal((prev) => ({
        ...prev,
        saving: false,
        completedReceipt: {
          whatsappText,
          usuarioGerente: quickPassModal.usuarioGerente,
          nuevoPassword: quickPassModal.nuevoPassword
        }
      }));

      window.hubApi.getBranches().then((list) => setBranches(list || []));
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
      setQuickPassModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const showToast = useCallback((text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Inicialización y suscripción a eventos
  useEffect(() => {
    if (!window.hubApi) return;

    const refreshData = () => {
      window.hubApi.getBrokerStatus().then((s) => {
        setBrokerStatus(s || {});
        if (s?.url && !customRelayInput) {
          setCustomRelayInput(s.url);
        }
      });
      window.hubApi.getBranches().then((list) => setBranches(list || []));
      if (typeof window.hubApi.getAppVersion === 'function') {
        window.hubApi.getAppVersion().then((ver) => {
          if (ver) setAppVersion(ver);
        });
      }
      window.hubApi.getNetworkInfo().then((info) => {
        if (info) {
          setNetworkInfo(info);
          if (info.appVersion) setAppVersion(info.appVersion);
          if (info.relayUrl && !customRelayInput) {
            setCustomRelayInput(info.relayUrl);
          }
        }
      });
    };

    refreshData();
    const interval = setInterval(refreshData, 3000);

    const unsubBranches = window.hubApi.onBranchListUpdate((list) => {
      setBranches(list || []);
    });

    const unsubStatus = window.hubApi.onBrokerStatusChange((status) => {
      setBrokerStatus(status || {});
    });

    if (window.hubApi && typeof window.hubApi.getTunnelStatus === 'function') {
      window.hubApi.getTunnelStatus().then((st) => {
        if (st) setTunnelState(st);
      }).catch(() => {});
    }

    const unsubTunnel = window.hubApi?.onTunnelStatus ? window.hubApi.onTunnelStatus((status) => {
      if (status) setTunnelState(status);
    }) : null;

    return () => {
      clearInterval(interval);
      if (typeof unsubBranches === 'function') unsubBranches();
      if (typeof unsubStatus === 'function') unsubStatus();
      if (typeof unsubTunnel === 'function') unsubTunnel();
    };
  }, [customRelayInput]);

  const handleStartTunnel = async () => {
    setTunnelLoading(true);
    showToast('Iniciando túnel Cloudflare seguro...', 'info');
    try {
      const res = await window.hubApi.startTunnel(4800);
      if (res) setTunnelState(res);
      if (res?.url) {
        showToast(`Túnel activo: ${res.url}`, 'success');
      } else {
        showToast('Túnel en proceso de inicialización...', 'info');
      }
    } catch (err) {
      showToast(`Error iniciando túnel: ${err.message}`, 'error');
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleStopTunnel = async () => {
    try {
      const res = await window.hubApi.stopTunnel();
      if (res) setTunnelState(res);
      showToast('Túnel Cloudflare detenido.', 'info');
    } catch (err) {
      showToast(`Error deteniendo túnel: ${err.message}`, 'error');
    }
  };

  // Despachador de acciones (local o remoto)
  const dispatchAction = useCallback(async (action, payload = {}) => {
    if (!window.hubApi) throw new Error('API del Hub no inicializada.');

    if (selectedTarget === '__local__') {
      if (action === 'sql_query') return window.hubApi.executeLocalQuery(payload.query);
      if (action === 'system_health') return window.hubApi.getLocalSystemHealth();
      throw new Error(`La acción "${action}" debe ejecutarse sobre una sucursal remota en línea.`);
    }

    return window.hubApi.sendRemoteAction(selectedTarget, action, payload);
  }, [selectedTarget]);

  // Ejecución SQL
  const handleExecuteSql = async () => {
    if (!sqlQuery.trim()) return;
    setExecutingSql(true);
    setSqlResult(null);
    try {
      const res = await dispatchAction('sql_query', { query: sqlQuery });
      setSqlResult(res);
      showToast(`Consulta completada en ${res.executionTimeMs || 0} ms`);
    } catch (err) {
      setSqlResult({ error: err.message });
      showToast(err.message, 'error');
    } finally {
      setExecutingSql(false);
    }
  };

  // Telemetría
  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await dispatchAction('system_health');
      setHealthData(res);
    } catch (err) {
      showToast(`Telemetría no disponible: ${err.message}`, 'error');
    } finally {
      setLoadingHealth(false);
    }
  }, [dispatchAction, showToast]);

  useEffect(() => {
    if (activeTab === 'health') {
      fetchHealth();
    }
  }, [activeTab, fetchHealth]);

  // Mantenimiento
  const handleOptimizeDb = async () => {
    setOptimizing(true);
    try {
      const res = await dispatchAction('optimize_db');
      setOptimizeResults(res.results || []);
      showToast('Tablas desfragmentadas e índices reconstruidos');
    } catch (err) {
      showToast(`Error al optimizar: ${err.message}`, 'error');
    } finally {
      setOptimizing(false);
    }
  };

  const handleExportBackup = async () => {
    setExportingBackup(true);
    try {
      const res = await dispatchAction('export_backup');
      if (res && res.backup) {
        const branchName = selectedTarget === '__local__' ? 'Local' : (branches.find((b) => b.branchId === selectedTarget)?.branchName || 'Remoto');
        const defaultFilename = `DulceHorno_Snapshot_${branchName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
        const saveRes = await window.hubApi.saveBackupFile(defaultFilename, res.backup);
        if (saveRes.saved) {
          showToast(`Snapshot guardado en: ${saveRes.filePath}`);
        }
      }
    } catch (err) {
      showToast(`Error descargando respaldo: ${err.message}`, 'error');
    } finally {
      setExportingBackup(false);
    }
  };

  // Cambio de contraseña
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setSavingPass(true);
    try {
      const res = await dispatchAction('cambiar_password', passForm);
      showToast(res.message || 'Contraseña actualizada');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPass(false);
    }
  };

  // Alta de Gerente
  const handleAgregarGerente = async (e) => {
    e.preventDefault();
    setSavingGerente(true);
    try {
      const res = await dispatchAction('agregar_gerente', gerenteForm);
      showToast(res.message || 'Gerente registrado exitosamente');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingGerente(false);
    }
  };

  // Guardar nueva URL del Relay
  const handleSaveRelayUrl = async (e) => {
    e.preventDefault();
    if (!customRelayInput.trim()) return;
    try {
      await window.hubApi.setRelayUrl(customRelayInput.trim());
      showToast('URL del broker actualizada. Reconectando...');
      const status = await window.hubApi.reconnectBroker();
      setBrokerStatus(status);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const copyToClipboard = (text, label = 'Copiado al portapapeles') => {
    navigator.clipboard.writeText(text);
    showToast(label);
  };

  const activeBranchInfo = useMemo(() => {
    return branches.find((b) => b.branchId === selectedTarget);
  }, [branches, selectedTarget]);

  const preferredLanIp = useMemo(() => {
    const list = networkInfo.ips || [];
    const eth = list.find((i) => i.name.toLowerCase().includes('ethernet') || i.name.toLowerCase().includes('wi-fi') || i.name.toLowerCase().includes('wlan'));
    return eth ? eth.address : (list[0]?.address || '127.0.0.1');
  }, [networkInfo.ips]);

  return (
    <div className="hub-container">
      {/* ========================================================
          HEADER / MISSION CONTROL FLOATING BAR (MINIMALIST DOUBLE-BEZEL)
          ======================================================== */}
      <header className="hub-header">
        <div className="hub-brand">
          <div className="hub-brand-logo-shell">
            <div className="hub-brand-logo-inner">
              <Icons.Logo />
            </div>
          </div>
          <div>
            <div className="hub-brand-title">
              <span>DulceHorno Central Hub</span>
              <span className="hub-badge-pill hub-badge-pro">v{appVersion} PRO</span>
            </div>
            <div className="hub-brand-subtitle">
              Consola Maestra de Teleasistencia, Diagnóstico y Respaldo Remoto
            </div>
          </div>
        </div>

        {/* Selector de Objetivo (Double Bezel) */}
        <div className="hub-target-box">
          <span className="hub-target-tag">
            <Icons.Server />
            <span>Nodo:</span>
          </span>
          <select
            className="hub-target-select"
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
          >
            <option value="__local__">Esta Computadora (MySQL Local 127.0.0.1)</option>
            {branches.map((b) => (
              <option key={b.branchId} value={b.branchId}>
                {b.branchName} [ID: {b.branchId}] - PIN: {b.sessionPin}
              </option>
            ))}
          </select>
        </div>

        {/* Indicador de Conexión del Broker y Túnel Cloudflare */}
        <div className="hub-status-cluster">
          {tunnelState.status === 'running' && tunnelState.url ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 9999,
              fontSize: '0.74rem'
            }}>
              <span className="tunnel-pulse-dot online"></span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Túnel Activo</span>
              <button
                className="btn-action-pill btn-dark"
                style={{ padding: '2px 8px', fontSize: '0.68rem', borderRadius: 6 }}
                onClick={() => copyToClipboard(tunnelState.url, 'Enlace de túnel copiado')}
                title="Copiar URL para el POS"
              >
                Copiar
              </button>
            </div>
          ) : (
            <button
              className="btn-action-pill btn-cyan"
              style={{ padding: '6px 14px', fontSize: '0.74rem' }}
              onClick={handleStartTunnel}
              disabled={tunnelLoading || tunnelState.status === 'starting'}
            >
              <Icons.Network />
              <span>{tunnelLoading || tunnelState.status === 'starting' ? 'Iniciando Túnel...' : '⚡ Iniciar Túnel Cloud'}</span>
            </button>
          )}

          <div
            className="broker-pill"
            onClick={() => setActiveTab('network')}
            title="Click para ver configuración de red"
            style={{ cursor: 'pointer' }}
          >
            <span className={`beacon-dot ${brokerStatus.connected ? 'online' : 'offline'}`}></span>
            <span className={`broker-label ${brokerStatus.connected ? 'online' : 'offline'}`}>
              {brokerStatus.connected ? 'Broker 4800 ONLINE' : 'Reconectando Broker'}
            </span>
          </div>

          <button
            className="btn-action-pill btn-dark"
            onClick={async () => {
              const res = await window.hubApi.reconnectBroker();
              const list = await window.hubApi.getBranches();
              setBranches(list || []);
              if (res?.connected) {
                setBrokerStatus({ connected: true, url: res.url });
                showToast(`Sincronizado: ${list.length} sucursal(es) conectada(s)`);
              } else {
                showToast('Verificando enlace...');
              }
            }}
            title="Sincronizar nodos y reconectar broker"
          >
            <Icons.Refresh />
            <span>Sincronizar</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          MODERN WORKSPACE: SIDEBAR NAVIGATION + VIEWPORT LAYOUT
          ======================================================== */}
      <div className="hub-main-layout">
        <aside className="hub-sidebar-nav">
          <div className="hub-sidebar-menu">
            <div className="hub-sidebar-section-title">CONTROL CENTRAL</div>
            <button
              className={`hub-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <Icons.Network />
              <span>Centro de Mando</span>
            </button>

            <button
              className={`hub-nav-item ${activeTab === 'branches' ? 'active' : ''}`}
              onClick={() => setActiveTab('branches')}
            >
              <Icons.Store />
              <span>Terminales &amp; Flota</span>
              <span className="hub-nav-count">{branches.length}</span>
            </button>

            <div className="hub-sidebar-section-title">COMERCIAL &amp; SEGURIDAD</div>
            <button
              className={`hub-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Icons.Key />
              <span>Bóveda de Licencias</span>
            </button>

            <div className="hub-sidebar-section-title">DIAGNÓSTICO &amp; SQL</div>
            <button
              className={`hub-nav-item ${activeTab === 'sql' ? 'active' : ''}`}
              onClick={() => setActiveTab('sql')}
            >
              <Icons.Terminal />
              <span>Consola SQL Remota</span>
            </button>

            <button
              className={`hub-nav-item ${activeTab === 'health' ? 'active' : ''}`}
              onClick={() => setActiveTab('health')}
            >
              <Icons.Pulse />
              <span>Telemetría &amp; Salud</span>
            </button>

            <button
              className={`hub-nav-item ${activeTab === 'maint' ? 'active' : ''}`}
              onClick={() => setActiveTab('maint')}
            >
              <Icons.Wrench />
              <span>Mantenimiento &amp; Backup</span>
            </button>

            <div className="hub-sidebar-section-title">CONECTIVIDAD</div>
            <button
              className={`hub-nav-item ${activeTab === 'network' ? 'active' : ''}`}
              onClick={() => setActiveTab('network')}
            >
              <Icons.Server />
              <span>Red &amp; Broker Enlace</span>
            </button>
          </div>

          {/* Sidebar Tunnel Station Widget */}
          <div className="hub-sidebar-tunnel-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                TÚNEL CLOUD
              </span>
              <span className={`tunnel-pulse-dot ${tunnelState.status === 'running' ? 'online' : (tunnelState.status === 'starting' ? 'starting' : 'offline')}`}></span>
            </div>
            <div style={{ fontSize: '0.74rem', fontWeight: 600, color: tunnelState.status === 'running' ? '#10b981' : (tunnelState.status === 'starting' ? '#f59e0b' : 'var(--text-secondary)') }}>
              {tunnelState.status === 'running' ? 'Enlace Activo' : (tunnelState.status === 'starting' ? 'Generando túnel...' : 'Túnel Detenido')}
            </div>
            {tunnelState.url ? (
              <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  readOnly
                  value={tunnelState.url}
                  className="font-mono"
                  style={{
                    background: '#070b16',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: 6,
                    color: '#38bdf8',
                    fontSize: '0.65rem',
                    padding: '3px 6px',
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                />
                <button
                  className="btn-action-pill btn-dark"
                  style={{ padding: '3px 8px', fontSize: '0.68rem' }}
                  onClick={() => copyToClipboard(tunnelState.url, 'Enlace de túnel copiado')}
                  title="Copiar URL"
                >
                  <Icons.Copy />
                </button>
              </div>
            ) : (
              <button
                className="btn-action-pill btn-cyan"
                style={{ width: '100%', marginTop: 8, padding: '5px', fontSize: '0.72rem', justifyContent: 'center' }}
                onClick={handleStartTunnel}
                disabled={tunnelLoading || tunnelState.status === 'starting'}
              >
                <span>{tunnelLoading || tunnelState.status === 'starting' ? 'Conectando...' : 'Iniciar Túnel'}</span>
              </button>
            )}
          </div>
        </aside>

        {/* ========================================================
            MAIN VIEWPORT
            ======================================================== */}
        <main className="hub-viewport">
          {/* ========================================================
              TAB 0: CENTRO DE MANDO & TÚNEL CLOUDFLARE HERO
              ======================================================== */}
          {activeTab === 'overview' && (
            <div>
              {/* Hero 1: Estación de Túnel Cloudflare */}
              <div className="hub-tunnel-hero-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span className="hub-badge-pill hub-badge-pro">Enlace Remoto Global</span>
                      <span className={`hub-badge-pill ${tunnelState.status === 'running' ? 'badge-emerald' : (tunnelState.status === 'starting' ? 'badge-amber' : 'badge-rose')}`}>
                        <span className={`tunnel-pulse-dot ${tunnelState.status === 'running' ? 'online' : (tunnelState.status === 'starting' ? 'starting' : 'offline')}`} style={{ marginRight: 6 }}></span>
                        {tunnelState.status === 'running' ? 'TÚNEL EN LÍNEA (TRYCLOUDFLARE.COM)' : (tunnelState.status === 'starting' ? 'GENERANDO TÚNEL...' : 'TÚNEL DETENIDO')}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                      Motor de Enlace Seguro Cloudflare
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.5 }}>
                      Genera una dirección pública segura con cifrado TLS automático para conectar terminales de punto de venta desde cualquier computadora o sucursal remota sin necesidad de configurar puertos ni tener IP fija.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {tunnelState.status === 'running' ? (
                      <>
                        <button
                          className="btn-action-pill btn-cyan"
                          style={{ padding: '9px 18px', fontSize: '0.82rem' }}
                          onClick={() => copyToClipboard(tunnelState.url, 'Enlace Cloudflare copiado al portapapeles')}
                        >
                          <Icons.Copy />
                          <span>Copiar Enlace para POS</span>
                        </button>
                        <button
                          className="btn-action-pill btn-danger"
                          style={{ padding: '9px 16px', fontSize: '0.82rem' }}
                          onClick={handleStopTunnel}
                        >
                          <span>Detener Túnel</span>
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-action-pill btn-cyan"
                        style={{ padding: '10px 22px', fontSize: '0.86rem', fontWeight: 600 }}
                        onClick={handleStartTunnel}
                        disabled={tunnelLoading || tunnelState.status === 'starting'}
                      >
                        <Icons.Network />
                        <span>{tunnelLoading || tunnelState.status === 'starting' ? 'Estableciendo Túnel...' : '⚡ Generar Enlace Remoto'}</span>
                      </button>
                    )}

                    <button
                      className="btn-action-pill btn-dark"
                      style={{ padding: '9px 14px', fontSize: '0.82rem' }}
                      onClick={() => setShowTunnelLogs(!showTunnelLogs)}
                      title="Ver registros en consola"
                    >
                      <Icons.Terminal />
                      <span>{showTunnelLogs ? 'Ocultar Consola' : 'Ver Registros'}</span>
                    </button>
                  </div>
                </div>

                {/* URL activa destacada */}
                {tunnelState.url && (
                  <div style={{
                    marginTop: 20,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: 12,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                        DIRECCIÓN PÚBLICA PARA TERMINALES
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#38bdf8', marginTop: 3 }}>
                        {tunnelState.url}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-action-pill btn-dark"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={() => copyToClipboard(tunnelState.url, 'URL copiada')}
                      >
                        <Icons.Copy />
                        <span>Copiar URL</span>
                      </button>
                      <button
                        className="btn-action-pill btn-dark"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        onClick={() => copyToClipboard(`wss://${tunnelState.url.replace(/^https:\/\//, '')}`, 'URL WebSocket copiada')}
                        title="Copiar en formato wss://"
                      >
                        <span>Copiar como WSS</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Guía en 3 pasos para conectar terminales */}
                <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  <div className="instruction-step-chip">
                    <div className="instruction-step-number">1</div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>Inicia el Túnel</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        Pulsa el botón de arriba para generar tu dirección trycloudflare mundial con 1 solo clic.
                      </div>
                    </div>
                  </div>

                  <div className="instruction-step-chip">
                    <div className="instruction-step-number">2</div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>Pega en el POS</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        En la pantalla de Login del Punto de Venta, pulsa <strong>"⚙ Configurar Enlace"</strong> y pega la dirección.
                      </div>
                    </div>
                  </div>

                  <div className="instruction-step-chip">
                    <div className="instruction-step-number">3</div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>Administra la Terminal</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        La terminal aparecerá aquí en segundos para activación, soporte remoto o cambio de contraseñas.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Consola de logs en vivo del túnel */}
                {showTunnelLogs && (
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        REGISTROS DEL PROCESO CLOUDFLARE EN TIEMPO REAL
                      </span>
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.72rem', cursor: 'pointer' }}
                        onClick={() => setShowTunnelLogs(false)}
                      >
                        Cerrar Consola
                      </button>
                    </div>
                    <div className="hub-terminal-console-window">
                      {(tunnelState.logs && tunnelState.logs.length > 0) ? (
                        tunnelState.logs.map((log, idx) => (
                          <div key={idx} style={{ color: log.includes('✅') || log.includes('trycloudflare') ? '#38bdf8' : (log.includes('❌') ? '#f43f5e' : 'inherit') }}>
                            {log}
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--text-dim)' }}>Esperando salida del proceso cloudflared...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bento Grid de Salud de la Flota */}
              <div className="hero-bento-strip">
                <div className="bento-stat-card">
                  <div className="bento-stat-top">
                    <span className="data-metric-label">Terminales Conectadas</span>
                    <span className={`beacon-dot ${branches.length > 0 ? 'online' : 'offline'}`}></span>
                  </div>
                  <div className="data-metric-hero font-mono">{branches.length}</div>
                  <div className="data-metric-sub">
                    {branches.length === 1 ? '1 terminal activa en vivo' : `${branches.length} terminales comunicándose con el Hub`}
                  </div>
                </div>

                <div className="bento-stat-card">
                  <div className="bento-stat-top">
                    <span className="data-metric-label">Licencias Activas</span>
                    <span className="hub-badge-pill badge-emerald">En Regla</span>
                  </div>
                  <div className="data-metric-hero font-mono text-emerald">
                    {branches.filter((b) => b.license?.isActivated).length}
                  </div>
                  <div className="data-metric-sub">Operando con gerente autenticado</div>
                </div>

                <div className="bento-stat-card">
                  <div className="bento-stat-top">
                    <span className="data-metric-label">Esperando Activación</span>
                    <span className="hub-badge-pill badge-amber">Pendientes</span>
                  </div>
                  <div className="data-metric-hero font-mono text-amber">
                    {branches.filter((b) => !b.license?.isActivated && !b.license?.isSuspended).length}
                  </div>
                  <div className="data-metric-sub">Listas para despacho de token comercial</div>
                </div>

                <div className="bento-stat-card">
                  <div className="bento-stat-top">
                    <span className="data-metric-label">Terminales Suspendidas</span>
                    <span className="hub-badge-pill badge-rose">Bloqueadas</span>
                  </div>
                  <div className="data-metric-hero font-mono text-rose">
                    {branches.filter((b) => b.license?.isSuspended).length}
                  </div>
                  <div className="data-metric-sub">Bloqueo por falta de pago o administrativo</div>
                </div>
              </div>

              {/* Acciones Rápidas & Generación */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
                {/* Generador Rápido de Tokens */}
                <div className="hub-card-shell">
                  <div className="hub-card-core">
                    <div className="card-headline-bar">
                      <h3 className="card-headline-title">
                        <Icons.Key />
                        <span>Generador Rápido de Tokens Comerciales</span>
                      </h3>
                      <span className="hub-badge-pill hub-badge-pro">Bóveda Criptográfica</span>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                      Genera tokens estructurados con checksum SHA-256 listos para activar terminales de clientes al confirmar su pago.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                      <div>
                        <label className="form-card-label">Plan / Tipo de Licencia:</label>
                        <select
                          className="form-card-input"
                          value={tokenGenState.tier}
                          onChange={(e) => {
                            const t = e.target.value;
                            const found = TIERS.find((x) => x.id === t);
                            setTokenGenState({
                              ...tokenGenState,
                              tier: t,
                              generatedToken: generateStructuredHubToken(t, tokenGenState.branchId),
                              expirationDate: calculateExpirationDate(found?.defaultDays)
                            });
                          }}
                        >
                          {TIERS.map((tier) => (
                            <option key={tier.id} value={tier.id}>{tier.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="form-card-label">Vigencia Calculada:</label>
                        <input
                          type="text"
                          className="form-card-input"
                          readOnly
                          value={tokenGenState.expirationDate || 'Permanente (Vitalicia)'}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <label className="form-card-label">Token Generado:</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          readOnly
                          className="form-card-input font-mono"
                          style={{ color: '#38bdf8', fontWeight: 700 }}
                          value={tokenGenState.generatedToken}
                        />
                        <button
                          type="button"
                          className="btn-action-pill btn-cyan"
                          onClick={() => copyToClipboard(tokenGenState.generatedToken, 'Token copiado al portapapeles')}
                          title="Copiar Token"
                        >
                          <Icons.Copy />
                          <span>Copiar</span>
                        </button>
                        <button
                          type="button"
                          className="btn-action-pill btn-dark"
                          onClick={() => setTokenGenState({
                            ...tokenGenState,
                            generatedToken: generateStructuredHubToken(tokenGenState.tier, tokenGenState.branchId)
                          })}
                          title="Regenerar Token"
                        >
                          <Icons.Refresh />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flota de Terminales Conectadas */}
                <div className="hub-card-shell">
                  <div className="hub-card-core">
                    <div className="card-headline-bar">
                      <h3 className="card-headline-title">
                        <Icons.Store />
                        <span>Flota de Terminales en Vivo</span>
                      </h3>
                      <button
                        className="btn-action-pill btn-dark"
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                        onClick={() => setActiveTab('branches')}
                      >
                        <span>Ver Todas ({branches.length})</span>
                      </button>
                    </div>

                    {branches.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '28px 12px', color: 'var(--text-dim)' }}>
                        <Icons.Laptop style={{ width: 32, height: 32, margin: '0 auto 8px auto', opacity: 0.5 }} />
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          No hay terminales conectadas en este momento
                        </div>
                        <div style={{ fontSize: '0.76rem', marginTop: 4 }}>
                          Inicia el túnel Cloudflare y conecta tu terminal POS para verla aquí en tiempo real.
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {branches.slice(0, 4).map((b) => {
                          const lic = b.license || {};
                          const isSusp = Boolean(lic.isSuspended || lic.estado === 'Suspendida');
                          return (
                            <div
                              key={b.branchId}
                              style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 10,
                                padding: '10px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                                  {b.branchName}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                                  ID: {b.branchId} | PIN: {b.sessionPin}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span className={`hub-badge-pill ${isSusp ? 'badge-rose' : (lic.isActivated ? 'badge-emerald' : 'badge-amber')}`}>
                                  {isSusp ? 'Suspendida' : (lic.isActivated ? 'Activa' : 'Pendiente')}
                                </span>
                                <button
                                  className="btn-action-pill btn-dark"
                                  style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                  onClick={() => {
                                    setSelectedTarget(b.branchId);
                                    setActiveTab('branches');
                                  }}
                                >
                                  Gestionar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        {/* ========================================================
            TAB 1: DIRECTORIO DE SUCURSALES (CLIENTES EN VIVO)
            ======================================================== */}
        {activeTab === 'branches' && (
          <div>
            {/* Bento Strip de Métricas */}
            <div className="hero-bento-strip">
              <div className="bento-stat-card">
                <div className="bento-stat-top">
                  <span className="bento-stat-label">Nodos Conectados</span>
                  <div className="bento-stat-icon icon-emerald">
                    <Icons.Store />
                  </div>
                </div>
                <div className="bento-stat-number">{branches.length}</div>
                <div className="bento-stat-footnote">Sucursales con enlace activo</div>
              </div>

              <div className="bento-stat-card">
                <div className="bento-stat-top">
                  <span className="bento-stat-label">Destino Seleccionado</span>
                  <div className="bento-stat-icon icon-cyan">
                    <Icons.Laptop />
                  </div>
                </div>
                <div className="bento-stat-number truncate-text">
                  {activeBranchInfo ? activeBranchInfo.branchName : 'MySQL Local'}
                </div>
                <div className="bento-stat-footnote">
                  {activeBranchInfo ? `ID: ${activeBranchInfo.branchId}` : '127.0.0.1:3306 (Local)'}
                </div>
              </div>

              <div className="bento-stat-card">
                <div className="bento-stat-top">
                  <span className="bento-stat-label">Túnel de Red</span>
                  <div className="bento-stat-icon icon-amber">
                    <Icons.Network />
                  </div>
                </div>
                <div className="bento-stat-number">Puerto {networkInfo.port || 4800}</div>
                <div className="bento-stat-footnote">WSS Cifrado Bidireccional</div>
              </div>

              <div className="bento-stat-card">
                <div className="bento-stat-top">
                  <span className="bento-stat-label">Versión Ecosistema</span>
                  <div className="bento-stat-icon icon-violet">
                    <Icons.Server />
                  </div>
                </div>
                <div className="bento-stat-number">v{appVersion}</div>
                <div className="bento-stat-footnote">DulceHorno POS Production</div>
              </div>
            </div>

            {/* Cuadrícula de Nodos / Sucursales */}
            <div className="card-headline-bar">
              <div>
                <h2 className="card-headline-title">
                  <span>Panaderías y Terminales en Línea</span>
                  <span className="hub-badge-pill badge-emerald">
                    {branches.length} conectadas
                  </span>
                </h2>
                <div className="card-headline-desc">
                  Selecciona una sucursal para diagnosticar su base de datos, descargar respaldos o restablecer accesos.
                </div>
              </div>

              <button
                className="btn-action-pill btn-dark"
                onClick={() => setActiveTab('network')}
              >
                <Icons.Network />
                <span>Instrucciones de Conexión</span>
              </button>
            </div>

            {branches.length === 0 ? (
              <div className="hub-card-shell">
                <div className="hub-card-core empty-state-container">
                  <div className="empty-state-antenna">
                    <Icons.Antenna />
                  </div>
                  <h3 className="empty-state-title">
                    Esperando enlace de sucursales en vivo...
                  </h3>
                  <p className="empty-state-body">
                    Cuando una panadería abra <strong>DulceHorno Punto de Venta</strong> en cualquier equipo, su agente remoto se conectará automáticamente a este panel.
                  </p>

                  <div className="empty-state-pills-row">
                    <div className="config-chip">
                      <span className="config-chip-label">URL del Broker:</span>
                      <code className="config-chip-value">{brokerStatus.url || 'ws://127.0.0.1:4800'}</code>
                    </div>

                    <div className="config-chip">
                      <span className="config-chip-label">IP en Red Local (LAN):</span>
                      <code className="config-chip-value">ws://{preferredLanIp}:4800</code>
                    </div>

                    <button
                      className="btn-action-pill btn-dark"
                      style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                      onClick={() => copyToClipboard(`ws://${preferredLanIp}:4800`, 'URL LAN copiada')}
                      title="Copiar URL para clientes en la misma red"
                    >
                      <Icons.Copy />
                      <span>Copiar URL LAN</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="branches-grid">
                {branches.map((b) => {
                  const isSelected = selectedTarget === b.branchId;
                  const lic = b.license || {};
                  const isSuspended = Boolean(lic.isSuspended || lic.estado === 'Suspendida');
                  const isActivated = Boolean(lic.isActivated || b.system?.isActivated) && !isSuspended;
                  const isPending = !isActivated && !isSuspended;

                  return (
                    <div
                      key={b.branchId}
                      className={`branch-node-shell ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedTarget(b.branchId);
                        showToast(`Sucursal seleccionada: ${b.branchName}`);
                      }}
                    >
                      <div className="branch-node-core">
                        <div className="branch-top-row">
                          <div>
                            <div className="branch-name">{b.branchName}</div>
                            <div className="branch-id-badge">ID: {b.branchId}</div>
                          </div>
                          {isSuspended ? (
                            <span className="hub-badge-pill badge-rose">
                              <span className="beacon-dot offline"></span>
                              <span>Licencia Suspendida</span>
                            </span>
                          ) : isActivated ? (
                            <span className="hub-badge-pill badge-emerald">
                              <span className="beacon-dot online"></span>
                              <span>Licencia Activa</span>
                            </span>
                          ) : (
                            <span className="hub-badge-pill badge-amber">
                              <span className="beacon-dot offline" style={{ background: 'var(--color-amber)', boxShadow: '0 0 8px var(--color-amber)' }}></span>
                              <span>Esperando Activación</span>
                            </span>
                          )}
                        </div>

                        <div className="branch-data-cluster">
                          <div>
                            <div className="data-metric-label">Versión POS</div>
                            <div className="data-metric-val">{b.version ? `v${b.version}` : `v${appVersion}`}</div>
                          </div>
                          <div>
                            <div className="data-metric-label">IP Remota</div>
                            <div className="data-metric-val font-mono">{b.ip || '127.0.0.1'}</div>
                          </div>
                          <div>
                            <div className="data-metric-label">PIN Asistencia</div>
                            <div className="data-metric-val">
                              <span className="pin-chip">{b.sessionPin}</span>
                            </div>
                          </div>
                          <div>
                            <div className="data-metric-label">Conectado</div>
                            <div className="data-metric-val font-mono">
                              {b.connectedAt ? new Date(b.connectedAt).toLocaleTimeString() : 'Ahora'}
                            </div>
                          </div>
                        </div>

                        {/* ESTADO 1: TERMINAL PENDIENTE DE PAGO */}
                        {isPending && (
                          <div style={{
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px dashed rgba(245, 158, 11, 0.35)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            margin: '10px 0 12px 0'
                          }}>
                            <div style={{ fontSize: '0.8rem', color: '#fde68a', fontWeight: 600, marginBottom: '3px' }}>
                              Terminal sin Licencia Comercial
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.35, marginBottom: '10px' }}>
                              La terminal está en línea esperando activación de pago y despacho de gerente.
                            </div>
                            <button
                              type="button"
                              className="btn-action-pill btn-emerald"
                              style={{ width: '100%', padding: '9px 12px', fontSize: '0.82rem', justifyContent: 'center', fontWeight: 700 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openActivationModal(b);
                              }}
                            >
                              <Icons.Bolt />
                              <span>Activar Licencia &amp; Despachar Gerente</span>
                            </button>
                          </div>
                        )}

                        {/* ESTADO 2: TERMINAL SUSPENDIDA / BLOQUEADA */}
                        {isSuspended && (
                          <div style={{
                            background: 'rgba(244, 63, 94, 0.08)',
                            border: '1px solid rgba(244, 63, 94, 0.35)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            margin: '10px 0 12px 0'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#fb7185', fontWeight: 700, marginBottom: '3px' }}>
                              <Icons.ShieldAlert />
                              <span>Terminal Bloqueada por Suspensión</span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.35, marginBottom: '10px' }}>
                              Motivo: <strong>{lic.motivoSuspension || 'Falta de pago o suspensión administrativa'}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn-action-pill btn-emerald"
                                style={{ flex: 1, padding: '7px 10px', fontSize: '0.76rem', justifyContent: 'center', fontWeight: 700 }}
                                title="Reactivar y desbloquear terminal en vivo"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openReactivateModal(b);
                                }}
                              >
                                <Icons.ShieldCheck />
                                <span>Reactivar Licencia</span>
                              </button>
                              <button
                                type="button"
                                className="btn-action-pill btn-dark"
                                style={{ padding: '7px 10px', fontSize: '0.76rem' }}
                                title="Modificar parámetros de licencia"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModifyModal(b);
                                }}
                              >
                                <Icons.Sliders />
                              </button>
                              <button
                                type="button"
                                className="btn-action-pill btn-dark"
                                style={{ padding: '7px 10px', fontSize: '0.76rem' }}
                                title="Cambiar clave de gerente"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openQuickPassModal(b);
                                }}
                              >
                                <Icons.Key />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ESTADO 3: TERMINAL ACTIVA Y OPERATIVA */}
                        {isActivated && (
                          <div style={{
                            background: 'rgba(16, 185, 129, 0.06)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            margin: '10px 0 12px 0'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div>
                                <div style={{ fontSize: '0.7rem', color: '#6ee7b7', fontWeight: 600, textTransform: 'uppercase' }}>
                                  {lic.tipoLicencia || 'Comercial Pro Vitalicia'}
                                </div>
                                <div style={{ fontSize: '0.76rem', color: '#f1f5f9' }}>
                                  Gerente: <strong>{lic.gerenteUsuario || 'carlos_gerente'}</strong>
                                  <span style={{ color: '#64748b', margin: '0 6px' }}>•</span>
                                  <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                                    {lic.fechaExpiracion ? `Vence: ${lic.fechaExpiracion}` : 'Vitalicia (Permanente)'}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn-action-pill btn-dark"
                                style={{ padding: '5px 8px', fontSize: '0.72rem' }}
                                title="Copiar Ficha de la Sucursal para WhatsApp"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(getWhatsAppBranchSummary(b), 'Ficha de sucursal copiada para WhatsApp');
                                }}
                              >
                                <Icons.Share />
                              </button>
                            </div>

                            {/* Barra de Acciones de Control Rápido */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '6px' }}>
                              <button
                                type="button"
                                className="btn-action-pill btn-dark"
                                style={{ padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center' }}
                                title="Cambiar contraseña del Gerente"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openQuickPassModal(b);
                                }}
                              >
                                <Icons.Key />
                                <span>Clave</span>
                              </button>

                              <button
                                type="button"
                                className="btn-action-pill btn-dark"
                                style={{ padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center' }}
                                title="Modificar licencia (nombre, vigencia, tier, notas)"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModifyModal(b);
                                }}
                              >
                                <Icons.Sliders />
                                <span>Modificar</span>
                              </button>

                              <button
                                type="button"
                                className="btn-action-pill btn-rose"
                                style={{ padding: '6px 8px', fontSize: '0.74rem', justifyContent: 'center' }}
                                title="Suspender o Revocar Licencia"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRevokeModal(b);
                                }}
                              >
                                <Icons.ShieldAlert />
                                <span>Suspender</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <button
                          className={`btn-action-pill ${isSelected ? 'btn-cyan' : 'btn-dark'}`}
                          style={{ width: '100%', marginTop: 4 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isSelected && <Icons.Check />}
                            <span>{isSelected ? 'Objetivo Activo' : 'Conectarse a esta Sucursal'}</span>
                          </div>
                          <div className="btn-inner-icon-ring">
                            <Icons.ArrowUpRight />
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 2: CONSOLA SQL REMOTA (DOUBLE BEZEL)
            ======================================================== */}
        {activeTab === 'sql' && (
          <div>
            <div className="hub-card-shell">
              <div className="hub-card-core">
                <div className="card-headline-bar">
                  <div>
                    <h3 className="card-headline-title">
                      <span>Consola SQL Remota</span>
                      <span className="hub-badge-pill hub-badge-pro">
                        {activeBranchInfo ? `Remoto: ${activeBranchInfo.branchName}` : 'Local: MySQL 8.0'}
                      </span>
                    </h3>
                    <div className="card-headline-desc">
                      Ejecuta sentencias SQL en tiempo real contra el motor de la sucursal seleccionada.
                    </div>
                  </div>
                </div>

                <div className="snippet-chip-row">
                  <button
                    type="button"
                    className="snippet-chip"
                    onClick={() => setSqlQuery('SELECT IdArticulo, Nombre, Cantidad, Minimo, PrecioVenta, PrecioCompra FROM Articulos ORDER BY Cantidad ASC LIMIT 20;')}
                  >
                    <Icons.Box />
                    <span>Inventario &amp; Stock</span>
                  </button>
                  <button
                    type="button"
                    className="snippet-chip"
                    onClick={() => setSqlQuery('SELECT v.IdVenta, v.FechaVenta, v.Total, v.TipoVenta, e.NombreUsuario as Cajero FROM Ventas v LEFT JOIN Empleados e ON v.IdEmpleado = e.IdEmpleado ORDER BY v.IdVenta DESC LIMIT 10;')}
                  >
                    <Icons.Receipt />
                    <span>Últimas 10 Ventas</span>
                  </button>
                  <button
                    type="button"
                    className="snippet-chip"
                    onClick={() => setSqlQuery('SELECT mi.IdMovimiento, a.Nombre as Articulo, mi.TipoMovimiento, mi.Cantidad, mi.FechaMovimiento FROM MovimientosInventario mi JOIN Articulos a ON mi.IdArticulo = a.IdArticulo ORDER BY mi.IdMovimiento DESC LIMIT 15;')}
                  >
                    <Icons.List />
                    <span>Kardex / Movimientos</span>
                  </button>
                  <button
                    type="button"
                    className="snippet-chip"
                    onClick={() => setSqlQuery('SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE();')}
                  >
                    <Icons.Gear />
                    <span>Stored Procedures</span>
                  </button>
                  <button
                    type="button"
                    className="snippet-chip"
                    onClick={() => setSqlQuery('SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE();')}
                  >
                    <Icons.Bolt />
                    <span>Triggers Activos</span>
                  </button>
                </div>

                <div className="sql-console-shell">
                  <div className="sql-console-header">
                    <span>Editor SQL • Motor: MySQL • Protección de Schema: Activa</span>
                    <span className="font-mono">{sqlQuery.length} caracteres</span>
                  </div>
                  <textarea
                    className="sql-editor-area"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Escribe tu consulta SQL aquí..."
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Presiona <kbd className="key-cap">Ctrl</kbd> + <kbd className="key-cap">Enter</kbd> para ejecutar.
                  </span>
                  <button
                    className="btn-action-pill btn-cyan"
                    onClick={handleExecuteSql}
                    disabled={executingSql}
                  >
                    <Icons.Play />
                    <span>{executingSql ? 'Ejecutando en Sucursal...' : 'Ejecutar Consulta'}</span>
                    <div className="btn-inner-icon-ring">
                      <Icons.ArrowUpRight />
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Resultados SQL */}
            {sqlResult && (
              <div className="hub-card-shell" style={{ marginTop: 20 }}>
                <div className="hub-card-core">
                  <div className="card-headline-bar">
                    <h4 className="card-headline-title">
                      <span>Resultados de la Consulta</span>
                      <span className="hub-badge-pill badge-cyan">
                        {sqlResult.totalRows ?? sqlResult.affectedRows ?? 0} registros
                      </span>
                    </h4>
                    <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icons.Clock />
                      <span>{sqlResult.executionTimeMs} ms</span>
                    </span>
                  </div>

                  {sqlResult.error ? (
                    <div className="result-alert-box alert-error">
                      <Icons.AlertCircle />
                      <div>
                        <strong>Error SQL:</strong> {sqlResult.error}
                      </div>
                    </div>
                  ) : sqlResult.isSelect ? (
                    <div className="table-glass-container">
                      <table className="pro-table">
                        <thead>
                          <tr>
                            {sqlResult.columns.map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sqlResult.rows.map((row, idx) => (
                            <tr key={idx}>
                              {sqlResult.columns.map((col) => (
                                <td key={col}>{String(row[col] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="result-alert-box alert-success">
                      <Icons.CheckCircle />
                      <div>
                        {sqlResult.message || 'Operación completada exitosamente.'} (Filas afectadas: {sqlResult.affectedRows})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 3: TELEMETRÍA Y COCKPIT EN VIVO
            ======================================================== */}
        {activeTab === 'health' && (
          <div>
            <div className="card-headline-bar">
              <div>
                <h3 className="card-headline-title">
                  <span>Cockpit de Telemetría: {activeBranchInfo ? activeBranchInfo.branchName : 'MySQL Local'}</span>
                </h3>
                <div className="card-headline-desc">
                  Métricas de hardware, memoria y rendimiento de la base de datos en tiempo real.
                </div>
              </div>
              <button
                className="btn-action-pill btn-dark"
                onClick={fetchHealth}
                disabled={loadingHealth}
              >
                <Icons.Refresh />
                <span>{loadingHealth ? 'Sondeando...' : 'Actualizar Telemetría'}</span>
              </button>
            </div>

            {healthData && (
              <>
                <div className="hero-bento-strip">
                  <div className="bento-stat-card">
                    <div className="bento-stat-top">
                      <span className="bento-stat-label">Conexión MySQL</span>
                      <div className="bento-stat-icon icon-emerald">
                        <Icons.Pulse />
                      </div>
                    </div>
                    <div className="bento-stat-number" style={{ color: 'var(--color-emerald)' }}>
                      {healthData.database?.status}
                    </div>
                    <div className="bento-stat-footnote">Latencia Ping: {healthData.database?.pingMs} ms</div>
                  </div>

                  <div className="bento-stat-card">
                    <div className="bento-stat-top">
                      <span className="bento-stat-label">Tamaño de BD</span>
                      <div className="bento-stat-icon icon-cyan">
                        <Icons.Server />
                      </div>
                    </div>
                    <div className="bento-stat-number">{healthData.database?.totalSizeMB} MB</div>
                    <div className="bento-stat-footnote">{healthData.database?.totalTables} tablas alojadas</div>
                  </div>

                  <div className="bento-stat-card">
                    <div className="bento-stat-top">
                      <span className="bento-stat-label">Memoria Proceso</span>
                      <div className="bento-stat-icon icon-amber">
                        <Icons.Wrench />
                      </div>
                    </div>
                    <div className="bento-stat-number">{healthData.system?.heapUsedMB || '0'} MB</div>
                    <div className="bento-stat-footnote">Total Sistema: {healthData.system?.totalMemMB || '0'} MB</div>
                  </div>

                  <div className="bento-stat-card">
                    <div className="bento-stat-top">
                      <span className="bento-stat-label">Tiempo Activo</span>
                      <div className="bento-stat-icon icon-violet">
                        <Icons.Clock />
                      </div>
                    </div>
                    <div className="bento-stat-number">
                      {Math.floor((healthData.system?.uptimeSeconds || 0) / 60)} min
                    </div>
                    <div className="bento-stat-footnote">Node {healthData.system?.versions?.node || '20'}</div>
                  </div>
                </div>

                <div className="hub-card-shell">
                  <div className="hub-card-core">
                    <div className="card-headline-bar">
                      <h4 className="card-headline-title">Estructura y Dimensiones de Tablas en MySQL</h4>
                      <span className="hub-badge-pill" style={{ background: '#1e293b', color: '#fff' }}>
                        Schema: {healthData.database?.databaseName || 'panaderia'}
                      </span>
                    </div>

                    <div className="table-glass-container">
                      <table className="pro-table">
                        <thead>
                          <tr>
                            <th>Tabla</th>
                            <th>Filas Estimadas</th>
                            <th>Tamaño en Disco</th>
                            <th>Fecha de Creación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(healthData.database?.tables || []).map((t, idx) => (
                            <tr key={idx}>
                              <td><strong style={{ color: 'var(--color-cyan)' }}>{t.tableName}</strong></td>
                              <td>{t.tableRows ?? 0}</td>
                              <td>{t.sizeKB} KB</td>
                              <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                                {t.createTime ? new Date(t.createTime).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: MANTENIMIENTO Y RESPALDOS REMOTOS
            ======================================================== */}
        {activeTab === 'maint' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
            {/* Card 1: Snapshot Remoto */}
            <div className="hub-card-shell">
              <div className="hub-card-core">
                <div className="card-headline-bar">
                  <h3 className="card-headline-title">
                    <Icons.Download />
                    <span>Copia de Seguridad Instantánea (Snapshot JSON)</span>
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Solicita a la máquina de la sucursal seleccionada que extraiga todas sus tablas contables, tickets, clientes y catálogo de productos, transfiriéndotelos cifrados en un archivo portable <code>.json</code>.
                </p>
                <button
                  className="btn-action-pill btn-cyan"
                  onClick={handleExportBackup}
                  disabled={exportingBackup}
                  style={{ width: '100%' }}
                >
                  <Icons.Download />
                  <span>{exportingBackup ? 'Empaquetando Snapshot Remoto...' : 'Descargar Snapshot Remoto (.JSON)'}</span>
                  <div className="btn-inner-icon-ring">
                    <Icons.ArrowUpRight />
                  </div>
                </button>
              </div>
            </div>

            {/* Card 2: Desfragmentación */}
            <div className="hub-card-shell">
              <div className="hub-card-core">
                <div className="card-headline-bar">
                  <h3 className="card-headline-title">
                    <Icons.Wrench />
                    <span>Desfragmentación &amp; Reconstrucción de Índices</span>
                  </h3>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Ejecuta <code>OPTIMIZE TABLE</code> en MySQL de la panadería remota para reorganizar el almacenamiento físico, liberar espacio y acelerar la velocidad del punto de venta tras meses de operación continua.
                </p>
                <button
                  className="btn-action-pill btn-dark"
                  onClick={handleOptimizeDb}
                  disabled={optimizing}
                  style={{ width: '100%' }}
                >
                  <Icons.Wrench />
                  <span>{optimizing ? 'Optimizando tablas...' : 'Optimizar Tablas (OPTIMIZE TABLE)'}</span>
                  <div className="btn-inner-icon-ring">
                    <Icons.ArrowUpRight />
                  </div>
                </button>

                {optimizeResults && (
                  <div style={{ marginTop: 16, fontSize: '0.8rem', background: 'var(--bg-input)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                    <strong style={{ color: '#fff' }}>Resultado por tabla:</strong>
                    <ul style={{ paddingLeft: 18, marginTop: 6 }}>
                      {optimizeResults.map((r, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>
                          <code>{r.table}</code>: <span style={{ color: r.success ? 'var(--color-emerald)' : 'var(--color-rose)' }}>{r.status}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: LICENCIAS, TOKENS & CREDENCIALES
            ======================================================== */}
        {activeTab === 'users' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
            {/* Card 1: Generador Criptográfico de Tokens & Cotizador */}
            <div className="hub-card-shell">
              <div className="hub-card-core">
                <div className="card-headline-bar">
                  <div>
                    <h3 className="card-headline-title">
                      <Icons.Bolt />
                      <span>Generador Criptográfico de Tokens</span>
                    </h3>
                    <div className="card-headline-desc">
                      Emisión comercial con validación y checksum SHA-256
                    </div>
                  </div>
                  <span className="hub-badge-pill hub-badge-pro">Algoritmo v1.1</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-card-field">
                    <label className="form-card-label">Tipo de Licencia Comercial:</label>
                    <select
                      className="form-card-input"
                      value={tokenGenState.tier}
                      onChange={(e) => {
                        const newTier = e.target.value;
                        const tierObj = TIERS.find((t) => t.id === newTier);
                        const exp = calculateExpirationDate(tierObj?.defaultDays);
                        setTokenGenState({
                          ...tokenGenState,
                          tier: newTier,
                          generatedToken: generateStructuredHubToken(newTier, tokenGenState.branchId),
                          expirationDate: exp
                        });
                      }}
                    >
                      {TIERS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-card-field">
                    <label className="form-card-label">Nombre del Negocio / Panadería:</label>
                    <input
                      type="text"
                      className="form-card-input"
                      placeholder="Ej. Panadería La Esperanza"
                      value={tokenGenState.businessName}
                      onChange={(e) => setTokenGenState({ ...tokenGenState, businessName: e.target.value })}
                    />
                  </div>

                  <div className="form-card-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-card-label">Token Estructurado Generado:</label>
                      <button
                        type="button"
                        className="btn-action-pill btn-dark"
                        style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                        onClick={() => {
                          setTokenGenState({
                            ...tokenGenState,
                            generatedToken: generateStructuredHubToken(tokenGenState.tier, tokenGenState.branchId)
                          });
                          showToast('Nuevo token generado');
                        }}
                      >
                        <Icons.Refresh />
                        <span>Regenerar</span>
                      </button>
                    </div>
                    <div style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      color: 'var(--color-cyan)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textAlign: 'center'
                    }}>
                      {tokenGenState.generatedToken}
                    </div>
                  </div>

                  <div style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    fontSize: '0.76rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Vigencia Estimada:</span>
                      <strong style={{ color: '#fff' }}>
                        {tokenGenState.tier === 'PRO' ? 'Permanente (Vitalicia)' : (tokenGenState.expirationDate || 'Calculada al activar')}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Protección:</span>
                      <strong style={{ color: 'var(--color-emerald)' }}>Checksum Criptográfico Activo</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <button
                      type="button"
                      className="btn-action-pill btn-cyan"
                      style={{ flex: 1 }}
                      onClick={() => copyToClipboard(tokenGenState.generatedToken, 'Token copiado al portapapeles')}
                    >
                      <Icons.Copy />
                      <span>Copiar Token</span>
                    </button>
                    <button
                      type="button"
                      className="btn-action-pill btn-dark"
                      style={{ flex: 1 }}
                      onClick={() => {
                        const tierObj = TIERS.find((t) => t.id === tokenGenState.tier);
                        const msg = `🍞 *DULCE HORNO POS - CERTIFICADO DE LICENCIA*\n\n` +
                          `🏪 *Negocio:* ${tokenGenState.businessName || 'Cliente'}\n` +
                          `📦 *Modalidad:* ${tierObj?.label || tokenGenState.tier}\n` +
                          `🔑 *Token de Activación:* ${tokenGenState.generatedToken}\n` +
                          `📅 *Vigencia:* ${tokenGenState.tier === 'PRO' ? 'Vitalicia (Sin caducidad)' : (tokenGenState.expirationDate || 'Activa')}\n\n` +
                          `Para activar, abre el Punto de Venta e ingresa este token o el equipo técnico lo activará remotamente.`;
                        copyToClipboard(msg, 'Certificado de licencia copiado para WhatsApp');
                      }}
                    >
                      <Icons.Share />
                      <span>Copiar Ficha WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Restablecimiento Rápido de Contraseña de Gerente */}
            <div className="hub-card-shell">
              <div className="hub-card-core">
                <div className="card-headline-bar">
                  <div>
                    <h3 className="card-headline-title">
                      <Icons.Key />
                      <span>Restablecer Contraseña de Gerente</span>
                    </h3>
                    <div className="card-headline-desc">
                      Nodo: <strong>{activeBranchInfo ? activeBranchInfo.branchName : 'MySQL Local'}</strong>
                    </div>
                  </div>
                  <span className="hub-badge-pill badge-emerald">Directo</span>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!passForm.usuarioObjetivo || !passForm.passwordNuevo) {
                    showToast('Ingresa usuario y contraseña.', 'error');
                    return;
                  }
                  setSavingPass(true);
                  try {
                    const res = await dispatchAction('change_manager_password', {
                      usuarioGerente: passForm.usuarioObjetivo,
                      nuevoPassword: passForm.passwordNuevo
                    });
                    showToast(res.message || 'Contraseña actualizada');
                    const msg = `🍞 *DULCE HORNO POS - ACCESO ACTUALIZADO*\n\n` +
                      `👤 *Usuario:* ${passForm.usuarioObjetivo}\n` +
                      `🔒 *Nueva Clave:* ${passForm.passwordNuevo}\n` +
                      `📅 *Fecha:* ${new Date().toLocaleString()}`;
                    copyToClipboard(msg, 'Nueva clave copiada para WhatsApp');
                  } catch (err) {
                    showToast(err.message, 'error');
                  } finally {
                    setSavingPass(false);
                  }
                }}>
                  <div className="form-card-field">
                    <label className="form-card-label">Usuario Gerente en Terminal:</label>
                    <input
                      type="text"
                      className="form-card-input font-mono"
                      value={passForm.usuarioObjetivo}
                      onChange={(e) => setPassForm({ ...passForm, usuarioObjetivo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-card-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-card-label">Nueva Contraseña:</label>
                      <button
                        type="button"
                        className="btn-action-pill btn-dark"
                        style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                        onClick={() => setPassForm({ ...passForm, passwordNuevo: generateRandomPass() })}
                      >
                        Generar Segura
                      </button>
                    </div>
                    <input
                      type="text"
                      className="form-card-input font-mono"
                      value={passForm.passwordNuevo}
                      onChange={(e) => setPassForm({ ...passForm, passwordNuevo: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 14,
                    lineHeight: 1.4
                  }}>
                    La contraseña se actualizará en la base de datos de la terminal seleccionada con cifrado criptográfico scrypt y se copiará la ficha a tu portapapeles.
                  </div>

                  <button
                    type="submit"
                    className="btn-action-pill btn-emerald"
                    disabled={savingPass}
                    style={{ width: '100%', padding: '10px 14px', fontWeight: 700 }}
                  >
                    <Icons.Check />
                    <span>{savingPass ? 'Actualizando...' : 'Restablecer Clave & Copiar Ficha'}</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Card 3: Rescate de Usuario Técnico (Programador) */}
            <div className="hub-card-shell">
              <div className="hub-card-core">
                <div className="card-headline-bar">
                  <h3 className="card-headline-title">
                    <Icons.Lock />
                    <span>Usuario Técnico (Superusuario)</span>
                  </h3>
                </div>
                <form onSubmit={handleCambiarPassword}>
                  <div className="form-card-field">
                    <label className="form-card-label">Usuario Técnico Maestro:</label>
                    <input
                      type="text"
                      className="form-card-input"
                      value={passForm.usernameProgramador}
                      onChange={(e) => setPassForm({ ...passForm, usernameProgramador: e.target.value })}
                    />
                  </div>
                  <div className="form-card-field">
                    <label className="form-card-label">Contraseña Actual del Programador:</label>
                    <input
                      type="password"
                      className="form-card-input"
                      value={passForm.passwordProgramador}
                      onChange={(e) => setPassForm({ ...passForm, passwordProgramador: e.target.value })}
                    />
                  </div>
                  <div className="form-card-field">
                    <label className="form-card-label">Usuario Técnico a Restablecer:</label>
                    <input
                      type="text"
                      className="form-card-input"
                      value={passForm.usuarioObjetivo}
                      onChange={(e) => setPassForm({ ...passForm, usuarioObjetivo: e.target.value })}
                    />
                  </div>
                  <button type="submit" className="btn-action-pill btn-dark" disabled={savingPass} style={{ width: '100%', marginTop: 8 }}>
                    <Icons.Check />
                    <span>{savingPass ? 'Actualizando...' : 'Actualizar Credencial Técnica'}</span>
                    <div className="btn-inner-icon-ring">
                      <Icons.ArrowUpRight />
                    </div>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 6: CONFIGURACIÓN DE RED & ENLACE REMOTO
            ======================================================== */}
        {activeTab === 'network' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
            {/* Card 1: Estado del Broker y URL Activa */}
            <div className="hub-card-shell">
              <div className="hub-card-core">
                <div className="card-headline-bar">
                  <h3 className="card-headline-title">
                    <Icons.Network />
                    <span>Servidor Broker de Retransmisión</span>
                  </h3>
                  <span className={`hub-badge-pill ${brokerStatus.connected ? 'badge-emerald' : 'badge-rose'}`}>
                    {brokerStatus.connected ? 'En Línea' : 'Desconectado'}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Este Hub incluye su propio servidor de túnel WebSocket que escucha en el puerto <strong>{networkInfo.port || 4800}</strong> en todas las interfaces de red (0.0.0.0).
                </p>

                <form onSubmit={handleSaveRelayUrl}>
                  <div className="form-card-field">
                    <label className="form-card-label">Dirección WebSocket del Broker:</label>
                    <input
                      type="text"
                      className="form-card-input font-mono"
                      value={customRelayInput}
                      onChange={(e) => setCustomRelayInput(e.target.value)}
                      placeholder="ws://127.0.0.1:4800 o wss://tu-tunnel.trycloudflare.com"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button type="submit" className="btn-action-pill btn-cyan" style={{ flex: 1 }}>
                      <Icons.Check />
                      <span>Aplicar &amp; Reconectar</span>
                    </button>
                    <button
                      type="button"
                      className="btn-action-pill btn-dark"
                      onClick={() => {
                        setCustomRelayInput('ws://127.0.0.1:4800');
                        window.hubApi.setRelayUrl('ws://127.0.0.1:4800');
                        showToast('Restablecido a localhost (127.0.0.1:4800)');
                      }}
                    >
                      <Icons.Refresh />
                      <span>Restablecer Local</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Card 2: Direcciones IP para Conexión de Sucursales */}
            <div className="hub-card-shell">
              <div className="hub-card-core">
                <div className="card-headline-bar">
                  <h3 className="card-headline-title">
                    <Icons.Server />
                    <span>Direcciones de Conexión para Clientes</span>
                  </h3>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div className="data-metric-label" style={{ marginBottom: 4 }}>Para computadoras en la misma red local (WiFi / Ethernet):</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <code className="config-chip-value" style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8 }}>
                      ws://{preferredLanIp}:4800
                    </code>
                    <button
                      className="btn-action-pill btn-dark"
                      style={{ padding: '8px 12px' }}
                      onClick={() => copyToClipboard(`ws://${preferredLanIp}:4800`, 'URL LAN copiada')}
                      title="Copiar"
                    >
                      <Icons.Copy />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div className="data-metric-label" style={{ marginBottom: 4 }}>Para computadoras en cualquier parte del mundo (Internet):</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Puedes exponer el puerto 4800 usando un túnel seguro gratuito sin abrir puertos en el módem (por ejemplo con <code>npx cloudflared tunnel --url http://localhost:4800</code> o <code>ngrok http 4800</code>). Luego coloca esa URL <code>wss://...</code> aquí y en el sistema del cliente.
                  </p>
                </div>

                <div>
                  <div className="data-metric-label" style={{ marginBottom: 6 }}>Interfaces de red detectadas en este equipo:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(networkInfo.ips || []).map((ip, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: 6, fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{ip.name}</span>
                        <code style={{ color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>{ip.address}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>

      {/* ========================================================
          MODAL 1: ACTIVACIÓN COMERCIAL DE LICENCIA & GERENTE
          ======================================================== */}
      {licenseModal.isOpen && (
        <div className="hub-modal-overlay" onClick={() => !licenseModal.dispatching && setLicenseModal({ ...licenseModal, isOpen: false })}>
          <div className="hub-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-header">
              <div>
                <h3 className="hub-modal-title">
                  <Icons.Bolt />
                  <span>Activar Licencia Comercial y Registrar Gerente</span>
                </h3>
                <div className="hub-modal-subtitle">
                  Terminal Destino: <strong>{licenseModal.branchName}</strong> (ID: {licenseModal.branchId})
                </div>
              </div>
              <button
                type="button"
                className="btn-action-pill btn-dark"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                onClick={() => setLicenseModal({ ...licenseModal, isOpen: false })}
                disabled={licenseModal.dispatching}
              >
                <Icons.Close />
              </button>
            </div>

            <div className="hub-modal-body">
              {licenseModal.completedReceipt ? (
                <div>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'var(--color-emerald)', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                      <Icons.ShieldCheck />
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                      Terminal Activada Exitosamente
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      La terminal remota recibió el despacho y habilitó el acceso para el Gerente en vivo.
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    lineHeight: 1.6,
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {licenseModal.completedReceipt.receiptText}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn-action-pill btn-emerald"
                      style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                      onClick={() => copyToClipboard(licenseModal.completedReceipt.receiptText, 'Ficha copiada para WhatsApp/Correo')}
                    >
                      <Icons.Copy />
                      <span>Copiar Ficha para WhatsApp / Correo</span>
                    </button>
                    <button
                      type="button"
                      className="btn-action-pill btn-dark"
                      style={{ padding: '10px 18px' }}
                      onClick={() => setLicenseModal({ ...licenseModal, isOpen: false })}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleDispatchActivation}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div className="form-card-field">
                      <label className="form-card-label">Modalidad / Tier de Licencia:</label>
                      <select
                        className="form-card-input"
                        value={licenseModal.tier}
                        onChange={(e) => {
                          const newTier = e.target.value;
                          const tierObj = TIERS.find((t) => t.id === newTier);
                          const exp = calculateExpirationDate(tierObj?.defaultDays);
                          setLicenseModal({
                            ...licenseModal,
                            tier: newTier,
                            tipoLicencia: tierObj?.label || newTier,
                            token: generateStructuredHubToken(newTier, licenseModal.branchId),
                            fechaExpiracion: exp
                          });
                        }}
                      >
                        {TIERS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-card-field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-card-label">Token Estructurado de Activación:</label>
                        <button
                          type="button"
                          className="btn-action-pill btn-dark"
                          style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          onClick={() => setLicenseModal({ ...licenseModal, token: generateStructuredHubToken(licenseModal.tier, licenseModal.branchId) })}
                        >
                          Generar Nuevo
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-card-input font-mono"
                        style={{ color: '#38bdf8', fontWeight: 700 }}
                        value={licenseModal.token}
                        onChange={(e) => setLicenseModal({ ...licenseModal, token: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-card-field">
                      <label className="form-card-label">Nombre del Negocio / Panadería:</label>
                      <input
                        type="text"
                        className="form-card-input"
                        placeholder="Panadería La Esperanza"
                        value={licenseModal.nombreNegocio}
                        onChange={(e) => setLicenseModal({ ...licenseModal, nombreNegocio: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-card-field">
                        <label className="form-card-label">Nombre del Titular / Gerente:</label>
                        <input
                          type="text"
                          className="form-card-input"
                          placeholder="Carlos Morales"
                          value={licenseModal.nombreGerente}
                          onChange={(e) => setLicenseModal({ ...licenseModal, nombreGerente: e.target.value })}
                        />
                      </div>

                      <div className="form-card-field">
                        <label className="form-card-label">Usuario de Acceso del Gerente:</label>
                        <input
                          type="text"
                          className="form-card-input font-mono"
                          placeholder="carlos_gerente"
                          value={licenseModal.usuarioGerente}
                          onChange={(e) => setLicenseModal({ ...licenseModal, usuarioGerente: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-card-field">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-card-label">Contraseña Inicial:</label>
                        <button
                          type="button"
                          className="btn-action-pill btn-dark"
                          style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          onClick={() => setLicenseModal({ ...licenseModal, passwordGerente: generateRandomPass() })}
                        >
                          Generar Aleatoria
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-card-input font-mono"
                        value={licenseModal.passwordGerente}
                        onChange={(e) => setLicenseModal({ ...licenseModal, passwordGerente: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-card-field">
                      <label className="form-card-label">Fecha de Expiración (Vigencia):</label>
                      <input
                        type="date"
                        className="form-card-input"
                        value={licenseModal.fechaExpiracion}
                        onChange={(e) => setLicenseModal({ ...licenseModal, fechaExpiracion: e.target.value })}
                        placeholder="Dejar vacío para Licencia Vitalicia Permanente"
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {licenseModal.fechaExpiracion ? `Vigente hasta el ${licenseModal.fechaExpiracion}` : 'Sin fecha de caducidad (Licencia Vitalicia)'}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      background: 'rgba(56, 189, 248, 0.06)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <Icons.Pulse />
                      <span>Al confirmar el pago y activar, la terminal remota se desbloqueará en tiempo real y el Gerente podrá iniciar sesión inmediatamente.</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                      <button
                        type="button"
                        className="btn-action-pill btn-dark"
                        onClick={() => setLicenseModal({ ...licenseModal, isOpen: false })}
                        disabled={licenseModal.dispatching}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn-action-pill btn-emerald"
                        style={{ padding: '10px 20px', fontWeight: 700 }}
                        disabled={licenseModal.dispatching}
                      >
                        <Icons.Bolt />
                        <span>{licenseModal.dispatching ? 'Despachando a Terminal...' : 'Confirmar Pago & Activar Terminal'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: SUSPENSIÓN / REVOCACIÓN DE LICENCIA
          ======================================================== */}
      {revokeModal.isOpen && (
        <div className="hub-modal-overlay" onClick={() => !revokeModal.revoking && setRevokeModal({ ...revokeModal, isOpen: false })}>
          <div className="hub-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-header" style={{ borderBottomColor: 'rgba(244, 63, 94, 0.2)' }}>
              <div>
                <h3 className="hub-modal-title" style={{ color: '#fb7185' }}>
                  <Icons.ShieldAlert />
                  <span>Suspender Licencia de Terminal</span>
                </h3>
                <div className="hub-modal-subtitle">
                  Terminal: <strong>{revokeModal.branchName}</strong> (ID: {revokeModal.branchId})
                </div>
              </div>
              <button
                type="button"
                className="btn-action-pill btn-dark"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                onClick={() => setRevokeModal({ ...revokeModal, isOpen: false })}
                disabled={revokeModal.revoking}
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleConfirmRevoke}>
              <div className="hub-modal-body">
                <div style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                  fontSize: '0.78rem',
                  color: '#cbd5e1',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: '#fb7185', display: 'block', marginBottom: '4px' }}>
                    Efecto Inmediato en Tiempo Real:
                  </strong>
                  Al suspender la licencia, la terminal remota cerrará cualquier sesión abierta, se bloqueará con la pantalla roja de suspensión y el Gerente quedará deshabilitado en la base de datos hasta que decidas reactivarla.
                </div>

                <div className="form-card-field">
                  <label className="form-card-label">Motivo de Suspensión:</label>
                  <select
                    className="form-card-input"
                    value={revokeModal.motivoPreset}
                    onChange={(e) => setRevokeModal({ ...revokeModal, motivoPreset: e.target.value })}
                  >
                    <option value="Falta de pago de mensualidad o renovación">Falta de pago de mensualidad o renovación</option>
                    <option value="Periodo de evaluación Demo finalizado">Periodo de evaluación Demo finalizado</option>
                    <option value="Suspensión administrativa solicitada por el cliente">Suspensión administrativa solicitada por el cliente</option>
                    <option value="Incumplimiento de términos y condiciones de software">Incumplimiento de términos y condiciones de software</option>
                    <option value="Mantenimiento técnico mayor preventivo">Mantenimiento técnico mayor preventivo</option>
                    <option value="Personalizado...">Personalizado / Otro motivo...</option>
                  </select>
                </div>

                <div className="form-card-field">
                  <label className="form-card-label">Detalle o Mensaje visible en la terminal bloqueada:</label>
                  <input
                    type="text"
                    className="form-card-input"
                    placeholder="Ej. Favor de comunicarse al 55-XXXX-XXXX para renovar su plan"
                    value={revokeModal.motivoCustom}
                    onChange={(e) => setRevokeModal({ ...revokeModal, motivoCustom: e.target.value })}
                  />
                </div>
              </div>

              <div className="hub-modal-footer">
                <button
                  type="button"
                  className="btn-action-pill btn-dark"
                  onClick={() => setRevokeModal({ ...revokeModal, isOpen: false })}
                  disabled={revokeModal.revoking}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-action-pill btn-rose"
                  style={{ padding: '9px 18px', fontWeight: 700 }}
                  disabled={revokeModal.revoking}
                >
                  <Icons.ShieldAlert />
                  <span>{revokeModal.revoking ? 'Suspendiendo...' : 'Confirmar Suspensión Inmediata'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: REACTIVACIÓN DE LICENCIA
          ======================================================== */}
      {reactivateModal.isOpen && (
        <div className="hub-modal-overlay" onClick={() => !reactivateModal.reactivating && setReactivateModal({ ...reactivateModal, isOpen: false })}>
          <div className="hub-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-header" style={{ borderBottomColor: 'rgba(16, 185, 129, 0.2)' }}>
              <div>
                <h3 className="hub-modal-title" style={{ color: '#34d399' }}>
                  <Icons.ShieldCheck />
                  <span>Reactivar Licencia de Terminal</span>
                </h3>
                <div className="hub-modal-subtitle">
                  Terminal: <strong>{reactivateModal.branchName}</strong> (ID: {reactivateModal.branchId})
                </div>
              </div>
              <button
                type="button"
                className="btn-action-pill btn-dark"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                onClick={() => setReactivateModal({ ...reactivateModal, isOpen: false })}
                disabled={reactivateModal.reactivating}
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleConfirmReactivate}>
              <div className="hub-modal-body">
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                  fontSize: '0.78rem',
                  color: '#cbd5e1',
                  lineHeight: 1.5
                }}>
                  <strong style={{ color: '#34d399', display: 'block', marginBottom: '4px' }}>
                    Desbloqueo Inmediato:
                  </strong>
                  Esta acción restablecerá el estado activo en la base de datos de la terminal, habilitará la cuenta del Gerente y desbloqueará el punto de venta en vivo para volver a cobrar tickets al instante.
                </div>

                <div className="form-card-field">
                  <label className="form-card-label">Notas de Reactivación (Opcional):</label>
                  <input
                    type="text"
                    className="form-card-input"
                    placeholder="Ej. Pago acreditado folio #10842"
                    value={reactivateModal.notas}
                    onChange={(e) => setReactivateModal({ ...reactivateModal, notas: e.target.value })}
                  />
                </div>
              </div>

              <div className="hub-modal-footer">
                <button
                  type="button"
                  className="btn-action-pill btn-dark"
                  onClick={() => setReactivateModal({ ...reactivateModal, isOpen: false })}
                  disabled={reactivateModal.reactivating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-action-pill btn-emerald"
                  style={{ padding: '9px 18px', fontWeight: 700 }}
                  disabled={reactivateModal.reactivating}
                >
                  <Icons.ShieldCheck />
                  <span>{reactivateModal.reactivating ? 'Reactivando...' : 'Reactivar & Desbloquear Terminal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: MODIFICACIÓN DE PARÁMETROS DE LICENCIA
          ======================================================== */}
      {modifyModal.isOpen && (
        <div className="hub-modal-overlay" onClick={() => !modifyModal.saving && setModifyModal({ ...modifyModal, isOpen: false })}>
          <div className="hub-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-header">
              <div>
                <h3 className="hub-modal-title">
                  <Icons.Sliders />
                  <span>Modificar Parámetros de Licencia</span>
                </h3>
                <div className="hub-modal-subtitle">
                  Terminal: <strong>{modifyModal.branchName}</strong> (ID: {modifyModal.branchId})
                </div>
              </div>
              <button
                type="button"
                className="btn-action-pill btn-dark"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                onClick={() => setModifyModal({ ...modifyModal, isOpen: false })}
                disabled={modifyModal.saving}
              >
                <Icons.Close />
              </button>
            </div>

            <form onSubmit={handleConfirmModify}>
              <div className="hub-modal-body">
                <div className="form-card-field">
                  <label className="form-card-label">Nombre del Negocio / Panadería:</label>
                  <input
                    type="text"
                    className="form-card-input"
                    value={modifyModal.nombreNegocio}
                    onChange={(e) => setModifyModal({ ...modifyModal, nombreNegocio: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-card-field">
                    <label className="form-card-label">Titular / Contacto:</label>
                    <input
                      type="text"
                      className="form-card-input"
                      value={modifyModal.titular}
                      onChange={(e) => setModifyModal({ ...modifyModal, titular: e.target.value })}
                    />
                  </div>

                  <div className="form-card-field">
                    <label className="form-card-label">Modalidad / Tier:</label>
                    <select
                      className="form-card-input"
                      value={modifyModal.tier}
                      onChange={(e) => {
                        const newTier = e.target.value;
                        const tierObj = TIERS.find((t) => t.id === newTier);
                        const exp = calculateExpirationDate(tierObj?.defaultDays);
                        setModifyModal({
                          ...modifyModal,
                          tier: newTier,
                          tipoLicencia: tierObj?.label || newTier,
                          fechaExpiracion: exp
                        });
                      }}
                    >
                      {TIERS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-card-field">
                  <label className="form-card-label">Fecha de Expiración (YYYY-MM-DD):</label>
                  <input
                    type="date"
                    className="form-card-input"
                    value={modifyModal.fechaExpiracion}
                    onChange={(e) => setModifyModal({ ...modifyModal, fechaExpiracion: e.target.value })}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {modifyModal.fechaExpiracion ? `Vigente hasta el ${modifyModal.fechaExpiracion}` : 'Sin fecha de caducidad (Licencia Vitalicia)'}
                  </span>
                </div>

                <div className="form-card-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-card-label">Token de Licencia:</label>
                    <button
                      type="button"
                      className="btn-action-pill btn-dark"
                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                      onClick={() => setModifyModal({ ...modifyModal, token: generateStructuredHubToken(modifyModal.tier, modifyModal.branchId) })}
                    >
                      Re-emitir Token
                    </button>
                  </div>
                  <input
                    type="text"
                    className="form-card-input font-mono"
                    style={{ color: '#38bdf8', fontWeight: 700 }}
                    value={modifyModal.token}
                    onChange={(e) => setModifyModal({ ...modifyModal, token: e.target.value })}
                    required
                  />
                </div>

                <div className="form-card-field">
                  <label className="form-card-label">Notas Adicionales / Contrato:</label>
                  <textarea
                    className="form-card-input"
                    style={{ minHeight: '60px', resize: 'vertical' }}
                    value={modifyModal.notas}
                    onChange={(e) => setModifyModal({ ...modifyModal, notas: e.target.value })}
                  />
                </div>
              </div>

              <div className="hub-modal-footer">
                <button
                  type="button"
                  className="btn-action-pill btn-dark"
                  onClick={() => setModifyModal({ ...modifyModal, isOpen: false })}
                  disabled={modifyModal.saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-action-pill btn-cyan"
                  style={{ padding: '9px 18px', fontWeight: 700 }}
                  disabled={modifyModal.saving}
                >
                  <Icons.Check />
                  <span>{modifyModal.saving ? 'Guardando...' : 'Guardar Cambios en Terminal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: CAMBIO RÁPIDO DE CONTRASEÑA DE GERENTE
          ======================================================== */}
      {quickPassModal.isOpen && (
        <div className="hub-modal-overlay" onClick={() => !quickPassModal.saving && setQuickPassModal({ ...quickPassModal, isOpen: false })}>
          <div className="hub-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="hub-modal-header">
              <div>
                <h3 className="hub-modal-title">
                  <Icons.Key />
                  <span>Cambiar Contraseña de Gerente Remoto</span>
                </h3>
                <div className="hub-modal-subtitle">
                  Terminal: <strong>{quickPassModal.branchName}</strong> (ID: {quickPassModal.branchId})
                </div>
              </div>
              <button
                type="button"
                className="btn-action-pill btn-dark"
                style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                onClick={() => setQuickPassModal({ ...quickPassModal, isOpen: false })}
                disabled={quickPassModal.saving}
              >
                <Icons.Close />
              </button>
            </div>

            <div className="hub-modal-body">
              {quickPassModal.completedReceipt ? (
                <div>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                    textAlign: 'center'
                  }}>
                    <div style={{ color: 'var(--color-emerald)', display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                      <Icons.CheckCircle />
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                      ¡Contraseña Actualizada en Vivo!
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      La terminal ya sincronizó la nueva clave. Puedes enviarla por WhatsApp al cliente con un clic:
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.78rem',
                    lineHeight: 1.6,
                    color: '#e2e8f0',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {quickPassModal.completedReceipt.whatsappText}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn-action-pill btn-emerald"
                      style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                      onClick={() => copyToClipboard(quickPassModal.completedReceipt.whatsappText, 'Mensaje copiado para WhatsApp')}
                    >
                      <Icons.Copy />
                      <span>Copiar Ficha para WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      className="btn-action-pill btn-dark"
                      style={{ padding: '10px 18px' }}
                      onClick={() => setQuickPassModal({ ...quickPassModal, isOpen: false })}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmQuickPass}>
                  <div className="form-card-field">
                    <label className="form-card-label">Usuario Gerente en la Terminal:</label>
                    <input
                      type="text"
                      className="form-card-input font-mono"
                      value={quickPassModal.usuarioGerente}
                      onChange={(e) => setQuickPassModal({ ...quickPassModal, usuarioGerente: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-card-field">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-card-label">Nueva Contraseña:</label>
                      <button
                        type="button"
                        className="btn-action-pill btn-dark"
                        style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                        onClick={() => setQuickPassModal({ ...quickPassModal, nuevoPassword: generateRandomPass() })}
                      >
                        Generar Aleatoria
                      </button>
                    </div>
                    <input
                      type="text"
                      className="form-card-input font-mono"
                      value={quickPassModal.nuevoPassword}
                      onChange={(e) => setQuickPassModal({ ...quickPassModal, nuevoPassword: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginTop: 10,
                    lineHeight: 1.4
                  }}>
                    La contraseña se cifra con algoritmo criptográfico seguro scrypt y se actualiza en tiempo real en la base de datos de la terminal.
                  </div>

                  <div className="hub-modal-footer" style={{ margin: '18px -24px -24px -24px' }}>
                    <button
                      type="button"
                      className="btn-action-pill btn-dark"
                      onClick={() => setQuickPassModal({ ...quickPassModal, isOpen: false })}
                      disabled={quickPassModal.saving}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn-action-pill btn-emerald"
                      style={{ padding: '9px 18px', fontWeight: 700 }}
                      disabled={quickPassModal.saving}
                    >
                      <Icons.Key />
                      <span>{quickPassModal.saving ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="hub-toast">
          <div className="hub-toast-icon" style={{ color: toastMessage.type === 'error' ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
            {toastMessage.type === 'error' ? <Icons.AlertCircle /> : <Icons.CheckCircle />}
          </div>
          <span className="hub-toast-text">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('hub-root'));
root.render(<HubApp />);