#requires -Version 5.1
<#
 Read-only by default. Installation affects Windows; it requires an explicit
 -InstallSigned flag and an interactive confirmation. Never installs certificates,
 uninstalls apps, changes existing packages, or publishes to Partner Center.
 No automatic "AllowUnsigned": formal Store identity must NOT be spoofed.
#>
[CmdletBinding()]
param(
 [Parameter(Mandatory=$true)][string]$PackagePath,
 [Parameter(Mandatory=$true)][string]$ExpectedIdentity,
 [Parameter(Mandatory=$true)][string]$ExpectedPublisher,
 [switch]$InstallSigned
)
$ErrorActionPreference="Stop"
if([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT){
 throw "Windows only"
}
$full=(Resolve-Path $PackagePath).Path
if([IO.Path]::GetExtension($full).ToLowerInvariant() -ne ".msix"){
 throw "指定するファイルはMSIXのみです（MSIXUPLOADはインストール不可）"
}
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::OpenRead($full)
try {
 $entry=$zip.GetEntry("AppxManifest.xml")
 if($null -eq $entry){throw "Missing AppxManifest.xml"}
 $reader=New-Object IO.StreamReader($entry.Open())
 try{[xml]$xml=$reader.ReadToEnd()}finally{$reader.Dispose()}
 $id=$xml.SelectSingleNode("/*[local-name()='Package']/*[local-name()='Identity']")
 if($null -eq $id){throw "Missing Identity"}
 $actualName=$id.GetAttribute("Name")
 $actualPub=$id.GetAttribute("Publisher")
 $actualVersion=$id.GetAttribute("Version")
 if($actualName -cne $ExpectedIdentity){throw "Package identity mismatch: $actualName"}
 if($actualPub -cne $ExpectedPublisher){throw "Publisher mismatch: $actualPub"}
}finally{$zip.Dispose()}
$sig=Get-AuthenticodeSignature -FilePath $full
$before=@(Get-AppxPackage -Name $actualName -ErrorAction SilentlyContinue)
$info=[ordered]@{
 package=$full
 identity=$actualName
 publisher=$actualPub
 version=$actualVersion
 signature_status=[string]$sig.Status
 prior_installs=@($before | ForEach-Object {$_.PackageFullName})
 action="INSPECT_ONLY"
}
if(-not $InstallSigned){
 $info|ConvertTo-Json -Depth 4
 Write-Host "Inspect only: -InstallSigned を付けない限りインストールしません。"
 exit 0
}
if($sig.Status -ne "Valid"){throw "署名が有効ではありません。開発用署名の信頼設定を所有者が別途確認してください。"}
if($before.Count -gt 0){throw "既存パッケージを保護するためインストールを中止しました。更新検査は独立した手順で実施してください。"}
$answer=Read-Host "このWindowsユーザーに $actualName $actualVersion をインストールしますか？ YES と入力した場合のみ開始"
if($answer -cne "YES"){throw "利用者が承認しなかったためインストールしませんでした"}
Add-AppxPackage -Path $full -ErrorAction Stop
$after=@(Get-AppxPackage -Name $actualName -ErrorAction SilentlyContinue)
$matched=@($after|Where-Object {
 $_.Publisher -ceq $ExpectedPublisher -and [string]$_.Version -eq $actualVersion
})
if($matched.Count -ne 1){throw "Add-AppxPackage後の登録情報が一致しません。検査結果を保留してください。"}
$info.action="INSTALLED_SIGNED_QA"
$info.installed_package=$matched[0].PackageFullName
$info|ConvertTo-Json -Depth 4
Write-Host "登録を確認しました。ゲームを起動して手動で6ルート・保存を試し、別途WACKを実施してください。アンインストールは行っていません。"
