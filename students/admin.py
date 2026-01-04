from django.contrib import admin
from .models import (
    Student,
    StudentNote,
    Grade,
    Interest,
    AttendanceRecord,
    TeacherObservation,
    Task,
)


@admin.register(Interest)
class InterestAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "icon"]
    list_filter = ["category"]
    search_fields = ["name"]
    ordering = ["category", "name"]


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = [
        "full_name",
        "email",
        "group",
        "tutor_name",
        "attendance_rate",
        "average_grade",
        "letter_grade",
    ]
    list_filter = ["group", "created_at"]
    search_fields = ["first_name", "last_name", "email"]
    filter_horizontal = ["interests"]
    ordering = ["last_name", "first_name"]
    readonly_fields = ["average_grade", "letter_grade"]

    fieldsets = (
        ("Identity", {"fields": ("first_name", "last_name", "email", "avatar_url")}),
        ("Academics", {"fields": ("group", "tutor", "teacher_tutor")}),
        ("Profile", {"fields": ("birthday", "interests", "hobbies")}),
        (
            "Metrics",
            {
                "fields": (
                    "attendance_rate",
                    "average_grade",
                    "letter_grade",
                ),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = [
        "student",
        "course",
        "grade_type",
        "title",
        "display_grade",
        "date_recorded",
    ]
    list_filter = ["course", "grade_type", "date_recorded"]
    search_fields = ["student__first_name", "student__last_name", "title"]
    date_hierarchy = "date_recorded"
    ordering = ["-date_recorded"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "course", "grade_type", "due_date", "max_score"]
    list_filter = ["course", "grade_type", "due_date"]
    search_fields = ["title"]
    date_hierarchy = "due_date"


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = [
        "student",
        "course",
        "month",
        "attendance_percentage",
        "classes_attended",
        "classes_total",
    ]
    list_filter = ["course", "month"]
    search_fields = ["student__first_name", "student__last_name"]
    date_hierarchy = "month"
    ordering = ["-month"]


@admin.register(TeacherObservation)
class TeacherObservationAdmin(admin.ModelAdmin):
    list_display = ["student", "teacher", "observation_type", "is_public", "created_at"]
    list_filter = ["observation_type", "is_public", "course", "created_at"]
    search_fields = ["student__first_name", "student__last_name", "text"]
    date_hierarchy = "created_at"
    ordering = ["-created_at"]


@admin.register(StudentNote)
class StudentNoteAdmin(admin.ModelAdmin):
    list_display = ["student", "teacher", "created_at"]
    list_filter = ["teacher", "created_at"]
    search_fields = ["student__first_name", "student__last_name", "text"]
    ordering = ["-created_at"]
