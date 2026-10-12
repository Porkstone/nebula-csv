$ErrorActionPreference = 'Stop'
if (Get-OSArchitectureWidth -Compare 32) { throw 'Nebula CSV Viewer requires 64-bit Windows.' }
$packageArgs = @{
  packageName    = 'nebula-csv'
  fileType       = 'exe'
  url64bit       = 'https://github.com/porkstone/nebula-csv/releases/download/v1.0.2/nebula-csv-viewer.exe'
  checksum64     = '025829DFB3B97C1847D1DC88065DE89FC87671C19FBC2DBA4BB525D5CFCD89AF'
  checksumType64 = 'sha256'
  silentArgs     = '/S /allusers'
  validExitCodes = @(0, 1641, 3010)
  softwareName   = 'Nebula CSV Viewer*'
}
Install-ChocolateyPackage @packageArgs
