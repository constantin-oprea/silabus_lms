from flask import Blueprint, render_template, request, redirect, url_for, session

# --- THIS IS THE MISSING LINE ---
auth_bp = Blueprint('auth', __name__) 

@auth_bp.route('/')
def login_page():
    return render_template('login.html')

@auth_bp.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    session['user'] = username
    return redirect(url_for('dashboard.dashboard_view')) 

@auth_bp.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('auth.login_page'))