from django.contrib import admin
from .models import LessonPlan


@admin.register(LessonPlan)
class LessonPlanAdmin(admin.ModelAdmin):
    list_display = ["title", "course", "lesson_date", "status", "created_at"]
    list_filter = ["status", "course", "lesson_date"]
    search_fields = ["title", "objectives", "content"]
    ordering = ["-lesson_date", "-created_at"]
