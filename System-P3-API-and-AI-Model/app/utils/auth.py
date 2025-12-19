from flask import request, jsonify, current_app
from ..models.person import Person
from ..models.revoked_token import RevokedToken
import jwt
from functools import wraps


def token_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):
        token = None

        # Check if token is in headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
            else:
                token = auth_header

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        # Check if token is revoked
        if RevokedToken.query.filter_by(token=token).first():
            return jsonify({'error': 'Token has been revoked (User logged out)'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            # Ensure the user itself isn't deleted (soft deleted users shouldn't have access)
            current_user = Person.query.filter_by(id=data['user_id'], deleted_on=None).first()
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'error': f'Token error: {str(e)}'}), 401

        return f(current_user, *args, **kwargs)

    return decorator