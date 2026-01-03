from django.urls import path
from . import views

app_name = "students"

urlpatterns = [
    # Page views
    path("", views.students_view, name="students"),
    path("grades/", views.grades_view, name="grades"),
    # API endpoints - import here to avoid circular import
    path(
        "api/top/",
        lambda request: __import__(
            "students.api", fromlist=["top_students_api"]
        ).top_students_api(request),
        name="api_top_students",
    ),
]
