def generate_alert(prediction, probabilities, feature_values):
    """Generate alerts based on prediction and sensor data."""
    risk_levels = ['Healthy', 'Low Risk', 'Injured']
    current_risk = risk_levels[prediction] if prediction < len(risk_levels) else "Unknown"

    alerts = []
    recommendations = []

    if prediction == 2:  # Injured
        alerts.append("HIGH RISK: Potential injury detected!")
        if feature_values.get('heart_rate', 0) > 160:
            recommendations.append("Elevated heart rate detected - consider reducing intensity")
        if feature_values.get('body_temperature', 0) > 38:
            recommendations.append("High body temperature - hydrate and cool down")

        ja = feature_values.get('joint_angles')
        if ja is not None and (ja < 60 or ja > 175):
            recommendations.append("Abnormal joint angles detected - check form")

    elif prediction == 1:  # Low Risk
        alerts.append("CAUTION: Elevated injury risk indicators")
        recommendations.append("Monitor your form and consider moderate intensity")

    else:  # Healthy
        alerts.append("OPTIMAL: All parameters within safe ranges")
        recommendations.append("Maintain current performance level")

    return alerts, recommendations
