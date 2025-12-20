#!/usr/bin/env python3
"""
FIXED Test script for Runners Model Prediction endpoint using curl commands
Works on Windows and other platforms
"""

import subprocess
import json
import random
import os
import sys
import tempfile

BASE_URL = "http://localhost:5000/api/v1.0/runners_model"


def run_curl_simple(command):
    """Execute a curl command and return the response"""
    print(f"\nExecuting: {command[:100]}..." if len(command) > 100 else f"\nExecuting: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)

    print(f"Status Code: {result.returncode}")

    if result.stdout:
        try:
            response = json.loads(result.stdout)
            print(f"Response: {json.dumps(response, indent=2)}")
            return response
        except json.JSONDecodeError:
            print(f"Response: {result.stdout}")
            return result.stdout

    if result.stderr:
        print(f"Error Output: {result.stderr}")

    return None


def run_curl_with_file(json_data):
    """Run curl using a temporary file (most reliable on Windows)"""
    print("\nUsing file-based curl (reliable on Windows)...")

    # Create a temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(json_data, f)
        temp_file = f.name

    try:
        # Use @filename syntax for curl
        curl_cmd = f'curl -X POST {BASE_URL}/predict -H "Content-Type: application/json" -d @{temp_file}'
        result = run_curl_simple(curl_cmd)
        return result
    finally:
        # Clean up
        os.unlink(temp_file)


def run_curl_windows_safe(json_data):
    """Run curl with Windows-safe command formatting"""
    print("\nUsing Windows-safe curl command...")

    # Escape quotes for Windows
    json_str = json.dumps(json_data)
    # Double-escape the quotes for Windows cmd
    json_str_escaped = json_str.replace('"', '\\"')

    # Single line command (no backslash continuation)
    curl_cmd = f'curl -X POST {BASE_URL}/predict -H "Content-Type: application/json" -d "{json_str_escaped}"'

    return run_curl_simple(curl_cmd)


def test_predict_endpoint(sensor_data=None, method='auto'):
    """Test POST /api/v1.0/runners_model/predict with different methods"""
    if sensor_data is None:
        sensor_data = generate_sample_sensor_data()

    print("Sample sensor data being sent:")
    print(json.dumps(sensor_data, indent=2))

    result = None
    if method == 'file' or method == 'auto':
        result = run_curl_with_file(sensor_data)
        if result and 'error' not in str(result).lower() and 'Unsupported Media Type' not in str(result):
            return result

    if method == 'windows' or (method == 'auto' and result is None):
        result = run_curl_windows_safe(sensor_data)

    return result


def generate_sample_sensor_data():
    """Generate realistic sample sensor data for testing"""
    return {
        "body_temperature": round(random.uniform(36.0, 38.0), 2),
        "ambient_temperature": round(random.uniform(15.0, 30.0), 2),
        "heart_rate": random.randint(60, 180),
        "joint_angles": round(random.uniform(0.0, 180.0), 2),
        "gait_speed": round(random.uniform(0.5, 3.5), 2),
        "cadence": random.randint(140, 200),
        "step_count": random.randint(50, 5000),
        "jump_height": round(random.uniform(0.1, 1.2), 2),
        "ground_reaction_force": round(random.uniform(500.0, 2000.0), 2),
        "range_of_motion": round(random.uniform(30.0, 120.0), 2)
    }


def test_predict_with_invalid_data():
    """Test with invalid/missing data"""
    print("\n" + "=" * 60)
    print("Testing with invalid data (missing required field)")
    print("=" * 60)

    invalid_data = {
        "body_temperature": 37.0,
        "ambient_temperature": 22.0,
        # Missing heart_rate
        "joint_angles": 45.0,
        "gait_speed": 1.5,
        "cadence": 160,
        "step_count": 1000,
        "jump_height": 0.5,
        "ground_reaction_force": 800.0,
        "range_of_motion": 90.0
    }

    return test_predict_endpoint(invalid_data, method='windows')


def test_predict_with_negative_values():
    """Test with negative values"""
    print("\n" + "=" * 60)
    print("Testing with negative values")
    print("=" * 60)

    negative_data = {
        "body_temperature": -1.0,
        "ambient_temperature": 22.0,
        "heart_rate": -50,
        "joint_angles": 45.0,
        "gait_speed": 1.5,
        "cadence": 160,
        "step_count": 1000,
        "jump_height": 0.5,
        "ground_reaction_force": 800.0,
        "range_of_motion": 90.0
    }

    return test_predict_endpoint(negative_data, method='windows')


def test_predict_with_string_values():
    """Test with string values instead of numbers"""
    print("\n" + "=" * 60)
    print("Testing with string values")
    print("=" * 60)

    string_data = {
        "body_temperature": "thirty seven",
        "ambient_temperature": 22.0,
        "heart_rate": "seventy two",
        "joint_angles": 45.0,
        "gait_speed": 1.5,
        "cadence": 160,
        "step_count": 1000,
        "jump_height": 0.5,
        "ground_reaction_force": 800.0,
        "range_of_motion": 90.0
    }

    return test_predict_endpoint(string_data, method='windows')


def test_predict_scenarios():
    """Test different risk scenarios"""
    scenarios = [
        ("Healthy Runner", {
            "body_temperature": 36.8,
            "ambient_temperature": 20.0,
            "heart_rate": 65,
            "joint_angles": 175.0,
            "gait_speed": 3.0,
            "cadence": 180,
            "step_count": 5000,
            "jump_height": 0.8,
            "ground_reaction_force": 1200.0,
            "range_of_motion": 110.0
        }),
        ("Fatigued Runner", {
            "body_temperature": 37.8,
            "ambient_temperature": 25.0,
            "heart_rate": 160,
            "joint_angles": 120.0,
            "gait_speed": 1.2,
            "cadence": 150,
            "step_count": 10000,
            "jump_height": 0.3,
            "ground_reaction_force": 600.0,
            "range_of_motion": 60.0
        }),
        ("Injured Runner", {
            "body_temperature": 38.2,
            "ambient_temperature": 18.0,
            "heart_rate": 95,
            "joint_angles": 45.0,
            "gait_speed": 0.8,
            "cadence": 120,
            "step_count": 200,
            "jump_height": 0.1,
            "ground_reaction_force": 300.0,
            "range_of_motion": 30.0
        })
    ]

    results = []

    for scenario_name, sensor_data in scenarios:
        print(f"\n" + "=" * 60)
        print(f"Testing Scenario: {scenario_name}")
        print("=" * 60)

        response = test_predict_endpoint(sensor_data, method='windows')
        if response:
            results.append((scenario_name, response))

    return results


def test_get_request():
    """Test GET request (should fail)"""
    print("\n" + "=" * 60)
    print("Testing GET request (should return 405)")
    print("=" * 60)

    curl_cmd = f'curl -X GET {BASE_URL}/predict'
    return run_curl_simple(curl_cmd)


def test_with_python_requests():
    """Test using Python requests library (alternative)"""
    try:
        import requests
    except ImportError:
        print("\nInstalling requests library...")
        subprocess.run([sys.executable, "-m", "pip", "install", "requests"], capture_output=True)
        import requests

    print("\n" + "=" * 60)
    print("Testing with Python requests library")
    print("=" * 60)

    test_data = {
        "body_temperature": 37.2,
        "ambient_temperature": 22.5,
        "heart_rate": 72,
        "joint_angles": 45.0,
        "gait_speed": 1.5,
        "cadence": 160,
        "step_count": 1000,
        "jump_height": 0.5,
        "ground_reaction_force": 800.0,
        "range_of_motion": 90.0
    }

    try:
        response = requests.post(f"{BASE_URL}/predict", json=test_data, timeout=10)
        print(f"Status Code: {response.status_code}")

        if response.status_code == 200:
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return response.json()
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Request failed: {e}")
        return None


def main():
    import sys

    print("=" * 80)
    print("FIXED - Testing Runners Model Prediction Endpoint")
    print(f"URL: {BASE_URL}/predict")
    print("=" * 80)

    # Check if server is running
    print("\n1. Checking if server is running...")
    check_cmd = 'curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/ 2>nul'
    result = subprocess.run(check_cmd, shell=True, capture_output=True, text=True)

    status = result.stdout.strip()
    if status in ['200', '201', '404']:
        print(f"✅ Server is running (Status: {status})")
    else:
        print(f"❌ Server may not be running (Response: {status})")
        print("Please start your Flask server first:")
        print("  python app.py")
        return

    # Test 1: Normal prediction
    print("\n2. Testing normal prediction with random sensor data")
    response1 = test_predict_endpoint()

    # If still getting 415, try Python requests
    if response1 and "Unsupported Media Type" in str(response1):
        print("\n⚠️  Curl still having issues. Trying Python requests...")
        response1 = test_with_python_requests()

    # Test 2: Test different scenarios
    print("\n3. Testing different runner scenarios")
    results = test_predict_scenarios()

    # Test 3: Test with invalid data
    print("\n4. Testing error handling")
    test_predict_with_invalid_data()

    # Test 4: Test with negative values
    test_predict_with_negative_values()

    # Test 5: Test with string values
    test_predict_with_string_values()

    # Test 6: Test wrong HTTP method
    test_get_request()

    print("\n" + "=" * 80)
    print("Test Summary")
    print("=" * 80)

    # Final test with optimal values
    print("\n5. Final test with optimal runner values")
    optimal_data = {
        "body_temperature": 36.5,
        "ambient_temperature": 18.0,
        "heart_rate": 58,
        "joint_angles": 178.0,
        "gait_speed": 3.4,
        "cadence": 185,
        "step_count": 7500,
        "jump_height": 1.0,
        "ground_reaction_force": 1500.0,
        "range_of_motion": 115.0
    }

    print("\nOptimal runner data:")
    final_response = test_predict_endpoint(optimal_data, method='windows')

    if final_response:
        if 'risk_label' in str(final_response):
            if isinstance(final_response, dict):
                print(f"\n🎉 Final prediction: {final_response.get('risk_label', 'N/A')} "
                      f"(Confidence: {final_response.get('confidence', 'N/A')})")
            else:
                print(f"\n✅ Got response (check above for details)")
        else:
            print(f"\n⚠️  Response: {str(final_response)[:100]}...")
    else:
        print("\n❌ No response received")

if __name__ == "__main__":
    main()