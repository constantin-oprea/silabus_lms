# app/__init__.py
import os
from flask import Flask, g

def create_app(config_name=None):
    """Application factory for SCOLA."""
    
    # 1. Initialize Flask
    app = Flask(__name__)
    
    # 2. Load Config based on environment
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'development')
    
    from config import config
    app.config.from_object(config[config_name])
    
    # Log which database we're using
    db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if 'postgresql' in db_uri:
        print(f"[DATABASE] Using PostgreSQL")
    else:
        print(f"[DATABASE] Using SQLite: scola.db")

    # 3. Initialize Database
    from .models import db
    db.init_app(app)
    
    # 4. Create tables and seed initial data
    with app.app_context():
        db.create_all()
        
        # Seed database with demo user and sample data
        from .seed_data import seed_database
        try:
            seed_database()
        except Exception as e:
            print(f"[WARNING] Could not seed database: {e}")
            db.session.rollback()

    # 5. Before request - set current user to demo1
    @app.before_request
    def load_current_user():
        """Load demo user as the current user for all requests."""
        from .seed_data import get_demo_user
        g.current_user = get_demo_user()

    # 6. Register Blueprints
    from .blueprints.auth import auth_bp
    from .blueprints.dashboard import dashboard_bp
    from .blueprints.students import students_bp
    from .blueprints.lesson_plans import lesson_plans_bp
    from .blueprints.settings import settings_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(students_bp)
    app.register_blueprint(lesson_plans_bp)
    app.register_blueprint(settings_bp)

    # 7. Global Route for "/" (redirects to dashboard for demo)
    from flask import redirect, url_for
    @app.route('/')
    def index():
        return redirect(url_for('dashboard.dashboard_view'))

    return app
