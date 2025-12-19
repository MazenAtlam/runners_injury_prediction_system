from flask import Blueprint, request, jsonify, current_app
from ..config import db
from ..models.person import Person
from ..models.athlete import Athlete
from ..models.coach import Coach
from ..models.revoked_token import RevokedToken
from ..utils.auth import token_required
from datetime import date, datetime, timedelta
import jwt
from werkzeug.security import generate_password_hash, check_password_hash

user_bp = Blueprint('user_bp', __name__)


@user_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Basic Validation
    if not data:
        return jsonify({'error': 'No input data provided'}), 400

    required_fields = ['email', 'password', 'type', 'name']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # Check if email already exists
    if Person.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400

    user_type = data['type'].lower()
    created_by = data.get('created_by', 'REGISTRATION_API')
    hashed_password = generate_password_hash(data['password'])

    try:
        new_user = None

        if user_type == 'athlete':
            # Handle Athlete specific fields
            coach_id = data.get('coach_id')
            # Verify coach exists if ID is provided (and check it's not deleted)
            if coach_id:
                if not Coach.query.filter_by(id=coach_id, deleted_on=None).first():
                    return jsonify({'error': f'Coach with id {coach_id} not found'}), 404

            new_user = Athlete(
                name=data['name'],
                email=data['email'],
                password=hashed_password,
                coach_id=coach_id,
                created_on=date.today(),
                created_by=created_by
            )

        elif user_type == 'coach':
            new_user = Coach(
                name=data['name'],
                email=data['email'],
                password=hashed_password,
                created_on=date.today(),
                created_by=created_by
            )
        else:
            return jsonify({'error': 'Invalid user type. Must be "athlete" or "coach".'}), 400

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'message': f'{user_type.capitalize()} registered successfully',
            'id': new_user.id,
            'type': user_type,
            'email': new_user.email
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    # Polymorphic query - will find either Athlete or Coach
    user = Person.query.filter_by(email=data['email'], deleted_on=None).first()

    # Check if user exists and password hash matches
    if user and check_password_hash(user.password, data['password']):
        # Generate JWT Token
        token = jwt.encode({
            'user_id': user.id,
            'email': user.email,
            'type': user.type,
            'exp': datetime.utcnow() + timedelta(hours=24)  # Token expires in 24 hours
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        # Construct response based on user type
        response = {
            'message': 'Login successful',
            'token': token,
            'id': user.id,
            'name': user.name,
            'type': user.type,  # 'athlete' or 'coach'
            'email': user.email
        }

        if user.type == 'athlete':
            response['coach_id'] = getattr(user, 'coach_id', None)

        return jsonify(response), 200
    else:
        return jsonify({'error': 'Invalid email or password'}), 401


@user_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    # Extract token from header to revoke it
    token = None
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            token = auth_header

    if token:
        try:
            # Add token to blacklist
            revoked_token = RevokedToken(
                token=token,
                created_on=date.today(),
                created_by=current_user.email
            )
            db.session.add(revoked_token)
            db.session.commit()
            return jsonify({'message': 'Successfully logged out'}), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    return jsonify({'error': 'Token not provided'}), 400