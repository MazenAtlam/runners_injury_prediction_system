import os
from datetime import timedelta
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail

load_dotenv()

# Initialize the database instance directly here
db = SQLAlchemy()
migrate = Migrate()

# Initialize Mail
mail = Mail()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'hf-space-secret-key-change-me')

    # API settings
    API_TITLE = os.environ.get('API_TITLE', 'Title Not Found')
    API_VERSION = os.environ.get('API_VERSION', 'v0.0')

    # Model settings
    MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ai_classification_models', 'runners_injury_prediction_model.pkl')

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

    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///runners.db')

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Flask-Migrate configuration
    MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), 'migrations')

    # Mail Configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.googlemail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', '587'))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') is not None
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')

    # Frontend URL for Reset Links
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:8081')

    # JWT Settings
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)