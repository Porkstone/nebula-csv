param([string]$Version)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
if (-not $Version) { $Version = (Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).version }
$installer = Join-Path $root 'release/nebula-csv-viewer.exe'
$checksum = (Get-FileHash -LiteralPath $installer -Algorithm SHA256).Hash
$tools = Join-Path $root 'chocolatey/tools'
New-Item -ItemType Directory -Path $tools -Force | Out-Null
$script = @'
$ErrorActionPreference = 'Stop'
if (Get-OSArchitectureWidth -Compare 32) { throw 'Nebula CSV Viewer requires 64-bit Windows.' }
$packageArgs = @{
  packageName    = 'nebula-csv'
  fileType       = 'exe'
  url64bit       = 'https://github.com/porkstone/nebula-csv/releases/download/v__VERSION__/nebula-csv-viewer.exe'
  checksum64     = '__CHECKSUM__'
  checksumType64 = 'sha256'
  silentArgs     = '/S /allusers'
  validExitCodes = @(0, 1641, 3010)
  softwareName   = 'Nebula CSV Viewer*'
}
Install-ChocolateyPackage @packageArgs
'@
$script.Replace('__VERSION__', $Version).Replace('__CHECKSUM__', $checksum) | Set-Content -LiteralPath (Join-Path $tools 'chocolateyinstall.ps1') -Encoding UTF8
Write-Output "Prepared Chocolatey installer script for $Version with SHA256 $checksum"
