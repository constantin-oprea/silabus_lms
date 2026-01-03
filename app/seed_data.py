# app/seed_data.py
"""
Database seeder for KantOS.
Creates demo user and sample data for development.
"""

from datetime import datetime, date, timedelta
from .models import db, User, Group, Course, CourseSchedule, Student, Event


def seed_database():
    """Seed database with demo user and sample data."""
    
    # Check if already seeded
    if User.query.filter_by(email='demo1@kantos.edu').first():
        print("[SEED] Database already seeded, skipping...")
        return
    
    print("[SEED] Seeding database with demo data...")
    
    # ============================================
    # 1. CREATE DEMO USER
    # ============================================
    demo_user = User(
        email='demo1@kantos.edu',
        password_hash='demo123',  # In production, use proper hashing
        first_name='Demo',
        last_name='Teacher',
        role='teacher',
        avatar_url='/static/images/avatar.png'
    )
    db.session.add(demo_user)
    db.session.flush()  # Get the user ID
    
    print(f"[SEED] Created demo user: {demo_user.email}")
    
    # ============================================
    # 2. CREATE GROUPS
    # ============================================
    groups_data = [
        {'name': 'III A', 'level': 'High School'},
        {'name': 'III B', 'level': 'High School'},
        {'name': 'IV A', 'level': 'High School'},
        {'name': 'IV B', 'level': 'High School'},
        {'name': 'V', 'level': 'High School'},
        {'name': '2nd Primary', 'level': 'Primary'},
    ]
    
    groups = {}
    for g in groups_data:
        group = Group(name=g['name'], level=g['level'])
        db.session.add(group)
        groups[g['name']] = group
    
    db.session.flush()
    print(f"[SEED] Created {len(groups)} groups")
    
    # ============================================
    # 3. CREATE COURSES
    # ============================================
    courses_data = [
        {
            'name': 'Philosophy',
            'description': 'Introduction to philosophical thinking',
            'room': 'III A',
            'icon_url': '/static/images/icon_Philosophy.png',
            'schedules': [
                {'day': 'Monday', 'start': '08:15 AM', 'end': '09:45 AM'},
                {'day': 'Wednesday', 'start': '08:15 AM', 'end': '09:45 AM'},
                {'day': 'Friday', 'start': '10:00 AM', 'end': '11:30 AM'},
            ]
        },
        {
            'name': 'Social Studies',
            'description': 'Understanding society and culture',
            'room': 'IV B',
            'icon_url': '/static/images/icon_social_studies.jpg',
            'schedules': [
                {'day': 'Tuesday', 'start': '09:00 AM', 'end': '10:30 AM'},
                {'day': 'Thursday', 'start': '09:00 AM', 'end': '10:30 AM'},
            ]
        },
        {
            'name': 'Projects',
            'description': 'Hands-on project-based learning',
            'room': 'V',
            'icon_url': '/static/images/icon_projects.jpeg',
            'schedules': [
                {'day': 'Monday', 'start': '02:00 PM', 'end': '03:30 PM'},
                {'day': 'Wednesday', 'start': '02:00 PM', 'end': '03:30 PM'},
            ]
        },
    ]
    
    courses = {}
    for c in courses_data:
        course = Course(
            name=c['name'],
            description=c['description'],
            room=c['room'],
            icon_url=c['icon_url'],
            start_date=date(2025, 3, 1),
            end_date=date(2025, 12, 15),
            teacher_id=demo_user.id
        )
        db.session.add(course)
        db.session.flush()
        
        # Add schedules
        for s in c['schedules']:
            schedule = CourseSchedule(
                course_id=course.id,
                day_of_week=s['day'],
                start_time=s['start'],
                end_time=s['end']
            )
            db.session.add(schedule)
        
        courses[c['name']] = course
    
    print(f"[SEED] Created {len(courses)} courses with schedules")
    
    # ============================================
    # 4. CREATE STUDENTS
    # ============================================
    students_data = [
        {'first': 'Carlos', 'last': 'Mendoza', 'group': 'III B', 'courses': ['Social Studies', 'Projects'], 'avatar': '/static/images/face_1.jpg', 'grade': 85, 'attendance': 92},
        {'first': 'María', 'last': 'Quispe', 'group': 'IV A', 'courses': ['Philosophy', 'Projects'], 'avatar': '/static/images/face_2.jpg', 'grade': 91, 'attendance': 98},
        {'first': 'Luis', 'last': 'Huamán', 'group': 'III A', 'courses': ['Social Studies', 'Philosophy'], 'avatar': '/static/images/face_3.jpg', 'grade': 78, 'attendance': 88},
        {'first': 'Ana', 'last': 'Flores', 'group': 'III A', 'courses': ['Projects'], 'avatar': '/static/images/face_4.jpg', 'grade': 95, 'attendance': 100},
        {'first': 'José', 'last': 'Chávez', 'group': 'IV B', 'courses': ['Social Studies'], 'avatar': '/static/images/face_5.jpg', 'grade': 72, 'attendance': 85},
        {'first': 'Rosa', 'last': 'Paredes', 'group': 'III A', 'courses': ['Philosophy', 'Projects'], 'avatar': '/static/images/face_6.jpg', 'grade': 88, 'attendance': 94},
        {'first': 'Miguel', 'last': 'Rojas', 'group': 'IV A', 'courses': ['Social Studies', 'Philosophy', 'Projects'], 'avatar': '/static/images/face_7.jpg', 'grade': 82, 'attendance': 90},
        {'first': 'Carmen', 'last': 'Vargas', 'group': 'V', 'courses': ['Philosophy'], 'avatar': '/static/images/face_8.jpg', 'grade': 89, 'attendance': 96},
        {'first': 'Pedro', 'last': 'Sánchez', 'group': 'III B', 'courses': ['Social Studies', 'Projects'], 'avatar': '/static/images/face_9.jpg', 'grade': 76, 'attendance': 82},
        {'first': 'Lucía', 'last': 'Castillo', 'group': 'III B', 'courses': ['Projects'], 'avatar': '/static/images/face_10.jpg', 'grade': 93, 'attendance': 99},
    ]
    
    for s in students_data:
        student = Student(
            first_name=s['first'],
            last_name=s['last'],
            email=f"{s['first'].lower()}.{s['last'].lower()}@student.kantos.edu",
            group_id=groups[s['group']].id,
            avatar_url=s['avatar'],
            average_grade=s['grade'],
            attendance_rate=s['attendance']
        )
        db.session.add(student)
        db.session.flush()
        
        # Link to courses
        for course_name in s['courses']:
            if course_name in courses:
                student.courses.append(courses[course_name])
    
    print(f"[SEED] Created {len(students_data)} students")
    
    # ============================================
    # 5. CREATE EVENTS
    # ============================================
    today = date.today()
    events_data = [
        {
            'title': 'Philosophy Essay Deadline',
            'event_type': 'homework',
            'event_date': today + timedelta(days=2),
            'start_time': '11:59 PM',
            'duration': 0,
            'notes': 'Submit via online portal'
        },
        {
            'title': 'Faculty Meeting',
            'event_type': 'meeting',
            'event_date': today + timedelta(days=3),
            'start_time': '02:00 PM',
            'duration': 60,
            'notes': 'Room 301 - Quarterly review'
        },
        {
            'title': 'Social Studies Quiz',
            'event_type': 'exam',
            'event_date': today + timedelta(days=5),
            'start_time': '09:00 AM',
            'duration': 45,
            'notes': 'Chapters 5-7'
        },
        {
            'title': 'Parent-Teacher Conference',
            'event_type': 'meeting',
            'event_date': today + timedelta(days=7),
            'start_time': '04:00 PM',
            'duration': 120,
            'notes': 'Virtual meeting'
        },
        {
            'title': 'Project Presentations',
            'event_type': 'oral_presentation',
            'event_date': today + timedelta(days=10),
            'start_time': '10:00 AM',
            'duration': 90,
            'notes': 'Final project showcase'
        },
    ]
    
    for e in events_data:
        event = Event(
            title=e['title'],
            event_type=e['event_type'],
            event_date=e['event_date'],
            start_time=e['start_time'],
            duration_minutes=e['duration'],
            notes=e['notes'],
            creator_id=demo_user.id,
            # Legacy fields for compatibility
            date=str(e['event_date'].day),
            month=e['event_date'].strftime('%b').upper(),
            time=e['start_time'],
            type=f"type-{e['event_type'].replace('_', '-')}"
        )
        db.session.add(event)
    
    print(f"[SEED] Created {len(events_data)} events")
    
    # Commit all changes
    db.session.commit()
    print("[SEED] Database seeding complete!")


def get_demo_user():
    """Get or create the demo user."""
    user = User.query.filter_by(email='demo1@kantos.edu').first()
    if not user:
        seed_database()
        user = User.query.filter_by(email='demo1@kantos.edu').first()
    return user
