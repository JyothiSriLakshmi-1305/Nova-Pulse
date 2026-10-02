import logging
from flask import Blueprint, jsonify, request
from backend.config import Config
from backend.services.gemini_service import GeminiService

logger = logging.getLogger(__name__)

ai_copilot_bp = Blueprint('ai_copilot', __name__, url_prefix='/api/ai')

@ai_copilot_bp.route('/status', methods=['GET'])
def get_ai_status():
    has_key = bool(Config.GEMINI_API_KEY)
    masked_key = f"{Config.GEMINI_API_KEY[:6]}...{Config.GEMINI_API_KEY[-4:]}" if has_key and len(Config.GEMINI_API_KEY) > 10 else ("Configured" if has_key else "Not Set")
    
    return jsonify({
        "success": True,
        "service": "Google Gemini 1.5 Flash",
        "has_api_key": has_key,
        "masked_key": masked_key,
        "model": Config.GEMINI_MODEL,
        "fallback_mode": "Intelligent Deterministic Rule Parser (Always Active)",
        "capabilities": [
            "Kirana Voice/Text Note Parsing to Catalog Inventory",
            "Smart Out-of-Stock Substitution Suggestions",
            "Autonomous Dispute & Auto-Refund Triage"
        ]
    })

@ai_copilot_bp.route('/set-key', methods=['POST'])
def set_gemini_key():
    data = request.get_json() or {}
    key = data.get('api_key', '').strip()
    if key:
        Config.GEMINI_API_KEY = key
        logger.info("Updated GEMINI_API_KEY dynamically for evaluation testing.")
        return jsonify({
            "success": True,
            "message": "Gemini API Key updated successfully!",
            "has_api_key": True,
            "masked_key": f"{key[:6]}...{key[-4:]}"
        })
    return jsonify({"success": False, "error": "No API key provided"}), 400

@ai_copilot_bp.route('/test-prompt', methods=['POST'])
def test_prompt():
    data = request.get_json() or {}
    sample_text = data.get('prompt', 'Received 15 fresh batches of organic sourdough bread and milk is sold out')
    
    sample_catalog = [
        {"id": 1, "name": "A2 Farm Fresh Organic Cow Milk", "price": 78, "stock_quantity": 35},
        {"id": 6, "name": "Sourdough Boule (Slow Fermented)", "price": 180, "stock_quantity": 12},
    ]
    
    extracted = GeminiService.parse_inventory_note(sample_text, sample_catalog)
    return jsonify({
        "success": True,
        "input_prompt": sample_text,
        "mode": "Gemini API" if Config.GEMINI_API_KEY else "Intelligent Rule Engine Fallback",
        "extracted_updates": extracted
    })
