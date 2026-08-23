$files = @(
  "src\app\api\v1\bi\dashboard\alerts\route.ts",
  "src\app\api\v1\bi\dashboard\overview\route.ts",
  "src\app\api\v1\bi\import\clients\route.ts",
  "src\app\api\v1\bi\import\products\route.ts",
  "src\app\api\v1\bi\import\purchases\route.ts"
)

$replacements = @{
  "Ã©" = "é"
  "Ã¨" = "è"
  "Ã " = "à"
  "Ã»" = "û"
  "Ã´" = "ô"
  "Ã¢" = "â"
  "Ã®" = "î"
  "Ã‰" = "É"
  "â™" = "'"
  "â“" = "-"
  "â”" = "-"
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

  [System.IO.File]::WriteAllText((Resolve-Path $f), $content, [System.Text.Encoding]::UTF8)
  Write-Host "OK: $f" -ForegroundColor Green
}
