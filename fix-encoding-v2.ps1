$files = @(
  "src\app\api\v1\bi\dashboard\alerts\route.ts",
  "src\app\api\v1\bi\dashboard\overview\route.ts",
  "src\app\api\v1\bi\import\clients\route.ts",
  "src\app\api\v1\bi\import\products\route.ts",
  "src\app\api\v1\bi\import\purchases\route.ts"
)

$Atilde = [char]0x00C3
$copySign = [char]0x00A9
$nbsp = [char]0x00A0
$raquo = [char]0x00BB
$acute = [char]0x00B4
$cent = [char]0x00A2
$reg = [char]0x00AE
$dia = [char]0x00A8

$eacute = [char]0x00E9
$agrave = [char]0x00E0
$ucirc  = [char]0x00FB
$ocirc  = [char]0x00F4
$acirc  = [char]0x00E2
$icirc  = [char]0x00EE
$egrave = [char]0x00E8

$replacements = [ordered]@{
  ([string]$Atilde + [string]$copySign) = [string]$eacute
  ([string]$Atilde + [string]$nbsp)     = [string]$agrave
  ([string]$Atilde + [string]$raquo)    = [string]$ucirc
  ([string]$Atilde + [string]$acute)    = [string]$ocirc
  ([string]$Atilde + [string]$cent)     = [string]$acirc
  ([string]$Atilde + [string]$reg)      = [string]$icirc
  ([string]$Atilde + [string]$dia)      = [string]$egrave
}

foreach ($f in $files) {
  if (-not (Test-Path -LiteralPath $f)) {
    Write-Host "INTROUVABLE: $f" -ForegroundColor Red
    continue
  }

  $content = Get-Content -LiteralPath $f -Raw -Encoding UTF8

  foreach ($key in $replacements.Keys) {
    $content = $content.Replace($key, $replacements[$key])
  }

  [System.IO.File]::WriteAllText((Resolve-Path $f), $content, [System.Text.UTF8Encoding]::new($false))
  Write-Host "OK: $f" -ForegroundColor Green
}
