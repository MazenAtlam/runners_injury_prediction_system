import requests
import time
import statistics
from datetime import datetime

# API endpoint
API_URL = "http://localhost:5000/api/v1.0/runners_model/predict"

# Labeled test scenarios based on physiological knowledge
test_scenarios = [
    # ---------------------- HEALTHY RUNNERS (Risk Level 0) ----------------------
    {
        "label": "Healthy Elite Runner",
        "expected_risk": 0,
        "data": {
            "heart_rate": 62,
            "body_temperature": 36.2,
            "joint_angles": 178.5,
            "gait_speed": 3.8,
            "cadence": 185,
            "step_count": 8500,
            "jump_height": 0.8,
            "ground_reaction_force": 2100,
            "range_of_motion": 145,
            "ambient_temperature": 18.0
        }
    },
    {
        "label": "Healthy Recreational Runner",
        "expected_risk": 0,
        "data": {
            "heart_rate": 68,
            "body_temperature": 36.5,
            "joint_angles": 175.0,
            "gait_speed": 2.9,
            "cadence": 168,
            "step_count": 6500,
            "jump_height": 0.6,
            "ground_reaction_force": 1800,
            "range_of_motion": 138,
            "ambient_temperature": 20.0
        }
    },
    {
        "label": "Healthy Runner Optimal Conditions",
        "expected_risk": 0,
        "data": {
            "heart_rate": 65,
            "body_temperature": 36.3,
            "joint_angles": 177.0,
            "gait_speed": 3.2,
            "cadence": 172,
            "step_count": 7500,
            "jump_height": 0.7,
            "ground_reaction_force": 1950,
            "range_of_motion": 142,
            "ambient_temperature": 19.0
        }
    },
    {
        "label": "Healthy Runner Cool Environment",
        "expected_risk": 0,
        "data": {
            "heart_rate": 64,
            "body_temperature": 36.1,
            "joint_angles": 176.5,
            "gait_speed": 3.1,
            "cadence": 170,
            "step_count": 7000,
            "jump_height": 0.65,
            "ground_reaction_force": 1900,
            "range_of_motion": 140,
            "ambient_temperature": 15.0
        }
    },
    {
        "label": "Healthy Runner Mild Exercise",
        "expected_risk": 0,
        "data": {
            "heart_rate": 72,
            "body_temperature": 36.8,
            "joint_angles": 174.0,
            "gait_speed": 2.5,
            "cadence": 162,
            "step_count": 5500,
            "jump_height": 0.55,
            "ground_reaction_force": 1700,
            "range_of_motion": 135,
            "ambient_temperature": 22.0
        }
    },

    # ---------------------- LOW RISK RUNNERS (Risk Level 1) ----------------------
    {
        "label": "Fatigued Runner",
        "expected_risk": 1,
        "data": {
            "heart_rate": 82,
            "body_temperature": 37.2,
            "joint_angles": 168.0,
            "gait_speed": 2.8,
            "cadence": 158,
            "step_count": 12000,
            "jump_height": 0.45,
            "ground_reaction_force": 2200,
            "range_of_motion": 125,
            "ambient_temperature": 24.0
        }
    },
    {
        "label": "Slight Overload",
        "expected_risk": 1,
        "data": {
            "heart_rate": 78,
            "body_temperature": 37.0,
            "joint_angles": 165.0,
            "gait_speed": 3.0,
            "cadence": 165,
            "step_count": 9500,
            "jump_height": 0.5,
            "ground_reaction_force": 2400,
            "range_of_motion": 128,
            "ambient_temperature": 25.0
        }
    },
    {
        "label": "Early Fatigue Signs",
        "expected_risk": 1,
        "data": {
            "heart_rate": 85,
            "body_temperature": 37.1,
            "joint_angles": 162.0,
            "gait_speed": 2.7,
            "cadence": 155,
            "step_count": 10500,
            "jump_height": 0.42,
            "ground_reaction_force": 2300,
            "range_of_motion": 122,
            "ambient_temperature": 26.0
        }
    },
    {
        "label": "Reduced Mobility",
        "expected_risk": 1,
        "data": {
            "heart_rate": 80,
            "body_temperature": 36.9,
            "joint_angles": 160.0,
            "gait_speed": 2.6,
            "cadence": 152,
            "step_count": 8000,
            "jump_height": 0.4,
            "ground_reaction_force": 2100,
            "range_of_motion": 118,
            "ambient_temperature": 23.0
        }
    },
    {
        "label": "Elevated Load",
        "expected_risk": 1,
        "data": {
            "heart_rate": 88,
            "body_temperature": 37.3,
            "joint_angles": 158.0,
            "gait_speed": 2.9,
            "cadence": 160,
            "step_count": 11000,
            "jump_height": 0.48,
            "ground_reaction_force": 2500,
            "range_of_motion": 120,
            "ambient_temperature": 27.0
        }
    },

    # ---------------------- INJURED RUNNERS (Risk Level 2) ----------------------
    {
        "label": "Acute Injury Pattern",
        "expected_risk": 2,
        "data": {
            "heart_rate": 95,
            "body_temperature": 37.8,
            "joint_angles": 142.0,
            "gait_speed": 1.8,
            "cadence": 140,
            "step_count": 4500,
            "jump_height": 0.25,
            "ground_reaction_force": 2800,
            "range_of_motion": 95,
            "ambient_temperature": 21.0
        }
    },
    {
        "label": "Severe Limitation",
        "expected_risk": 2,
        "data": {
            "heart_rate": 92,
            "body_temperature": 37.6,
            "joint_angles": 135.0,
            "gait_speed": 1.5,
            "cadence": 135,
            "step_count": 3800,
            "jump_height": 0.2,
            "ground_reaction_force": 3000,
            "range_of_motion": 85,
            "ambient_temperature": 20.0
        }
    },
    {
        "label": "Compensatory Gait",
        "expected_risk": 2,
        "data": {
            "heart_rate": 98,
            "body_temperature": 37.9,
            "joint_angles": 148.0,
            "gait_speed": 1.9,
            "cadence": 145,
            "step_count": 4200,
            "jump_height": 0.3,
            "ground_reaction_force": 2700,
            "range_of_motion": 100,
            "ambient_temperature": 22.0
        }
    },
    {
        "label": "Overtraining Syndrome",
        "expected_risk": 2,
        "data": {
            "heart_rate": 102,
            "body_temperature": 38.0,
            "joint_angles": 140.0,
            "gait_speed": 1.6,
            "cadence": 138,
            "step_count": 15000,
            "jump_height": 0.22,
            "ground_reaction_force": 3200,
            "range_of_motion": 88,
            "ambient_temperature": 19.0
        }
    },
    {
        "label": "Chronic Injury Indicators",
        "expected_risk": 2,
        "data": {
            "heart_rate": 90,
            "body_temperature": 37.5,
            "joint_angles": 130.0,
            "gait_speed": 1.4,
            "cadence": 130,
            "step_count": 3500,
            "jump_height": 0.18,
            "ground_reaction_force": 2900,
            "range_of_motion": 80,
            "ambient_temperature": 18.0
        }
    }
]


def test_endpoint(scenario):
    """Test a single scenario and return response data"""
    try:
        start_time = time.time()
        response = requests.post(API_URL, json=scenario["data"], timeout=10)
        end_time = time.time()

        response_time = (end_time - start_time) * 1000  # Convert to milliseconds

        if response.status_code == 200:
            result = response.json()
            return {
                "success": True,
                "response_time": response_time,
                "risk_level": result.get("risk_level"),
                "risk_label": result.get("risk_label"),
                "confidence": result.get("confidence"),
                "probabilities": result.get("probabilities"),
                "alerts": result.get("alerts", []),
                "recommendations": result.get("recommendations", [])
            }
        else:
            return {
                "success": False,
                "response_time": response_time,
                "error": f"HTTP {response.status_code}: {response.text}"
            }

    except requests.exceptions.Timeout:
        return {
            "success": False,
            "response_time": None,
            "error": "Request timeout"
        }
    except requests.exceptions.RequestException as e:
        return {
            "success": False,
            "response_time": None,
            "error": f"Request failed: {str(e)}"
        }


def run_performance_test():
    """Run all test scenarios and collect performance data"""
    print("=" * 80)
    print("AI MODEL PERFORMANCE TEST")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Endpoint: {API_URL}")
    print("=" * 80)

    results = []
    response_times = []
    predictions_by_risk = {0: 0, 1: 0, 2: 0}

    for i, scenario in enumerate(test_scenarios, 1):
        print(f"\n{'=' * 60}")
        print(f"Test {i:02d}: {scenario['label']}")
        print(f"Data: {scenario['data']}")
        print(f"Expected Risk Level: {scenario['expected_risk']}")
        print(f"{'=' * 60}")

        result = test_endpoint(scenario)

        if result["success"]:
            response_times.append(result["response_time"])
            predictions_by_risk[result["risk_level"]] += 1

            print(f"✓ Request successful")
            print(f"  Response Time: {result['response_time']:.2f} ms")
            print(f"  Predicted Risk Level: {result['risk_level']} ({result['risk_label']})")
            print(f"  Confidence: {result['confidence']:.3f}")
            print(f"  Probabilities: {result['probabilities']}")

            if result["alerts"]:
                print(f"  Alerts: {result['alerts']}")
            if result["recommendations"]:
                print(f"  Recommendations: {result['recommendations']}")

            # Store for summary
            results.append({
                "scenario": scenario["label"],
                "expected": scenario["expected_risk"],
                "predicted": result["risk_level"],
                "response_time": result["response_time"],
                "confidence": result["confidence"]
            })
        else:
            print(f"✗ Request failed")
            print(f"  Error: {result['error']}")
            if result["response_time"]:
                print(f"  Response Time: {result['response_time']:.2f} ms")

    # Calculate statistics
    if response_times:
        avg_response_time = statistics.mean(response_times)
        min_response_time = min(response_times)
        max_response_time = max(response_times)

        # Calculate percentiles
        sorted_times = sorted(response_times)
        p50 = sorted_times[int(len(sorted_times) * 0.5)]
        p95 = sorted_times[int(len(sorted_times) * 0.95)]
        p99 = sorted_times[int(len(sorted_times) * 0.99)] if len(sorted_times) >= 100 else max_response_time

        # Print summary
        print("\n" + "=" * 80)
        print("PERFORMANCE SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {len(test_scenarios)}")
        print(f"Successful Requests: {len(response_times)}")
        print(f"Failed Requests: {len(test_scenarios) - len(response_times)}")
        print(f"\nResponse Time Statistics (ms):")
        print(f"  Average: {avg_response_time:.2f}")
        print(f"  Minimum: {min_response_time:.2f}")
        print(f"  Maximum: {max_response_time:.2f}")
        print(f"  50th percentile (median): {p50:.2f}")
        print(f"  95th percentile: {p95:.2f}")
        print(f"  99th percentile: {p99:.2f}")

        print(f"\nPrediction Distribution:")
        print(f"  Healthy (0): {predictions_by_risk[0]} predictions")
        print(f"  Low Risk (1): {predictions_by_risk[1]} predictions")
        print(f"  Injured (2): {predictions_by_risk[2]} predictions")

        # Additional analysis
        healthy_scenarios = [r for r in results if r["expected"] == 0]
        low_risk_scenarios = [r for r in results if r["expected"] == 1]
        injured_scenarios = [r for r in results if r["expected"] == 2]

        print(f"\nScenario Analysis:")
        if healthy_scenarios:
            avg_conf_healthy = statistics.mean([r["confidence"] for r in healthy_scenarios])
            avg_time_healthy = statistics.mean([r["response_time"] for r in healthy_scenarios])
            print(
                f"  Healthy scenarios: Avg confidence = {avg_conf_healthy:.3f}, Avg response = {avg_time_healthy:.2f} ms")

        if low_risk_scenarios:
            avg_conf_low = statistics.mean([r["confidence"] for r in low_risk_scenarios])
            avg_time_low = statistics.mean([r["response_time"] for r in low_risk_scenarios])
            print(f"  Low Risk scenarios: Avg confidence = {avg_conf_low:.3f}, Avg response = {avg_time_low:.2f} ms")

        if injured_scenarios:
            avg_conf_injured = statistics.mean([r["confidence"] for r in injured_scenarios])
            avg_time_injured = statistics.mean([r["response_time"] for r in injured_scenarios])
            print(
                f"  Injured scenarios: Avg confidence = {avg_conf_injured:.3f}, Avg response = {avg_time_injured:.2f} ms")

        # Save detailed results to file
        with open(f"model_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt", "w") as f:
            f.write(f"AI Model Test Results\n")
            f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Total Tests: {len(test_scenarios)}\n")
            f.write(f"Successful: {len(response_times)}\n\n")

            for result in results:
                f.write(f"Scenario: {result['scenario']}\n")
                f.write(f"  Expected: {result['expected']}, Predicted: {result['predicted']}\n")
                f.write(f"  Response Time: {result['response_time']:.2f} ms\n")
                f.write(f"  Confidence: {result['confidence']:.3f}\n\n")

            f.write(f"\nPerformance Summary:\n")
            f.write(f"  Avg Response Time: {avg_response_time:.2f} ms\n")
            f.write(f"  Min Response Time: {min_response_time:.2f} ms\n")
            f.write(f"  Max Response Time: {max_response_time:.2f} ms\n")
            f.write(f"  95th Percentile: {p95:.2f} ms\n")

        print(f"\nDetailed results saved to file.")

    print("\n" + "=" * 80)
    print("TEST COMPLETED")
    print("=" * 80)


if __name__ == "__main__":
    # Run the performance test
    run_performance_test()