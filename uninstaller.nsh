Section "UninstallSection"
  ; Code for uninstallation...

  ; Delete files in AppData/Roaming directory
  RMDir /r "$APPDATA\buffed-client"
  
  ; Code for uninstallation...
SectionEnd