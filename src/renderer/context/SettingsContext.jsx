import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const DEFAULT_USER_SETTINGS = {
  density: 'normal', // 'normal' | 'compact'
  fontSize: 'normal', // 'small' | 'normal' | 'large'
  defaultPOSCategory: 'todos',
  confirmClearCart: true,
  soundEffects: true,
  showShortcuts: true,
  autoClearSearch: false,
  autoPrintReceipt: false,
  animationsEnabled: true
};

export const DEFAULT_GLOBAL_SETTINGS = {
  nombrePanaderia: 'Panadería Dulce Horno',
  contactoTicket: 'Calle Dulce #45, Col. Centro • Tel: 555-8765',
  rfcTienda: 'DHO-260101-AAA',
  pieTicket: '¡Gracias por su preferencia! Vuelva pronto.',
  ivaPorcentaje: 16,
  pesoBolilloRefKg: 0.065,
  stockMinimoAlerta: 5,
  limiteEfectivoCaja: 3500,
  descuentoPanAyer: 50,
  horaFelizPan: '20:00',
  autocobroHabilitado: true,
  requiereAuthGerenteCorte: true,
  permitirDevolucionSinTicket: false
};

export const DEFAULT_DEV_SETTINGS = {
  modoDebug: false,
  mostrarLogsIPC: false,
  simularModoOffline: false,
  autoAbrirDevTools: false,
  tasaRefrescoMs: 5000
};

export const SettingsProvider = ({ children }) => {
  const { user } = useAuth();
  const username = user?.NombreUsuario || 'guest';
  const role = user?.Rol || 'Empleado';

  // Configuración de Tienda (Global)
  const [globalSettings, setGlobalSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('dulcehorno_global_settings');
      return saved ? { ...DEFAULT_GLOBAL_SETTINGS, ...JSON.parse(saved) } : DEFAULT_GLOBAL_SETTINGS;
    } catch {
      return DEFAULT_GLOBAL_SETTINGS;
    }
  });

  // Configuración de Perfil Personal (Por Usuario)
  const [userSettings, setUserSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(`dulcehorno_settings_${username}`);
      return saved ? { ...DEFAULT_USER_SETTINGS, ...JSON.parse(saved) } : DEFAULT_USER_SETTINGS;
    } catch {
      return DEFAULT_USER_SETTINGS;
    }
  });

  // Configuración de Desarrollador (Programador)
  const [devSettings, setDevSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('dulcehorno_dev_settings');
      return saved ? { ...DEFAULT_DEV_SETTINGS, ...JSON.parse(saved) } : DEFAULT_DEV_SETTINGS;
    } catch {
      return DEFAULT_DEV_SETTINGS;
    }
  });

  // Recargar configuración del usuario cuando cambia de sesión
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`dulcehorno_settings_${username}`);
      setUserSettings(saved ? { ...DEFAULT_USER_SETTINGS, ...JSON.parse(saved) } : DEFAULT_USER_SETTINGS);
    } catch {
      setUserSettings(DEFAULT_USER_SETTINGS);
    }
  }, [username]);

  // Aplicar adaptaciones visuales a la etiqueta body
  useEffect(() => {
    // Densidad visual
    if (userSettings.density === 'compact') {
      document.body.classList.add('density-compact');
    } else {
      document.body.classList.remove('density-compact');
    }

    // Escala de fuente para accesibilidad
    document.body.classList.remove('font-scale-large', 'font-scale-small');
    if (userSettings.fontSize === 'large') {
      document.body.classList.add('font-scale-large');
    } else if (userSettings.fontSize === 'small') {
      document.body.classList.add('font-scale-small');
    }

    // Animaciones y transiciones
    if (userSettings.animationsEnabled === false) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
  }, [userSettings.density, userSettings.fontSize, userSettings.animationsEnabled]);

  // Actualizar preferencias de perfil (Cualquier Rol)
  const updateUserSettings = (newValues) => {
    setUserSettings((prev) => {
      const updated = { ...prev, ...newValues };
      localStorage.setItem(`dulcehorno_settings_${username}`, JSON.stringify(updated));
      return updated;
    });
  };

  // Actualizar parámetros de tienda (Solo Gerente y Programador)
  const updateGlobalSettings = (newValues) => {
    if (role !== 'Gerente' && role !== 'Programador') {
      throw new Error('Solo el Gerente o Programador pueden modificar parámetros de tienda.');
    }
    setGlobalSettings((prev) => {
      const updated = { ...prev, ...newValues };
      localStorage.setItem('dulcehorno_global_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Actualizar parámetros técnicos (Exclusivo Programador)
  const updateDevSettings = (newValues) => {
    if (role !== 'Programador') {
      throw new Error('Solo el Programador tiene acceso a la configuración técnica de desarrollo.');
    }
    setDevSettings((prev) => {
      const updated = { ...prev, ...newValues };
      localStorage.setItem('dulcehorno_dev_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Restablecer configuraciones
  const resetUserSettings = () => {
    setUserSettings(DEFAULT_USER_SETTINGS);
    localStorage.removeItem(`dulcehorno_settings_${username}`);
  };

  const resetAllSettings = () => {
    if (role !== 'Programador') {
      throw new Error('Solo el Programador puede restablecer la configuración global.');
    }
    setGlobalSettings(DEFAULT_GLOBAL_SETTINGS);
    setDevSettings(DEFAULT_DEV_SETTINGS);
    localStorage.removeItem('dulcehorno_global_settings');
    localStorage.removeItem('dulcehorno_dev_settings');
  };

  const exportSettingsJSON = () => {
    return JSON.stringify({
      userSettings,
      globalSettings,
      devSettings,
      exportedAt: new Date().toISOString()
    }, null, 2);
  };

  const importSettingsJSON = (jsonStr) => {
    if (role !== 'Programador') {
      throw new Error('Solo el Programador puede importar configuraciones del sistema.');
    }
    try {
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (parsed.globalSettings) {
        setGlobalSettings(parsed.globalSettings);
        localStorage.setItem('dulcehorno_global_settings', JSON.stringify(parsed.globalSettings));
      }
      if (parsed.devSettings) {
        setDevSettings(parsed.devSettings);
        localStorage.setItem('dulcehorno_dev_settings', JSON.stringify(parsed.devSettings));
      }
      return true;
    } catch (e) {
      throw new Error('El archivo de configuración no tiene un formato JSON válido.');
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        userSettings,
        globalSettings,
        devSettings,
        updateUserSettings,
        updateGlobalSettings,
        updateDevSettings,
        resetUserSettings,
        resetAllSettings,
        exportSettingsJSON,
        importSettingsJSON,
        userRole: role
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
