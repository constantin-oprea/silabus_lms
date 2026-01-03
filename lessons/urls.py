from django.urls import path
from . import views

app_name = "lessons"

urlpatterns = [
    path("", views.lesson_plans_view, name="lesson_plans"),
]
