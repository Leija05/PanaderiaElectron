// Librería de iconos SVG vectoriales locales (100% offline, sin dependencias CDN)
window.App = window.App || {};

window.App.Icons = {
  svg(pathContent, viewBox = '0 0 24 24', className = '') {
    return `<svg class="icon ${className}" viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${pathContent}</svg>`;
  },

  bread() {
    return this.svg(`
      <path d="M4 11V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3"/>
      <path d="M4 11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3"/>
      <path d="M6 14v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/>
      <path d="M9 8c.5 1 1.5 1.5 3 1.5s2.5-.5 3-1.5"/>
    `);
  },

  cart() {
    return this.svg(`
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    `);
  },

  pos() {
    return this.svg(`
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01"/>
    `);
  },

  box() {
    return this.svg(`
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    `);
  },

  chart() {
    return this.svg(`
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    `);
  },

  users() {
    return this.svg(`
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    `);
  },

  user() {
    return this.svg(`
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    `);
  },

  truck() {
    return this.svg(`
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    `);
  },

  cut() {
    return this.svg(`
      <circle cx="6" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    `);
  },

  code() {
    return this.svg(`
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    `);
  },

  sun() {
    return this.svg(`
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    `);
  },

  moon() {
    return this.svg(`
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    `);
  },

  logout() {
    return this.svg(`
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    `);
  },

  search() {
    return this.svg(`
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    `);
  },

  plus() {
    return this.svg(`
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    `);
  },

  minus() {
    return this.svg(`
      <line x1="5" y1="12" x2="19" y2="12"/>
    `);
  },

  trash() {
    return this.svg(`
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    `);
  },

  check() {
    return this.svg(`
      <polyline points="20 6 9 17 4 12"/>
    `);
  },

  x() {
    return this.svg(`
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    `);
  },

  alert() {
    return this.svg(`
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    `);
  },

  printer() {
    return this.svg(`
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    `);
  },

  download() {
    return this.svg(`
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    `);
  },

  lock() {
    return this.svg(`
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    `);
  },

  key() {
    return this.svg(`
      <path d="M21 2l-2 2m-1.5 1.5L14 9l-1.5-1.5L11 9l-1.5-1.5L8 9"/>
      <circle cx="7.5" cy="16.5" r="4.5"/>
    `);
  },

  refresh() {
    return this.svg(`
      <polyline points="23 4 23 10 17 10"/>
      <polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    `);
  },

  scale() {
    return this.svg(`
      <path d="M12 3v18M6 8l6-5 6 5M6 8a4 4 0 0 0 0 8h.5a4 4 0 0 0 3.5-2M18 8a4 4 0 0 1 0 8h-.5a4 4 0 0 1-3.5-2"/>
    `);
  },

  cash() {
    return this.svg(`
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <circle cx="12" cy="12" r="2"/>
      <path d="M6 12h.01M18 12h.01"/>
    `);
  },

  logoSvg(size = 42) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 256 256" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M128 32 C80 32 40 68 40 116 C40 138 48 158 62 173 C66 177 68 183 66 189 L60 210 C58 217 64 224 72 224 L184 224 C192 224 198 217 196 210 L190 189 C188 183 190 177 194 173 C208 158 216 138 216 116 C216 68 176 32 128 32 Z" fill="#D97706"/>
        <path d="M96 110 C96 90 110 80 128 80 C146 80 160 90 160 110" stroke="#FFF9F0" stroke-width="12" stroke-linecap="round" fill="none"/>
        <path d="M82 140 C86 132 102 124 128 124 C154 124 170 132 174 140" stroke="#FFF9F0" stroke-width="10" stroke-linecap="round" fill="none"/>
        <circle cx="128" cy="170" r="10" fill="#FFF9F0"/>
      </svg>
    `;
  }
};

