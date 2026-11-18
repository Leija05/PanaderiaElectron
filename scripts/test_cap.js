const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({
      width: 1920,
      height: 1080,
      show: false
    });

    await win.loadURL('data:text/html,<h1 style="color:orange; font-family:sans-serif; padding:50px;">Hello from Electron Capture!</h1>');
    
    setTimeout(async () => {
      const img = await win.webContents.capturePage();
      const outPath = path.resolve(__dirname, '../assets/promo_video/test_electron_cap.png');
      fs.writeFileSync(outPath, img.toPNG());
      console.log('Capture success! Size:', img.getSize(), 'Saved to:', outPath);
      app.quit();
    }, 600);
  } catch (e) {
    console.error('Error during capture:', e);
    app.quit();
  }
});
