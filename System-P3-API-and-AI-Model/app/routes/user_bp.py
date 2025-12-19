from flask import Blueprint, request, jsonify, current_app, url_for
from ..config import db, mail
from ..models.person import Person
from ..models.athlete import Athlete
from ..models.coach import Coach
from ..models.revoked_token import RevokedToken
from ..utils.auth import token_required
from datetime import date, datetime, timedelta
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from flask_mail import Message

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


@user_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    if not data or 'email' not in data:
        return jsonify({'error': 'Email is required'}), 400

    email = data['email']
    # Check if user exists and is not deleted
    user = Person.query.filter_by(email=email, deleted_on=None).first()

    # Always return success message to prevent email enumeration
    if not user:
        return jsonify({'message': 'If an account with that email exists, a password reset link has been sent.'}), 200

    try:
        # Generate a reset token (valid for 30 minutes)
        token = jwt.encode({
            'user_id': user.id,
            'type': 'reset',
            'exp': datetime.utcnow() + timedelta(minutes=30)
        }, current_app.config['SECRET_KEY'], algorithm="HS256")

        # Construct reset URL (Deep link or Web URL)
        frontend_url = current_app.config['FRONTEND_URL']
        reset_link = f"{frontend_url}/reset-password?token={token}"

        # Send Email
        msg = Message("Password Reset Request - Runners App",
                      sender=current_app.config['MAIL_DEFAULT_SENDER'],
                      recipients=[email])
        msg.body = f"""Hello {user.name},

You requested a password reset. Please click the link below to reset your password:

{reset_link}

This link will expire in 30 minutes.

If you did not request this, please ignore this email.
"""
        mail.send(msg)

        return jsonify({'message': 'If an account with that email exists, a password reset link has been sent.'}), 200

    except Exception as e:
        return jsonify({'error': f'Failed to send email: {str(e)}'}), 500


@user_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    token = data.get('token')
    new_password = data.get('new_password')

    if not token or not new_password:
        return jsonify({'error': 'Token and new password are required'}), 400

    try:
        # Decode token
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])

        # Verify token type
        if payload.get('type') != 'reset':
            return jsonify({'error': 'Invalid token type'}), 400

        user = Person.query.filter_by(id=payload['user_id'], deleted_on=None).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Update password
        user.password = generate_password_hash(new_password)
        user.updated_on = date.today()
        user.updated_by = 'PASSWORD_RESET'

        db.session.commit()

        return jsonify({'message': 'Password has been reset successfully. Please login with your new password.'}), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Reset link has expired. Please request a new one.'}), 400
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid reset link.'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500