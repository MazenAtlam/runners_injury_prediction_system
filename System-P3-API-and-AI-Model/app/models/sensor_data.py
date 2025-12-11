from ..config import db
from .audit_base import AuditBase

class SensorData(AuditBase):
    __tablename__ = 'sensor_data'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'), nullable=False)

    # Biometric and Environmental Data
    body_temperature = db.Column(db.Float, nullable=False)
    ambient_temperature = db.Column(db.Float, nullable=False)
    heart_rate = db.Column(db.Float, nullable=False)
    joint_angle = db.Column(db.Float, nullable=False)
    gait_speed = db.Column(db.Float, nullable=False)
    cadence = db.Column(db.Float, nullable=False)
    step_count = db.Column(db.Integer, nullable=False)
    jump_height = db.Column(db.Float, nullable=False)
    ground_reaction_force = db.Column(db.Float, nullable=False)
    range_of_motion = db.Column(db.Float, nullable=False)

    # Relationship using string reference to avoid circular import
    session = db.relationship("Session", back_populates="sensor_data")

    def __repr__(self):
        return f"<SensorData {self.id}>"