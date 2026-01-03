from django.contrib import admin
from .models import Student, StudentNote


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = [
        "full_name",
        "email",
        "group",
        "attendance_rate",
        "average_grade",
        "created_at",
    ]
    list_filter = ["group", "created_at"]
    search_fields = ["first_name", "last_name", "email"]
    ordering = ["last_name", "first_name"]


@admin.register(StudentNote)
class StudentNoteAdmin(admin.ModelAdmin):
    list_display = ["student", "teacher", "created_at"]
    list_filter = ["teacher", "created_at"]
    search_fields = ["student__first_name", "student__last_name", "text"]
    ordering = ["-created_at"]
