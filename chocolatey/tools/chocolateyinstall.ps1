$ErrorActionPreference = 'Stop'
if (Get-OSArchitectureWidth -Compare 32) { throw 'Nebula CSV Viewer requires 64-bit Windows.' }
$packageArgs = @{
  packageName    = 'nebula-csv'
  fileType       = 'exe'
  url64bit       = 'https://github.com/porkstone/nebula-csv/releases/download/v1.0.3/nebula-csv-viewer.exe'
  checksum64     = 'F639059016631995E891539A5076AC48FB68C51A1A4782FC1C4146D0C839DAE3'
  checksumType64 = 'sha256'
  silentArgs     = '/S /allusers'
  validExitCodes = @(0, 1641, 3010)
  softwareName   = 'Nebula CSV Viewer*'
}
Install-ChocolateyPackage @packageArgs
