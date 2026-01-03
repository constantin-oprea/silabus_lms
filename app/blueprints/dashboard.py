# app/blueprints/dashboard.py
from flask import Blueprint, render_template, g, redirect, url_for, request, jsonify
from datetime import datetime
from app.models import db, Event, Student, Course, Group

dashboard_bp = Blueprint('dashboard', __name__)


def get_current_user():
    """Get the current user from Flask's g object."""
    return getattr(g, 'current_user', None)


@dashboard_bp.route('/dashboard')
def dashboard_view():
    """Main dashboard view - reads all data from database."""
    user = get_current_user()
    if not user:
        return redirect(url_for('auth.login_page'))
    
    today = datetime.now().strftime("%B %d, %Y")
    
    # ============================================
    # FETCH DATA FROM DATABASE
    # ============================================
    
    # Events - for this teacher
    events = Event.query.filter_by(creator_id=user.id).order_by(Event.event_date.asc()).all()
    events_list = [event.to_dict() for event in events]
    
    # Top students - ordered by grade (for sidebar)
    top_students = Student.query.order_by(Student.average_grade.desc()).limit(10).all()
    students_list = []
    for student in top_students:
        course_names = ', '.join([c.name for c in student.courses])
        students_list.append({
            'id': student.id,
            'name': f'{student.first_name} {student.last_name}',
            'room': student.group.name if student.group else 'N/A',
            'courses': course_names,
            'avatar': student.avatar_url or '/static/images/avatar.png',
            'grade': student.average_grade,
            'attendance': student.attendance_rate
        })
    
    # Courses - for this teacher
    courses = Course.query.filter_by(teacher_id=user.id).all()
    courses_list = []
    for course in courses:
        # Get schedule days
        days = ', '.join([s.day_of_week[:3] for s in course.schedules])
        courses_list.append({
            'id': course.id,
            'name': course.name,
            'description': course.description,
            'room': course.room,
            'icon_url': course.icon_url,
            'student_count': len(course.students),
            'days': days or 'TBD'
        })
    
    return render_template('dashboard.html', 
                           page="dashboard", 
                           date=today, 
                           username=f"{user.first_name} {user.last_name}",
                           user=user,
                           students_db=students_list,
                           events_db=events_list,
                           courses_db=courses_list
                           )


# ============================================
# API ROUTES
# ============================================

@dashboard_bp.route('/api/events', methods=['POST'])
def create_event():
    """Create a new event."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    
    # Parse date
    event_date = None
    if 'event_date' in data:
        try:
            event_date = datetime.strptime(data['event_date'], '%d-%b-%y').date()
        except:
            event_date = datetime.now().date()
    
    # Create new event
    new_event = Event(
        title=data.get('title', 'Untitled Event'),
        event_type=data.get('event_type', 'meeting'),
        event_date=event_date or datetime.now().date(),
        start_time=data.get('start_time'),
        duration_minutes=data.get('duration_minutes', 60),
        notes=data.get('notes'),
        participants=data.get('participants'),
        creator_id=user.id,
        # Legacy fields
        date=data.get('date', str(event_date.day) if event_date else ''),
        month=data.get('month', event_date.strftime('%b').upper() if event_date else ''),
        time=data.get('time', data.get('start_time', '')),
        type=data.get('type', f"type-{data.get('event_type', 'meeting')}")
    )
    
    db.session.add(new_event)
    db.session.commit()
    
    return jsonify(new_event.to_dict()), 201


@dashboard_bp.route('/api/events', methods=['GET'])
def get_events():
    """Get all events for current user."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    events = Event.query.filter_by(creator_id=user.id).order_by(Event.event_date.asc()).all()
    return jsonify([event.to_dict() for event in events]), 200


@dashboard_bp.route('/api/students', methods=['GET'])
def get_students():
    """Get all students."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    students = Student.query.order_by(Student.last_name).all()
    return jsonify([student.to_dict() for student in students]), 200


@dashboard_bp.route('/api/students/top', methods=['GET'])
def get_top_students():
    """Get top 10 students by grade."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    top_students = Student.query.order_by(Student.average_grade.desc()).limit(10).all()
    students_list = []
    for student in top_students:
        course_names = ', '.join([c.name for c in student.courses])
        students_list.append({
            'id': student.id,
            'name': f'{student.first_name} {student.last_name}',
            'room': student.group.name if student.group else 'N/A',
            'courses': course_names,
            'avatar': student.avatar_url or '/static/images/avatar.png',
            'grade': student.average_grade
        })
    return jsonify(students_list), 200


@dashboard_bp.route('/api/courses', methods=['GET'])
def get_courses():
    """Get all courses for current teacher."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    courses = Course.query.filter_by(teacher_id=user.id).all()
    return jsonify([course.to_dict() for course in courses]), 200


@dashboard_bp.route('/schedule')
def schedule_view():
    user = get_current_user()
    if not user:
        return redirect(url_for('auth.login_page'))
    return render_template('schedule.html', page="schedule", username=f"{user.first_name} {user.last_name}")


@dashboard_bp.route('/course/<course_name>')
def course_view(course_name):
    user = get_current_user()
    if not user:
        return redirect(url_for('auth.login_page'))
    title = course_name.replace('-', ' ').title() 
    return render_template('course.html', course_title=title, username=f"{user.first_name} {user.last_name}")
