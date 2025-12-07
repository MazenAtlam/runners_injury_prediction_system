import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

    # API settings
    API_TITLE = os.environ.get('API_TITLE', 'Title Not Found')
    API_VERSION = os.environ.get('API_VERSION', 'v0.0')

    # Model settings
    MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ai_classification_models', 'injury_prediction_model.pkl')

    # Alert settings
    ALERT_THRESHOLDS = {
        'high_confidence': 0.78,
        'medium_confidence': 0.50,
        'low_confidence': 0.45
    }

    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

    # Data validation
    FEATURE_RANGES = {
        'heart_rate': (40, 180),
        'body_temperature': (35.8, 39.2),
        'joint_angles': (45, 175),
        'gait_speed': (0.8, 3.5),
        'cadence': (50, 280),
        'step_count': (2000, 15000),
        'jump_height': (0.15, 0.85),
        'ground_reaction_force': (800, 2800),
        'range_of_motion': (60, 180),
        'ambient_temperature': (15, 38)
    }