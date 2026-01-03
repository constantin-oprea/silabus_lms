# Context processor to provide common data to all templates
from students.models import Student
from django.core.serializers.json import DjangoJSONEncoder
import json


def common_context(request):
    """Provide common data to all templates like Top 10 Students."""
    if request.user.is_authenticated:
        # Get top 10 students by average grade
        top_students = Student.objects.all().order_by("-average_grade")[:10]
        top_students_data = [student.to_dict() for student in top_students]

        return {
            "top_students_json": json.dumps(top_students_data, cls=DjangoJSONEncoder),
        }
    return {}
