import sys
from pathlib import Path

# Ensure the root project directory is on sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app import app
from backend.config import Config

if __name__ == '__main__':
    print(f"Starting NOVA PULSE Backend on http://127.0.0.1:{Config.PORT}")
    app.run(host='127.0.0.1', port=Config.PORT, debug=False)
