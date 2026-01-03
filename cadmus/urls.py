"""
URL configuration for SilabusLMS project.
"""

from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from students import api as students_api

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),
    # Root redirect to dashboard
    path("", lambda request: redirect("dashboard:dashboard", permanent=False)),
    # App URLs
    path("auth/", include("core.urls")),
    path("dashboard/", include("dashboard.urls")),
    path("students/", include("students.urls")),
    path("lessons/", include("lessons.urls")),
    path("settings/", include("settings_app.urls")),
    # API URLs - direct mapping to avoid duplicate 'students' in path
    path("api/students/top/", students_api.top_students_api, name="api_top_students"),
]
