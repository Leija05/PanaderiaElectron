@echo off
chcp 65001 > nul
title Dulce Horno - Configuración de Arranque Automático con Windows

echo ==============================================================================
echo    PANADERÍA DULCE HORNO - ASISTENTE DE ARRANQUE AUTOMÁTICO EN WINDOWS
echo ==============================================================================
echo.
echo Este asistente configurará tu computadora para que, al encenderla:
echo  1. MySQL de XAMPP inicie automáticamente en segundo plano.
echo  2. Dulce Horno Punto de Venta se abra listo para cobrar en mostrador.
echo.
echo ------------------------------------------------------------------------------
echo [PASO 1/2] Verificando e instalando MySQL de XAMPP como Servicio de Windows...
echo ------------------------------------------------------------------------------

if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo [OK] XAMPP detectado en C:\xampp\mysql
    
    :: Intentar registrar el servicio MySQL si no está registrado
    "C:\xampp\mysql\bin\mysqld.exe" --install MySQL --defaults-file="C:\xampp\mysql\bin\my.ini" > nul 2>&1
    
    :: Asegurar inicio automático en Windows
    sc config MySQL start= auto > nul 2>&1
    
    :: Iniciar el servicio ahora mismo si estaba detenido
    net start MySQL > nul 2>&1
    
    echo [✓] Servicio MySQL configurado en modo AUTOMÁTICO.
) else (
    echo [AVISO] No se encontró C:\xampp\mysql\bin\mysqld.exe.
    echo Asegúrate de tener XAMPP instalado o MySQL corriendo en el puerto 3306.
)

echo.
echo ------------------------------------------------------------------------------
echo [PASO 2/2] Creando lanzador silencioso de Dulce Horno al encender Windows...
echo ------------------------------------------------------------------------------

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_LAUNCHER=%STARTUP_FOLDER%\DulceHorno_AutoStart.vbs"
set "APP_DIR=%~dp0.."

:: Generar script VBS que arranca Dulce Horno sin ventana negra de consola
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%APP_DIR%"
echo WshShell.Run "cmd /c npm start", 0, False
) > "%VBS_LAUNCHER%"

if exist "%VBS_LAUNCHER%" (
    echo [✓] Lanzador automático creado exitosamente en:
    echo     %VBS_LAUNCHER%
) else (
    echo [ERROR] No se pudo escribir en la carpeta de Inicio de Windows.
)

echo.
echo ==============================================================================
echo  ¡CONFIGURACIÓN COMPLETADA CON ÉXITO!
echo ==============================================================================
echo A partir de ahora, cada vez que enciendas la computadora:
echo  • MySQL iniciará silenciosamente en Windows.
echo  • Dulce Horno abrirá directamente tu pantalla de venta.
echo.
echo Presiona cualquier tecla para salir...
pause > nul
