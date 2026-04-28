# NEXUS IDS - Setup Verification Script
# Run this in PowerShell as Administrator to check your installation

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "NEXUS IDS - Setup Verification" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Suricata
Write-Host "1. Checking Suricata..." -ForegroundColor Yellow
if (Test-Path "C:\Program Files\Suricata\suricata.exe") {
    Write-Host "   ✓ Suricata executable found" -ForegroundColor Green
    $version = & "C:\Program Files\Suricata\suricata.exe" -V 2>&1
    Write-Host "   Version: $version" -ForegroundColor Green
} else {
    Write-Host "   ✗ Suricata not found at C:\Program Files\Suricata" -ForegroundColor Red
}

# Check Npcap
Write-Host ""
Write-Host "2. Checking Npcap..." -ForegroundColor Yellow
$npcap = Get-ItemProperty "HKLM:\SOFTWARE\Npcap" -ErrorAction SilentlyContinue
if ($npcap) {
    Write-Host "   ✓ Npcap is installed" -ForegroundColor Green
    Write-Host "   Version: $($npcap.InstallPath)" -ForegroundColor Green
} else {
    Write-Host "   ✗ Npcap not found - This is REQUIRED!" -ForegroundColor Red
    Write-Host "   Download from: https://npcap.com/#download" -ForegroundColor Yellow
}

# Check Python
Write-Host ""
Write-Host "3. Checking Python..." -ForegroundColor Yellow
try {
    $python = python --version 2>&1
    Write-Host "   ✓ Python found: $python" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Python not found in PATH" -ForegroundColor Red
}

# Check Node.js
Write-Host ""
Write-Host "4. Checking Node.js..." -ForegroundColor Yellow
try {
    $node = node --version 2>&1
    Write-Host "   ✓ Node.js found: $node" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Node.js not found in PATH" -ForegroundColor Red
}

# Check project structure
Write-Host ""
Write-Host "5. Checking Project Structure..." -ForegroundColor Yellow
$dirs = @(
    "d:\nids\backend",
    "d:\nids\nids",
    "d:\nids\nids\src"
)
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "   ✓ $dir" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $dir - NOT FOUND" -ForegroundColor Red
    }
}

# Check backend files
Write-Host ""
Write-Host "6. Checking Backend Files..." -ForegroundColor Yellow
$files = @(
    "d:\nids\backend\app.py",
    "d:\nids\backend\requirements.txt",
    "d:\nids\backend\generate_test_alerts.py"
)
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✓ $(Split-Path $file -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $(Split-Path $file -Leaf) - NOT FOUND" -ForegroundColor Red
    }
}

# Check log directory
Write-Host ""
Write-Host "7. Checking Suricata Log Directory..." -ForegroundColor Yellow
if (Test-Path "C:\Program Files\Suricata\log") {
    Write-Host "   ✓ Log directory exists" -ForegroundColor Green
    $files = Get-ChildItem "C:\Program Files\Suricata\log" -ErrorAction SilentlyContinue | Measure-Object
    Write-Host "   Files in log directory: $($files.Count)" -ForegroundColor Green
} else {
    Write-Host "   ✗ Log directory not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Make sure you're running PowerShell as ADMINISTRATOR" -ForegroundColor Yellow
Write-Host "2. Start Suricata:" -ForegroundColor Yellow
Write-Host '   & "C:\Program Files\Suricata\suricata.exe" -c "C:\Program Files\Suricata\suricata.yaml" -i "Wi-Fi"' -ForegroundColor Cyan
Write-Host ""
Write-Host "3. In new Admin PowerShell windows, run:" -ForegroundColor Yellow
Write-Host "   Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "   cd d:\nids\backend" -ForegroundColor Cyan
Write-Host "   pip install -r requirements.txt" -ForegroundColor Cyan
Write-Host "   python app.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "   cd d:\nids\nids" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Open browser to: http://localhost:5173" -ForegroundColor Yellow
