"""
NEXUS IDS - Flask Backend for Suricata Integration
Reads Suricata EVE JSON logs and serves real-time alerts via REST API
"""

import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path
from collections import deque
from threading import Thread, Lock
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Configuration
# Use writable location for EVE log
EVE_LOG_PATH = 'd:/nids/backend/eve.json'
MAX_ALERTS = 1000  # Keep last 1000 alerts in memory
POLL_INTERVAL = 1  # Check for new logs every second

# In-memory alert storage
alerts_store = deque(maxlen=MAX_ALERTS)
alerts_lock = Lock()
last_position = 0

# Country code to name mapping (common ones for demo)
COUNTRY_MAP = {
    'US': 'United States', 'CN': 'China', 'RU': 'Russia', 'DE': 'Germany',
    'FR': 'France', 'GB': 'United Kingdom', 'JP': 'Japan', 'KR': 'South Korea',
    'BR': 'Brazil', 'IN': 'India', 'NL': 'Netherlands', 'UA': 'Ukraine',
    'IR': 'Iran', 'KP': 'North Korea', 'VN': 'Vietnam', 'ID': 'Indonesia',
    'TW': 'Taiwan', 'HK': 'Hong Kong', 'SG': 'Singapore', 'AU': 'Australia',
    'CA': 'Canada', 'IT': 'Italy', 'ES': 'Spain', 'PL': 'Poland',
    'TR': 'Turkey', 'MX': 'Mexico', 'AR': 'Argentina', 'ZA': 'South Africa',
    'Unknown': 'Unknown'
}

# Attack type classification based on Suricata signature patterns
ATTACK_PATTERNS = {
    'SQL': 'SQL Injection',
    'XSS': 'Cross-Site Scripting',
    'RCE': 'Remote Code Execution',
    'EXPLOIT': 'Exploit Attempt',
    'SCAN': 'Port Scan',
    'DOS': 'Denial of Service',
    'DDOS': 'DDoS Attack',
    'BRUTE': 'Brute Force',
    'MALWARE': 'Malware',
    'TROJAN': 'Trojan',
    'BOTNET': 'Botnet',
    'C2': 'Command & Control',
    'C&C': 'Command & Control',
    'BACKDOOR': 'Backdoor',
    'SHELLCODE': 'Shellcode',
    'PHISHING': 'Phishing',
    'SPAM': 'Spam',
    'DNS': 'DNS Attack',
    'SSH': 'SSH Attack',
    'FTP': 'FTP Attack',
    'HTTP': 'HTTP Attack',
    'WEB': 'Web Attack',
    'SMB': 'SMB Attack',
    'POLICY': 'Policy Violation',
    'INFO': 'Information Disclosure',
    'LEAK': 'Data Leak',
    'OVERFLOW': 'Buffer Overflow',
    'INJECTION': 'Injection Attack',
    'CVE': 'Known Vulnerability',
}


def classify_attack(signature: str) -> str:
    """Classify attack type based on signature keywords"""
    sig_upper = signature.upper()
    for pattern, attack_type in ATTACK_PATTERNS.items():
        if pattern in sig_upper:
            return attack_type
    return 'External Threat'


def map_severity(severity_num: int) -> str:
    """Map Suricata severity number to text"""
    if severity_num == 1:
        return 'critical'
    elif severity_num == 2:
        return 'high'
    elif severity_num == 3:
        return 'medium'
    else:
        return 'low'


def parse_eve_alert(line: str) -> dict | None:
    """Parse a single EVE JSON log line into an alert object"""
    try:
        data = json.loads(line)

        # Only process alert events
        if data.get('event_type') != 'alert':
            return None

        alert_data = data.get('alert', {})

        # Extract source IP info
        src_ip = data.get('src_ip', 'Unknown')
        dest_ip = data.get('dest_ip', 'Unknown')
        src_port = data.get('src_port', 0)
        dest_port = data.get('dest_port', 0)

        # Get GeoIP info if available (Suricata can add this)
        geoip = data.get('geoip', {})
        country_code = geoip.get('country_code', 'Unknown')
        country = COUNTRY_MAP.get(country_code, country_code)

        # Build the alert object
        signature = alert_data.get('signature', 'Unknown Threat')
        severity_num = alert_data.get('severity', 3)

        alert = {
            'id': f"alert-{data.get('flow_id', int(time.time() * 1000))}",
            'timestamp': data.get('timestamp', datetime.now().isoformat()),
            'signature': signature,
            'protocol': data.get('proto', data.get('app_proto', 'UNKNOWN')).upper(),
            'severity': map_severity(severity_num),
            'attackType': classify_attack(signature),
            'country': country,
            'src_ip': src_ip,
            'dest_ip': dest_ip,
            'src_port': src_port,
            'dest_port': dest_port,
            'category': alert_data.get('category', 'Unknown'),
            'signature_id': alert_data.get('signature_id', 0),
            'raw': data  # Keep raw data for detailed view
        }

        return alert

    except json.JSONDecodeError as e:
        print(f"JSON Error on line: {e}")
        return None
    except Exception as e:
        print(f"Error parsing alert: {e}")
        return None


def tail_eve_log():
    """Background thread to tail the EVE JSON log file"""
    global last_position

    while True:
        try:
            if not os.path.exists(EVE_LOG_PATH):
                print(f"Waiting for EVE log at: {EVE_LOG_PATH}")
                time.sleep(5)
                continue

            with open(EVE_LOG_PATH, 'r', encoding='utf-8', errors='ignore') as f:
                # Seek to last position
                f.seek(last_position)

                while True:
                    line = f.readline()
                    if not line:
                        # Remember position and wait for new data
                        last_position = f.tell()
                        break

                    alert = parse_eve_alert(line.strip())
                    if alert:
                        with alerts_lock:
                            alerts_store.append(alert)
                            print(f"New alert: {alert['signature'][:50]}...")

        except FileNotFoundError:
            print(f"EVE log not found: {EVE_LOG_PATH}")
        except Exception as e:
            print(f"Error reading EVE log: {e}")

        time.sleep(POLL_INTERVAL)


@app.route('/alerts', methods=['GET'])
def get_alerts():
    """Get all alerts with optional filtering"""
    limit = request.args.get('limit', 100, type=int)
    severity = request.args.get('severity', None)
    since = request.args.get('since', None)  # ISO timestamp

    with alerts_lock:
        alerts = list(alerts_store)

    print(f"DEBUG: alerts_store has {len(alerts)} alerts")

    # Sort by timestamp descending (newest first)
    try:
        alerts.sort(key=lambda x: x['timestamp'], reverse=True)
    except Exception as e:
        print(f"Sort error: {e}")
        pass

    # Apply filters
    if severity:
        alerts = [a for a in alerts if a['severity'] == severity]

    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
            alerts = [a for a in alerts if datetime.fromisoformat(
                a['timestamp'].replace('Z', '+00:00')
            ) >= since_dt]
        except:
            pass

    # Limit results
    alerts = alerts[:limit]

    return jsonify(alerts)


@app.route('/alerts/stats', methods=['GET'])
def get_stats():
    """Get alert statistics"""
    with alerts_lock:
        alerts = list(alerts_store)

    stats = {
        'total': len(alerts),
        'critical': len([a for a in alerts if a['severity'] == 'critical']),
        'high': len([a for a in alerts if a['severity'] == 'high']),
        'medium': len([a for a in alerts if a['severity'] == 'medium']),
        'low': len([a for a in alerts if a['severity'] == 'low']),
    }

    # Attack type distribution
    attack_types = {}
    for a in alerts:
        t = a['attackType']
        attack_types[t] = attack_types.get(t, 0) + 1

    # Protocol distribution
    protocols = {}
    for a in alerts:
        p = a['protocol']
        protocols[p] = protocols.get(p, 0) + 1

    # Country distribution
    countries = {}
    for a in alerts:
        c = a['country']
        countries[c] = countries.get(c, 0) + 1

    # Timeline (last 24 hours, hourly buckets)
    now = datetime.now()
    timeline = []
    for i in range(24):
        hour_start = now - timedelta(hours=23-i)
        hour_end = now - timedelta(hours=22-i) if i < 23 else now
        count = 0
        for a in alerts:
            try:
                ts = datetime.fromisoformat(a['timestamp'].replace('Z', '+00:00').replace('+00:00', ''))
                if hour_start <= ts < hour_end:
                    count += 1
            except:
                pass
        timeline.append({
            'time': hour_start.strftime('%H:%M'),
            'count': count
        })

    return jsonify({
        'stats': stats,
        'attackTypes': [{'type': k, 'count': v} for k, v in sorted(attack_types.items(), key=lambda x: -x[1])[:10]],
        'protocols': [{'protocol': k, 'count': v} for k, v in sorted(protocols.items(), key=lambda x: -x[1])[:10]],
        'countries': [{'country': k, 'count': v} for k, v in sorted(countries.items(), key=lambda x: -x[1])[:10]],
        'timeline': timeline
    })


@app.route('/alerts/<alert_id>', methods=['GET'])
def get_alert(alert_id):
    """Get a specific alert by ID"""
    with alerts_lock:
        for alert in alerts_store:
            if alert['id'] == alert_id:
                return jsonify(alert)

    return jsonify({'error': 'Alert not found'}), 404


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    eve_exists = os.path.exists(EVE_LOG_PATH)
    with alerts_lock:
        count = len(alerts_store)
    return jsonify({
        'status': 'healthy',
        'eve_log_path': EVE_LOG_PATH,
        'eve_log_exists': eve_exists,
        'alerts_count': count,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/config', methods=['GET'])
def get_config():
    """Get current configuration"""
    return jsonify({
        'eve_log_path': EVE_LOG_PATH,
        'max_alerts': MAX_ALERTS,
        'poll_interval': POLL_INTERVAL
    })


def load_existing_alerts():
    """Load existing alerts from eve.json on startup"""
    global last_position
    if not os.path.exists(EVE_LOG_PATH):
        return

    try:
        with open(EVE_LOG_PATH, 'r', encoding='utf-8', errors='ignore') as f:
            count = 0
            while True:
                line = f.readline()
                if not line:
                    last_position = f.tell()
                    break

                alert = parse_eve_alert(line.strip())
                if alert:
                    with alerts_lock:
                        alerts_store.append(alert)
                    count += 1

            print(f"Loaded {count} existing alerts from {EVE_LOG_PATH}")
    except Exception as e:
        print(f"Error loading alerts: {e}")


if __name__ == '__main__':
    print(f"NEXUS IDS Backend Starting...")
    print(f"EVE Log Path: {EVE_LOG_PATH}")
    print(f"Max Alerts in Memory: {MAX_ALERTS}")

    # Load existing alerts first
    load_existing_alerts()

    # Start background thread to tail EVE log
    log_thread = Thread(target=tail_eve_log, daemon=True)
    log_thread.start()
    print("EVE log tailing started...")

    # Run Flask server
    print("Starting Flask server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
