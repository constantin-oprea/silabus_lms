from django.db import models
from django.conf import settings


class Group(models.Model):
    """
    Student groups/classes (e.g., III A, IV B, 2nd Primary).
    Represents a class or cohort of students.
    """

    name = models.CharField(max_length=50, unique=True, help_text='e.g., "III A"')
    level = models.CharField(
        max_length=50, blank=True, help_text='e.g., "High School", "Primary"'
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Group"
        verbose_name_plural = "Groups"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def student_count(self):
        """Return the number of students in this group."""
        return self.students.count()

    def to_dict(self):
        """Return a dictionary representation of the group."""
        return {
            "id": self.id,
            "name": self.name,
            "level": self.level,
            "description": self.description,
            "student_count": self.student_count,
        }


class Course(models.Model):
    """
    Courses taught by teachers.
    Each course is associated with a teacher and can have multiple students enrolled.
    """

    name = models.CharField(max_length=100, help_text='e.g., "Philosophy"')
    description = models.TextField(blank=True)
    room = models.CharField(max_length=50, blank=True, help_text='e.g., "III A"')
    icon_url = models.CharField(max_length=500, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)

    # Relationships
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="courses"
    )
    students = models.ManyToManyField(
        "students.Student",
        through="CourseStudent",
        related_name="enrolled_courses",
        blank=True,
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Course"
        verbose_name_plural = "Courses"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    @property
    def student_count(self):
        """Return the number of students enrolled in this course."""
        return self.students.count()

    def to_dict(self):
        """Return a dictionary representation of the course."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "room": self.room,
            "icon_url": self.icon_url,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "student_count": self.student_count,
            "schedules": [s.to_dict() for s in self.schedules.all()],
        }


class CourseSchedule(models.Model):
    """
    Weekly schedule for courses (day + time).
    Each course can have multiple schedule entries (e.g., Monday 8AM, Wednesday 10AM).
    """

    WEEKDAY_CHOICES = [
        ("Monday", "Monday"),
        ("Tuesday", "Tuesday"),
        ("Wednesday", "Wednesday"),
        ("Thursday", "Thursday"),
        ("Friday", "Friday"),
        ("Saturday", "Saturday"),
        ("Sunday", "Sunday"),
    ]

    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="schedules"
    )
    day_of_week = models.CharField(max_length=10, choices=WEEKDAY_CHOICES)
    start_time = models.CharField(max_length=10, help_text='e.g., "08:15 AM"')
    end_time = models.CharField(max_length=10, help_text='e.g., "09:45 AM"')

    class Meta:
        verbose_name = "Course Schedule"
        verbose_name_plural = "Course Schedules"
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        return (
            f"{self.course.name} - {self.day_of_week} {self.start_time}-{self.end_time}"
        )

    def to_dict(self):
        """Return a dictionary representation of the schedule."""
        return {
            "id": self.id,
            "day": self.day_of_week,
            "start_time": self.start_time,
            "end_time": self.end_time,
        }


class CourseStudent(models.Model):
    """
    Through model for the many-to-many relationship between Course and Student.
    Allows tracking enrollment dates and other metadata.
    """

    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Course Enrollment"
        verbose_name_plural = "Course Enrollments"
        unique_together = ["course", "student"]

    def __str__(self):
        return f"{self.student} enrolled in {self.course}"
