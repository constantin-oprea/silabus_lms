from django.db import models
from django.utils import timezone
from datetime import timedelta
# If you have a Course model, import it here. If not, we can link it later.
# from courses.models import Course


class Event(models.Model):
    TYPE_CHOICES = [
        ("CLASS", "Regular Class"),
        ("EXAM", "Examination"),
        ("DEADLINE", "Assignment Deadline"),
        ("HOLIDAY", "Holiday"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="CLASS")

    # The core timing fields
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    # Link to a course (Optional for now, strictly needed later)
    # course = models.ForeignKey('courses.Course', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return f"{self.title} ({self.start_time.strftime('%b %d, %H:%M')})"

    @property
    def is_upcoming(self):
        return self.start_time > timezone.now()

    @property
    def minutes_until_start(self):
        """Calculates minutes remaining for the Header Countdown"""
        now = timezone.now()
        if now > self.start_time:
            return 0
        delta = self.start_time - now
        return int(delta.total_seconds() / 60)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "event_type": self.event_type,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat(),
            # Frontend compat
            "event_date": self.start_time.date().isoformat(),
        }


class Session(models.Model):
    """
    Represents a weekly scheduled session for a course.
    Used for the 'Weekly Schedule' section and countdown display.
    """

    WEEKDAY_CHOICES = [
        ("monday", "Monday"),
        ("tuesday", "Tuesday"),
        ("wednesday", "Wednesday"),
        ("thursday", "Thursday"),
        ("friday", "Friday"),
    ]

    course = models.ForeignKey(
        "dashboard.Course", on_delete=models.CASCADE, related_name="sessions"
    )
    day_of_week = models.CharField(
        max_length=10,
        choices=WEEKDAY_CHOICES,
        default="monday",
        help_text="Day of the week",
    )
    start_time = models.TimeField(
        default="08:00", help_text="Start time in 24-hour format (HH:MM)"
    )
    end_time = models.TimeField(
        default="09:00", help_text="End time in 24-hour format (HH:MM)"
    )
    room = models.CharField(max_length=100, default="", help_text='e.g., "Room 101"')

    class Meta:
        verbose_name = "Session"
        verbose_name_plural = "Sessions"
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        return f"{self.course.name} - {self.get_day_of_week_display()} {self.start_time.strftime('%H:%M')}"

    def format_time_display(self, time_obj):
        """Format time for display: show AM only for morning, hide suffix for PM."""
        hour = time_obj.hour
        if hour < 12:
            return time_obj.strftime("%I:%M AM").lstrip("0")
        else:
            return time_obj.strftime("%H:%M")

    @property
    def start_time_display(self):
        """Return formatted start time for frontend display."""
        return self.format_time_display(self.start_time)

    @property
    def end_time_display(self):
        """Return formatted end time for frontend display."""
        return self.format_time_display(self.end_time)

    def to_dict(self):
        """Return a dictionary representation of the session."""
        return {
            "id": self.id,
            "course_id": self.course.id,
            "course_name": self.course.name,
            "day_of_week": self.day_of_week,
            "day_of_week_display": self.get_day_of_week_display(),
            "start_time": self.start_time.strftime("%H:%M"),
            "end_time": self.end_time.strftime("%H:%M"),
            "start_time_display": self.start_time_display,
            "end_time_display": self.end_time_display,
            "room": self.room,
        }
