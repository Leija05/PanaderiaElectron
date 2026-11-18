@echo off
chcp 65001 > nul
:: ==============================================================================
:: Panadería Dulce Horno - Script de Post-Instalación Silenciosa
:: Se ejecuta automáticamente al instalar la aplicación en el equipo del cliente
:: ==============================================================================

:: 1. Configurar MySQL de XAMPP como Servicio de Windows en modo Automático
if exist "C:\xampp\mysql\bin\mysqld.exe" (
    "C:\xampp\mysql\bin\mysqld.exe" --install MySQL --defaults-file="C:\xampp\mysql\bin\my.ini" > nul 2>&1
    sc config MySQL start= auto > nul 2>&1
    net start MySQL > nul 2>&1
)

:: 2. Crear lanzador de arranque automático en Inicio de Windows
set "STARTUP_DIR=%ALLUSERSPROFILE%\Microsoft\Windows\Start Menu\Programs\Startup"
if not exist "%STARTUP_DIR%" set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

set "APP_EXE=%~dp0..\..\DulceHorno.exe"
if exist "%APP_EXE%" (
    set "VBS_PATH=%STARTUP_DIR%\DulceHorno_AutoStart.vbs"
    (
        echo Set WshShell = CreateObject^("WScript.Shell"^)
        echo WshShell.Run """%APP_EXE%""", 1, False
    ) > "%VBS_PATH%" 2> nul
)

exit /b 0
