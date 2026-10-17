#requires -Version 5.1
<#
  Verify the real MSIX internal AppxManifest.xml identity after packaging.
  Read-only: does not sign, install, upload or publish the package.
#>
param(
  [string]$OutputFolder = "dist-msix",
  [string]$IdentityName = $env:STORE_IDENTITY_NAME,
  [string]$Publisher = $env:STORE_PUBLISHER,
  [string]$PackageVersion = $env:STORE_PACKAGE_VERSION
)
$ErrorActionPreference = "Stop"
if (-not $IdentityName -or -not $Publisher -or -not $PackageVersion) {
  throw "Partner Centerの正式Identity・Publisher・PackageVersionが必要です"
}
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dir = Join-Path $root $OutputFolder
if (-not (Test-Path $dir)) {throw "出力先が見つかりません: $dir"}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$packages = @(Get-ChildItem -Path $dir -File -Filter "*.msix")
$uploads = @(Get-ChildItem -Path $dir -File -Filter "*.msixupload")
if ($packages.Count -lt 1 -or $uploads.Count -lt 1) {
  throw "Store用MSIXとMSIXUPLOADの両方が必要です。"
}
$rows = @()
foreach ($file in $packages) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($file.FullName)
  try {
    $entry = $zip.GetEntry("AppxManifest.xml")
    if ($null -eq $entry) {throw "AppxManifest.xmlなし: $($file.Name)"}
    $reader = New-Object System.IO.StreamReader($entry.Open())
    try { [xml]$manifest = $reader.ReadToEnd() } finally { $reader.Dispose() }
    $identity = $manifest.SelectSingleNode("/*[local-name()='Package']/*[local-name()='Identity']")
    if ($null -eq $identity) {throw "Package.Identity要素がありません"}
    $name = $identity.GetAttribute("Name")
    $pub = $identity.GetAttribute("Publisher")
    $ver = $identity.GetAttribute("Version")
    $arch = $identity.GetAttribute("ProcessorArchitecture")
    if ($name -cne $IdentityName) {throw "Name不一致: $name / Partner Center: $IdentityName"}
    if ($pub -cne $Publisher) {throw "Publisher不一致: $pub / Partner Center: $Publisher"}
    if ($ver -ne $PackageVersion) {throw "Version不一致: $ver / 指定: $PackageVersion"}
    if ($arch -ne "x64") {throw "CPUアーキテクチャ不一致: $arch"}
    $rows += [pscustomobject]@{File=$file.Name;Identity=$name;Publisher=$pub;Version=$ver;Architecture=$arch;Bytes=$file.Length}
  } finally { $zip.Dispose() }
}
foreach ($upload in $uploads) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($upload.FullName)
  try {
    $containsPackage = @($zip.Entries | Where-Object { $_.FullName -match '\.msix(bundle)?$' }).Count -gt 0
    if (-not $containsPackage) {throw "MSIXUPLOAD内にMSIX/MSIXBUNDLEがありません: $($upload.Name)"}
  } finally { $zip.Dispose() }
}
Write-Host "MSIX_MANIFEST_PASS: $($packages.Count) MSIX, $($uploads.Count) upload archive(s)"
$rows | Format-Table -AutoSize
Write-Host "Store認証・WACK・実機インストール検査は、まだ完了していません。"
