from flask import Blueprint, request, jsonify
from ..config import db
from ..models.session import Session
from datetime import date

session_bp = Blueprint('session_bp', __name__)


# CREATE
@session_bp.route('/', methods=['POST'])
def create_session():
    data = request.get_json()

    try:
        new_session = Session(
            athlete_id=data['athlete_id'],
            coach_id=data['coach_id'],
            created_on=date.today(),
            created_by=data.get('created_by', 'API_USER')
        )

        db.session.add(new_session)
        db.session.commit()

        return jsonify({'message': 'Session created successfully', 'id': new_session.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# READ ALL
@session_bp.route('/', methods=['GET'])
def get_sessions():
    sessions = Session.query.all()
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
def get_session(id):
    s = Session.query.get_or_404(id)
    return jsonify({
        'id': s.id,
        'athlete_id': s.athlete_id,
        'coach_id': s.coach_id,
        'created_on': str(s.created_on),
        'created_by': s.created_by
    }), 200


# UPDATE
@session_bp.route('/<int:id>', methods=['PUT'])
def update_session(id):
    s = Session.query.get_or_404(id)
    data = request.get_json()

    try:
        if 'athlete_id' in data:
            s.athlete_id = data['athlete_id']
        if 'coach_id' in data:
            s.coach_id = data['coach_id']

        s.updated_on = date.today()
        s.updated_by = data.get('updated_by', 'API_USER')

        db.session.commit()
        return jsonify({'message': 'Session updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# DELETE
@session_bp.route('/<int:id>', methods=['DELETE'])
def delete_session(id):
    s = Session.query.get_or_404(id)
    try:
        db.session.delete(s)
        db.session.commit()
        return jsonify({'message': 'Session deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400