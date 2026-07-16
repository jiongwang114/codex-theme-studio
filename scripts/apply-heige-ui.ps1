param(
  [ValidateSet("miku-488137", "genshin-night", "genshin-dawn", "wuthering-echo", "wuthering-tide", "naruto-hokage", "naruto-sasuke", "deepspace-dawn", "deepspace-star", "dalao-dianyan")]
  [string]$Theme = "miku-488137"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$node = (Get-Command node -ErrorAction Stop).Source
$core = Join-Path $root "node_modules\@codedrobe\core\bin\codedrobe.mjs"
$heigeCli = Join-Path $root "vendor\heige-codex-skin-studio\src\cli.mjs"

# CodeDrobe reliably relaunches the Store edition with a loopback-only CDP port.
& $node $core launch --app codex --port 9335 --restart-existing
if ($LASTEXITCODE -ne 0) { throw "CodeDrobe could not restart Codex with CDP." }

# HeiGe owns the visual layer and the in-app palette menu.
& $node $heigeCli apply --theme $Theme --port 9335
if ($LASTEXITCODE -ne 0) { throw "HeiGe UI injection failed." }
