# Bolt.new naar Lokaal Project Sync Script
# Dit script kopieert automatisch alle files naar je lokale project

param(
    [string]$ProjectPath = "C:\Users\info\project"
)

Write-Host "🚀 Bolt.new Project Sync Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check of project directory bestaat
if (-not (Test-Path $ProjectPath)) {
    Write-Host "❌ Project directory niet gevonden: $ProjectPath" -ForegroundColor Red
    Write-Host "💡 Run met: .\install.ps1 -ProjectPath 'C:\pad\naar\je\project'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Project directory: $ProjectPath" -ForegroundColor Green
Write-Host ""

# Vraag om bevestiging
Write-Host "⚠️  WAARSCHUWING: Dit overschrijft files in je project!" -ForegroundColor Yellow
Write-Host "💡 TIP: Zorg dat je een Git commit hebt gemaakt van je huidige versie" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Wil je doorgaan? (ja/nee)"

if ($confirm -ne "ja") {
    Write-Host "❌ Geannuleerd" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔄 Backup maken van huidige project..." -ForegroundColor Cyan
$backupName = "project-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$backupPath = Join-Path (Split-Path $ProjectPath -Parent) $backupName

try {
    Copy-Item -Path $ProjectPath -Destination $backupPath -Recurse -Force
    Write-Host "✅ Backup gemaakt: $backupPath" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Backup maken gefaald, maar doorgaan..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📦 Files kopieren..." -ForegroundColor Cyan

# Items om te kopieren
$items = @(
    "src",
    "supabase",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json",
    "vite.config.ts",
    "tailwind.config.js",
    "postcss.config.js",
    "eslint.config.js",
    "index.html",
    ".env.example"
)

$copiedCount = 0
$skippedCount = 0

foreach ($item in $items) {
    $sourcePath = Join-Path $PSScriptRoot $item
    $destPath = Join-Path $ProjectPath $item

    if (Test-Path $sourcePath) {
        try {
            if (Test-Path $sourcePath -PathType Container) {
                # Directory
                Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
            } else {
                # File
                Copy-Item -Path $sourcePath -Destination $destPath -Force
            }
            Write-Host "  ✅ $item" -ForegroundColor Green
            $copiedCount++
        } catch {
            Write-Host "  ❌ $item - Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️  $item (niet gevonden)" -ForegroundColor Yellow
        $skippedCount++
    }
}

Write-Host ""
Write-Host "📊 Resultaat:" -ForegroundColor Cyan
Write-Host "  ✅ Gekopieerd: $copiedCount" -ForegroundColor Green
Write-Host "  ⚠️  Overgeslagen: $skippedCount" -ForegroundColor Yellow

Write-Host ""
Write-Host "📦 Dependencies installeren..." -ForegroundColor Cyan
Push-Location $ProjectPath
try {
    npm install
    Write-Host "✅ Dependencies geïnstalleerd" -ForegroundColor Green
} catch {
    Write-Host "❌ npm install gefaald: $($_.Exception.Message)" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "🔨 Project builden..." -ForegroundColor Cyan
try {
    npm run build
    Write-Host "✅ Build succesvol!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build gefaald: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Check de errors hierboven en los ze op" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Pop-Location

Write-Host ""
Write-Host "🎉 Sync compleet!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Volgende stappen:" -ForegroundColor Cyan
Write-Host "  1. Test lokaal:    cd $ProjectPath && npm run dev" -ForegroundColor White
Write-Host "  2. Check changes:  git status" -ForegroundColor White
Write-Host "  3. Commit:         git add . && git commit -m 'Add new features from Bolt.new'" -ForegroundColor White
Write-Host "  4. Push:           git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "✨ Vercel zal automatisch je nieuwe versie deployen!" -ForegroundColor Green
