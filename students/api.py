# API views for students app
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .models import Student


@login_required
def top_students_api(request):
    """API endpoint to get top 10 students by average grade."""
    # Get top 10 students ordered by average grade
    top_students = Student.objects.all().order_by("-average_grade")[:10]

    # Serialize to JSON
    students_data = [student.to_dict() for student in top_students]

    return JsonResponse(students_data, safe=False)
