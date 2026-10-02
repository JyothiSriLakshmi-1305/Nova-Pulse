from flask import Blueprint, jsonify, request
from backend.services.retention_service import RetentionService

retention_bp = Blueprint('retention', __name__, url_prefix='/api/retention')

@retention_bp.route('/profile', methods=['GET'])
def get_profile():
    customer_name = request.args.get('customer_name', 'Kavita Iyer')
    profile = RetentionService.get_or_create_profile(customer_name)
    return jsonify({"success": True, "profile": profile})

@retention_bp.route('/advance', methods=['POST'])
def advance_profile():
    data = request.get_json() or {}
    customer_name = data.get('customer_name', 'Kavita Iyer')
    updated = RetentionService.increment_order_progress(customer_name)
    return jsonify({"success": True, "profile": updated})
