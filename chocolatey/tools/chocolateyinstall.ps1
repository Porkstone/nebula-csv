$ErrorActionPreference = 'Stop'
if (Get-OSArchitectureWidth -Compare 32) { throw 'Nebula CSV Viewer requires 64-bit Windows.' }
$packageArgs = @{
  packageName    = 'nebula-csv'
  fileType       = 'exe'
  url64bit       = 'https://github.com/porkstone/nebula-csv/releases/download/v1.0.5/nebula-csv-viewer.exe'
  checksum64     = 'F45F9FFE2BB0662AA485EFA26200C70A099702477FC52A3CD1F68EEDF5AB90C6'
  checksumType64 = 'sha256'
  silentArgs     = '/S /allusers'
  validExitCodes = @(0, 1641, 3010)
  softwareName   = 'Nebula CSV Viewer*'
}
Install-ChocolateyPackage @packageArgs
