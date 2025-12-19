from ..config import db
from .person import Person


class Coach(Person):
    __tablename__ = 'coach'

    # Linked to Person ID (Joined Table Inheritance)
    id = db.Column(db.Integer, db.ForeignKey('person.id'), primary_key=True)

    # Relationships (String reference)
    athletes = db.relationship(
        "Athlete",
        back_populates="coach",
        cascade="all",
        foreign_keys="Athlete.coach_id"
    )

    sessions = db.relationship(
        "Session",
        back_populates="coach",
        cascade="all, delete-orphan",
        foreign_keys="Session.coach_id"
    )

    __mapper_args__ = {
        'polymorphic_identity': 'coach',
    }

    def __repr__(self):
        return f"<Coach {self.name}>"