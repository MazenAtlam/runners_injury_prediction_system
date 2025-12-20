#!/usr/bin/env python3
"""
Create a proper mock model using standard scikit-learn models
"""

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler


def create_standard_mock_model():
    print("Creating standard mock model...")

    # Create synthetic training data
    np.random.seed(42)
    n_samples = 1000

    # Generate realistic data for 10 features
    X = np.random.randn(n_samples, 10)

    # Create labels: 0=Healthy, 1=Low Risk, 2=Injured
    # Base risk on heart rate (feature index 2) and step count (feature index 6)
    y = np.zeros(n_samples, dtype=int)
    for i in range(n_samples):
        heart_rate = X[i, 2] * 20 + 70  # Scale to realistic HR
        step_count = X[i, 6] * 1000 + 2000  # Scale to realistic steps

        if heart_rate < 80 and step_count > 2500:
            y[i] = 0  # Healthy
        elif heart_rate < 100:
            y[i] = 1  # Low Risk
        else:
            y[i] = 2  # Injured

    # Create and train a standard model
    model = RandomForestClassifier(
        n_estimators=50,
        max_depth=10,
        random_state=42
    )

    # Fit the model
    model.fit(X, y)

    # Create a scaler (optional)
    scaler = StandardScaler()
    scaler.fit(X)

    # Save model and scaler
    model_path = '../app/ai_classification_models/standard_runners_model.pkl'
    scaler_path = '../app/ai_classification_models/standard_scaler.pkl'

    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    print(f"✅ Model saved as: {model_path}")
    print(f"✅ Scaler saved as: {scaler_path}")
    print(f"   Model classes: {model.classes_}")
    print(f"   Training accuracy: {model.score(X, y):.2f}")

    # Test with a sample
    sample = np.array([[37.2, 22.5, 72, 45.0, 1.5, 160, 1000, 0.5, 800.0, 90.0]])
    prediction = model.predict(sample)
    probabilities = model.predict_proba(sample)

    print(f"\nSample prediction:")
    print(f"  Input: {sample[0]}")
    print(f"  Prediction: {prediction[0]}")
    print(f"  Probabilities: {probabilities[0]}")

    return model_path, scaler_path


if __name__ == "__main__":
    create_standard_mock_model()