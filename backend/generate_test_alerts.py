"""
NEXUS IDS - Test Alert Generator
Generates realistic Suricata-style EVE JSON alerts for testing the dashboard
"""

import json
import random
import os
import time
from datetime import datetime, timedelta

# Output path - use backend folder instead of system folder for write permissions
EVE_LOG_PATH = os.environ.get('SURICATA_EVE_LOG', 'd:/nids/backend/eve.json')

# Sample signatures based on real Suricata rules
SIGNATURES = [
    ("ET SCAN Potential SSH Scan", 2, "Attempted Information Leak", 2001219),
    ("ET EXPLOIT Apache Struts 2 RCE Attempt", 1, "Web Application Attack", 2024897),
    ("ET MALWARE Win32/Emotet Activity", 1, "A Network Trojan was detected", 2025641),
    ("ET POLICY Outgoing Basic Auth Base64 HTTP", 2, "Potentially Bad Traffic", 2016679),
    ("ET SCAN Nmap Scripting Engine User-Agent Detected", 2, "Detection of a Network Scan", 2024364),
    ("ET WEB_SERVER SQL Injection Attempt", 1, "Web Application Attack", 2006446),
    ("GPL ATTACK_RESPONSE id check returned root", 1, "Successful User Privilege Gain", 498),
    ("ET POLICY DNS Query for Suspicious TLD", 2, "Potentially Bad Traffic", 2027757),
    ("ET TROJAN CobaltStrike Beacon Observed", 1, "A Network Trojan was detected", 2025702),
    ("ET SCAN Behavioral Unusual Port 445 traffic", 2, "Detection of a Network Scan", 2010937),
    ("ET EXPLOIT Possible CVE-2021-44228 Log4j RCE Attempt", 1, "Attempted Administrator Privilege Gain", 2034647),
    ("GPL SHELLCODE x86 NOOP", 1, "Executable code was detected", 649),
    ("ET DOS Possible NTP DDoS Amplification Attack", 1, "Attempted Denial of Service", 2017966),
    ("ET POLICY Cryptocurrency Miner DNS Query", 2, "Potentially Bad Traffic", 2024792),
    ("ET PHISHING Possible Office365 Phishing Landing Page", 2, "Social Engineering", 2027759),
    ("ET HUNTING Possible Brute Force SSH Detected", 2, "Unsuccessful User Privilege Gain", 2019876),
    ("ET EXPLOIT SMB Remote Code Execution Attempt", 1, "Attempted Administrator Privilege Gain", 2025650),
    ("ET WEB_SERVER Cross-Site Scripting Attempt", 2, "Web Application Attack", 2100494),
    ("ET MALWARE Ransomware Domain Detected", 1, "A Network Trojan was detected", 2828433),
    ("ET INFO Possible TeamViewer Connection", 3, "Misc activity", 2012647),
    ("ET HUNTING DNS Query for .onion Proxy Service", 2, "Potentially Bad Traffic", 2029056),
    ("GPL BACKDOOR BO2K Communication", 1, "Misc Attack", 1853),
    ("ET C2 Metasploit Meterpreter Activity", 1, "A Network Trojan was detected", 2018959),
    ("ET BOTNET Possible Mirai Botnet C&C Communication", 1, "A Network Trojan was detected", 2027369),
    ("ET EXPLOIT Buffer Overflow Attempt", 1, "Attempted Administrator Privilege Gain", 2101201),
]

# Source IPs (simulated attackers)
SOURCE_IPS = [
    ("185.220.101.45", "DE"),  # Germany
    ("45.155.205.233", "RU"),  # Russia
    ("103.75.201.54", "CN"),   # China
    ("91.240.118.172", "UA"),  # Ukraine
    ("141.98.10.63", "NL"),    # Netherlands
    ("194.147.140.21", "IR"),  # Iran
    ("185.156.73.54", "KP"),   # North Korea
    ("103.141.138.118", "VN"), # Vietnam
    ("45.227.255.99", "BR"),   # Brazil
    ("185.243.214.127", "US"), # United States
    ("212.70.149.68", "TR"),   # Turkey
    ("103.108.193.10", "IN"),  # India
]

# Protocols
PROTOCOLS = ["TCP", "UDP", "ICMP", "HTTP", "TLS", "DNS", "SSH", "SMB", "FTP"]

def generate_alert():
    """Generate a single realistic Suricata EVE JSON alert"""
    sig = random.choice(SIGNATURES)
    src = random.choice(SOURCE_IPS)

    # Random timestamp within the last hour
    timestamp = datetime.now() - timedelta(seconds=random.randint(0, 3600))

    alert = {
        "timestamp": timestamp.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+0000",
        "flow_id": random.randint(1000000000000, 9999999999999),
        "in_iface": "eth0",
        "event_type": "alert",
        "src_ip": src[0],
        "src_port": random.randint(10000, 65535),
        "dest_ip": f"192.168.1.{random.randint(1, 254)}",
        "dest_port": random.choice([22, 80, 443, 445, 3389, 8080, 8443]),
        "proto": random.choice(PROTOCOLS),
        "alert": {
            "action": "allowed",
            "gid": 1,
            "signature_id": sig[3],
            "rev": random.randint(1, 10),
            "signature": sig[0],
            "category": sig[2],
            "severity": sig[1]
        },
        "geoip": {
            "country_code": src[1]
        },
        "app_proto": random.choice(["http", "tls", "ssh", "dns", "ftp", "smb"]),
        "flow": {
            "pkts_toserver": random.randint(1, 100),
            "pkts_toclient": random.randint(1, 100),
            "bytes_toserver": random.randint(100, 10000),
            "bytes_toclient": random.randint(100, 50000),
            "start": (timestamp - timedelta(seconds=random.randint(1, 60))).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+0000"
        }
    }

    return alert

def generate_alerts_to_file(count=50, interval=0):
    """Generate alerts and write to EVE JSON file"""

    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(EVE_LOG_PATH), exist_ok=True)

    print(f"Generating {count} test alerts to: {EVE_LOG_PATH}")

    with open(EVE_LOG_PATH, 'a', encoding='utf-8') as f:
        for i in range(count):
            alert = generate_alert()
            f.write(json.dumps(alert) + '\n')

            if interval > 0:
                print(f"Generated alert {i+1}/{count}: {alert['alert']['signature'][:50]}...")
                time.sleep(interval)

    print(f"Done! Generated {count} alerts.")

def continuous_mode(rate=5):
    """Generate alerts continuously at a given rate (alerts per minute)"""
    print(f"Continuous mode: Generating ~{rate} alerts per minute")
    print(f"Writing to: {EVE_LOG_PATH}")
    print("Press Ctrl+C to stop...\n")

    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(EVE_LOG_PATH), exist_ok=True)

    interval = 60 / rate
    count = 0

    try:
        with open(EVE_LOG_PATH, 'a', encoding='utf-8') as f:
            while True:
                alert = generate_alert()
                f.write(json.dumps(alert) + '\n')
                f.flush()
                count += 1
                print(f"[{count}] {alert['alert']['signature'][:60]}...")
                time.sleep(interval)
    except KeyboardInterrupt:
        print(f"\nStopped. Total alerts generated: {count}")

if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == '--continuous':
            rate = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            continuous_mode(rate)
        elif sys.argv[1] == '--count':
            count = int(sys.argv[2]) if len(sys.argv) > 2 else 50
            generate_alerts_to_file(count)
        else:
            print("Usage:")
            print("  python generate_test_alerts.py                 # Generate 50 alerts instantly")
            print("  python generate_test_alerts.py --count 100     # Generate 100 alerts")
            print("  python generate_test_alerts.py --continuous 10 # Generate 10 alerts/min continuously")
    else:
        # Default: generate 50 alerts
        generate_alerts_to_file(50)
