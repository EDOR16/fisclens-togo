$files = @(
  "src\app\api\v1\bi\dashboard\alerts\route.ts",
  "src\app\api\v1\bi\dashboard\clients\route.ts",
  "src\app\api\v1\bi\dashboard\overview\route.ts",
  "src\app\api\v1\bi\dashboard\profitability\route.ts",
  "src\app\api\v1\bi\dashboard\purchases\route.ts",
  "src\app\api\v1\bi\dashboard\sales\route.ts",
  "src\app\api\v1\bi\import\clients\route.ts",
  "src\app\api\v1\bi\import\products\route.ts",
  "src\app\api\v1\bi\import\purchases\route.ts",
  "src\app\api\v1\bi\import\sales\route.ts",
  "src\app\api\v1\bi\reconciliation\route.ts"
)

foreach ($f in $files) {
  if (-not (Test-Path -LiteralPath $f)) {
    Write-Host "INTROUVABLE: $f" -ForegroundColor Red
    continue
  }

  $content = Get-Content -LiteralPath $f -Raw

  $content = $content -replace 'import \{ withTenantGuard \} from "@/lib/server/with-guard";', 'import { withTenantGuard, type GuardContext } from "@/lib/server/with-guard";'

  $content = $content -replace '\(req: NextRequest, tenantId: string\) => \{', "(req: NextRequest, ctx: GuardContext) => {`n    const { tenantId } = ctx;"

  Set-Content -LiteralPath $f -Value $content -Encoding utf8 -NoNewline
  Write-Host "OK: $f" -ForegroundColor Green
}
