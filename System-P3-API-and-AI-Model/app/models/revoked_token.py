from ..config import db
from .audit_base import AuditBase


class RevokedToken(AuditBase):
    __tablename__ = 'revoked_token'

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(500), unique=True, nullable=False)

    def __repr__(self):
        return f"<RevokedToken {self.id}>"