# NEXUS IDS - Suricata Setup Guide

## Overview
This guide will help you set up Suricata IDS to work with the NEXUS IDS dashboard for real-time threat detection.

## Architecture
```
Network Traffic → Suricata → EVE JSON Logs → Flask Backend → React Dashboard
```

---

## Step 1: Install Suricata on Windows

### Option A: Download from Official Website
1. Go to https://suricata.io/download/
2. Download the Windows MSI installer
3. Run the installer and follow the prompts
4. Default installation path: `C:\Program Files\Suricata`

### Option B: Using Chocolatey (Recommended)
```powershell
# Run PowerShell as Administrator
choco install suricata
```

### Option C: Using WinGet
```powershell
winget install OISF.Suricata
```

---

## Step 2: Configure Suricata

### 2.1 Find your network interface
```powershell
# List network interfaces
netsh interface show interface

# Or use Suricata's built-in command
"C:\Program Files\Suricata\suricata.exe" --list-runmodes
```

### 2.2 Edit Suricata configuration
Open `C:\Program Files\Suricata\suricata.yaml` in a text editor (as Administrator).

**Key settings to update:**

```yaml
# Set EVE log output (line ~520)
outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      # Types of events to log
      types:
        - alert:
            tagged-packets: yes
        - http:
            extended: yes
        - dns:
        - tls:
            extended: yes
        - files:
            force-magic: yes
        - flow

# Set HOME_NET to your local network (line ~15)
vars:
  address-groups:
    HOME_NET: "[192.168.0.0/16,10.0.0.0/8,172.16.0.0/12]"
    EXTERNAL_NET: "!$HOME_NET"

# Enable GeoIP (optional, for country detection)
# Download GeoLite2-Country.mmdb from MaxMind
geoip:
  enabled: yes
  database: "C:\\Program Files\\Suricata\\GeoLite2-Country.mmdb"
```

### 2.3 Update Suricata Rules
```powershell
# Update rules (requires suricata-update)
cd "C:\Program Files\Suricata"
suricata-update
```

---

## Step 3: Run Suricata

### Find Your Network Interface ID
```powershell
"C:\Program Files\Suricata\suricata.exe" --list-pcap
```

This will show output like:
```
\Device\NPF_{XXXXX-XXXXX-XXXXX}
```

### Start Suricata
```powershell
# Run Suricata on your network interface
# Replace the device ID with yours
"C:\Program Files\Suricata\suricata.exe" -c "C:\Program Files\Suricata\suricata.yaml" -i "\Device\NPF_{YOUR-INTERFACE-ID}"

# Or to run in service mode (recommended)
"C:\Program Files\Suricata\suricata.exe" --service-install -i "\Device\NPF_{YOUR-INTERFACE-ID}"
net start suricata
```

### Verify Suricata is Running
Check that eve.json is being created:
```powershell
dir "C:\Program Files\Suricata\log\eve.json"
```

---

## Step 4: Start the NEXUS IDS Backend

### 4.1 Install Python Dependencies
```powershell
cd d:\nids\backend
python -m pip install -r requirements.txt
```

### 4.2 Start the Backend
```powershell
cd d:\nids\backend
python app.py
```

You should see output like:
```
NEXUS IDS Backend Starting...
EVE Log Path: d:/nids/backend/eve.json
Max Alerts in Memory: 1000
Loaded 35 existing alerts from d:/nids/backend/eve.json
EVE log tailing started...
Starting Flask server on http://localhost:5000
 * Running on http://127.0.0.1:5000
```

### Backend Data Sources

**By default**, the backend reads from `d:\nids\backend\eve.json`, which can be populated by:

1. **Test alert generator** (for demos):
   ```powershell
   cd d:\nids\backend
   python generate_test_alerts.py --count 50
   ```

2. **Real Suricata alerts** (if available):
   - Copy alerts from `C:\Program Files\Suricata\log\eve.json` to `d:\nids\backend\eve.json`
   - Or restart the backend after Suricata generates real alerts

---

## Step 5: Start the Dashboard

### 5.1 Install Node Dependencies
```powershell
cd d:\nids\nids
npm install
```

### 5.2 Start the Development Server
```powershell
npm run dev
```

Open http://localhost:5173 in your browser.

---

## Step 6: Generate Test Traffic (For Demo)

The NEXUS IDS project works great with realistic test alerts. Here are your options:

### Recommended: Use the Test Script
```powershell
cd d:\nids\backend
python generate_test_alerts.py --count 50
```

Then restart the backend to load the alerts:
```powershell
# Ctrl+C to stop old backend
python app.py
```

### Alternative: Real Suricata Alerts
1. **Trigger test attacks:**
   - Visit http://testmyids.com in your browser
   - Suricata will detect these test patterns

2. **Check if Suricata created alerts:**
   ```powershell
   dir "C:\Program Files\Suricata\log\eve.json"
   ```

3. **Copy alerts to backend location:**
   ```powershell
   copy "C:\Program Files\Suricata\log\eve.json" "d:\nids\backend\eve.json"
   ```

4. **Restart the backend:**
   ```powershell
   # (Press Ctrl+C in backend terminal)
   python app.py
   ```

### Alternative: Process PCAP Files
```powershell
# Download sample malicious traffic from:
# https://www.malware-traffic-analysis.net/

# Process with Suricata
"C:\Program Files\Suricata\suricata.exe" -c "C:\Program Files\Suricata\suricata.yaml" -r sample.pcap

# Output goes to: C:\Program Files\Suricata\log\eve.json
```

---

## Troubleshooting

### Backend not connecting (Dashboard shows "Disconnected")
1. Ensure backend is running on port 5000:
   ```powershell
   netstat -ano | findstr :5000
   ```
2. Check that Flask is started:
   ```
   Starting Flask server on http://localhost:5000
   ```
3. Test the health endpoint:
   ```powershell
   curl http://localhost:5000/health
   ```

### No alerts appearing in dashboard
1. Verify eve.json exists and has data:
   ```powershell
   Get-Content "d:\nids\backend\eve.json" -Head 5
   ```

2. Restart the backend to load alerts:
   ```powershell
   # Ctrl+C to stop
   python app.py
   ```

3. Check backend logs for parsing errors

### "Permission denied" errors
- Run PowerShell **as Administrator**
- May need admin rights to write to Suricata directories

### Old Python processes still running
If Flask doesn't start, kill old processes:
```powershell
# Run as Administrator
taskkill /F /IM python.exe
```

### Port 5000 already in use
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill that process
taskkill /PID <PID> /F
```

---

## Quick Start Commands

**For Demo / Testing (Recommended):**

```powershell
# Terminal 1: Generate test alerts
cd d:\nids\backend
python generate_test_alerts.py --count 50

# Terminal 2: Start Backend
cd d:\nids\backend
python app.py
# You should see: "Loaded 50 existing alerts"

# Terminal 3: Start Frontend
cd d:\nids\nids
npm run dev

# Open browser to http://localhost:5173
```

**For Real Suricata Alerts:**

```powershell
# Terminal 1: Start Suricata (as Administrator)
cd "C:\Program Files\Suricata"
.\suricata.exe -c suricata.yaml -i "Wi-Fi"

# Terminal 2: Start Backend (after Suricata generates alerts)
cd d:\nids\backend
python app.py

# Terminal 3: Start Frontend
cd d:\nids\nids
npm run dev

# Open browser to http://localhost:5173
```

---

## For Your Judges Demo

### Before the Demo
1. Generate test alerts:
   ```powershell
   cd d:\nids\backend
   python generate_test_alerts.py --count 100
   ```

2. Start the backend and verify alerts load:
   ```powershell
   cd d:\nids\backend
   python app.py
   # Should show: "Loaded 100 existing alerts"
   ```

3. Start the dashboard:
   ```powershell
   cd d:\nids\nids
   npm run dev
   ```

### During the Demo
1. Show the dashboard with live alerts
2. Click on alerts to show detailed EVE JSON data
3. Demonstrate filtering by severity or protocol
4. Show the statistics panel with attack type distribution
5. Point out the country-based geolocation of threats
6. Download test data as CSV/JSON to show data export functionality
7. Explain how real Suricata alerts would flow in the same way

### Key Features to Highlight
- **Real-time Alert Stream**: Alerts update as they arrive
- **Threat Intelligence**: Shows attack types, severity, and source locations
- **Interactive Dashboard**: Filter, search, and drill down into alert details
- **Export Functionality**: Download alerts as CSV or JSON for further analysis
- **Professional UI**: Modern, dark-themed security operations center interface
