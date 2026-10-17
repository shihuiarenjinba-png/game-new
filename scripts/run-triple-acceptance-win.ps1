#requires -Version 5.1
<#
Triple-gate Windows QA for Handover Room; works ONLY in extracted v18 folder.
NO admin escalation, no installation, no certificate trust changes, no removal,
no submission, no silent npm install, no other-repo changes.
A blocked MSIX build is an explicit BLOCKED gate, never a PASS.
#>
param(
  [switch]$SkipGui,
  [switch]$SkipMsixBuild,
  [switch]$RunWack
)
$ErrorActionPreference="Stop"
$root=(Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stamp=Get-Date -Format "yyyyMMdd-HHmmss-ffff"
$output=Join-Path $root ("qa-local-output\acceptance-"+$stamp)
New-Item -ItemType Directory -Path $output -Force | Out-Null
$results=New-Object System.Collections.Generic.List[object]
$nodeVersion="unavailable"
$started=(Get-Date).ToString("o")
function Mark([string]$name,[string]$status,[string]$detail,[string]$log=""){
  $script:results.Add([pscustomobject]@{gate=$name;status=$status;detail=$detail;log=$log})
  Write-Host "$status | $name | $detail"
}
function Invoke-Log([string]$gate,[string]$file,[string[]]$arguments){
  $log=Join-Path $output ($gate.Replace(":","-")+".log")
  Push-Location $root
  try {
    $prior=$ErrorActionPreference
    $ErrorActionPreference="Continue"
    try { & $file @arguments *> $log } finally { $ErrorActionPreference=$prior }
    $code=$LASTEXITCODE
    if ($null -eq $code) {$code=1}
    if ($code -eq 0) { Mark $gate "PASS" "exit=0" $log; return $true }
    Mark $gate "FAIL" "exit=$code; see log" $log
    return $false
  } catch {
    Mark $gate "FAIL" $_.Exception.Message $log
    return $false
  } finally { Pop-Location }
}
try {
  $isWindows=[Environment]::OSVersion.Platform -eq [PlatformID]::Win32NT
  if(-not $isWindows){
    Mark "ENVIRONMENT" "BLOCKED" "Windows required"
  } else {
    Mark "ENVIRONMENT" "PASS" ([Environment]::OSVersion.VersionString)
  }
  $node=Get-Command node.exe -ErrorAction SilentlyContinue
  $npm=Get-Command npm.cmd -ErrorAction SilentlyContinue
  $nodeReady=$false
  if($node -and $npm) {
    $nodeVersion=(& node --version | Out-String).Trim()
    $nodeReady=$nodeVersion -match '^v(\d+)\.(\d+)\.' -and
      ([int]$Matches[1] -gt 22 -or ([int]$Matches[1] -eq 22 -and [int]$Matches[2] -ge 12))
    if($nodeReady){Mark "NODE_RUNTIME" "PASS" $nodeVersion}
    else{Mark "NODE_RUNTIME" "BLOCKED" "Node 22.12+ required; found $nodeVersion"}
  }else{Mark "NODE_RUNTIME" "BLOCKED" "node.exe and npm.cmd must be installed"}
  if($isWindows -and $nodeReady){
    [void](Invoke-Log "NODE_FULL_REGRESSION" "npm.cmd" @("test"))
    [void](Invoke-Log "STORY_VOLUME" "npm.cmd" @("run","audit:story-volume"))
    $edgeCandidates=@(
      (Join-Path ([Environment]::GetFolderPath("ProgramFilesX86")) "Microsoft\Edge\Application\msedge.exe"),
      (Join-Path ([Environment]::GetFolderPath("ProgramFiles")) "Microsoft\Edge\Application\msedge.exe")
    ) | Where-Object { $_ -and (Test-Path $_) }
    if($SkipGui){
      Mark "EDGE_GUI" "NOT_RUN" "Explicit -SkipGui; not a PASS"
    }elseif(@($edgeCandidates).Count -eq 0){
      Mark "EDGE_GUI" "BLOCKED" "Microsoft Edge executable missing"
    }else{
      [void](Invoke-Log "EDGE_FULL_STORY" "npm.cmd" @("run","test:edge:win"))
      [void](Invoke-Log "EDGE_KEYBOARD_DPI_RELOAD" "npm.cmd" @("run","test:edge:accessibility:win"))
      [void](Invoke-Log "EDGE_JSON_SAVE_TRANSFER" "npm.cmd" @("run","test:edge:save:win"))
    }
    if($SkipMsixBuild){
      Mark "MSIX_BUILD" "NOT_RUN" "Explicit -SkipMsixBuild; not a PASS"
    }else{
      $identityFields=@("STORE_IDENTITY_NAME","STORE_PUBLISHER",
        "STORE_PUBLISHER_DISPLAY_NAME","STORE_PACKAGE_VERSION",
        "STORE_IDENTITY_CONFIRMED","STORE_BRAND_APPROVED")
      $missing=@($identityFields | Where-Object {
        [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_))
      })
      if($missing.Count -gt 0){
        Mark "MSIX_BUILD" "BLOCKED" ("Formal product identity / logo approval missing: "+($missing -join ", "))
      }elseif(-not (Test-Path (Join-Path $root "node_modules\electron-builder\cli.js"))){
        Mark "MSIX_BUILD" "BLOCKED" "Local electron-builder not installed. No automatic npm install."
      }elseif(Invoke-Log "MSIX_PREFLIGHT" "npm.cmd" @("run","audit:msix")){
        if(Invoke-Log "MSIX_BUILD" "npm.cmd" @("run","build:msix")){
          [void](Invoke-Log "MSIX_MANIFEST" "npm.cmd" @("run","verify:msix:win"))
        }else{Mark "MSIX_MANIFEST" "BLOCKED" "Package build did not pass"}
      }else{
        Mark "MSIX_BUILD" "BLOCKED" "Failed formal Identity/logo preflight"
        Mark "MSIX_MANIFEST" "BLOCKED" "No verified package"
      }
    }
    if($RunWack){
      $kit=Join-Path ([Environment]::GetFolderPath("ProgramFilesX86")) "Windows Kits\10\App Certification Kit\appcert.exe"
      $pkgs=@(Get-ChildItem (Join-Path $root "dist-msix") -Filter "*.msix" -File -ErrorAction SilentlyContinue)
      if(-not (Test-Path $kit)){Mark "WACK" "BLOCKED" "Windows App Certification Kit not found"}
      elseif($pkgs.Count -ne 1){Mark "WACK" "BLOCKED" "Exactly one recent MSIX required for WACK"}
      else {
        # Microsoft's documented CLI; requires an interactive user session and, commonly, administrator rights.
        $report=Join-Path $output "WACK_report.xml"
        [void](Invoke-Log "WACK_RESET" $kit @("reset"))
        [void](Invoke-Log "WACK" $kit @("test","-appxpackagepath",$pkgs[0].FullName,
          "-reportoutputpath",$report))
      }
    }else{Mark "WACK" "NOT_RUN" "Run manually in interactive Windows session or opt in with -RunWack"}
  }else{
    foreach($name in @("NODE_FULL_REGRESSION","STORY_VOLUME","EDGE_GUI","MSIX_BUILD","MSIX_MANIFEST","WACK")){
      Mark $name "BLOCKED" "Windows / Node prerequisites not met"
    }
  }
}catch{
  Mark "FATAL" "FAIL" $_.Exception.Message
}finally{
  # A failed or missing gate is never silently converted into a successful result.
  $needed=@("ENVIRONMENT","NODE_RUNTIME","NODE_FULL_REGRESSION","STORY_VOLUME",
    "EDGE_FULL_STORY","EDGE_KEYBOARD_DPI_RELOAD","EDGE_JSON_SAVE_TRANSFER",
    "MSIX_BUILD","MSIX_MANIFEST")
  $passes=@($results | Where-Object {$_.status -eq "PASS"} | ForEach-Object {$_.gate})
  $complete=@($needed | Where-Object {$_ -notin $passes}).Count -eq 0
  $summary=[ordered]@{
    project="Handover Room"
    branch="feature/handover-v18-windows-acceptance-triple-gate"
    started_at=$started
    finished_at=(Get-Date).ToString("o")
    os=[Environment]::OSVersion.VersionString
    node=$nodeVersion
    overall=if($complete){"AUTOMATED_GATES_PASS_STORE_HOLD"}else{"INCOMPLETE_OR_FAILED"}
    store_release="HOLD"
    important="WACK, human MSIX install/start/update/uninstall, real human playtest and Store certification are independent acceptance gates."
    gates=@($results.ToArray())
  }
  $target=Join-Path $output "acceptance-summary.json"
  $summary | ConvertTo-Json -Depth 8 | Set-Content -Path $target -Encoding UTF8
  Write-Host ("Evidence: "+$target)
}
if(-not $complete){exit 2} else {exit 0}
