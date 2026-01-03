from flask import (
    Blueprint,
    render_template,
    session,
    redirect,
    url_for,
    g,
    jsonify,
    request,
)
from datetime import datetime
from app.models import db, Student, StudentNote, Event

students_bp = Blueprint("students", __name__)


def get_current_user():
    """Get current logged-in user from g."""
    return getattr(g, "current_user", None)


def get_students_with_notes():
    """Get all students with their notes formatted for the frontend."""
    students = Student.query.all()
    students_list = []

    for student in students:
        # Get courses for this student
        course_names = [c.name for c in student.courses] if student.courses else []
        course_name = course_names[0] if course_names else "General"

        # Get notes for this student
        notes = (
            StudentNote.query.filter_by(student_id=student.id)
            .order_by(StudentNote.created_at.desc())
            .all()
        )
        comments = [note.to_dict() for note in notes]

        students_list.append(
            {
                "id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "course": course_name,
                "img": student.avatar_url.replace("/static/images/", "")
                if student.avatar_url
                else "avatar.png",
                "attendance": f"{int(student.attendance_rate)}%",
                "homework": f"{int(student.average_grade)}%",
                "participationVal": 1,  # Default medium
                "personal": {"dob": "--", "hobbies": "--"},
                "gradesList": [],
                "groups": [student.group.name] if student.group else [],
                "friends": [],
                "comments": comments,
            }
        )

    return students_list


def get_events_list():
    """Get events for the current user."""
    user = get_current_user()
    if not user:
        return []
    events = (
        Event.query.filter_by(creator_id=user.id).order_by(Event.event_date.asc()).all()
    )
    return [event.to_dict() for event in events]


@students_bp.route("/students")
def students_view():
    if "user" not in session:
        return redirect(url_for("auth.login_page"))

    today = datetime.now().strftime("%B %d, %Y")

    # Get teacher's first name from current user
    teacher_first_name = "Demo"
    user = get_current_user()
    if user:
        teacher_first_name = user.first_name or "Demo"

    # Get data from database
    students_list = get_students_with_notes()
    events_list = get_events_list()

    return render_template(
        "students.html",
        page="students",
        date=today,
        username=session["user"],
        teacher_first_name=teacher_first_name,
        students_db=students_list,
        events_db=events_list,
        courses_db=[],
    )


@students_bp.route("/grades")
def grades_view():
    if "user" not in session:
        return redirect(url_for("auth.login_page"))

    today = datetime.now().strftime("%B %d, %Y")

    # Get teacher's first name from current user
    teacher_first_name = "Demo"
    user = get_current_user()
    if user:
        teacher_first_name = user.first_name or "Demo"

    # Get data from database
    students_list = get_students_with_notes()
    events_list = get_events_list()

    return render_template(
        "grades.html",
        page="grades",
        date=today,
        username=session["user"],
        teacher_first_name=teacher_first_name,
        students_db=students_list,
        events_db=events_list,
        courses_db=[],
    )


# ============================================
# API ENDPOINTS FOR STUDENT NOTES
# ============================================


@students_bp.route("/api/students/<int:student_id>/notes", methods=["GET"])
def get_student_notes(student_id):
    """Get all notes for a specific student."""
    notes = (
        StudentNote.query.filter_by(student_id=student_id)
        .order_by(StudentNote.created_at.desc())
        .all()
    )
    return jsonify([note.to_dict() for note in notes]), 200


@students_bp.route("/api/students/<int:student_id>/notes", methods=["POST"])
def add_student_note(student_id):
    """Add a new note for a student."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    # Verify student exists
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    data = request.get_json()
    if not data or not data.get("text"):
        return jsonify({"error": "Note text is required"}), 400

    # Create new note
    note = StudentNote(student_id=student_id, teacher_id=user.id, text=data["text"])

    db.session.add(note)
    db.session.commit()

    return jsonify(note.to_dict()), 201


@students_bp.route(
    "/api/students/<int:student_id>/notes/<int:note_id>", methods=["DELETE"]
)
def delete_student_note(student_id, note_id):
    """Delete a specific note."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401

    note = StudentNote.query.filter_by(id=note_id, student_id=student_id).first()
    if not note:
        return jsonify({"error": "Note not found"}), 404

    db.session.delete(note)
    db.session.commit()

    return jsonify({"success": True}), 200
