from flask import Flask, redirect, url_for
from config import Config
from models.database import init_db
from routes.auth import auth_bp
from routes.chat import chat_bp

def create_app():
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize database
    init_db()
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    
    # Main route - redirect to login
    @app.route('/')
    def index():
        return redirect(url_for('auth.login'))
    
    return app

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 Starting SecureChat Application")
    print("=" * 50)
    print(f"📡 Server: http://{Config.HOST}:{Config.PORT}")
    print(f"🗄️  Database: {Config.DATABASE_NAME}")
    print(f"🔐 Security: Enabled")
    print("=" * 50)
    print("📱 Access the app:")
    print(f"   Register: http://{Config.HOST}:{Config.PORT}/register")
    print(f"   Login:    http://{Config.HOST}:{Config.PORT}/login")
    print("=" * 50)
    
    app = create_app()
    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)