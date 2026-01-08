from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["title", "event_type", "start_time", "end_time", "is_upcoming"]
    list_filter = ["event_type", "start_time"]
    search_fields = ["title", "description"]
