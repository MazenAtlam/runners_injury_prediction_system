from ..config import db

class AuditBase(db.Model):
    """
    Abstract base class providing audit trail fields for all entities.
    """
    __abstract__ = True

    created_on = db.Column(db.Date, nullable=False)
    created_by = db.Column(db.String(100), nullable=False)
    updated_on = db.Column(db.Date, nullable=True)
    updated_by = db.Column(db.String(100), nullable=True)
    deleted_on = db.Column(db.Date, nullable=True)
    deleted_by = db.Column(db.String(100), nullable=True)