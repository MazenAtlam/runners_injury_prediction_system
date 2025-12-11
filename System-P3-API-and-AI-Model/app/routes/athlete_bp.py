from flask import Blueprint, request, jsonify
from ..config import db
from ..models.athlete import Athlete
from datetime import date

athlete_bp = Blueprint('athlete_bp', __name__)


# CREATE
@athlete_bp.route('/', methods=['POST'])
def create_athlete():
    data = request.get_json()

    try:
        new_athlete = Athlete(
            name=data['name'],
            email=data['email'],
            password=data['password'],  # In a real app, hash this!
            coach_id=data.get('coach_id'),
            created_on=date.today(),
            created_by=data.get('created_by', 'API_USER')
        )

        db.session.add(new_athlete)
        db.session.commit()

        return jsonify({'message': 'Athlete created successfully', 'id': new_athlete.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# READ ALL
@athlete_bp.route('/', methods=['GET'])
def get_athletes():
    athletes = Athlete.query.all()
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
def get_athlete(id):
    athlete = Athlete.query.get_or_404(id)
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
def update_athlete(id):
    athlete = Athlete.query.get_or_404(id)
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
        athlete.updated_by = data.get('updated_by', 'API_USER')

        db.session.commit()
        return jsonify({'message': 'Athlete updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# DELETE
@athlete_bp.route('/<int:id>', methods=['DELETE'])
def delete_athlete(id):
    athlete = Athlete.query.get_or_404(id)
    try:
        db.session.delete(athlete)
        db.session.commit()
        return jsonify({'message': 'Athlete deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400