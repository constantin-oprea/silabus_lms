from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
import json
from .models import Course
from events.models import Event
from students.models import Student


@login_required
def dashboard_view(request):
    """Main dashboard view with data serialization for JavaScript."""
    # Get teacher's courses
    courses = Course.objects.filter(teacher=request.user).prefetch_related(
        "students", "schedules"
    )

    # Get all students for the top 10 list
    students = Student.objects.all().order_by("-average_grade")[:10]

    # Get upcoming events
    today = timezone.now().date()
    upcoming_events = Event.objects.filter(event_date__gte=today).order_by(
        "event_date"
    )[:10]

    # Serialize data to JSON for JavaScript (matching Flask's tojson filter)
    courses_data = [course.to_dict() for course in courses]
    students_data = [student.to_dict() for student in students]
    events_data = [event.to_dict() for event in upcoming_events]

    context = {
        "courses": courses,
        "upcoming_events": upcoming_events,
        "students_json": json.dumps(students_data, cls=DjangoJSONEncoder),
        "events_json": json.dumps(events_data, cls=DjangoJSONEncoder),
        "courses_json": json.dumps(courses_data, cls=DjangoJSONEncoder),
    }

    return render(request, "dashboard/dashboard.html", context)


@login_required
def schedule_view(request):
    """Weekly schedule view."""
    # Get all courses with their schedules
    courses = Course.objects.filter(teacher=request.user).prefetch_related("schedules")

    context = {
        "courses": courses,
    }

    return render(request, "dashboard/schedule.html", context)
