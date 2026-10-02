import os
import logging
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from backend.config import Config
from backend.database import init_db
from backend.routes.stores import stores_bp
from backend.routes.orders import orders_bp
from backend.routes.retention import retention_bp
from backend.routes.support import support_bp
from backend.routes.analytics import analytics_bp
from backend.routes.ai_copilot import ai_copilot_bp

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for API routes
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register modular blueprints
    app.register_blueprint(stores_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(retention_bp)
    app.register_blueprint(support_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(ai_copilot_bp)

    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' https: http:; img-src 'self' data: https:; font-src 'self' https: data:;"
        return response

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "NOVA PULSE Backend API",
            "version": "1.0.0",
            "challenge": "PromptWars 2026",
            "gemini_connected": bool(Config.GEMINI_API_KEY)
        })

    # Serve production frontend build if available
    dist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/'):
            return jsonify({"success": False, "error": "API endpoint not found"}), 404
        if path != "" and os.path.exists(os.path.join(dist_dir, path)):
            return send_from_directory(dist_dir, path)
        elif os.path.exists(os.path.join(dist_dir, 'index.html')):
            return send_from_directory(dist_dir, 'index.html')
        else:
            return jsonify({
                "status": "healthy",
                "service": "NOVA PULSE Backend API",
                "message": "API online. Build frontend with 'npm run build' to view UI on root."
            }), 200

    # Global sanitized error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"success": False, "error": "Resource not found"}), 404

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"success": False, "error": "Invalid request payload"}), 400

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Internal server error: {error}")
        return jsonify({"success": False, "error": "An internal server error occurred"}), 500

    # Initialize SQLite database
    init_db()

    return app

app = create_app()

if __name__ == '__main__':
    logger.info(f"Starting NOVA PULSE Backend on port {Config.PORT}")
    app.run(host='127.0.0.1', port=Config.PORT, debug=Config.DEBUG)
