from flask import Blueprint, request, jsonify
from ..config import db
from ..models.sensor_data import SensorData
from ..utils.auth import token_required
from datetime import date

sensor_data_bp = Blueprint('sensor_data_bp', __name__)


# CREATE
@sensor_data_bp.route('/', methods=['POST'])
@token_required
def create_sensor_data(current_user):
    data = request.get_json()

    try:
        new_data = SensorData(
            session_id=data['session_id'],
            body_temperature=data['body_temperature'],
            ambient_temperature=data['ambient_temperature'],
            heart_rate=data['heart_rate'],
            joint_angles=data['joint_angles'],
            gait_speed=data['gait_speed'],
            cadence=data['cadence'],
            step_count=data['step_count'],
            jump_height=data['jump_height'],
            ground_reaction_force=data['ground_reaction_force'],
            range_of_motion=data['range_of_motion'],
            created_on=date.today(),
            created_by=current_user.name
        )

        db.session.add(new_data)
        db.session.commit()

        return jsonify({'message': 'Sensor Data created successfully', 'id': new_data.id}), 201
    except KeyError as e:
        return jsonify({'error': f'Missing field: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# READ ALL
@sensor_data_bp.route('/', methods=['GET'])
@token_required
def get_all_sensor_data(current_user):
    session_id = request.args.get('session_id')

    # Ensure not deleted
    existing_sensor_data = SensorData.query.filter(SensorData.deleted_on.is_(None))

    # Filter by session_id (if provided)
    if session_id:
        data_list = existing_sensor_data.filter_by(session_id=session_id).all()
    else:
        data_list = existing_sensor_data.all()

    result = []
    for d in data_list:
        result.append({
            'id': d.id,
            'session_id': d.session_id,
            'heart_rate': d.heart_rate,
            'step_count': d.step_count
            # Add other summary fields as needed
        })
    return jsonify(result), 200


# READ ONE
@sensor_data_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_sensor_data_entry(current_user, id):
    # Use filter_by with deleted_on=None
    d = SensorData.query.filter_by(id=id, deleted_on=None).first_or_404()
    return jsonify({
        'id': d.id,
        'session_id': d.session_id,
        'body_temperature': d.body_temperature,
        'ambient_temperature': d.ambient_temperature,
        'heart_rate': d.heart_rate,
        'joint_angles': d.joint_angles,
        'gait_speed': d.gait_speed,
        'cadence': d.cadence,
        'step_count': d.step_count,
        'jump_height': d.jump_height,
        'ground_reaction_force': d.ground_reaction_force,
        'range_of_motion': d.range_of_motion,
        'created_on': str(d.created_on)
    }), 200


# UPDATE
@sensor_data_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_sensor_data(current_user, id):
    # Use filter_by with deleted_on=None
    d = SensorData.query.filter_by(id=id, deleted_on=None).first_or_404()
    data = request.get_json()

    try:
        # Loop through allow-listed fields to update
        fields = ['body_temperature', 'ambient_temperature', 'heart_rate',
                  'joint_angles', 'gait_speed', 'cadence', 'step_count',
                  'jump_height', 'ground_reaction_force', 'range_of_motion']

        for field in fields:
            if field in data:
                setattr(d, field, data[field])

        d.updated_on = date.today()
        d.updated_by = current_user.name

        db.session.commit()
        return jsonify({'message': 'Sensor Data updated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400


# DELETE
@sensor_data_bp.route('/<int:id>', methods=['DELETE'])
@token_required
def delete_sensor_data(current_user, id):
    # Find existing, non-deleted record
    d = SensorData.query.filter_by(id=id, deleted_on=None).first_or_404()
    try:
        # Soft delete
        d.deleted_on = date.today()
        d.deleted_by = current_user.name

        db.session.commit()
        return jsonify({'message': 'Sensor Data deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400