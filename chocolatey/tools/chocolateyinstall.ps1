$ErrorActionPreference = 'Stop'
if (Get-OSArchitectureWidth -Compare 32) { throw 'Nebula CSV Viewer requires 64-bit Windows.' }
$packageArgs = @{
  packageName    = 'nebula-csv'
  fileType       = 'exe'
  url64bit       = 'https://github.com/porkstone/nebula-csv/releases/download/v1.0.1/nebula-csv-viewer.exe'
  checksum64     = '7BD8EB99C656C2E054F1B2E768C426E8502CFABFF6F155947D588F3C7B32AE98'
  checksumType64 = 'sha256'
  silentArgs     = '/S /allusers'
  validExitCodes = @(0, 1641, 3010)
  softwareName   = 'Nebula CSV Viewer*'
}
Install-ChocolateyPackage @packageArgs
