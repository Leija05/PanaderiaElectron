@echo off
chcp 65001 > nul
title Dulce Horno - Desactivar Arranque Automático

echo ==============================================================================
echo    PANADERÍA DULCE HORNO - DESACTIVAR ARRANQUE AUTOMÁTICO
echo ==============================================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_LAUNCHER=%STARTUP_FOLDER%\DulceHorno_AutoStart.vbs"

if exist "%VBS_LAUNCHER%" (
    del /f /q "%VBS_LAUNCHER%"
    echo [✓] Lanzador automático de Dulce Horno eliminado de la carpeta de Inicio.
) else (
    echo [INFO] No había lanzador automático configurado.
)

echo.
echo Presiona cualquier tecla para salir...
pause > nul
