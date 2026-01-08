from django.urls import path
from . import views

app_name = "dashboard"

urlpatterns = [
    path("", views.dashboard_view, name="dashboard"),
    path("schedule/", views.schedule_view, name="schedule"),
    path("create-course/", views.create_course, name="create_course"),
    path("my-courses/", views.my_courses_view, name="my_courses"),
]
