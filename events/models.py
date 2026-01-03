from django.db import models
from django.conf import settings


class Event(models.Model):
    """
    Calendar events (meetings, exams, homework, oral presentations, etc.).
    Events can be associated with specific courses or groups.
    """

    EVENT_TYPE_CHOICES = [
        ("meeting", "Meeting"),
        ("exam", "Exam"),
        ("homework", "Homework"),
        ("oral_presentation", "Oral Presentation"),
        ("project", "Project"),
        ("field_trip", "Field Trip"),
        ("other", "Other"),
    ]

    title = models.CharField(max_length=200)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPE_CHOICES)
    event_date = models.DateField(db_index=True)
    start_time = models.CharField(
        max_length=10, blank=True, help_text='e.g., "10:00 AM"'
    )
    duration_minutes = models.IntegerField(default=60)
    notes = models.TextField(blank=True)
    participants = models.TextField(blank=True, help_text="Comma-separated names")

    # Relationships
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="events",
        null=True,
        blank=True,
    )
    assigned_courses = models.ManyToManyField(
        "dashboard.Course", related_name="events", blank=True
    )
    assigned_groups = models.ManyToManyField(
        "dashboard.Group", related_name="events", blank=True
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Legacy fields for backward compatibility (optional, can be removed later)
    date = models.CharField(max_length=10, blank=True, help_text='Legacy: e.g., "22"')
    month = models.CharField(max_length=10, blank=True, help_text='Legacy: e.g., "DEC"')
    time = models.CharField(
        max_length=100, blank=True, help_text='Legacy: e.g., "10:00 AM • Class A"'
    )
    type = models.CharField(
        max_length=50, blank=True, help_text='Legacy: e.g., "type-exam"'
    )

    class Meta:
        verbose_name = "Event"
        verbose_name_plural = "Events"
        ordering = ["event_date", "start_time"]

    def __str__(self):
        return f"{self.title} on {self.event_date}"

    def to_dict(self):
        """Return a dictionary representation of the event."""
        return {
            "id": self.id,
            "title": self.title,
            "event_type": self.event_type,
            "event_date": self.event_date.isoformat() if self.event_date else None,
            "start_time": self.start_time,
            "duration_minutes": self.duration_minutes,
            "notes": self.notes,
            "participants": self.participants.split("\n") if self.participants else [],
            # Legacy format for backward compatibility
            "date": self.date or (str(self.event_date.day) if self.event_date else ""),
            "month": self.month
            or (self.event_date.strftime("%b").upper() if self.event_date else ""),
            "time": self.time or self.start_time,
            "type": self.type or f"type-{self.event_type}",
        }
