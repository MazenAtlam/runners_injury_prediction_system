from flask import Blueprint, request, jsonify
from ..config import db
from ..models.coach import Coach
from ..utils.auth import token_required
from datetime import date
from werkzeug.security import generate_password_hash

coach_bp = Blueprint('coach_bp', __name__)


# CREATE
@coach_bp.route('/', methods=['POST'])
@token_required
def create_coach(current_user):
    data = request.get_json()

    try:
        hashed_password = generate_password_hash(data['password'])

        new_coach = Coach(
            name=data['name'],
            email=data['email'],
            password=hashed_password,
            created_on=date.today(),
            created_by=current_user.name
        )

        db.session.add(new_coach)
        db.session.commit()

        return jsonify({'message': 'Coach created successfully', 'id': new_coach.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# READ ALL
@coach_bp.route('/', methods=['GET'])
@token_required
def get_coaches(current_user):
    # Filter out deleted coaches
    coaches = Coach.query.filter(Coach.deleted_on.is_(None)).all()
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
@token_required
def get_coach(current_user, id):
    # Use filter_by with deleted_on=None
    coach = Coach.query.filter_by(id=id, deleted_on=None).first_or_404()
    return jsonify({
        'id': coach.id,
        'name': coach.name,
        'email': coach.email,
        'created_on': str(coach.created_on),
        'created_by': coach.created_by
    }), 200


# UPDATE
@coach_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_coach(current_user, id):
    # Use filter_by with deleted_on=None
    coach = Coach.query.filter_by(id=id, deleted_on=None).first_or_404()
    data = request.get_json()

    try:
        if 'name' in data:
            coach.name = data['name']
        if 'email' in data:
            coach.email = data['email']

        coach.updated_on = date.today()
        coach.updated_by = current_user.name

        db.session.commit()
        return jsonify({'message': 'Coach updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# DELETE
@coach_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_coach(current_user, id):
    # Find existing, non-deleted coach
    coach = Coach.query.filter_by(id=id, deleted_on=None).first_or_404()
    try:
        # Soft delete
        coach.deleted_on = date.today()
        coach.deleted_by = current_user.name

        db.session.commit()
        return jsonify({'message': 'Coach deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400