from flask import Flask
from flask_cors import CORS
from .config import Config, db, migrate


def create_app(config_class=Config):
    app = Flask(__name__)

    # Enable CORS for mobile app communication
    CORS(app)

    # Load configuration
    app.config.from_object(config_class)

    # Initialize Flask Extensions
    db.init_app(app)
    migrate.init_app(app, db)


    # Create database tables if they don't exist
    with app.app_context():
        from .models.audit_base import AuditBase
        from .models.person import Person
        from .models.coach import Coach
        from .models.athlete import Athlete
        from .models.session import Session
        from .models.sensor_data import SensorData

        db.create_all()

        print(f"✓ Database tables ready")
        print(f"✓ Metadata tables: {list(db.metadata.tables.keys())}")

    return app