#!/usr/bin/env python3
"""
Test script for Coach CRUD endpoints using curl commands
"""

import subprocess
import json
import time

BASE_URL = "https://mazen-atlam-runners-injury-prediction-system-api.hf.space/api/v1.0/coach"


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


def test_create_coach():
    """Test POST /coach"""
    coach_data = {
        "name": "Test Coach",
        "email": f"coach.test{int(time.time())}@example.com",
        "password": "securepassword123",
        "created_by": "Test Script"
    }

    curl_cmd = f'''curl -X POST {BASE_URL}/ \\
        -H "Content-Type: application/json" \\
        -d '{json.dumps(coach_data)}'
    '''

    response = run_curl(curl_cmd)
    if response and 'id' in response:
        return response['id']
    return None


def test_get_all_coaches():
    """Test GET /coach"""
    curl_cmd = f"curl -X GET {BASE_URL}/"
    run_curl(curl_cmd)


def test_get_coach(coach_id):
    """Test GET /coach/<id>"""
    curl_cmd = f"curl -X GET {BASE_URL}/{coach_id}"
    run_curl(curl_cmd)


def test_update_coach(coach_id):
    """Test PUT /coach/<id>"""
    update_data = {
        "name": "Updated Coach Name",
        "email": f"updated.coach{int(time.time())}@example.com",
        "updated_by": "Test Script"
    }

    curl_cmd = f'''curl -X PUT {BASE_URL}/{coach_id} \\
        -H "Content-Type: application/json" \\
        -d '{json.dumps(update_data)}'
    '''
    run_curl(curl_cmd)


def test_delete_coach(coach_id):
    """Test DELETE /coach/<id>"""
    curl_cmd = f"curl -X DELETE {BASE_URL}/{coach_id}"
    run_curl(curl_cmd)


def main():
    print("=" * 60)
    print("Testing Coach Endpoints")
    print("=" * 60)

    # Test 1: Create a coach
    print("\n1. Testing POST /coach (Create Coach)")
    coach_id = test_create_coach()

    if not coach_id:
        print("Failed to create coach. Exiting...")
        return

    # Test 2: Get all coaches
    print("\n2. Testing GET /coach (Get All Coaches)")
    test_get_all_coaches()

    # Test 3: Get specific coach
    print(f"\n3. Testing GET /coach/{coach_id} (Get Specific Coach)")
    test_get_coach(coach_id)

    # Test 4: Update coach
    print(f"\n4. Testing PUT /coach/{coach_id} (Update Coach)")
    test_update_coach(coach_id)

    # Test 5: Get updated coach
    print(f"\n5. Testing GET /coach/{coach_id} (Verify Update)")
    test_get_coach(coach_id)

    # # Test 6: Delete coach (optional - uncomment if you want to test deletion)
    # print(f"\n6. Testing DELETE /coach/{1} (Delete Coach)")
    # test_delete_coach(1)


if __name__ == "__main__":
    main()