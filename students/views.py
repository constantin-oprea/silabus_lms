from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.core.serializers.json import DjangoJSONEncoder
import json
from .models import Student
from dashboard.models import Group, Course
from events.models import Event


@login_required
def students_view(request):
    """Students list view with JSON data for JavaScript."""
    # Get all students with their groups
    students_list = Student.objects.select_related("group").order_by(
        "last_name", "first_name"
    )

    # Get all groups for filtering
    groups = Group.objects.all()

    # Get all courses
    courses = Course.objects.all()

    # Get all events
    events = Event.objects.all().order_by("start_time")

    # Serialize data to JSON for JavaScript
    students_data = [student.to_profile_dict() for student in students_list]
    courses_data = [course.to_dict() for course in courses]
    events_data = [event.to_dict() for event in events]

    context = {
        "students": students_list,
        "groups": groups,
        "students_json": json.dumps(students_data, cls=DjangoJSONEncoder),
        "events_json": json.dumps(events_data, cls=DjangoJSONEncoder),
        "courses_json": json.dumps(courses_data, cls=DjangoJSONEncoder),
        "teacher_first_name": request.user.first_name,
    }

    return render(request, "students/students.html", context)


@login_required
def grades_view(request):
    """Grades interface view with JSON data for JavaScript."""
    # Get all students
    students_list = Student.objects.select_related("group").order_by(
        "last_name", "first_name"
    )

    # Get all courses
    courses = Course.objects.all()

    # Serialize data to JSON for JavaScript
    students_data = [student.to_dict() for student in students_list]
    courses_data = [course.to_dict() for course in courses]

    context = {
        "students": students_list,
        "students_json": json.dumps(students_data, cls=DjangoJSONEncoder),
        "courses_json": json.dumps(courses_data, cls=DjangoJSONEncoder),
        "teacher_first_name": request.user.first_name,
    }

    return render(request, "students/grades.html", context)
