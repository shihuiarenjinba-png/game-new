#requires -Version 5.1
<#
  引継ぎ室: offline Windows acceptance run.
  No install, no network use by this script, no Git push, no MSIX creation.
  Usage:
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-windows-local-qa.ps1
    powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\run-windows-local-qa.ps1 -SkipEdge
#>
param([switch]$SkipEdge)
$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stamp = Get-Date -Format "yyyyMMdd-HHmmss-ffff"
$folder = Join-Path $root ("qa-local-output\run-" + $stamp)
New-Item -Path $folder -ItemType Directory -Force | Out-Null
$checks = New-Object System.Collections.Generic.List[object]
$failures = 0
$node = Get-Command node.exe -ErrorAction SilentlyContinue
$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
$edgeCandidates = @(
  (Join-Path ([Environment]::GetFolderPath("ProgramFilesX86")) "Microsoft\Edge\Application\msedge.exe"),
  (Join-Path ([Environment]::GetFolderPath("ProgramFiles")) "Microsoft\Edge\Application\msedge.exe")
) | Where-Object { $_ -and (Test-Path $_) }
$hasEdge = @($edgeCandidates).Count -gt 0
$nodeVersion = if ($node) { (& node --version | Out-String).Trim() } else { "not installed" }
$npmVersion = if ($npm) { (& npm.cmd --version | Out-String).Trim() } else { "not installed" }

function Add-Result([string]$name,[string]$status,[string]$detail,[string]$log) {
  $checks.Add([pscustomobject]@{ Name=$name; Status=$status; Detail=$detail; Log=$log })
  Write-Host ($status + " | " + $name + " | " + $detail)
}
function Run-Test([string]$name,[string]$scriptName) {
  $log = Join-Path $folder ($scriptName.Replace(":","-") + ".log")
  Push-Location $root
  try {
    $priorPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { & npm.cmd run $scriptName *> $log } finally { $ErrorActionPreference = $priorPreference }
    $code = $LASTEXITCODE
    if ($code -eq 0) {
      Add-Result $name "PASS" "exit code 0" $log
    } else {
      Add-Result $name "FAIL" ("exit code " + $code) $log
      $script:failures++
    }
  } catch {
    Add-Result $name "FAIL" $_.Exception.Message $log
    $script:failures++
  } finally {
    Pop-Location
  }
}
try {
  if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) {
    Add-Result "Windows environment" "BLOCKED" "Windows only" ""
    $failures++
  } elseif (-not $node -or -not $npm) {
    Add-Result "Node / npm" "BLOCKED" "Node.js 22+ and npm.cmd needed; no automatic installation" ""
    $failures++
  } else {
    $major = if ($nodeVersion -match '^v(\d+)') { [int]$Matches[1] } else { 0 }
    $minor = if ($nodeVersion -match '^v\d+\.(\d+)') { [int]$Matches[1] } else { 0 }
    if ($major -lt 22 -or ($major -eq 22 -and $minor -lt 12)) {
      Add-Result "Node version" "BLOCKED" ($nodeVersion + " (Node.js 22.12+ required for MSIX beta toolchain)") ""
      $failures++
    } else {
      Run-Test "Narrative / deductions / old saves / logic regression" "test"
      Run-Test "Six-route visible story volume" "audit:story-volume"
      if ($SkipEdge) {
        Add-Result "Windows Edge browser suite" "NOT_RUN" "Explicitly skipped; not a complete pass." ""
      } elseif (-not $hasEdge) {
        Add-Result "Windows Edge browser suite" "BLOCKED" "Microsoft Edge executable not found" ""
        $failures++
      } else {
        Run-Test "Six full story routes, wide and narrow screens" "test:edge:win"
        Run-Test "Keyboard, viewport, DPI and real page reload" "test:edge:accessibility:win"
        Run-Test "JSON export/import, cancellation and case isolation" "test:edge:save:win"
      }
    }
  }
} finally {
  $outcome = if ($failures -eq 0 -and -not $SkipEdge) {
    "AUTOMATED_PASS"
  } elseif ($failures -eq 0) {
    "PARTIAL_NODE_ONLY"
  } else {
    "BLOCKED_OR_FAILED"
  }
  $result = [ordered]@{
    project="Handover Room — game-new"
    version="v0.16 UI and MSIX readiness QA candidate"
    source_branch="feature/handover-v16-clear-ui-msix-readiness"
    timestamp=(Get-Date).ToString("o")
    os=[Environment]::OSVersion.VersionString
    node=$nodeVersion
    npm=$npmVersion
    edge_found=$hasEdge
    edge_suite_skipped=[bool]$SkipEdge
    commercial_status="HOLD: human playtest / MSIX / retail price unverified"
    result=$outcome
    checks=@($checks.ToArray())
  }
  $json=Join-Path $folder "qa-summary.json"
  $result | ConvertTo-Json -Depth 8 | Set-Content -Path $json -Encoding UTF8
  Write-Host ""
  Write-Host ("QA report: "+$json)
  Write-Host "No MSIX was built, no code was pushed, and no external accounts were used."
}
if ($failures -gt 0) { exit 1 } else { exit 0 }
