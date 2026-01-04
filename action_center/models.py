"""
Action Center Models for SilabusLMS

These models power the "Casino Slot" ticker on the dashboard:
- Message: Unread messages between teachers/parents
- ForumTopic: Active course discussion threads
- Deadline: Upcoming/missed assignment deadlines

Brand Colors:
- Deep Forest Green: #2C5545
- Cream: #F9F9F7
"""

from django.db import models
from django.conf import settings
from django.utils import timezone


class Message(models.Model):
    """
    Teacher-to-teacher or parent-to-teacher messages.
    Used in the "Unread Messages" slot of the Action Center ticker.
    """

    PRIORITY_CHOICES = [
        ("normal", "Normal"),
        ("urgent", "Urgent"),
    ]

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_messages",
    )
    subject = models.CharField(max_length=200)
    body = models.TextField()
    is_read = models.BooleanField(default=False, db_index=True)
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="normal"
    )

    # Optional course association for filtering
    course = models.ForeignKey(
        "dashboard.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="messages",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Message"
        verbose_name_plural = "Messages"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["recipient", "is_read"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.subject} (from {self.sender})"

    def mark_as_read(self):
        """Mark this message as read."""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=["is_read", "read_at"])

    def to_ticker_dict(self):
        """
        Return data formatted for the Casino Slot ticker animation.
        Designed for quick display with sender and subject preview.
        """
        return {
            "id": self.id,
            "type": "message",
            "icon": "📬",
            "title": self.subject[:50] + ("..." if len(self.subject) > 50 else ""),
            "subtitle": f"From: {self.sender.first_name} {self.sender.last_name[:1]}.",
            "priority": self.priority,
            "timestamp": self.created_at.strftime("%b %d, %I:%M %p"),
            "course_name": self.course.name if self.course else None,
        }

    def to_dict(self):
        """Full message representation for API responses."""
        return {
            "id": self.id,
            "sender_id": self.sender.id,
            "sender_name": self.sender.full_name,
            "recipient_id": self.recipient.id,
            "subject": self.subject,
            "body": self.body,
            "is_read": self.is_read,
            "priority": self.priority,
            "course_id": self.course.id if self.course else None,
            "created_at": self.created_at.isoformat(),
            "read_at": self.read_at.isoformat() if self.read_at else None,
        }


class ForumTopic(models.Model):
    """
    Course discussion forum topics.
    Used in the "Active Topics" slot of the Action Center ticker.
    """

    STATUS_CHOICES = [
        ("open", "Open"),
        ("closed", "Closed"),
        ("resolved", "Resolved"),
    ]

    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="forum_topics",
    )
    course = models.ForeignKey(
        "dashboard.Course",
        on_delete=models.CASCADE,
        related_name="forum_topics",
    )

    # Activity tracking
    replies_count = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)
    last_activity = models.DateTimeField(auto_now=True)

    # Status and visibility
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="open")
    is_pinned = models.BooleanField(default=False)
    is_announcement = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Forum Topic"
        verbose_name_plural = "Forum Topics"
        ordering = ["-is_pinned", "-last_activity"]
        indexes = [
            models.Index(fields=["course", "status"]),
            models.Index(fields=["last_activity"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.course.name})"

    @property
    def is_active(self):
        """Check if topic has recent activity (within last 7 days)."""
        return (timezone.now() - self.last_activity).days < 7

    def to_ticker_dict(self):
        """
        Return data formatted for the Casino Slot ticker animation.
        Shows topic title and reply activity.
        """
        return {
            "id": self.id,
            "type": "forum_topic",
            "icon": "💬",
            "title": self.title[:50] + ("..." if len(self.title) > 50 else ""),
            "subtitle": f"{self.replies_count} replies • {self.course.name}",
            "is_pinned": self.is_pinned,
            "is_announcement": self.is_announcement,
            "timestamp": self.last_activity.strftime("%b %d"),
            "course_name": self.course.name,
        }

    def to_dict(self):
        """Full topic representation for API responses."""
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "author_id": self.author.id,
            "author_name": self.author.full_name,
            "course_id": self.course.id,
            "course_name": self.course.name,
            "replies_count": self.replies_count,
            "views_count": self.views_count,
            "status": self.status,
            "is_pinned": self.is_pinned,
            "is_announcement": self.is_announcement,
            "last_activity": self.last_activity.isoformat(),
            "created_at": self.created_at.isoformat(),
        }


class Deadline(models.Model):
    """
    Assignment, exam, or project deadlines.
    Used in the "Missed Deadlines" slot of the Action Center ticker.
    """

    DEADLINE_TYPE_CHOICES = [
        ("assignment", "Assignment"),
        ("exam", "Exam"),
        ("project", "Project"),
        ("presentation", "Presentation"),
        ("other", "Other"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    deadline_type = models.CharField(
        max_length=20, choices=DEADLINE_TYPE_CHOICES, default="assignment"
    )
    due_date = models.DateTimeField(db_index=True)
    priority = models.CharField(
        max_length=10, choices=PRIORITY_CHOICES, default="medium"
    )

    # Course association
    course = models.ForeignKey(
        "dashboard.Course",
        on_delete=models.CASCADE,
        related_name="deadlines",
    )

    # Status tracking
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Creator
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_deadlines",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Deadline"
        verbose_name_plural = "Deadlines"
        ordering = ["due_date"]
        indexes = [
            models.Index(fields=["course", "due_date"]),
            models.Index(fields=["is_completed", "due_date"]),
        ]

    def __str__(self):
        return f"{self.title} - Due: {self.due_date.strftime('%b %d')}"

    @property
    def is_overdue(self):
        """Check if deadline has passed and is not completed."""
        return not self.is_completed and self.due_date < timezone.now()

    @property
    def is_upcoming(self):
        """Check if deadline is within the next 3 days."""
        if self.is_completed:
            return False
        time_until = self.due_date - timezone.now()
        return 0 <= time_until.days <= 3

    @property
    def days_remaining(self):
        """Calculate days until/since deadline."""
        delta = self.due_date - timezone.now()
        return delta.days

    def mark_complete(self):
        """Mark this deadline as completed."""
        if not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save(update_fields=["is_completed", "completed_at"])

    def to_ticker_dict(self):
        """
        Return data formatted for the Casino Slot ticker animation.
        Highlights overdue status and urgency.
        """
        if self.is_overdue:
            status_icon = "🔴"
            status_text = f"{abs(self.days_remaining)} days overdue"
        elif self.is_upcoming:
            status_icon = "🟠"
            status_text = f"Due in {self.days_remaining} days"
        else:
            status_icon = "🟢"
            status_text = f"Due {self.due_date.strftime('%b %d')}"

        return {
            "id": self.id,
            "type": "deadline",
            "icon": status_icon,
            "title": self.title[:50] + ("..." if len(self.title) > 50 else ""),
            "subtitle": f"{status_text} • {self.course.name}",
            "priority": self.priority,
            "is_overdue": self.is_overdue,
            "is_upcoming": self.is_upcoming,
            "deadline_type": self.deadline_type,
            "due_date": self.due_date.strftime("%b %d, %I:%M %p"),
            "course_name": self.course.name,
        }

    def to_dict(self):
        """Full deadline representation for API responses."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "deadline_type": self.deadline_type,
            "due_date": self.due_date.isoformat(),
            "priority": self.priority,
            "course_id": self.course.id,
            "course_name": self.course.name,
            "is_completed": self.is_completed,
            "is_overdue": self.is_overdue,
            "is_upcoming": self.is_upcoming,
            "days_remaining": self.days_remaining,
            "created_by_id": self.created_by.id,
            "created_at": self.created_at.isoformat(),
        }
