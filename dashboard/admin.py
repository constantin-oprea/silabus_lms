from django.contrib import admin
from .models import Group, Course, CourseSchedule, CourseStudent


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ["name", "level", "student_count", "created_at"]
    search_fields = ["name", "level"]
    ordering = ["name"]


class CourseScheduleInline(admin.TabularInline):
    model = CourseSchedule
    extra = 1


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["name", "teacher", "room", "student_count", "created_at"]
    list_filter = ["teacher", "start_date"]
    search_fields = ["name", "description"]
    inlines = [CourseScheduleInline]
    ordering = ["-created_at"]


@admin.register(CourseSchedule)
class CourseScheduleAdmin(admin.ModelAdmin):
    list_display = ["course", "day_of_week", "start_time", "end_time"]
    list_filter = ["day_of_week"]


@admin.register(CourseStudent)
class CourseStudentAdmin(admin.ModelAdmin):
    list_display = ["course", "student", "enrolled_at"]
    list_filter = ["enrolled_at"]
    search_fields = ["course__name", "student__first_name", "student__last_name"]
