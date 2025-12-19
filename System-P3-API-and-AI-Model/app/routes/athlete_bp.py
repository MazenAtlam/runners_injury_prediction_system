from flask import Blueprint, request, jsonify
from ..config import db
from ..models.athlete import Athlete
from ..utils.auth import token_required
from datetime import date
from werkzeug.security import generate_password_hash

athlete_bp = Blueprint('athlete_bp', __name__)


# CREATE
@athlete_bp.route('/', methods=['POST'])
@token_required
def create_athlete(current_user):
    data = request.get_json()

    try:
        hashed_password = generate_password_hash(data['password'])

        new_athlete = Athlete(
            name=data['name'],
            email=data['email'],
            password=hashed_password,
            coach_id=data.get('coach_id'),
            created_on=date.today(),
            created_by=current_user.name
        )

        db.session.add(new_athlete)
        db.session.commit()

        return jsonify({'message': 'Athlete created successfully', 'id': new_athlete.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# READ ALL
@athlete_bp.route('/', methods=['GET'])
@token_required
def get_athletes(current_user):
    # Filter out deleted athletes
    athletes = Athlete.query.filter(Athlete.deleted_on.is_(None)).all()
    result = []
    for athlete in athletes:
        result.append({
            'id': athlete.id,
            'name': athlete.name,
            'email': athlete.email,
            'coach_id': athlete.coach_id,
            'type': athlete.type
        })
    return jsonify(result), 200


# READ ONE
@athlete_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_athlete(current_user, id):
    # Use filter_by with deleted_on=None
    athlete = Athlete.query.filter_by(id=id, deleted_on=None).first_or_404()
    return jsonify({
        'id': athlete.id,
        'name': athlete.name,
        'email': athlete.email,
        'coach_id': athlete.coach_id,
        'created_on': str(athlete.created_on),
        'created_by': athlete.created_by
    }), 200


# UPDATE
@athlete_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_athlete(current_user, id):
    # Use filter_by with deleted_on=None
    athlete = Athlete.query.filter_by(id=id, deleted_on=None).first_or_404()
    data = request.get_json()

    try:
        if 'name' in data:
            athlete.name = data['name']
        if 'email' in data:
            athlete.email = data['email']
        if 'coach_id' in data:
            athlete.coach_id = data['coach_id']

        # Audit update fields
        athlete.updated_on = date.today()
        athlete.updated_by = current_user.name

        db.session.commit()
        return jsonify({'message': 'Athlete updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# DELETE
@athlete_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_athlete(current_user, id):
    # Find existing, non-deleted athlete
    athlete = Athlete.query.filter_by(id=id, deleted_on=None).first_or_404()
    try:
        # Soft delete: update fields instead of removing record
        athlete.deleted_on = date.today()
        athlete.deleted_by = current_user.name

        db.session.commit()
        return jsonify({'message': 'Athlete deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400