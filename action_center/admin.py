from django.contrib import admin
from .models import Message, ForumTopic, Deadline


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """Admin configuration for Message model."""

    list_display = [
        "subject",
        "sender",
        "recipient",
        "is_read",
        "priority",
        "created_at",
    ]
    list_filter = ["is_read", "priority", "created_at", "course"]
    search_fields = ["subject", "body", "sender__email", "recipient__email"]
    date_hierarchy = "created_at"
    readonly_fields = ["created_at", "read_at"]


@admin.register(ForumTopic)
class ForumTopicAdmin(admin.ModelAdmin):
    """Admin configuration for ForumTopic model."""

    list_display = [
        "title",
        "course",
        "author",
        "replies_count",
        "status",
        "is_pinned",
        "last_activity",
    ]
    list_filter = ["status", "is_pinned", "is_announcement", "course", "created_at"]
    search_fields = ["title", "content", "author__email"]
    date_hierarchy = "created_at"
    readonly_fields = ["replies_count", "views_count", "last_activity", "created_at"]


@admin.register(Deadline)
class DeadlineAdmin(admin.ModelAdmin):
    """Admin configuration for Deadline model."""

    list_display = [
        "title",
        "course",
        "deadline_type",
        "due_date",
        "priority",
        "is_completed",
    ]
    list_filter = ["deadline_type", "priority", "is_completed", "course", "due_date"]
    search_fields = ["title", "description"]
    date_hierarchy = "due_date"
    readonly_fields = ["created_at", "updated_at", "completed_at"]
