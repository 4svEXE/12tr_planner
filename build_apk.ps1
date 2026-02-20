# 12TR APK Builder Script
Write-Host "--- 12TR Engine APK Builder ---" -ForegroundColor Cyan

# 1. Build the web app
Write-Host "[1/4] Будуємо веб-версію..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Помилка при збірці веб-версії!" -ForegroundColor Red
    exit $LASTEXITCODE
}

# 2. Sync with Capacitor
Write-Host "[2/4] Синхронізація з Capacitor..." -ForegroundColor Yellow
npx cap copy
npx cap sync

# 3. Build APK via Gradle (requires Android SDK)
Write-Host "[3/4] Спроба автоматичної збірки APK..." -ForegroundColor Yellow
if (Test-Path "android") {
    cd android
    ./gradlew assembleDebug
    cd ..
    
    if (Test-Path "android/app/build/outputs/apk/debug/app-debug.apk") {
        Write-Host "[4/4] APK успішно зібрано!" -ForegroundColor Green
        Write-Host "Файл знаходиться тут: android/app/build/outputs/apk/debug/app-debug.apk" -ForegroundColor White
    } else {
        Write-Host "Не вдалося знайти зібраний APK. Відкриваю Android Studio для ручної збірки..." -ForegroundColor Magenta
        npx cap open android
    }
} else {
    Write-Host "Папка android не знайдена. Запустіть 'npm run cap:add' спочатку." -ForegroundColor Red
}
