from flask import Flask
from flask_cors import CORS
import os


def create_app():
    app = Flask(__name__)

    # Enable CORS for mobile app communication
    CORS(app)

    # Load configuration
    app.config.from_pyfile('config.py')

    # Register blueprints/routes
    from app.routes import prediction, device_management, alert_handling

    app.register_blueprint(prediction.bp)
    app.register_blueprint(device_management.bp)
    app.register_blueprint(alert_handling.bp)

    return app