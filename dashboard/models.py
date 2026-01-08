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

    GRADE_LEVEL_CHOICES = [
        ("K3", "Kindergarten 3 years"),
        ("K4", "Kindergarten 4 years"),
        ("K5", "Kindergarten 5 years"),
        ("1P", "1st Primary"),
        ("2P", "2nd Primary"),
        ("3P", "3rd Primary"),
        ("4P", "4th Primary"),
        ("5P", "5th Primary"),
        ("6P", "6th Primary"),
        ("1HS", "I High School"),
        ("2HS", "II High School"),
        ("3HS", "III High School"),
        ("4HS", "IV High School"),
        ("5HS", "V High School"),
    ]

    GRADING_SYSTEM_OPTIONS = [
        ("official", "Official (AD, A, B, C)"),
        ("numeric", "Numeric (0-20)"),
        ("percentage", "Percentage (0-100%)"),
        ("gamified", "Gamified (Stars/Points)"),
    ]

    # Identity Fields
    name = models.CharField(max_length=100, help_text='e.g., "Philosophy"')
    abbreviation = models.CharField(max_length=10, blank=True, help_text='e.g., "PHIL"')
    color = models.CharField(
        max_length=7, blank=True, help_text='Hex color code, e.g., "#4A8B6F"'
    )
    section_group = models.CharField(
        max_length=20, blank=True, help_text='e.g., "IIIA"'
    )

    # Grade Level (single choice)
    grade_level = models.CharField(
        max_length=5,
        choices=GRADE_LEVEL_CHOICES,
        blank=True,
        help_text="Grade level for this course",
    )

    # Grading Systems (multi-select, stored as JSON list)
    grading_systems = models.JSONField(
        default=list,
        blank=True,
        help_text='List of grading systems, e.g., ["numeric", "gamified"]',
    )

    # Syllabus (PDF only)
    syllabus = models.FileField(
        upload_to="syllabi/",
        blank=True,
        null=True,
        help_text="Upload syllabus PDF",
    )

    # Course Image
    image = models.ImageField(
        upload_to="course_images/",
        blank=True,
        null=True,
        help_text="Upload course cover image",
    )

    # Legacy fields (kept for compatibility)
    description = models.TextField(blank=True)
    room = models.CharField(max_length=50, blank=True, help_text='e.g., "Room 101"')
    icon_url = models.CharField(max_length=500, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)

    # Enrollment code for easy student registration
    enrollment_code = models.CharField(
        max_length=8,
        unique=True,
        blank=True,
        null=True,
        help_text="Unique code for student enrollment",
    )

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

    def generate_enrollment_code(self):
        """Generate a unique 8-character enrollment code."""
        import random
        import string

        while True:
            code = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
            if not Course.objects.filter(enrollment_code=code).exists():
                return code

    def save(self, *args, **kwargs):
        """Override save to generate enrollment code if not set."""
        if not self.enrollment_code:
            self.enrollment_code = self.generate_enrollment_code()
        super().save(*args, **kwargs)

    @property
    def student_count(self):
        """Return the number of students enrolled in this course."""
        return self.students.count()

    def get_grade_level_display_full(self):
        """Return the full display name for the grade level."""
        return dict(self.GRADE_LEVEL_CHOICES).get(self.grade_level, "")

    def get_grading_systems_display(self):
        """Return display names for selected grading systems."""
        options_dict = dict(self.GRADING_SYSTEM_OPTIONS)
        return [options_dict.get(gs, gs) for gs in (self.grading_systems or [])]

    @property
    def days_display(self):
        """Return the days string for the course schedule."""
        # Calculate days string from Sessions
        days_list = sorted(list(set([s.day_of_week for s in self.sessions.all()])))
        # Map full names to short (monday -> Mon)
        days_map = {
            "monday": "Mon",
            "tuesday": "Tue",
            "wednesday": "Wed",
            "thursday": "Thu",
            "friday": "Fri",
            "saturday": "Sat",
            "sunday": "Sun",
        }
        return ", ".join([days_map.get(d.lower(), d.capitalize()) for d in days_list])

    def to_dict(self):
        """Return a dictionary representation of the course."""

        return {
            "id": self.id,
            "name": self.name,
            "abbreviation": self.abbreviation,
            "color": self.color,
            "section_group": self.section_group,
            "grade_level": self.grade_level,
            "grade_level_display": self.get_grade_level_display_full(),
            "grading_systems": self.grading_systems or [],
            "syllabus_url": self.syllabus.url if self.syllabus else None,
            "description": self.description,
            "room": self.room,
            "icon_url": self.image.url if self.image else (self.icon_url or None),
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "student_count": self.student_count,
            # Frontend Compatibility Fields for dashboard-new.js
            "grade": self.section_group,  # Maps 'grade' to section group (e.g. "III A")
            "days": self.days_display,  # e.g. "Mon, Wed"
            "schedules": [],  # Legacy
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
