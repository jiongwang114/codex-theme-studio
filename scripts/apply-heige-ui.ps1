param(
  [ValidateSet("miku-488137", "genshin-night", "genshin-dawn", "wuthering-echo", "wuthering-tide", "naruto-hokage", "naruto-sasuke", "deepspace-dawn", "deepspace-star", "dalao-dianyan")]
  [string]$Theme = "miku-488137"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$heigeRoot = Join-Path $root "vendor\heige-codex-skin-studio"
$common = Join-Path $heigeRoot "scripts\windows\lib\common.ps1"
$apply = Join-Path $heigeRoot "scripts\windows\apply.ps1"

. $common
$app = Get-CodexApp
$running = Get-RunningCodex -AppPath $app
if ($running) {
  $running | Stop-Process -Force
  for ($i = 0; $i -lt 40; $i++) {
    if (-not (Get-RunningCodex -AppPath $app)) { break }
    Start-Sleep -Milliseconds 250
  }
}

if (Get-RunningCodex -AppPath $app) {
  throw "Codex processes did not exit; HeiGe UI was not applied."
}

& $apply -Theme $Theme
