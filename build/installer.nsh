!define NEBULA_CSV_PROGID "Porkstone.NebulaCSV.csv"

!macro customInstall
  SetRegView 64
  ; Register an optional handler, without assigning the .csv default application.
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}" "FriendlyAppName" "nebula-csv"
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}\SupportedTypes" ".csv" ""
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}\DefaultIcon" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}",0'
  WriteRegStr HKLM "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'

  WriteRegStr HKLM "Software\Classes\${NEBULA_CSV_PROGID}" "" "CSV document"
  WriteRegStr HKLM "Software\Classes\${NEBULA_CSV_PROGID}\Application" "ApplicationName" "nebula-csv"
  WriteRegStr HKLM "Software\Classes\${NEBULA_CSV_PROGID}\Application" "ApplicationDescription" "Preview local CSV files"
  WriteRegStr HKLM "Software\Classes\${NEBULA_CSV_PROGID}\DefaultIcon" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}",0'
  WriteRegStr HKLM "Software\Classes\${NEBULA_CSV_PROGID}\shell\open\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  WriteRegStr HKLM "Software\Classes\.csv\OpenWithProgids" "${NEBULA_CSV_PROGID}" ""

  WriteRegStr HKLM "Software\RegisteredApplications" "nebula-csv" "Software\Porkstone\NebulaCSV\Capabilities"
  WriteRegStr HKLM "Software\Porkstone\NebulaCSV\Capabilities" "ApplicationName" "nebula-csv"
  WriteRegStr HKLM "Software\Porkstone\NebulaCSV\Capabilities" "ApplicationDescription" "Preview local CSV files"
  WriteRegStr HKLM "Software\Porkstone\NebulaCSV\Capabilities\FileAssociations" ".csv" "${NEBULA_CSV_PROGID}"

  WriteRegStr HKLM "Software\Classes\SystemFileAssociations\.csv\shell\NebulaCSV" "MUIVerb" "Open with nebula-csv"
  WriteRegStr HKLM "Software\Classes\SystemFileAssociations\.csv\shell\NebulaCSV" "Icon" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}",0'
  WriteRegStr HKLM "Software\Classes\SystemFileAssociations\.csv\shell\NebulaCSV\command" "" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" "%1"'
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
  SetRegView lastused
!macroend

!macro customUnInstall
  SetRegView 64
  DeleteRegValue HKLM "Software\Classes\.csv\OpenWithProgids" "${NEBULA_CSV_PROGID}"
  DeleteRegValue HKLM "Software\RegisteredApplications" "nebula-csv"
  DeleteRegKey HKLM "Software\Porkstone\NebulaCSV\Capabilities"
  DeleteRegKey HKLM "Software\Classes\${NEBULA_CSV_PROGID}"
  DeleteRegKey HKLM "Software\Classes\Applications\${APP_EXECUTABLE_FILENAME}"
  DeleteRegKey HKLM "Software\Classes\SystemFileAssociations\.csv\shell\NebulaCSV"
  System::Call 'shell32::SHChangeNotify(i 0x08000000, i 0, p 0, p 0)'
  SetRegView lastused
!macroend

