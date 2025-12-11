from ..config import db
from .audit_base import AuditBase


class Person(AuditBase, db.Model):
    __tablename__ = 'person'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    type = db.Column(db.String(50))  # Discriminator column for Polymorphism

    __mapper_args__ = {
        'polymorphic_identity': 'person',
        'polymorphic_on': type
    }

    def __repr__(self):
        return f"<Person {self.name}>"