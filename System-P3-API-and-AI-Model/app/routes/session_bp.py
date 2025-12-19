from flask import Blueprint, request, jsonify
from ..config import db
from ..models.session import Session
from ..utils.auth import token_required
from datetime import date

session_bp = Blueprint('session_bp', __name__)


# CREATE
@session_bp.route('/', methods=['POST'])
@token_required
def create_session(current_user):
    data = request.get_json()

    try:
        new_session = Session(
            athlete_id=data['athlete_id'],
            coach_id=data['coach_id'],
            created_on=date.today(),
            created_by=current_user.name
        )

        db.session.add(new_session)
        db.session.commit()

        return jsonify({'message': 'Session created successfully', 'id': new_session.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# READ ALL
@session_bp.route('/', methods=['GET'])
@token_required
def get_sessions(current_user):
    # Filter out deleted sessions
    sessions = Session.query.filter(Session.deleted_on.is_(None)).all()
    result = []
    for s in sessions:
        result.append({
            'id': s.id,
            'athlete_id': s.athlete_id,
            'coach_id': s.coach_id,
            'date': str(s.created_on)
        })
    return jsonify(result), 200


# READ ONE
@session_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_session(current_user, id):
    # Use filter_by with deleted_on=None
    s = Session.query.filter_by(id=id, deleted_on=None).first_or_404()
    return jsonify({
        'id': s.id,
        'athlete_id': s.athlete_id,
        'coach_id': s.coach_id,
        'created_on': str(s.created_on),
        'created_by': s.created_by
    }), 200


# UPDATE
@session_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_session(current_user, id):
    # Use filter_by with deleted_on=None
    s = Session.query.filter_by(id=id, deleted_on=None).first_or_404()
    data = request.get_json()

    try:
        if 'athlete_id' in data:
            s.athlete_id = data['athlete_id']
        if 'coach_id' in data:
            s.coach_id = data['coach_id']

        s.updated_on = date.today()
        s.updated_by = current_user.name

        db.session.commit()
        return jsonify({'message': 'Session updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# DELETE
@session_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_session(current_user, id):
    # Find existing, non-deleted session
    s = Session.query.filter_by(id=id, deleted_on=None).first_or_404()
    try:
        # Soft delete
        s.deleted_on = date.today()
        s.deleted_by = current_user.name

        db.session.commit()
        return jsonify({'message': 'Session deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400