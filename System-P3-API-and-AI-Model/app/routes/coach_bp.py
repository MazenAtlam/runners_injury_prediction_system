from flask import Blueprint, request, jsonify
from ..config import db
from ..models.coach import Coach
from datetime import date

coach_bp = Blueprint('coach_bp', __name__)


# CREATE
@coach_bp.route('/', methods=['POST'])
def create_coach():
    data = request.get_json()

    try:
        new_coach = Coach(
            name=data['name'],
            email=data['email'],
            password=data['password'],
            created_on=date.today(),
            created_by=data.get('created_by', 'API_USER')
        )

        db.session.add(new_coach)
        db.session.commit()

        return jsonify({'message': 'Coach created successfully', 'id': new_coach.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# READ ALL
@coach_bp.route('/', methods=['GET'])
def get_coaches():
    coaches = Coach.query.all()
    result = []
    for coach in coaches:
        result.append({
            'id': coach.id,
            'name': coach.name,
            'email': coach.email,
            'type': coach.type
        })
    return jsonify(result), 200


# READ ONE
@coach_bp.route('/<int:id>', methods=['GET'])
def get_coach(id):
    coach = Coach.query.get_or_404(id)
    return jsonify({
        'id': coach.id,
        'name': coach.name,
        'email': coach.email,
        'created_on': str(coach.created_on),
        'created_by': coach.created_by
    }), 200


# UPDATE
@coach_bp.route('/<int:id>', methods=['PUT'])
def update_coach(id):
    coach = Coach.query.get_or_404(id)
    data = request.get_json()

    try:
        if 'name' in data:
            coach.name = data['name']
        if 'email' in data:
            coach.email = data['email']

        coach.updated_on = date.today()
        coach.updated_by = data.get('updated_by', 'API_USER')

        db.session.commit()
        return jsonify({'message': 'Coach updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# DELETE
@coach_bp.route('/<int:id>', methods=['DELETE'])
def delete_coach(id):
    coach = Coach.query.get_or_404(id)
    try:
        db.session.delete(coach)
        db.session.commit()
        return jsonify({'message': 'Coach deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400