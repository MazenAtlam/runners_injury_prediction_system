from ..config import db
from .person import Person


class Athlete(Person):
    __tablename__ = 'athlete'

    # Linked to Person ID (Joined Table Inheritance)
    id = db.Column(db.Integer, db.ForeignKey('person.id'), primary_key=True)

    # Specific fields for Athlete
    coach_id = db.Column(db.Integer, db.ForeignKey('coach.id'), nullable=True)

    # Relationships (String reference)
    coach = db.relationship(
        "Coach",
        back_populates="athletes",
        foreign_keys=[coach_id]
    )

    sessions = db.relationship(
        "Session",
        back_populates="athlete",
        cascade="all, delete-orphan",
        foreign_keys="Session.athlete_id"
    )

    __mapper_args__ = {
        'polymorphic_identity': 'athlete',
    }

    def __repr__(self):
        return f"<Athlete {self.name}>"