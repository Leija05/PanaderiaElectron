const fs = require('fs');
const electron = require('electron');

fs.writeFileSync('scripts/electron_out.txt', JSON.stringify({
  type: typeof electron,
  isApp: !!electron.app,
  keys: Object.keys(electron)
}, null, 2));

if (electron.app) {
  electron.app.quit();
}
