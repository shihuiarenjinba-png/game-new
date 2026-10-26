#requires -Version 5.1
param(
  [string]$OutputFolder = "dist-msix",
  [string]$IdentityName = $env:STORE_IDENTITY_NAME,
  [string]$Publisher = $env:STORE_PUBLISHER,
  [string]$PackageVersion = $env:STORE_PACKAGE_VERSION,
  [string]$StoreDisplayName = $env:STORE_DISPLAY_NAME
)
$ErrorActionPreference = "Stop"

function Get-FileSha256Hex {
  param([Parameter(Mandatory=$true)][string]$Path)
  $algorithm = [System.Security.Cryptography.SHA256]::Create()
  $stream = [System.IO.File]::OpenRead($Path)
  try { return ([System.BitConverter]::ToString($algorithm.ComputeHash($stream))).Replace("-", "") }
  finally { $stream.Dispose(); $algorithm.Dispose() }
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$record = Get-Content -LiteralPath (Join-Path $root "store/partner-center-identity.json") -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $IdentityName -or -not $Publisher -or -not $PackageVersion -or -not $StoreDisplayName) {
  throw "Store Identity / Publisher / Version / DisplayName が必要です"
}
if ($IdentityName -cne [string]$record.identityName) { throw "Environment Identity differs from canonical record" }
if ($Publisher -cne [string]$record.publisher) { throw "Environment Publisher differs from canonical record" }
if ($StoreDisplayName -cne [string]$record.storeDisplayName) { throw "Environment Store display name differs from canonical record" }

$dir = Join-Path $root $OutputFolder
if (-not (Test-Path -LiteralPath $dir)) { throw "出力先が見つかりません: $dir" }

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$packages = @(Get-ChildItem -LiteralPath $dir -File -Filter "*.msix")
$uploads = @(Get-ChildItem -LiteralPath $dir -File -Filter "*.msixupload")
if ($packages.Count -ne 1 -or $uploads.Count -ne 1) {
  throw "Store用MSIXとMSIXUPLOADがそれぞれ1件必要です"
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($packages[0].FullName)
try {
  $entry = $zip.GetEntry("AppxManifest.xml")
  if (-not $entry) { throw "AppxManifest.xmlなし: $($packages[0].Name)" }
  $reader = New-Object System.IO.StreamReader($entry.Open())
  try { [xml]$manifest = $reader.ReadToEnd() }
  finally { $reader.Dispose() }

  $identity = $manifest.SelectSingleNode("/*[local-name()='Package']/*[local-name()='Identity']")
  if (-not $identity) { throw "Package.Identity要素がありません" }
  if ([string]$identity.GetAttribute("Name") -cne $IdentityName) { throw "Identity.Name mismatch" }
  if ([string]$identity.GetAttribute("Publisher") -cne $Publisher) { throw "Identity.Publisher mismatch" }
  if ([string]$identity.GetAttribute("Version") -cne $PackageVersion) { throw "Identity.Version mismatch" }
  if ([string]$identity.GetAttribute("Version") -notmatch '^\d+\.\d+\.\d+\.0$') { throw "Identity.Version revision must be 0" }
  if ([string]$identity.GetAttribute("ProcessorArchitecture") -cne "x64") { throw "ProcessorArchitecture is not x64" }

  $pdn = $manifest.SelectSingleNode("//*[local-name()='PublisherDisplayName']")
  if (-not $pdn -or [string]$pdn.InnerText -cne [string]$record.publisherDisplayName) {
    throw "PublisherDisplayName mismatch"
  }
  $propertiesName = $manifest.SelectSingleNode("//*[local-name()='Properties']/*[local-name()='DisplayName']")
  $visualElements = @($manifest.SelectNodes("//*[local-name()='VisualElements']"))
  if (-not $propertiesName -or [string]$propertiesName.InnerText -cne $StoreDisplayName) {
    throw "Package/Properties/DisplayName differs from reserved Store display name"
  }
  if ($visualElements.Count -ne 1 -or [string]$visualElements[0].GetAttribute("DisplayName") -cne $StoreDisplayName) {
    throw "uap:VisualElements/@DisplayName differs from reserved Store display name"
  }

  $resourceLanguages = @(
    $manifest.SelectNodes("//*[local-name()='Resources']/*[local-name()='Resource']") |
      ForEach-Object { [string]$_.GetAttribute("Language") }
  )
  if ($resourceLanguages -notcontains "ja-JP") { throw "Manifest Resources must include ja-JP" }

  if (@($zip.Entries | Where-Object { $_.FullName -match '(^|/)app\.asar$' }).Count -lt 1) {
    throw "app.asar missing from MSIX"
  }
  if (@($zip.Entries | Where-Object { $_.FullName -match '(^|/)LICENSE\.electron\.txt$' }).Count -lt 1) {
    throw "LICENSE.electron.txt missing from MSIX"
  }

  $commitEntries = @($zip.Entries | Where-Object { $_.FullName -match '(^|/)SOURCE_GIT_COMMIT\.txt$' })
  if ($commitEntries.Count -ne 1) { throw "Expected exactly one SOURCE_GIT_COMMIT.txt in MSIX" }
  $commitReader = New-Object System.IO.StreamReader($commitEntries[0].Open())
  try { $embeddedCommit = $commitReader.ReadToEnd().Trim() }
  finally { $commitReader.Dispose() }

  $expectedCommit = if ($env:SOURCE_GIT_COMMIT) { [string]$env:SOURCE_GIT_COMMIT } else { [string]$env:GITHUB_SHA }
  if ($expectedCommit -notmatch '^[0-9a-fA-F]{40}$' -or $embeddedCommit -cne $expectedCommit) {
    throw "Embedded Source commit mismatch"
  }

  Write-Host "MSIX_MANIFEST_PASS $IdentityName $PackageVersion x64"
  Write-Host "STORE_DISPLAY_NAME_PASS $StoreDisplayName"
  Write-Host "RESOURCE_LANGUAGE_PASS ja-JP"
  Write-Host "SOURCE_COMMIT_PASS $embeddedCommit"
}
finally {
  $zip.Dispose()
}

$uploadZip = [System.IO.Compression.ZipFile]::OpenRead($uploads[0].FullName)
try {
  $containsPackage = @($uploadZip.Entries | Where-Object { $_.FullName -match '\.msix(bundle)?$' }).Count -gt 0
  if (-not $containsPackage) { throw "MSIXUPLOAD内にMSIX/MSIXBUNDLEがありません" }
}
finally {
  $uploadZip.Dispose()
}

Write-Host ("MSIX_SHA256=" + (Get-FileSha256Hex -Path $packages[0].FullName))
Write-Host ("MSIXUPLOAD_SHA256=" + (Get-FileSha256Hex -Path $uploads[0].FullName))
Write-Host "Candidate only: Windows install/save/restore, WACK, Partner Center upload validation, certification and publication remain separate gates."
