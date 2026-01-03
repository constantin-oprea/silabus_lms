# app/models.py
"""
Database Models for KantOS Teacher Management System

These models are designed to be database-agnostic:
- Development: SQLite (kantos.db)
- Production: PostgreSQL

To switch databases, simply change the DATABASE_URL environment variable.
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date

db = SQLAlchemy()


# ============================================
# USER & AUTHENTICATION
# ============================================


class User(db.Model):
    """Teacher/Admin user accounts."""

    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(20), default="teacher")  # 'teacher', 'admin'
    position = db.Column(
        db.String(200), default="Philosophy Teacher"
    )  # Teaching position(s)
    avatar_url = db.Column(db.String(500))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    courses = db.relationship("Course", backref="teacher", lazy="dynamic")
    events = db.relationship("Event", backref="creator", lazy="dynamic")

    def __repr__(self):
        return f"<User {self.email}>"

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": f"{self.first_name} {self.last_name}",
            "role": self.role,
            "position": self.position,
            "avatar_url": self.avatar_url,
        }


# ============================================
# COURSES & GROUPS
# ============================================


class Group(db.Model):
    """Student groups/classes (e.g., III A, IV B, 2nd Primary)."""

    __tablename__ = "groups"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)  # e.g., "III A"
    level = db.Column(db.String(50))  # e.g., "High School", "Primary"
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    students = db.relationship("Student", backref="group", lazy="dynamic")

    def __repr__(self):
        return f"<Group {self.name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "level": self.level,
            "student_count": self.students.count(),
        }


class Course(db.Model):
    """Courses taught by teachers."""

    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # e.g., "Philosophy"
    description = db.Column(db.Text)
    room = db.Column(db.String(50))  # e.g., "III A"
    icon_url = db.Column(db.String(500))
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    schedules = db.relationship(
        "CourseSchedule", backref="course", lazy="dynamic", cascade="all, delete-orphan"
    )
    students = db.relationship(
        "Student", secondary="course_students", backref="courses"
    )

    def __repr__(self):
        return f"<Course {self.name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "room": self.room,
            "icon_url": self.icon_url,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "student_count": len(self.students),
            "schedules": [s.to_dict() for s in self.schedules],
        }


class CourseSchedule(db.Model):
    """Weekly schedule for courses (day + time)."""

    __tablename__ = "course_schedules"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    day_of_week = db.Column(db.String(10), nullable=False)  # 'Monday', 'Tuesday', etc.
    start_time = db.Column(db.String(10), nullable=False)  # '08:15 AM'
    end_time = db.Column(db.String(10), nullable=False)  # '09:45 AM'

    def __repr__(self):
        return f"<Schedule {self.day_of_week} {self.start_time}-{self.end_time}>"

    def to_dict(self):
        return {
            "id": self.id,
            "day": self.day_of_week,
            "start_time": self.start_time,
            "end_time": self.end_time,
        }


# Association table for many-to-many: Course <-> Student
course_students = db.Table(
    "course_students",
    db.Column("course_id", db.Integer, db.ForeignKey("courses.id"), primary_key=True),
    db.Column("student_id", db.Integer, db.ForeignKey("students.id"), primary_key=True),
)


# ============================================
# STUDENTS
# ============================================


class Student(db.Model):
    """Students enrolled in courses."""

    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, index=True)
    group_id = db.Column(db.Integer, db.ForeignKey("groups.id"))
    avatar_url = db.Column(db.String(500))
    attendance_rate = db.Column(db.Float, default=100.0)  # Percentage
    average_grade = db.Column(db.Float, default=0.0)
    birthday = db.Column(db.Date)  # Date of birth
    hobbies = db.Column(db.Text)  # Comma-separated hobbies
    social_circle = db.Column(
        db.Text
    )  # Comma-separated student IDs (friends in course)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    notes = db.relationship(
        "StudentNote", backref="student", lazy="dynamic", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Student {self.first_name} {self.last_name}>"

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": f"{self.first_name} {self.last_name}",
            "email": self.email,
            "group": self.group.name if self.group else None,
            "avatar_url": self.avatar_url,
            "attendance_rate": self.attendance_rate,
            "average_grade": self.average_grade,
            "birthday": self.birthday.isoformat() if self.birthday else None,
            "hobbies": self.hobbies,
            "social_circle": self.social_circle.split(",")
            if self.social_circle
            else [],
        }


class StudentNote(db.Model):
    """Teacher notes/comments about students (Teacher's Log)."""

    __tablename__ = "student_notes"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(
        db.Integer, db.ForeignKey("students.id"), nullable=False, index=True
    )
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship to get teacher info
    teacher = db.relationship("User", backref="student_notes")

    def __repr__(self):
        return f"<StudentNote {self.id} for Student {self.student_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "teacher_id": self.teacher_id,
            "teacher_name": f"{self.teacher.first_name}" if self.teacher else "Unknown",
            "text": self.text,
            "date": self.created_at.strftime("%b %d") if self.created_at else "",
            "fullDate": self.created_at.strftime("%d-%b-%y, %H:%M")
            if self.created_at
            else "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ============================================
# EVENTS
# ============================================


class Event(db.Model):
    """Calendar events (meetings, exams, homework, etc.)."""

    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    event_type = db.Column(
        db.String(50), nullable=False
    )  # 'meeting', 'exam', 'homework', 'oral_presentation'
    event_date = db.Column(db.Date, nullable=False, index=True)
    start_time = db.Column(db.String(10))  # '10:00 AM'
    duration_minutes = db.Column(db.Integer, default=60)
    notes = db.Column(db.Text)
    participants = db.Column(db.Text)  # Comma-separated names
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships for course/group assignment
    assigned_courses = db.relationship(
        "Course", secondary="event_courses", backref="events"
    )
    assigned_groups = db.relationship(
        "Group", secondary="event_groups", backref="events"
    )

    # Legacy fields for backward compatibility (can be removed later)
    date = db.Column(db.String(10))  # e.g., "22"
    month = db.Column(db.String(10))  # e.g., "DEC"
    time = db.Column(db.String(100))  # e.g., "10:00 AM • Class A"
    type = db.Column(db.String(50))  # e.g., "type-exam"

    def __repr__(self):
        return f"<Event {self.title} on {self.event_date}>"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "event_type": self.event_type,
            "event_date": self.event_date.isoformat() if self.event_date else None,
            "start_time": self.start_time,
            "duration_minutes": self.duration_minutes,
            "notes": self.notes,
            "participants": self.participants.split("\n") if self.participants else [],
            # Legacy format for backward compatibility
            "date": self.date or (str(self.event_date.day) if self.event_date else ""),
            "month": self.month
            or (self.event_date.strftime("%b").upper() if self.event_date else ""),
            "time": self.time or self.start_time,
            "type": self.type or f"type-{self.event_type}",
        }


# Association tables for Events
event_courses = db.Table(
    "event_courses",
    db.Column("event_id", db.Integer, db.ForeignKey("events.id"), primary_key=True),
    db.Column("course_id", db.Integer, db.ForeignKey("courses.id"), primary_key=True),
)

event_groups = db.Table(
    "event_groups",
    db.Column("event_id", db.Integer, db.ForeignKey("events.id"), primary_key=True),
    db.Column("group_id", db.Integer, db.ForeignKey("groups.id"), primary_key=True),
)


# ============================================
# LESSON PLANS
# ============================================


class LessonPlan(db.Model):
    """Lesson plans for courses."""

    __tablename__ = "lesson_plans"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id"), nullable=False)
    lesson_date = db.Column(db.Date)
    objectives = db.Column(db.Text)
    content = db.Column(db.Text)
    materials = db.Column(db.Text)
    homework = db.Column(db.Text)
    notes = db.Column(db.Text)
    status = db.Column(
        db.String(20), default="draft"
    )  # 'draft', 'published', 'completed'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    course = db.relationship("Course", backref="lesson_plans")

    def __repr__(self):
        return f"<LessonPlan {self.title}>"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "course_id": self.course_id,
            "course_name": self.course.name if self.course else None,
            "lesson_date": self.lesson_date.isoformat() if self.lesson_date else None,
            "objectives": self.objectives,
            "content": self.content,
            "materials": self.materials,
            "homework": self.homework,
            "notes": self.notes,
            "status": self.status,
        }
