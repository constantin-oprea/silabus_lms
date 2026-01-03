from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from .models import LessonPlan
from dashboard.models import Course


@login_required
def lesson_plans_view(request):
    """Lesson plans list view."""
    # Get all courses for the teacher
    courses = Course.objects.filter(teacher=request.user)

    # Get all lesson plans for teacher's courses
    lesson_plans = (
        LessonPlan.objects.filter(course__teacher=request.user)
        .select_related("course")
        .order_by("-lesson_date", "-created_at")
    )

    context = {
        "courses": courses,
        "lesson_plans": lesson_plans,
    }

    return render(request, "lessons/lesson_plans.html", context)
