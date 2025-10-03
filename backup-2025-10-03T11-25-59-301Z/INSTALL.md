# Bolt.new Project Sync - Installatie Instructies

## Automatisch Installeren (Windows)

1. **Download** deze backup folder naar je PC
2. **Open PowerShell** in de backup folder
3. **Run**:
```powershell
# Navigeer naar je project directory
cd C:\Users\info\project

# Kopieer alle files (BACKUP EERST JE HUIDIGE PROJECT!)
Copy-Item -Path "C:\Users\info\Downloads\backup-2025-10-03T11-25-59-301Z\*" -Destination . -Recurse -Force

# Install dependencies
npm install

# Build het project
npm run build
```

## Handmatig Installeren

### Stap 1: Backup Maken
```powershell
cd C:\Users\info\project
# Maak backup van huidige versie
Copy-Item -Path . -Destination ..\project-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss') -Recurse
```

### Stap 2: Kopieer Nieuwe Files
Kopieer de volgende folders/files naar `C:\Users\info\project`:

**Belangrijkste wijzigingen:**
- `src/components/Operator/GPTManagement.tsx` ✨ **NIEUW**
- `src/components/Operator/UserActivity.tsx` ✨ **NIEUW**
- `src/components/Operator/SystemHealth.tsx` (updated)
- `src/components/Operator/UsageMonitoring.tsx` (updated)
- `src/components/Operator/OperatorDashboard.tsx` (updated)
- `supabase/functions/` (all edge functions)

### Stap 3: Install & Build
```powershell
cd C:\Users\info\project
npm install
npm run build
```

### Stap 4: Test Lokaal
```powershell
npm run dev
```

Open http://localhost:5173 en test de nieuwe features.

### Stap 5: Push naar GitHub
```powershell
git add .
git commit -m "Add GPT Management and User Activity features to Operator Dashboard"
git push origin main
```

Vercel zal automatisch deployen!

## Checklist

- [ ] Backup gemaakt van huidige project
- [ ] Nieuwe files gekopieerd
- [ ] `npm install` uitgevoerd
- [ ] `npm run build` succesvol
- [ ] Lokaal getest (`npm run dev`)
- [ ] Naar GitHub gepusht
- [ ] Vercel deployment checked

## Hulp Nodig?

Als er errors zijn tijdens `npm run build`, check:
1. Node versie: `node --version` (moet 18+ zijn)
2. NPM cache: `npm cache clean --force`
3. Herinstall: `rm -rf node_modules package-lock.json && npm install`

## Nieuwe Features

Deze backup bevat:
- **GPT Management**: Beheer OpenAI API keys en modellen
- **User Activity**: Real-time monitoring van gebruikersactiviteit
- **Verbeterde Operator Dashboard**: Met alle nieuwe features geïntegreerd
- **Edge Functions**: JWT generatie en API endpoints
