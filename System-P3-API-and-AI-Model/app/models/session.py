from ..config import db
from .audit_base import AuditBase


class Session(AuditBase):
    __tablename__ = 'session'

    id = db.Column(db.Integer, primary_key=True)

    # Foreign Keys
    athlete_id = db.Column(db.Integer, db.ForeignKey('athlete.id'), nullable=False)
    coach_id = db.Column(db.Integer, db.ForeignKey('coach.id'), nullable=False)

    # Relationships using string references to avoid circular imports
    # Note: "Athlete" and "Coach" are strings here too, which is safer
    athlete = db.relationship("Athlete", back_populates="sessions")
    coach = db.relationship("Coach", back_populates="sessions")

    # The problematic relationship: changed to string reference
    sensor_data = db.relationship("SensorData", back_populates="session", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Session {self.id} - Athlete: {self.athlete_id}>"