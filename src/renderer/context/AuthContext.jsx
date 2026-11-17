import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('panaderia-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = async (username, password) => {
    const res = await window.api.login(username, password);
    if (res.success && res.user) {
      setUser(res.user);
      sessionStorage.setItem('panaderia-user', JSON.stringify(res.user));
      return { success: true, user: res.user };
    }
    return { success: false, message: res.message || 'Credenciales inválidas' };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('panaderia-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: Boolean(user) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

