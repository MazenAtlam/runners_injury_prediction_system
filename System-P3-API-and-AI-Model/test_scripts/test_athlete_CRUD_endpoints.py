#!/usr/bin/env python3
"""
Test script for Athlete CRUD endpoints using curl commands
"""

import subprocess
import json
import time

BASE_URL = "http://localhost:5000/api/v1.0/athlete"


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


def test_create_athlete(coach_id=None):
    """Test POST /athlete"""
    athlete_data = {
        "name": "Test Athlete",
        "email": f"athlete.test{int(time.time())}@example.com",
        "password": "athletepassword123",
        "created_by": "Test Script"
    }

    if coach_id:
        athlete_data["coach_id"] = coach_id

    curl_cmd = f'''curl -X POST {BASE_URL}/ \\
        -H "Content-Type: application/json" \\
        -d '{json.dumps(athlete_data)}'
    '''

    response = run_curl(curl_cmd)
    if response and 'id' in response:
        return response['id']
    return None


def test_get_all_athletes():
    """Test GET /athlete"""
    curl_cmd = f"curl -X GET {BASE_URL}/"
    run_curl(curl_cmd)


def test_get_athlete(athlete_id):
    """Test GET /athlete/<id>"""
    curl_cmd = f"curl -X GET {BASE_URL}/{athlete_id}"
    run_curl(curl_cmd)


def test_update_athlete(athlete_id, coach_id=None):
    """Test PUT /athlete/<id>"""
    update_data = {
        "name": "Updated Athlete Name",
        "email": f"updated.athlete{int(time.time())}@example.com",
        "updated_by": "Test Script"
    }

    if coach_id:
        update_data["coach_id"] = coach_id

    curl_cmd = f'''curl -X PUT {BASE_URL}/{athlete_id} \\
        -H "Content-Type: application/json" \\
        -d '{json.dumps(update_data)}'
    '''
    run_curl(curl_cmd)


def test_delete_athlete(athlete_id):
    """Test DELETE /athlete/<id>"""
    curl_cmd = f"curl -X DELETE {BASE_URL}/{athlete_id}"
    run_curl(curl_cmd)


def main():
    print("=" * 60)
    print("Testing Athlete Endpoints")
    print("=" * 60)

    # Note: You might need to create a coach first and use that coach_id
    coach_id = None  # Replace with actual coach_id if needed

    if not coach_id:
        print("Please provide a valid coach_id")
        return

    # Test 1: Create an athlete
    print("\n1. Testing POST /athlete (Create Athlete)")
    athlete_id = test_create_athlete(coach_id)

    if not athlete_id:
        print("Failed to create athlete. Exiting...")
        return

    # Test 2: Get all athletes
    print("\n2. Testing GET /athlete (Get All Athletes)")
    test_get_all_athletes()

    # Test 3: Get specific athlete
    print(f"\n3. Testing GET /athlete/{athlete_id} (Get Specific Athlete)")
    test_get_athlete(athlete_id)

    # Test 4: Update athlete
    print(f"\n4. Testing PUT /athlete/{athlete_id} (Update Athlete)")
    test_update_athlete(athlete_id, coach_id)

    # Test 5: Get updated athlete
    print(f"\n5. Testing GET /athlete/{athlete_id} (Verify Update)")
    test_get_athlete(athlete_id)

    # # Test 6: Delete athlete (optional)
    # print(f"\n6. Testing DELETE /athlete/{athlete_id} (Delete Athlete)")
    # test_delete_athlete(athlete_id)


if __name__ == "__main__":
    main()