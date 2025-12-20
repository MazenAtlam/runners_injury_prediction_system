import sys
import os

# Get the absolute path to the project root
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)  # Gets System-P3-API-and-AI-Model
sys.path.insert(0, parent_dir)  # Add parent directory to Python path

# Import app and create it
from app import create_app
from app.config import db

app = create_app()

with app.app_context():
    print("=" * 60)
    print("CHECKING MODEL REGISTRATION")
    print("=" * 60)

    # Method 1: Check metadata
    print("\n1. Tables in SQLAlchemy metadata:")
    for table_name in db.metadata.tables:
        print(f"   - {table_name}")

    # Method 2: Try to get all models
    print("\n2. Attempting to get model classes:")
    try:
        # This works for SQLAlchemy 2.0+
        for mapper in db.Model.registry.mappers:
            print(f"   - {mapper.class_.__name__} -> {mapper.class_.__tablename__}")
    except AttributeError:
        print("   Could not access registry.mappers")

    # Method 3: Check if we can create tables
    print("\n3. Testing table creation:")
    try:
        db.create_all()
        print("   ✓ db.create_all() succeeded")
    except Exception as e:
        print(f"   ✗ Error: {e}")

    # Method 4: Check actual database
    print("\n4. Checking actual database:")
    from sqlalchemy import inspect

    inspector = inspect(db.engine)
    existing_tables = inspector.get_table_names()
    print(f"   Tables in database: {existing_tables}")

    print("\n" + "=" * 60)