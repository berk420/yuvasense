@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================================
echo  YuvaSense — Sunucu Kurulum Scripti
echo ============================================================
echo.

set APP_SRC=C:\Users\Administrator\Documents\GitHub\yuvasense
set APP_DST=C:\inetpub\wwwroot\YuvaSense
set MKT_SRC=C:\Users\Administrator\Documents\GitHub\yuvasense-tanitim
set MKT_DST=C:\inetpub\wwwroot\YuvaSense-tanitim
set TUNNEL_ID=696f149b-2e9a-432b-827f-730b54d12b04
set GITHUB_USER=berk420

REM ----------------------------------------------------------
REM 1. Kaynak dosyalari wwwroot'a kopyala (node_modules ve data haric)
REM ----------------------------------------------------------
echo [1/7] Uygulama dosyalari kopyalaniyor...
if not exist "%APP_DST%" mkdir "%APP_DST%"
xcopy /s /e /y /i /exclude:%APP_SRC%\deploy-exclude.txt "%APP_SRC%" "%APP_DST%" >nul
echo     Tamamlandi: %APP_DST%

echo [1b/7] Tanitim sitesi kopyalaniyor...
if not exist "%MKT_DST%" mkdir "%MKT_DST%"
xcopy /s /e /y /i "%MKT_SRC%" "%MKT_DST%" >nul
echo     Tamamlandi: %MKT_DST%

REM ----------------------------------------------------------
REM 2. npm install (platform-native bagimliliklar icin gerekli)
REM ----------------------------------------------------------
echo [2/7] npm install calistiriliyor (%APP_DST%)...
cd /d "%APP_DST%"
call npm install --omit=dev 2>&1
if errorlevel 1 (
  echo HATA: npm install basarisiz! Log kontrol edin.
  pause
  exit /b 1
)
echo     npm install tamamlandi.

REM ----------------------------------------------------------
REM 3. GitHub repolari olustur ve push yap (gh CLI gerekli)
REM ----------------------------------------------------------
echo [3/7] GitHub repolari olusturuluyor...
where gh >nul 2>&1
if errorlevel 1 (
  echo     gh CLI bulunamadi — bu adim atlanıyor.
  echo     Repolari GitHub Desktop veya web arayuzu uzerinden manuel olusturun.
  echo     Repolar: %GITHUB_USER%/yuvasense ve %GITHUB_USER%/yuvasense-tanitim
  goto :SKIP_GITHUB
)

REM Uygulama reposu
cd /d "%APP_SRC%"
if not exist ".git" (
  git init
  git add .
  git commit -m "feat: initial YuvaSense app — kreş yönetim sistemi MVP"
)
gh repo create %GITHUB_USER%/yuvasense --private --source=. --remote=origin --push 2>&1
if errorlevel 1 (
  echo     Repo zaten var veya push hatasi, tekrar push deneniyor...
  git remote set-url origin https://github.com/%GITHUB_USER%/yuvasense.git 2>nul
  git push -u origin main 2>&1
)

REM Tanitim reposu
cd /d "%MKT_SRC%"
if not exist ".git" (
  git init
  git add .
  git commit -m "feat: initial YuvaSense marketing site — tanıtım sitesi"
)
gh repo create %GITHUB_USER%/yuvasense-tanitim --private --source=. --remote=origin --push 2>&1
if errorlevel 1 (
  echo     Repo zaten var veya push hatasi, tekrar push deneniyor...
  git remote set-url origin https://github.com/%GITHUB_USER%/yuvasense-tanitim.git 2>nul
  git push -u origin main 2>&1
)
echo     GitHub push tamamlandi.

:SKIP_GITHUB

REM ----------------------------------------------------------
REM 4. IIS siteleri olustur (PowerShell via WebAdministration)
REM ----------------------------------------------------------
echo [4/7] IIS siteleri olusturuluyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Import-Module WebAdministration; ^
   if (-not (Get-Website -Name 'yuvasense' -ErrorAction SilentlyContinue)) { ^
     New-Website -Name 'yuvasense' -Port 80 -HostHeader 'yuvasense.testprocess.com.tr' -PhysicalPath 'C:\inetpub\wwwroot\YuvaSense'; ^
     Write-Host '  IIS site ''yuvasense'' olusturuldu.'; ^
   } else { ^
     Write-Host '  IIS site ''yuvasense'' zaten var.'; ^
   }; ^
   if (-not (Get-Website -Name 'yuvasense-tanitim' -ErrorAction SilentlyContinue)) { ^
     New-Website -Name 'yuvasense-tanitim' -Port 80 -HostHeader 'yuvasense-tanitim.testprocess.com.tr' -PhysicalPath 'C:\inetpub\wwwroot\YuvaSense-tanitim'; ^
     Write-Host '  IIS site ''yuvasense-tanitim'' olusturuldu.'; ^
   } else { ^
     Write-Host '  IIS site ''yuvasense-tanitim'' zaten var.'; ^
   }; ^
   Start-Website -Name 'yuvasense' -ErrorAction SilentlyContinue; ^
   Start-Website -Name 'yuvasense-tanitim' -ErrorAction SilentlyContinue; ^
   Write-Host 'IIS siteleri aktif.'"
if errorlevel 1 echo     UYARI: IIS site olusturma hatasi olustu. IIS Manager'dan manuel kontrol edin.

REM ----------------------------------------------------------
REM 5. Cloudflare Tunnel DNS kayitlari ekle
REM ----------------------------------------------------------
echo [5/7] Cloudflare Tunnel DNS kayitlari ekleniyor...
where cloudflared >nul 2>&1
if errorlevel 1 (
  echo     cloudflared bulunamadi PATH'de, C:\Program Files\cloudflared deneniyor...
  set CF_CMD="C:\Program Files\cloudflared\cloudflared.exe"
) else (
  set CF_CMD=cloudflared
)

%CF_CMD% tunnel route dns %TUNNEL_ID% yuvasense.testprocess.com.tr 2>&1
%CF_CMD% tunnel route dns %TUNNEL_ID% yuvasense-tanitim.testprocess.com.tr 2>&1
echo     Cloudflare DNS kayitlari eklendi (yuvasense.testprocess.com.tr, yuvasense-tanitim.testprocess.com.tr)

REM ----------------------------------------------------------
REM 6. Cloudflare Tunnel config.yml guncelle (mevcut yonlendirmelere ek)
REM ----------------------------------------------------------
echo [6/7] Cloudflare Tunnel ingress kurali config.yml'e yaziliyor...
set CF_CONFIG=C:\Users\Administrator\.cloudflared\config.yml
echo tunnel: %TUNNEL_ID% > "%CF_CONFIG%"
echo credentials-file: C:\Users\Administrator\.cloudflared\%TUNNEL_ID%.json >> "%CF_CONFIG%"
echo. >> "%CF_CONFIG%"
echo ingress: >> "%CF_CONFIG%"
echo   - hostname: yuvasense.testprocess.com.tr >> "%CF_CONFIG%"
echo     service: http://localhost:80 >> "%CF_CONFIG%"
echo   - hostname: yuvasense-tanitim.testprocess.com.tr >> "%CF_CONFIG%"
echo     service: http://localhost:80 >> "%CF_CONFIG%"
echo   - service: http_status:404 >> "%CF_CONFIG%"

echo     config.yml yazildi: %CF_CONFIG%
echo     DIKKAT: Onceden mevcut rotalar (erp vb.) artik bu config'de degil.
echo     Cloudflare Zero Trust panelinden veya ek satir ekleyerek yonetebilirsiniz.

REM ----------------------------------------------------------
REM 7. IIS uygulama havuzu izinleri
REM ----------------------------------------------------------
echo [7/7] IIS uygulama havuzu izinleri ayarlaniyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "icacls 'C:\inetpub\wwwroot\YuvaSense' /grant 'IIS_IUSRS:(OI)(CI)F' /T /Q; ^
   icacls 'C:\inetpub\wwwroot\YuvaSense\data' /grant 'IIS_IUSRS:(OI)(CI)F' /T /Q 2>$null; ^
   New-Item -ItemType Directory -Force -Path 'C:\inetpub\wwwroot\YuvaSense\data' | Out-Null; ^
   icacls 'C:\inetpub\wwwroot\YuvaSense\data' /grant 'IIS_IUSRS:(OI)(CI)F' /T /Q; ^
   icacls 'C:\inetpub\wwwroot\YuvaSense\iisnode' /grant 'IIS_IUSRS:(OI)(CI)F' /T /Q 2>$null; ^
   New-Item -ItemType Directory -Force -Path 'C:\inetpub\wwwroot\YuvaSense\iisnode' | Out-Null; ^
   icacls 'C:\inetpub\wwwroot\YuvaSense\iisnode' /grant 'IIS_IUSRS:(OI)(CI)F' /T /Q; ^
   Write-Host 'Izinler ayarlandi.'"

echo.
echo ============================================================
echo  KURULUM TAMAMLANDI
echo ============================================================
echo.
echo  Uygulama:     https://yuvasense.testprocess.com.tr
echo  Tanitim:      https://yuvasense-tanitim.testprocess.com.tr
echo.
echo  Admin:        admin@yuvasense.com.tr / Yonetici2026!
echo  Ogretmen:     ayse.demir@yuvasense.com.tr / Ogretmen2026!
echo  Veli (demo):  Veli2026! (e-posta icin Veliler listesine bakin)
echo.
echo  NOT: Cloudflare Tunnel'i yeniden baslatin veya servisi restart edin:
echo       sc stop cloudflared
echo       sc start cloudflared
echo  ...veya Gorev Yoneticisi'nden cloudflared servisini restart edin.
echo.
pause
