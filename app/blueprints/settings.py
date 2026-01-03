# app/blueprints/settings.py
"""Settings blueprint for user profile, messaging, event management, and student import."""

import os
import io
import csv
from datetime import datetime
from flask import (
    Blueprint,
    render_template,
    g,
    redirect,
    url_for,
    request,
    jsonify,
    send_file,
)
from werkzeug.utils import secure_filename
from app.models import db, User, Student, Course, Event

settings_bp = Blueprint("settings", __name__)

# Configure upload folder
UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "static", "uploads", "avatars"
)
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
ALLOWED_IMPORT_EXTENSIONS = {"csv", "xlsx", "xls"}


def get_current_user():
    """Get the current user from Flask's g object."""
    return getattr(g, "current_user", None)


def allowed_file(filename):
    """Check if file extension is allowed."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def allowed_import_file(filename):
    """Check if import file extension is allowed."""
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMPORT_EXTENSIONS
    )


@settings_bp.route("/settings")
def settings_view():
    """Render the settings/profile page."""
    user = get_current_user()
    if not user:
        return redirect(url_for("auth.login_page"))

    # Get teacher's courses
    courses = Course.query.filter_by(teacher_id=user.id).all()
    courses_list = [{"id": c.id, "name": c.name} for c in courses]

    # Get all students from teacher's courses
    student_ids = set()
    for course in courses:
        for student in course.students:
            student_ids.add(student.id)

    students = (
        Student.query.filter(Student.id.in_(student_ids))
        .order_by(Student.last_name)
        .all()
    )
    students_list = []
    for student in students:
        course_names = [c.name for c in student.courses if c.teacher_id == user.id]
        students_list.append(
            {
                "id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "email": student.email,
                "avatar": student.avatar_url or "/static/images/avatar.png",
                "courses": course_names,
                "birthday": student.birthday.strftime("%Y-%m-%d")
                if student.birthday
                else "",
                "hobbies": student.hobbies or "",
                "social_circle": student.social_circle.split(",")
                if student.social_circle
                else [],
            }
        )

    # Get events for event management
    events = (
        Event.query.filter_by(creator_id=user.id)
        .order_by(Event.event_date.desc())
        .all()
    )
    events_list = [event.to_dict() for event in events]

    # Count unread messages (placeholder - will be 0 for now)
    unread_messages = 0

    return render_template(
        "settings.html",
        user=user,
        courses=courses_list,
        students=students_list,
        events=events_list,
        unread_messages=unread_messages,
    )


@settings_bp.route("/api/settings/students", methods=["GET"])
def get_teacher_students():
    """Get all students for the teacher with optional course filter."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    course_id = request.args.get("course_id", type=int)

    # Get teacher's courses
    if course_id:
        courses = Course.query.filter_by(teacher_id=user.id, id=course_id).all()
    else:
        courses = Course.query.filter_by(teacher_id=user.id).all()

    # Collect unique students
    student_ids = set()
    for course in courses:
        for student in course.students:
            student_ids.add(student.id)

    students = (
        Student.query.filter(Student.id.in_(student_ids))
        .order_by(Student.last_name)
        .all()
    )
    students_list = []
    for student in students:
        course_names = [c.name for c in student.courses if c.teacher_id == user.id]
        students_list.append(
            {
                "id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "email": student.email,
                "avatar": student.avatar_url or "/static/images/avatar.png",
                "courses": course_names,
                "birthday": student.birthday.strftime("%Y-%m-%d")
                if student.birthday
                else "",
                "hobbies": student.hobbies or "",
                "social_circle": student.social_circle.split(",")
                if student.social_circle
                else [],
            }
        )

    return jsonify(students_list), 200


@settings_bp.route("/api/settings/avatar", methods=["POST"])
def upload_avatar():
    """Upload a new profile picture."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if "avatar" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["avatar"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    if file and allowed_file(file.filename):
        # Create upload directory if it doesn't exist
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)

        # Generate secure filename with user id
        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"user_{user.id}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)

        # Save the file
        file.save(filepath)

        # Update user avatar_url
        user.avatar_url = f"/static/uploads/avatars/{filename}"
        db.session.commit()

        return jsonify({"success": True, "avatar_url": user.avatar_url}), 200

    return jsonify({"error": "Invalid file type"}), 400


@settings_bp.route("/api/settings/message", methods=["POST"])
def send_message():
    """Send a message to selected students."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    subject = data.get("subject", "")
    message = data.get("message", "")
    student_ids = data.get("student_ids", [])

    if not message:
        return jsonify({"error": "Message is required"}), 400

    # For now, just log the message (placeholder for actual messaging system)
    print(f"[MESSAGE] From: {user.email}")
    print(f"[MESSAGE] Subject: {subject}")
    print(f"[MESSAGE] To students: {student_ids}")
    print(f"[MESSAGE] Content: {message}")

    return jsonify(
        {
            "success": True,
            "message": "Message sent successfully",
            "recipients": len(student_ids),
        }
    ), 200


# ============================================
# EVENT MANAGEMENT API
# ============================================


@settings_bp.route("/api/settings/events", methods=["GET"])
def get_events():
    """Get all events for the current teacher."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    events = (
        Event.query.filter_by(creator_id=user.id)
        .order_by(Event.event_date.desc())
        .all()
    )
    return jsonify([event.to_dict() for event in events]), 200


@settings_bp.route("/api/settings/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    """Delete an event."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    event = Event.query.filter_by(id=event_id, creator_id=user.id).first()
    if not event:
        return jsonify({"error": "Event not found"}), 404

    db.session.delete(event)
    db.session.commit()

    return jsonify({"success": True, "message": "Event deleted successfully"}), 200


# ============================================
# STUDENT MANAGEMENT API
# ============================================


@settings_bp.route("/api/settings/students", methods=["POST"])
def add_student():
    """Add a new student and assign to a course."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()

    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()

    if not first_name or not last_name:
        return jsonify({"error": "First name and last name are required"}), 400

    course_id = data.get("course_id")
    if not course_id:
        return jsonify({"error": "Course selection is required"}), 400

    # Verify course belongs to teacher
    course = Course.query.filter_by(id=course_id, teacher_id=user.id).first()
    if not course:
        return jsonify({"error": "Invalid course"}), 400

    # Parse birthday
    birthday = None
    birthday_str = data.get("birthday", "")
    if birthday_str:
        try:
            birthday = datetime.strptime(birthday_str, "%Y-%m-%d").date()
        except ValueError:
            pass  # Ignore invalid dates

    # Get hobbies and social circle
    hobbies = data.get("hobbies", "").strip()
    social_circle = data.get("social_circle", [])
    if isinstance(social_circle, list):
        social_circle = ",".join(str(s) for s in social_circle)

    # Create student
    student = Student(
        first_name=first_name,
        last_name=last_name,
        email=data.get("email", "").strip() or None,
        birthday=birthday,
        hobbies=hobbies,
        social_circle=social_circle,
    )

    db.session.add(student)
    db.session.flush()  # Get student.id

    # Add student to course
    course.students.append(student)
    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "Student added successfully",
            "student": {
                "id": student.id,
                "name": f"{student.first_name} {student.last_name}",
                "course": course.name,
            },
        }
    ), 201


@settings_bp.route("/api/settings/students/<int:student_id>", methods=["PUT"])
def update_student(student_id):
    """Update a student's information."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "Student not found"}), 404

    # Verify student is in one of teacher's courses
    teacher_courses = Course.query.filter_by(teacher_id=user.id).all()
    student_in_teacher_course = any(c in student.courses for c in teacher_courses)
    if not student_in_teacher_course:
        return jsonify({"error": "Student not found in your courses"}), 404

    data = request.get_json()

    # Update fields
    if "first_name" in data:
        student.first_name = data["first_name"].strip()
    if "last_name" in data:
        student.last_name = data["last_name"].strip()
    if "email" in data:
        student.email = data["email"].strip() or None
    if "birthday" in data and data["birthday"]:
        try:
            student.birthday = datetime.strptime(data["birthday"], "%Y-%m-%d").date()
        except ValueError:
            pass
    if "hobbies" in data:
        student.hobbies = data["hobbies"].strip()
    if "social_circle" in data:
        sc = data["social_circle"]
        if isinstance(sc, list):
            student.social_circle = ",".join(str(s) for s in sc)
        else:
            student.social_circle = sc

    db.session.commit()

    return jsonify(
        {
            "success": True,
            "message": "Student updated successfully",
            "student": student.to_dict(),
        }
    ), 200


@settings_bp.route("/api/settings/courses/<int:course_id>/students", methods=["GET"])
def get_course_students(course_id):
    """Get all students for a specific course (for social circle dropdown)."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    course = Course.query.filter_by(id=course_id, teacher_id=user.id).first()
    if not course:
        return jsonify({"error": "Course not found"}), 404

    students = [
        {"id": s.id, "name": f"{s.first_name} {s.last_name}"} for s in course.students
    ]
    return jsonify(students), 200


# ============================================
# CSV/EXCEL IMPORT API
# ============================================


@settings_bp.route("/api/settings/students/template", methods=["GET"])
def download_template():
    """Download the Excel/CSV template for student import."""
    # Create CSV template
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["First Name", "Last Name", "Date of Birth", "Hobbies"])
    writer.writerow(["John", "Doe", "2005-03-15", "Reading, Music"])
    writer.writerow(["Jane", "Smith", "2006-07-22", "Sports, Art"])

    output.seek(0)
    return send_file(
        io.BytesIO(output.getvalue().encode("utf-8")),
        mimetype="text/csv",
        as_attachment=True,
        download_name="student_import_template.csv",
    )


@settings_bp.route("/api/settings/students/import", methods=["POST"])
def import_students():
    """Import students from CSV or Excel file."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    course_id = request.form.get("course_id")
    if not course_id:
        return jsonify({"error": "Course selection is required"}), 400

    # Verify course belongs to teacher
    course = Course.query.filter_by(id=int(course_id), teacher_id=user.id).first()
    if not course:
        return jsonify({"error": "Invalid course"}), 400

    if not allowed_import_file(file.filename):
        return jsonify(
            {"error": "Invalid file type. Please use CSV or Excel files."}
        ), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    students_added = []
    errors = []

    try:
        if ext == "csv":
            # Parse CSV
            content = file.read().decode("utf-8")
            reader = csv.reader(io.StringIO(content))
            headers = next(reader, None)  # Skip header row

            for row_num, row in enumerate(reader, start=2):
                try:
                    # Handle partial data - get whatever is available
                    first_name = row[0].strip() if len(row) > 0 and row[0] else ""
                    last_name = row[1].strip() if len(row) > 1 and row[1] else ""
                    dob_str = row[2].strip() if len(row) > 2 and row[2] else ""
                    hobbies = row[3].strip() if len(row) > 3 and row[3] else ""

                    # Skip rows without name
                    if not first_name and not last_name:
                        continue

                    # Use placeholder if one name is missing
                    if not first_name:
                        first_name = "Unknown"
                    if not last_name:
                        last_name = "Unknown"

                    # Parse birthday
                    birthday = None
                    if dob_str:
                        for fmt in ["%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%d/%m/%Y"]:
                            try:
                                birthday = datetime.strptime(dob_str, fmt).date()
                                break
                            except ValueError:
                                continue

                    # Create student
                    student = Student(
                        first_name=first_name,
                        last_name=last_name,
                        birthday=birthday,
                        hobbies=hobbies,
                    )
                    db.session.add(student)
                    db.session.flush()

                    # Add to course
                    course.students.append(student)
                    students_added.append(
                        {
                            "id": student.id,
                            "name": f"{first_name} {last_name}",
                            "row": row_num,
                        }
                    )

                except Exception as e:
                    errors.append({"row": row_num, "error": str(e)})

        elif ext in ["xlsx", "xls"]:
            # For Excel files, we need openpyxl
            try:
                import openpyxl

                workbook = openpyxl.load_workbook(io.BytesIO(file.read()))
                sheet = workbook.active

                for row_num, row in enumerate(
                    sheet.iter_rows(min_row=2, values_only=True), start=2
                ):
                    try:
                        first_name = str(row[0]).strip() if row[0] else ""
                        last_name = (
                            str(row[1]).strip() if len(row) > 1 and row[1] else ""
                        )
                        dob = row[2] if len(row) > 2 else None
                        hobbies = str(row[3]).strip() if len(row) > 3 and row[3] else ""

                        # Skip rows without name
                        if not first_name and not last_name:
                            continue

                        if not first_name:
                            first_name = "Unknown"
                        if not last_name:
                            last_name = "Unknown"

                        # Parse birthday
                        birthday = None
                        if dob:
                            if isinstance(dob, datetime):
                                birthday = dob.date()
                            elif isinstance(dob, str):
                                for fmt in [
                                    "%Y-%m-%d",
                                    "%d-%m-%Y",
                                    "%m/%d/%Y",
                                    "%d/%m/%Y",
                                ]:
                                    try:
                                        birthday = datetime.strptime(dob, fmt).date()
                                        break
                                    except ValueError:
                                        continue

                        # Create student
                        student = Student(
                            first_name=first_name,
                            last_name=last_name,
                            birthday=birthday,
                            hobbies=hobbies,
                        )
                        db.session.add(student)
                        db.session.flush()

                        # Add to course
                        course.students.append(student)
                        students_added.append(
                            {
                                "id": student.id,
                                "name": f"{first_name} {last_name}",
                                "row": row_num,
                            }
                        )

                    except Exception as e:
                        errors.append({"row": row_num, "error": str(e)})

            except ImportError:
                return jsonify(
                    {
                        "error": "Excel file support not available. Please use CSV format."
                    }
                ), 400

        db.session.commit()

        return jsonify(
            {
                "success": True,
                "message": f"Successfully imported {len(students_added)} students",
                "students_added": students_added,
                "errors": errors,
                "course": course.name,
            }
        ), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Import failed: {str(e)}"}), 500
