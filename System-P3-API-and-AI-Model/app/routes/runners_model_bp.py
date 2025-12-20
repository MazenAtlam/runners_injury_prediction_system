import numpy as np
from flask import Blueprint, request, jsonify
from ..utils.load_runners_model import load_runners_model, model_state
from ..utils.generate_alert import generate_alert
from ..utils.auth import token_required

runners_model_bp = Blueprint('runners_model_bp', __name__)

# Attempt to load immediately
load_runners_model()


@runners_model_bp.route('/predict', methods=['POST'])
@token_required
def predict(current_user):
    # Reload if needed
    if model_state['status'] != 'Loaded':
        load_runners_model()

    # Check status again
    if model_state['status'] != 'Loaded':
        return jsonify({
            'error': 'AI Model is not available on the server.',
            'details': model_state['error'],
            'status': model_state['status']
        }), 500

    data = request.get_json(force=True)

    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    # Determine required features
    if model_state['feature_names']:
        required_features = model_state['feature_names']
    else:
        # Fallback order matches notebook
        required_features = [
            'heart_rate',
            'body_temperature',
            'joint_angles',
            'gait_speed',
            'cadence',
            'step_count',
            'jump_height',
            'ground_reaction_force',
            'range_of_motion',
            'ambient_temperature'
        ]

    # Features that must physically be non-negative
    # ambient_temperature is excluded as it can be negative in winter conditions
    non_negative_features = [
        'heart_rate',
        'body_temperature',
        'joint_angles',
        'gait_speed',
        'cadence',
        'step_count',
        'jump_height',
        'ground_reaction_force',
        'range_of_motion'
    ]

    try:
        features_list = []
        input_data_for_alerts = {}

        for feature in required_features:
            value = data.get(feature)
            # Handle naming mismatch
            if value is None and feature == 'joint_angles':
                value = data.get('joint_angle')

            if value is None:
                return jsonify({'error': f'Missing required feature: {feature}'}), 400

            parsed_val = float(value)
            if feature == 'step_count':
                parsed_val = int(value)

            # Ensure value is not negative
            if feature in non_negative_features and parsed_val < 0:
                return jsonify({'error': f'Invalid value for {feature}: must be non-negative.'}), 400

            features_list.append(parsed_val)
            input_data_for_alerts[feature] = parsed_val

        input_vector = np.array([features_list])

        if model_state['scaler']:
            input_vector = model_state['scaler'].transform(input_vector)

        model = model_state['model']
        prediction = model.predict(input_vector)[0]
        risk_level = int(prediction)

        probabilities = []
        confidence = 0.0

        if hasattr(model, 'predict_proba'):
            probs_array = model.predict_proba(input_vector)[0]
            probabilities = [round(float(p), 4) for p in probs_array]
            confidence = probabilities[risk_level]

        alerts, recommendations = generate_alert(risk_level, probabilities, input_data_for_alerts)

        labels = {0: "Healthy", 1: "Low Risk", 2: "Injured"}

        response = {
            "risk_level": risk_level,
            "risk_label": labels.get(risk_level, "Unknown"),
            "confidence": confidence,
            "probabilities": probabilities,
            "alerts": alerts,
            "recommendations": recommendations
        }

        return jsonify(response), 200

    except Exception as e:
        return jsonify({'error': f'Prediction logic error: {str(e)}'}), 500
