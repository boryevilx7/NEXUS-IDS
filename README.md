# NEXUS IDS

NEXUS IDS is a real-time network intrusion detection dashboard built for Suricata EVE JSON alerts. It combines a Flask backend that tails and classifies alerts with a React + Vite frontend that visualizes security activity in a modern dashboard.

## Overview

The project is organized as a lightweight two-part stack:

- `backend/` reads Suricata EVE logs, normalizes alerts, and exposes a REST API.
- `nids/` is the React dashboard used to review alerts, trends, and threat summaries.

The frontend expects the backend to be available at `http://localhost:5000`.

## Features

- Real-time alert ingestion from Suricata EVE JSON logs
- Severity mapping and attack classification
- Country, protocol, attack-type, and timeline summaries
- Search, filtering, and alert detail inspection
- Auth-protected dashboard routes
- Demo-friendly test alert generation

## Tech Stack

- Backend: Python, Flask, Flask-CORS
- Frontend: React, TypeScript, Vite
- UI: Tailwind CSS, Radix UI, Framer Motion, Lucide icons
- Data source: Suricata EVE JSON

## Project Structure

```text
.
├── backend/
│   ├── app.py
│   ├── generate_test_alerts.py
│   ├── eve.json
│   └── requirements.txt
├── nids/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── run_dev.bat
├── start_nexus.bat
└── SETUP_GUIDE.md
```

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm
- Optional: Suricata for live network alert ingestion

## Quick Start

### 1) Start the backend

```powershell
cd backend
python -m pip install -r requirements.txt
python app.py
```

The backend runs on `http://localhost:5000`.

### 2) Start the frontend

```powershell
cd nids
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Demo Data

If you do not have live Suricata traffic available, generate sample alerts:

```powershell
cd backend
python generate_test_alerts.py --count 50
python app.py
```

## API Endpoints

- `GET /alerts` - list alerts, with optional filtering
- `GET /alerts/stats` - aggregated dashboard metrics
- `GET /alerts/<alert_id>` - retrieve a single alert
- `GET /health` - backend health status
- `GET /config` - runtime configuration

## Environment Notes

- The backend reads from `backend/eve.json` by default.
- The frontend fetches alerts from `http://localhost:5000`.
- The repo includes Windows-friendly batch helpers for common workflows.


```

## Troubleshooting

- If the dashboard shows as disconnected, confirm the Flask backend is running on port `5000`.
- If no alerts appear, verify that `backend/eve.json` contains Suricata EVE JSON entries or generate demo data first.
- If dependencies fail to install, confirm your Python and Node.js versions meet the prerequisites.

## License

Add your preferred license before publishing publicly on GitHub.