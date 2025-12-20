#!/usr/bin/env python3
"""
Diagnostic test for Runners Model Prediction endpoint
Helps identify why the AI model isn't loading
"""

import subprocess
import os


def check_server_health():
    """Check if Flask server is running and healthy"""
    print("\n1. Checking server health...")

    # Try multiple endpoints to see what's available
    endpoints = [
        ("Root", "/"),
        ("Coaches", "/api/v1.0/coach/"),
        ("Athletes", "/api/v1.0/athlete/"),
        ("Sessions", "/api/v1.0/session/"),
        ("Sensor Data", "/api/v1.0/sensor_data/"),
        ("Runners Model", "/api/v1.0/runners_model/predict"),
    ]

    server_running = False
    for endpoint_name, endpoint_path in endpoints:
        url = f"http://localhost:5000{endpoint_path}"
        curl_cmd = f"curl -s -o /dev/null -w '%{{http_code}}' {url}"
        print(f"Executing {endpoint_name}: {curl_cmd}")

        result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)
        status = result.stdout.strip("'")

        if status in ['200', '201', '404']:  # 404 means endpoint exists but not found
            print(f"  ✅ {endpoint_name}: Server responded (Status: {status})")
            server_running = True
        elif status == '000':
            print(f"  ❌ {endpoint_name}: No response (server might not be running)")
        else:
            print(f"  ⚠️  {endpoint_name}: Unexpected status {status}")

    return server_running


def check_flask_registration():
    """Check how the blueprint is registered in Flask"""
    print("\n2. Checking Flask blueprint registration...")

    # Look for app.py or similar files
    app_files = ['app.py', 'application.py', 'main.py', 'run.py', 'server.py']

    for app_file in app_files:
        if os.path.exists(app_file):
            print(f"  Found {app_file}, checking for blueprint registration...")

            try:
                with open(app_file, 'r') as f:
                    content = f.read()

                    # Look for runners_model_bp registration
                    if 'runners_model_bp' in content:
                        print(f"    ✅ runners_model_bp found in {app_file}")

                        # Extract relevant lines
                        lines = content.split('\n')
                        for i, line in enumerate(lines):
                            if 'runners_model_bp' in line:
                                print(f"      Line {i + 1}: {line.strip()}")
                                # Show context
                                for j in range(max(0, i - 2), min(len(lines), i + 3)):
                                    print(f"      {j + 1}: {lines[j]}")
                                print()
                    else:
                        print(f"    ❌ runners_model_bp not found in {app_file}")

            except Exception as e:
                print(f"    Error reading {app_file}: {e}")

    # Check for __init__.py files that might register blueprints
    print("\n  Checking for blueprint registration patterns...")
    common_patterns = [
        "app.register_blueprint(runners_model_bp",
        "app.register_blueprint(runners_model",
        "register_blueprint(runners_model",
    ]

    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r') as f:
                        content = f.read()
                        for pattern in common_patterns:
                            if pattern in content:
                                print(f"    ✅ Found '{pattern}' in {filepath}")
                except:
                    pass


def main():
    print("=" * 80)
    print("DIAGNOSTIC TEST FOR RUNNERS MODEL ENDPOINT")
    print("=" * 80)

    # Check if we're in the right directory
    print(f"Current directory: {os.getcwd()}")

    # Run diagnostics
    server_ok = check_server_health()

    if not server_ok:
        print("\n❌ SERVER ISSUE: Flask server might not be running properly")
        print("   Please make sure you have:")
        print("   1. Started the Flask app: python app.py")
        print("   2. The app is running on localhost:5000")
        print("   3. No firewall blocking port 5000")
        return

    check_flask_registration()


if __name__ == "__main__":
    main()