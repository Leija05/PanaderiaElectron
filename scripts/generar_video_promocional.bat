@echo off
chcp 65001 >nul
echo ======================================================================
echo   GENERADOR DE VIDEO PROMOCIONAL - DULCEHORNO PUNTO DE VENTA
echo ======================================================================
echo.
echo 1. Verificando entorno (Python, Node y FFmpeg)...
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] FFmpeg no esta en el PATH.
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta disponible.
    pause
    exit /b 1
)

echo 2. Emulando ejecucion del software DulceHorno y capturando pantallas reales...
set DEMO_EMULATE=1
node -e "const cp = require('child_process'); const env = { ...process.env, DEMO_EMULATE: '1' }; delete env.ELECTRON_RUN_AS_NODE; const res = cp.spawnSync('node_modules/electron/dist/electron.exe', ['.', '--no-sandbox', '--disable-gpu'], { env, stdio: 'inherit' }); process.exit(res.status || 0);"
if %errorlevel% neq 0 goto error

echo 3. Generando mockups de ventana y capas graficas editoriales...
python assets\promo_video\generate_app_screens.py
if %errorlevel% neq 0 goto error

echo 4. Generando banda sonora ritmica y efectos de sonido sincronizados...
python assets\promo_video\generate_app_soundtrack.py
if %errorlevel% neq 0 goto error

echo 5. Renderizando video promocional cinematico con FFmpeg...
python assets\promo_video\render_software_promo_video.py
if %errorlevel% neq 0 goto error

echo.
echo ======================================================================
echo   ¡PROCESO FINALIZADO CON EXITO!
echo   Video de Software: assets\promo_video\video_promocional_software_dulcehorno.mp4
echo ======================================================================
pause
exit /b 0

:error
echo.
echo [ERROR] Ocurrio un error durante la generacion del video promocional.
pause
exit /b 1
