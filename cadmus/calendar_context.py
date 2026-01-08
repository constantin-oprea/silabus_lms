"""
Calendar context processor for SilabusLMS.
Provides global calendar and events data to all templates.
"""

from events.models import Event
from students.models import Student
from core.models import User
import json
from django.core.serializers.json import DjangoJSONEncoder


def calendar_context(request):
    """
    Provide global calendar and events data to all templates.
    This ensures the calendar component has consistent data across all pages.
    """
    if request.user.is_authenticated:
        # Get all events for the calendar
        events = Event.objects.all().order_by("start_time")
        events_data = [event.to_dict() for event in events]

        # Get top 10 students (reuse existing logic)
        from students.models import Student

        top_students = Student.objects.select_related("group").order_by(
            "-average_grade"
        )[:10]
        top_students_data = []

        for student in top_students:
            top_students_data.append(
                {
                    "id": student.id,
                    "name": student.full_name,
                    "room": student.group.name if student.group else "N/A",
                    "courses": "Multiple Courses",  # Simplified for now
                    "avatar": student.avatar_url
                    or f"/static/images/student_avatars/{student.first_name}_{student.last_name}.jpg",
                }
            )

        return {
            "global_events_json": json.dumps(events_data, cls=DjangoJSONEncoder),
            "global_events_count": events.count(),
            "top_students_json": json.dumps(top_students_data, cls=DjangoJSONEncoder),
        }

    return {
        "global_events_json": "[]",
        "global_events_count": 0,
        "top_students_json": "[]",
    }
