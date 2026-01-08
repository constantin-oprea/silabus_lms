from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.http import JsonResponse
from django.utils import timezone
from django.core.serializers.json import DjangoJSONEncoder
from datetime import datetime, timedelta
import json
from .models import Course
from events.models import Event, Session
from students.models import Student


def get_next_session():
    """
    Find the next upcoming session based on current day and time.
    Returns the session and minutes until it starts.
    """
    now = timezone.localtime()
    current_day = now.strftime("%A").lower()
    current_time = now.time()

    # Weekday order for comparison
    weekday_order = ["monday", "tuesday", "wednesday", "thursday", "friday"]

    # Try to find a session today that hasn't started yet
    # Filter out sessions with null start_time
    today_sessions = Session.objects.filter(
        day_of_week=current_day,
        start_time__gt=current_time,
        start_time__isnull=False,
    ).order_by("start_time")

    if today_sessions.exists():
        session = today_sessions.first()
        if session.start_time:
            # Calculate minutes until start
            start_datetime = datetime.combine(now.date(), session.start_time)
            start_datetime = timezone.make_aware(start_datetime)
            delta = start_datetime - now
            minutes = int(delta.total_seconds() / 60)
            return session, minutes

    # Look for sessions on future days this week
    try:
        current_day_idx = weekday_order.index(current_day)
    except ValueError:
        current_day_idx = -1

    for i in range(1, 7):  # Check up to 7 days ahead
        future_day_idx = (current_day_idx + i) % 5  # Wrap around within Mon-Fri
        if future_day_idx <= current_day_idx and i <= 5:
            # We've wrapped to next week
            days_ahead = 7 - current_day_idx + future_day_idx
        else:
            days_ahead = (
                i if future_day_idx > current_day_idx else 7 - 5 + future_day_idx + 1
            )

        future_day = weekday_order[future_day_idx]
        future_sessions = Session.objects.filter(
            day_of_week=future_day, start_time__isnull=False
        ).order_by("start_time")

        if future_sessions.exists():
            session = future_sessions.first()
            if session.start_time:
                # Calculate minutes until start
                future_date = now.date() + timedelta(days=days_ahead)
                start_datetime = datetime.combine(future_date, session.start_time)
                start_datetime = timezone.make_aware(start_datetime)
                delta = start_datetime - now
                minutes = int(delta.total_seconds() / 60)
                return session, minutes

    return None, 0


@login_required
def my_courses_view(request):
    """View to display all courses for the logged-in teacher."""
    courses = (
        Course.objects.filter(teacher=request.user)
        .prefetch_related("students", "sessions")
        .order_by("name")
    )

    context = {
        "courses": courses,
    }
    return render(request, "dashboard/my_courses.html", context)


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
    today = timezone.now()
    upcoming_events = Event.objects.filter(start_time__gte=today).order_by(
        "start_time"
    )[:10]

    # Get the closest upcoming session for the dashboard header countdown
    next_session, minutes_to_start = get_next_session()

    # Serialize data to JSON for JavaScript (matching Flask's tojson filter)
    courses_data = [course.to_dict() for course in courses]
    students_data = [student.to_dict() for student in students]
    events_data = [event.to_dict() for event in upcoming_events]

    # Add minutes_to_start to session data
    if next_session:
        next_session_data = next_session.to_dict()
        next_session_data["minutes_to_start"] = minutes_to_start
    else:
        next_session_data = None

    context = {
        "courses": courses,
        "upcoming_events": upcoming_events,
        "students_json": json.dumps(students_data, cls=DjangoJSONEncoder),
        "events_json": json.dumps(events_data, cls=DjangoJSONEncoder),
        "courses_json": json.dumps(courses_data, cls=DjangoJSONEncoder),
        "next_session_json": json.dumps(next_session_data, cls=DjangoJSONEncoder),
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


@login_required
def create_course(request):
    """
    Handle creation of a new course via AJAX.
    """
    if request.method == "POST":
        try:
            # Extract data
            name = request.POST.get("name")
            abbreviation = request.POST.get("abbreviation", "")
            section_group = request.POST.get("section_group", "")
            grade_level = request.POST.get("grade_level", "")
            color = request.POST.get("color", "#4A8B6F")  # Default color
            room = request.POST.get("room", "")
            description = request.POST.get("description", "")
            start_date = request.POST.get("start_date") or None
            end_date = request.POST.get("end_date") or None

            # Grading systems (sent as 'grading_systems[]')
            grading_systems = request.POST.getlist("grading_systems[]")

            # Create Course
            course = Course.objects.create(
                name=name,
                abbreviation=abbreviation,
                section_group=section_group,
                grade_level=grade_level,
                color=color,
                room=room,
                description=description,
                start_date=start_date,
                end_date=end_date,
                grading_systems=grading_systems,
                teacher=request.user,
            )

            # Handle Syllabus & Image
            if "syllabus" in request.FILES:
                course.syllabus = request.FILES["syllabus"]

            if "image" in request.FILES:
                course.image = request.FILES["image"]

            course.save()

            # Handle Sessions (Schedule)
            # Expecting data like:
            # schedule[0][day], schedule[0][start], schedule[0][end], schedule[0][room]
            # Since we can't iterate easily over unknown indices in request.POST,
            # we rely on the frontend sending a JSON string or a known structure.
            # Best approach for dynamic rows: Parse a JSON string field 'schedule_json'

            schedule_json = request.POST.get("schedule_json")
            if schedule_json:
                schedule_data = json.loads(schedule_json)
                for session_item in schedule_data:
                    day = session_item.get("day")
                    start_time_str = session_item.get("start_time")  # HH:MM
                    end_time_str = session_item.get("end_time")  # HH:MM
                    room = session_item.get("room", "")

                    if day and start_time_str and end_time_str:
                        Session.objects.create(
                            course=course,
                            day_of_week=day.lower(),
                            start_time=start_time_str,
                            end_time=end_time_str,
                            room=room,
                        )

            return JsonResponse(
                {
                    "status": "success",
                    "message": "Course created successfully",
                    "course": course.to_dict(),
                }
            )

        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)

    return JsonResponse(
        {"status": "error", "message": "Invalid request method"}, status=405
    )
