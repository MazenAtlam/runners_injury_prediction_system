#!/usr/bin/env python3
"""
Test script for SensorData CRUD endpoints using curl commands
"""

import subprocess
import json

BASE_URL = "http://localhost:5000/api/v1.0/sensor_data"


def run_curl(command):
    """Execute a curl command and return the response"""
    print(f"\nExecuting: {command}")
    result = subprocess.run(command, shell=True, capture_output=True, text=True)

    if result.stdout:
        try:
            response = json.loads(result.stdout)
            print(f"Response: {json.dumps(response, indent=2)}")
            return response
        except json.JSONDecodeError:
            print(f"Response: {result.stdout}")
            return result.stdout
    if result.stderr:
        print(f"Error: {result.stderr}")
    return None


def test_create_sensor_data(session_id):
    """Test POST /sensor_data"""
    sensor_data = {
        "session_id": session_id,
        "body_temperature": 37.5,
        "ambient_temperature": 22.0,
        "heart_rate": 72.0,
        "joint_angles": 45.0,
        "gait_speed": 1.5,
        "cadence": 160.0,
        "step_count": 1000,
        "jump_height": 0.5,
        "ground_reaction_force": 800.0,
        "range_of_motion": 90.0,
        "created_by": "Test Script"
    }

    curl_cmd = f'''curl -X POST {BASE_URL}/ \\
        -H "Content-Type: application/json" \\
        -d '{json.dumps(sensor_data)}'
    '''

    response = run_curl(curl_cmd)
    if response and 'id' in response:
        return response['id']
    return None


def test_get_all_sensor_data(session_id=None):
    """Test GET /sensor_data"""
    if session_id:
        curl_cmd = f"curl -X GET '{BASE_URL}/?session_id={session_id}'"
    else:
        curl_cmd = f"curl -X GET {BASE_URL}/"

    run_curl(curl_cmd)


def test_get_sensor_data(sensor_data_id):
    """Test GET /sensor_data/<id>"""
    curl_cmd = f"curl -X GET {BASE_URL}/{sensor_data_id}"
    run_curl(curl_cmd)


def test_update_sensor_data(sensor_data_id):
    """Test PUT /sensor_data/<id>"""
    update_data = {
        "heart_rate": 75.0,
        "step_count": 1200,
        "gait_speed": 1.7,
        "updated_by": "Test Script"
    }

    curl_cmd = f'''curl -X PUT {BASE_URL}/{sensor_data_id} \\
        -H "Content-Type: application/json" \\
        -d '{json.dumps(update_data)}'
    '''
    run_curl(curl_cmd)


def test_delete_sensor_data(sensor_data_id):
    """Test DELETE /sensor_data/<id>"""
    curl_cmd = f"curl -X DELETE {BASE_URL}/{sensor_data_id}"
    run_curl(curl_cmd)


def main():
    print("=" * 60)
    print("Testing SensorData Endpoints")
    print("=" * 60)

    # You need to have an existing session_id
    # This should be created first using the session endpoint
    session_id = None  # Replace with actual session_id

    if not session_id:
        print("Please provide a valid session_id")
        return

    # Test 1: Create sensor data
    print(f"\n1. Testing POST /sensor_data (Create Sensor Data)")
    print(f"   Using session_id: {session_id}")
    sensor_data_id = test_create_sensor_data(session_id)

    if not sensor_data_id:
        print("Failed to create sensor data. Exiting...")
        return

    # Test 2: Get all sensor data
    print("\n2. Testing GET /sensor_data (Get All Sensor Data)")
    test_get_all_sensor_data()

    # Test 3: Get sensor data filtered by session_id
    print(f"\n3. Testing GET /sensor_data?session_id={session_id} (Filter by Session)")
    test_get_all_sensor_data(session_id)

    # Test 4: Get specific sensor data
    print(f"\n4. Testing GET /sensor_data/{sensor_data_id} (Get Specific Sensor Data)")
    test_get_sensor_data(sensor_data_id)

    # Test 5: Update sensor data
    print(f"\n5. Testing PUT /sensor_data/{sensor_data_id} (Update Sensor Data)")
    test_update_sensor_data(sensor_data_id)

    # Test 6: Get updated sensor data
    print(f"\n6. Testing GET /sensor_data/{sensor_data_id} (Verify Update)")
    test_get_sensor_data(sensor_data_id)

    # # Test 7: Delete sensor data (optional)
    # print(f"\n7. Testing DELETE /sensor_data/{sensor_data_id} (Delete Sensor Data)")
    # test_delete_sensor_data(sensor_data_id)


if __name__ == "__main__":
    main()