!macro customInstall
  DetailPrint "Configurando base de datos MySQL y arranque automatico de Dulce Horno..."
  nsExec::ExecToLog '"$INSTDIR\resources\scripts\post-install.bat"'
!macroend

!macro customUnInstall
  DetailPrint "Limpiando configuracion de arranque de Dulce Horno..."
  SetShellVarContext current
  Delete "$SMSTARTUP\DulceHorno_AutoStart.vbs"
  SetShellVarContext all
  Delete "$SMSTARTUP\DulceHorno_AutoStart.vbs"
!macroend
