from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "event_type",
        "event_date",
        "start_time",
        "creator",
        "created_at",
    ]
    list_filter = ["event_type", "event_date", "creator"]
    search_fields = ["title", "notes"]
    ordering = ["-event_date", "start_time"]
    filter_horizontal = ["assigned_courses", "assigned_groups"]
