from flask import Flask, jsonify
from flask_cors import CORS
from .config import Config, db, migrate, mail
from .routes.user_bp import user_bp
from .routes.coach_bp import coach_bp
from .routes.athlete_bp import athlete_bp
from .routes.session_bp import session_bp
from .routes.sensor_data_bp import sensor_data_bp
from .routes.runners_model_bp import runners_model_bp

API_V1_BASE_URL = '/api/v1.0'

def create_app(config_class=Config):
    app = Flask(__name__)

    # Enable CORS for mobile app communication
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Load configuration
    app.config.from_object(config_class)

    # Ensure SECRET_KEY is set for JWT
    if not app.config.get('SECRET_KEY'):
        app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'

    # Initialize Flask Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)

    # --- Register Blueprints (API Modules) ---
    app.register_blueprint(user_bp, url_prefix=f'{API_V1_BASE_URL}/user')
    app.register_blueprint(coach_bp, url_prefix=f'{API_V1_BASE_URL}/coach')
    app.register_blueprint(athlete_bp, url_prefix=f'{API_V1_BASE_URL}/athlete')
    app.register_blueprint(session_bp, url_prefix=f'{API_V1_BASE_URL}/session')
    app.register_blueprint(sensor_data_bp, url_prefix=f'{API_V1_BASE_URL}/sensor_data')
    app.register_blueprint(runners_model_bp, url_prefix=f'{API_V1_BASE_URL}/runners_model')

    # --- Root Route ---
    @app.route('/')
    def index():
        return "Runners Injury Prediction System (RIPS) Backend Running! Connect your client to /api/v1.0/..."

    # --- Health Check Route ---
    @app.route('/health')
    def health():
        return jsonify({'status': 'health'}), 200

    # --- Global Error Handler ---
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    # Create database tables if they don't exist
    with app.app_context():
        from .models.audit_base import AuditBase
        from .models.person import Person
        from .models.coach import Coach
        from .models.athlete import Athlete
        from .models.session import Session
        from .models.sensor_data import SensorData
        from .models.revoked_token import RevokedToken

        db.create_all()

    return app