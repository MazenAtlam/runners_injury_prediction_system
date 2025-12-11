from ..config import db
from .audit_base import AuditBase


class Session(AuditBase):
    __tablename__ = 'session'

    id = db.Column(db.Integer, primary_key=True)

    # Foreign Keys
    athlete_id = db.Column(db.Integer, db.ForeignKey('athlete.id'), nullable=False)
    coach_id = db.Column(db.Integer, db.ForeignKey('coach.id'), nullable=False)

    # Relationships using string references
    athlete = db.relationship(
        "Athlete",
        back_populates="sessions",
        foreign_keys=[athlete_id]
    )

    coach = db.relationship(
        "Coach",
        back_populates="sessions",
        foreign_keys=[coach_id]
    )

    # The problematic relationship: changed to string reference
    sensor_data = db.relationship(
        "SensorData",
        back_populates="session",
        cascade="all, delete-orphan",
        foreign_keys="SensorData.session_id"
    )

    def __repr__(self):
        return f"<Session {self.id} - Athlete: {self.athlete_id}>"