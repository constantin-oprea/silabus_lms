from flask import Blueprint, render_template, session, redirect, url_for
from datetime import datetime

# --- MAKE SURE THIS IS HERE ---
lesson_plans_bp = Blueprint('lesson_plans', __name__)

@lesson_plans_bp.route('/lesson-plans')
def lesson_plans_view():
    if 'user' not in session: return redirect(url_for('auth.login_page'))
    today = datetime.now().strftime("%B %d, %Y")
    return render_template('lesson_plans.html', page="lesson_plans", date=today, username=session['user'])