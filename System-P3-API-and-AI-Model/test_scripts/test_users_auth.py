#!/usr/bin/env python3
"""
Test script for User Authentication endpoints (register, login, logout)
Windows-safe curl commands with proper JSON handling
"""

import subprocess
import json
import os
import tempfile
import time

BASE_URL = "https://mazen-atlam-runners-injury-prediction-system-api.hf.space/api/v1.0/user"


def run_curl_with_file(json_data):
    """Run curl using a temporary file (most reliable on Windows)"""
    # Create a temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(json_data, f)
        temp_file = f.name

    try:
        # Use @filename syntax for curl
        curl_cmd = f'curl -X POST {BASE_URL}/register -H "Content-Type: application/json" -d @{temp_file}'
        print(f"\nExecuting: curl -X POST {BASE_URL}/register -H \"Content-Type: application/json\" -d @{temp_file}")
        result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)
        return result
    finally:
        # Clean up
        os.unlink(temp_file)


def run_curl_with_json(json_data, endpoint, method='POST'):
    """Run curl with JSON data using proper Windows escaping"""
    json_str = json.dumps(json_data)
    # Double-escape the quotes for Windows cmd
    json_str_escaped = json_str.replace('"', '\\"')

    # Single line command (no backslash continuation)
    if endpoint == 'register':
        curl_cmd = f'curl -X POST {BASE_URL}/register -H "Content-Type: application/json" -d "{json_str_escaped}"'
    elif endpoint == 'login':
        curl_cmd = f'curl -X POST {BASE_URL}/login -H "Content-Type: application/json" -d "{json_str_escaped}"'
    elif endpoint == 'logout':
        # For logout, we need to include the token in Authorization header
        token = json_data.get('token', '')
        curl_cmd = f'curl -X POST {BASE_URL}/logout -H "Content-Type: application/json" -H "Authorization: Bearer {token}"'

    print(f"\nExecuting: {curl_cmd}")
    result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)
    return result


def parse_curl_result(result):
    """Parse curl result and return response"""
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


def test_register_coach():
    """Test registering a coach"""
    print("\n" + "=" * 70)
    print("1. Testing Coach Registration")
    print("=" * 70)

    # Generate unique email to avoid conflicts
    timestamp = int(time.time())
    coach_data = {
        "name": f"Test Coach {timestamp}",
        "email": f"coach{timestamp}@test.com",
        "password": "CoachPassword123!",
        "type": "coach",
        "created_by": "Test Script"
    }

    print(f"Registering coach: {coach_data}")

    # Try file-based method first (most reliable)
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(coach_data, f)
        temp_file = f.name

    try:
        curl_cmd = f'curl -X POST {BASE_URL}/register -H "Content-Type: application/json" -d @{temp_file}'
        print(f"\nCommand: {curl_cmd}")
        result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)

        response = parse_curl_result(result)

        if response and 'id' in response:
            print(f"✅ Coach registered successfully! ID: {response['id']}")
            return {
                'id': response['id'],
                'email': coach_data['email'],
                'password': coach_data['password'],
                'type': 'coach'
            }
        else:
            print("❌ Coach registration failed")
            return None

    finally:
        os.unlink(temp_file)


def test_register_existing_coach():
    """Test registering a coach that alredy exists"""
    print("\n" + "=" * 70)
    print("1. Testing Coach Registration")
    print("=" * 70)

    # Generate unique email to avoid conflicts
    coach_data = {
        "name": f"Test Coach 1766176477",
        "email": f"coach1766176477@test.com",
        "password": "CoachPassword123!",
        "type": "coach",
        "created_by": "Test Script"
    }

    print(f"Registering coach: {coach_data}")

    # Try file-based method first (most reliable)
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(coach_data, f)
        temp_file = f.name

    try:
        curl_cmd = f'curl -X POST {BASE_URL}/register -H "Content-Type: application/json" -d @{temp_file}'
        print(f"\nCommand: {curl_cmd}")
        result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)

        response = parse_curl_result(result)

        if response and 'id' in response:
            print(f"✅ Coach registered successfully! ID: {response['id']}")
            return {
                'id': response['id'],
                'email': coach_data['email'],
                'password': coach_data['password'],
                'type': 'coach'
            }
        else:
            print("❌ Coach registration failed")
            return None

    finally:
        os.unlink(temp_file)


def test_register_athlete(coach_id=None):
    """Test registering an athlete"""
    print("\n" + "=" * 70)
    print("2. Testing Athlete Registration")
    print("=" * 70)

    timestamp = int(time.time())
    athlete_data = {
        "name": f"Test Athlete {timestamp}",
        "email": f"athlete{timestamp}@test.com",
        "password": "AthletePassword123!",
        "type": "athlete",
        "created_by": "Test Script"
    }

    if coach_id:
        athlete_data["coach_id"] = coach_id
        print(f"Registering athlete: {athlete_data} assigned to coach_id: {coach_id}")
    else:
        print(f"Registering athlete: {athlete_data} (no coach)")

    # Create temporary file for JSON data
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(athlete_data, f)
        temp_file = f.name

    try:
        curl_cmd = f'curl -X POST {BASE_URL}/register -H "Content-Type: application/json" -d @{temp_file}'
        print(f"\nCommand: {curl_cmd}")
        result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)

        response = parse_curl_result(result)

        if response and 'id' in response:
            print(f"✅ Athlete registered successfully! ID: {response['id']}")
            return {
                'id': response['id'],
                'email': athlete_data['email'],
                'password': athlete_data['password'],
                'type': 'athlete',
                'coach_id': coach_id if coach_id else None
            }
        else:
            print("❌ Athlete registration failed")
            return None

    finally:
        os.unlink(temp_file)


def test_login(email, password, user_type):
    """Test user login"""
    print("\n" + "=" * 70)
    print(f"3. Testing Login for {user_type}: {email}")
    print("=" * 70)

    login_data = {
        "email": email,
        "password": password
    }

    print(f'login data: {login_data}')

    # Create temporary file for JSON data
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(login_data, f)
        temp_file = f.name

    try:
        curl_cmd = f'curl -X POST {BASE_URL}/login -H "Content-Type: application/json" -d @{temp_file}'
        print(f"\nCommand: {curl_cmd}")
        result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)

        response = parse_curl_result(result)

        if response and 'token' in response:
            print(f"✅ Login successful!")
            print(f"   Token received: {response['token'][:50]}...")
            print(f"   User ID: {response.get('id')}")
            print(f"   User Type: {response.get('type')}")
            return response['token']
        else:
            print("❌ Login failed")
            return None

    finally:
        os.unlink(temp_file)


def test_logout(token):
    """Test user logout (requires valid token)"""
    print("\n" + "=" * 70)
    print("4. Testing Logout")
    print("=" * 70)

    if not token:
        print("❌ No token provided for logout test")
        return False

    print(f"Using token: {token}")

    # For logout, we just need to send the token in Authorization header
    curl_cmd = f'curl -X POST {BASE_URL}/logout -H "Content-Type: application/json" -H "Authorization: Bearer {token}"'
    print(f"\nCommand: {curl_cmd}")
    result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)

    response = parse_curl_result(result)

    if response and 'message' in response and 'logged out' in response['message'].lower():
        print("✅ Logout successful!")
        return True
    else:
        print("❌ Logout failed")
        return False


def test_invalid_registration():
    """Test registration with invalid data"""
    print("\n" + "=" * 70)
    print("5. Testing Invalid Registration Scenarios")
    print("=" * 70)

    test_cases = [
        {
            "name": "Missing required field",
            "data": {
                "email": "test@test.com",
                "password": "password123",
                # Missing "type" and "name"
            },
            "expected_error": "Missing required field"
        },
        {
            "name": "Invalid user type",
            "data": {
                "name": "Test User",
                "email": f"test{int(time.time())}@test.com",
                "password": "password123",
                "type": "invalid_type",  # Should be 'athlete' or 'coach'
                "created_by": "Test Script"
            },
            "expected_error": "Invalid user type"
        },
        {
            "name": "Duplicate email",
            "data": {
                "name": "Test User",
                "email": "coach@test.com",  # Using an email that might already exist
                "password": "password123",
                "type": "coach",
                "created_by": "Test Script"
            },
            "expected_error": "Email already exists"
        }
    ]

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print(f"   Data: {json.dumps(test_case['data'], indent=4)}")

        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(test_case['data'], f)
            temp_file = f.name

        try:
            curl_cmd = f'curl -X POST {BASE_URL}/register -H "Content-Type: application/json" -d @{temp_file}'
            result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)

            response = parse_curl_result(result)

            if response and 'error' in response:
                if test_case['expected_error'].lower() in response['error'].lower():
                    print(f"   ✅ Got expected error: {response['error']}")
                else:
                    print(f"   ⚠️  Got error but not expected: {response['error']}")
            else:
                print(f"   ❓ Unexpected response: {response}")

        finally:
            os.unlink(temp_file)


def test_invalid_login():
    """Test login with invalid credentials"""
    print("\n" + "=" * 70)
    print("6. Testing Invalid Login Scenarios")
    print("=" * 70)

    test_cases = [
        {
            "name": "Wrong password",
            "data": {
                "email": "coach@test.com",  # Use a known email
                "password": "WRONGPASSWORD123!"
            },
            "expected_error": "Invalid email or password"
        },
        {
            "name": "Non-existent email",
            "data": {
                "email": f"nonexistent{int(time.time())}@test.com",
                "password": "password123"
            },
            "expected_error": "Invalid email or password"
        },
        {
            "name": "Missing email",
            "data": {
                "password": "password123"
                # Missing email
            },
            "expected_error": "Email and password are required"
        }
    ]

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print(f"   Data: {json.dumps(test_case['data'], indent=4)}")

        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(test_case['data'], f)
            temp_file = f.name

        try:
            curl_cmd = f'curl -X POST {BASE_URL}/login -H "Content-Type: application/json" -d @{temp_file}'
            result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)

            response = parse_curl_result(result)

            if response and 'error' in response:
                if test_case['expected_error'].lower() in response['error'].lower():
                    print(f"   ✅ Got expected error: {response['error']}")
                else:
                    print(f"   ⚠️  Got error but not expected: {response['error']}")
            else:
                print(f"   ❓ Unexpected response: {response}")

        finally:
            os.unlink(temp_file)


def test_protected_endpoint(token):
    """Test accessing a protected endpoint with token"""
    print("\n" + "=" * 70)
    print("7. Testing Protected Endpoint Access")
    print("=" * 70)

    if not token:
        print("❌ No token available for protected endpoint test")
        return

    print(f"Testing with token: {token}")

    # Try to access a protected endpoint (logout requires token)
    curl_cmd = f'curl -X POST {BASE_URL}/logout -H "Content-Type: application/json" -H "Authorization: Bearer {token}"'
    print(f"\nCommand: {curl_cmd}")
    result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)

    response = parse_curl_result(result)

    if response:
        print(f"✅ Successfully accessed protected endpoint")
        return True
    else:
        print("❌ Failed to access protected endpoint")
        return False


def test_expired_token():
    """Test with expired/malformed token"""
    print("\n" + "=" * 70)
    print("8. Testing Invalid/Expired Token")
    print("=" * 70)

    test_tokens = [
        {
            "name": "Malformed token",
            "token": "malformed.token.here",
            "expected_error": "Invalid token"
        },
        {
            "name": "Expired token (if you have one)",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJ0eXBlIjoiY29hY2giLCJleHAiOjE2MDAwMDAwMDB9.expired_signature_here",
            "expected_error": "Token has expired"
        },
        {
            "name": "Empty token",
            "token": "",
            "expected_error": "Token is missing"
        }
    ]

    for test_token in test_tokens:
        print(f"\nTesting: {test_token['name']}")
        print(f"Token: {test_token['token']}")

        curl_cmd = f'curl -X POST {BASE_URL}/logout -H "Content-Type: application/json" -H "Authorization: Bearer {test_token['token']}"'
        print(f"\nCommand: {curl_cmd}")
        result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)

        response = parse_curl_result(result)

        if response and 'error' in response:
            if test_token['expected_error'].lower() in response['error'].lower():
                print(f"   ✅ Got expected error: {response['error']}")
            else:
                print(f"   ⚠️  Got error but not expected: {response['error']}")
        else:
            print(f"   ❓ Unexpected response: {response}")


def main():
    """Main test function"""
    print("=" * 80)
    print("USER AUTHENTICATION ENDPOINT TESTER")
    print(f"Base URL: {BASE_URL}")
    print("=" * 80)

    # Check if server is running
    print("\nChecking if server is running...")
    check_cmd = 'curl -s -o /dev/null -w "%{http_code}" https://mazen-atlam-runners-injury-prediction-system-api.hf.space/ 2>nul'
    result = subprocess.run(check_cmd, shell=True, capture_output=True, text=True)

    status = result.stdout.strip()
    if status in ['200', '201', '404']:
        print(f"✅ Server is running (Status: {status})")
    else:
        print(f"❌ Server may not be running (Response: {status})")
        print("Please start your Flask server first:")
        print("  python app.py")
        return

    # Store test results
    test_results = {
        'coach': None,
        'athlete': None,
        'coach_token': None,
        'athlete_token': None
    }

    # Test 1: Register a coach
    coach_info = test_register_coach()
    if coach_info:
        test_results['coach'] = coach_info

    # Test 2: Register an athlete (with coach if available)
    if coach_info:
        athlete_info = test_register_athlete(coach_id=coach_info['id'])
    else:
        athlete_info = test_register_athlete()

    if athlete_info:
        test_results['athlete'] = athlete_info

    # Test 3: Login as coach
    if coach_info:
        coach_token = test_login(coach_info['email'], coach_info['password'], 'coach')
        if coach_token:
            test_results['coach_token'] = coach_token

    # Test 4: Login as athlete
    if athlete_info:
        athlete_token = test_login(athlete_info['email'], athlete_info['password'], 'athlete')
        if athlete_token:
            test_results['athlete_token'] = athlete_token

    # Test 5: Test protected endpoint with valid token
    if test_results['coach_token']:
        test_protected_endpoint(test_results['coach_token'])

    # Test 6: Test logout
    if test_results['coach_token']:
        test_logout(test_results['coach_token'])

    # Test 7: Test invalid registration scenarios
    test_invalid_registration()

    # Test 8: Test invalid login scenarios
    test_invalid_login()

    # Test 9: Test invalid/expired tokens
    test_expired_token()

    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)

    tests_passed = 0
    total_tests = 4  # register coach, register athlete, login coach, login athlete

    if test_results['coach']:
        print(f"✅ Coach registration: PASSED (ID: {test_results['coach']['id']})")
        tests_passed += 1
    else:
        print("❌ Coach registration: FAILED")

    if test_results['athlete']:
        print(f"✅ Athlete registration: PASSED (ID: {test_results['athlete']['id']})")
        tests_passed += 1
    else:
        print("❌ Athlete registration: FAILED")

    if test_results['coach_token']:
        print(f"✅ Coach login: PASSED (Token received)")
        tests_passed += 1
    else:
        print("❌ Coach login: FAILED")

    if test_results['athlete_token']:
        print(f"✅ Athlete login: PASSED (Token received)")
        tests_passed += 1
    else:
        print("❌ Athlete login: FAILED")

    print(f"\nTotal tests passed: {tests_passed}/{total_tests}")

    if tests_passed == total_tests:
        print("\n🎉 All authentication tests passed successfully!")
    elif tests_passed > 0:
        print(f"\n⚠️  {tests_passed} tests passed, {total_tests - tests_passed} failed")
    else:
        print("\n❌ All authentication tests failed")


if __name__ == "__main__":
    main()