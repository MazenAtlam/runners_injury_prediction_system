#!/usr/bin/env python3
"""
Test script for Session CRUD endpoints using curl commands
"""

import subprocess
import json

BASE_URL = "http://localhost:5000/api/v1.0/session"


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


def test_create_session(athlete_id, coach_id):
    """Test POST /session"""
    session_data = {
        "athlete_id": athlete_id,
        "coach_id": coach_id,
        "created_by": "Test Script"
    }

    curl_cmd = f'''curl -X POST {BASE_URL}/ \\
        -H "Content-Type: application/json" \\
        -d '{json.dumps(session_data)}'
    '''

    response = run_curl(curl_cmd)
    if response and 'id' in response:
        return response['id']
    return None


def test_get_all_sessions():
    """Test GET /session"""
    curl_cmd = f"curl -X GET {BASE_URL}/"
    run_curl(curl_cmd)


def test_get_session(session_id):
    """Test GET /session/<id>"""
    curl_cmd = f"curl -X GET {BASE_URL}/{session_id}"
    run_curl(curl_cmd)


def test_update_session(session_id, athlete_id=None, coach_id=None):
    """Test PUT /session/<id>"""
    update_data = {
        "updated_by": "Test Script"
    }

    if athlete_id:
        update_data["athlete_id"] = athlete_id
    if coach_id:
        update_data["coach_id"] = coach_id

    curl_cmd = f'''curl -X PUT {BASE_URL}/{session_id} \\
        -H "Content-Type: application/json" \\
        -d '{json.dumps(update_data)}'
    '''
    run_curl(curl_cmd)


def test_delete_session(session_id):
    """Test DELETE /session/<id>"""
    curl_cmd = f"curl -X DELETE {BASE_URL}/{session_id}"
    run_curl(curl_cmd)


def main():
    print("=" * 60)
    print("Testing Session Endpoints")
    print("=" * 60)

    # You need to have existing athlete_id and coach_id
    # These should be created first using the coach and athlete endpoints
    athlete_id = None  # Replace with actual athlete_id
    coach_id = None  # Replace with actual coach_id

    if not athlete_id or not coach_id:
        print("Please provide valid athlete_id and coach_id")
        return

    # Test 1: Create a session
    print(f"\n1. Testing POST /session (Create Session)")
    print(f"   Using athlete_id: {athlete_id}, coach_id: {coach_id}")
    session_id = test_create_session(athlete_id, coach_id)

    if not session_id:
        print("Failed to create session. Exiting...")
        return

    # Test 2: Get all sessions
    print("\n2. Testing GET /session (Get All Sessions)")
    test_get_all_sessions()

    # Test 3: Get specific session
    print(f"\n3. Testing GET /session/{session_id} (Get Specific Session)")
    test_get_session(session_id)

    # Test 4: Update session
    print(f"\n4. Testing PUT /session/{session_id} (Update Session)")
    # Using same IDs for update, but you could change them
    test_update_session(session_id, athlete_id, coach_id)

    # Test 5: Get updated session
    print(f"\n5. Testing GET /session/{session_id} (Verify Update)")
    test_get_session(session_id)

    # # Test 6: Delete session (optional)
    # print(f"\n6. Testing DELETE /session/{session_id} (Delete Session)")
    # test_delete_session(session_id)


if __name__ == "__main__":
    main()