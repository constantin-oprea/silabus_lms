"""
Student Profile Models for SilabusLMS

Based on the Student Profile UI, this module contains:
- Student: Core student identity with tutor reference
- Interest: Tags for psychographics ("Pop Music", "Basketball")
- Grade: Individual grades with numeric (0-20) and letter values
- AttendanceRecord: Monthly attendance snapshots for charts
- TeacherObservation: Timestamped teacher notes (alias for StudentNote)

Peruvian Grading System (0-20):
- AD (Logro Destacado): 18-20
- A (Logro Esperado): 14-17
- B (En Proceso): 11-13
- C (En Inicio): 0-10
"""

from django.db import models
from django.conf import settings


# ============================================
# INTEREST (Many-to-Many with Student)
# ============================================


class Interest(models.Model):
    """
    Interest tags for student psychographics.
    Examples: "Pop Music", "Basketball", "K-Pop", "Reading"

    Used for filtering students by interest and displayed in
    the "I Like To..." section of the Student Profile.
    """

    CATEGORY_CHOICES = [
        ("music", "Music"),
        ("sports", "Sports"),
        ("hobbies", "Hobbies"),
        ("academic", "Academic"),
        ("arts", "Arts"),
        ("technology", "Technology"),
        ("other", "Other"),
    ]

    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(
        max_length=20, choices=CATEGORY_CHOICES, default="other"
    )
    icon = models.CharField(max_length=50, blank=True, help_text="Emoji or icon class")
    description = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Interest"
        verbose_name_plural = "Interests"
        ordering = ["category", "name"]

    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "icon": self.icon,
        }


# ============================================
# STUDENT (Enhanced with Tutor & Interests M2M)
# ============================================


class Student(models.Model):
    """
    Students enrolled in courses.

    UI Fields Supported:
    - Photo: avatar_url
    - Name: first_name + last_name
    - Course: group.name (e.g., "Philosophy IIIA")
    - Tutor: self-referencing FK for mentor/tutor relationship
    - Date of Birth: birthday
    - "I Like To...": interests (M2M to Interest)
    - Attendance: attendance_rate (current), attendance_records (historical)
    - Average Grade: average_grade (computed)
    """

    # Identity
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True, blank=True, null=True, db_index=True)
    avatar_url = models.CharField(max_length=500, blank=True, null=True)

    # Group/Class membership
    group = models.ForeignKey(
        "dashboard.Group",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )

    # Tutor relationship (self-referencing for peer mentorship or teacher FK)
    tutor = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mentees",
        help_text="Tutor/mentor for this student (can be another student)",
    )

    # Alternative: Teacher as tutor
    teacher_tutor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tutored_students",
        help_text="Teacher assigned as tutor",
    )

    # Bio & Personal Info
    birthday = models.DateField(blank=True, null=True, help_text="Date of Birth")

    # Psychographics - Many-to-Many with Interest model
    interests = models.ManyToManyField(
        Interest,
        related_name="students",
        blank=True,
        help_text="Student interests (e.g., Pop Music, Basketball)",
    )

    # Legacy fields (for backward compatibility)
    hobbies = models.TextField(blank=True, help_text="Comma-separated hobbies (legacy)")
    interests_json = models.JSONField(
        default=dict,
        blank=True,
        help_text='Legacy JSON format: {"music": ["K-Pop"], "sports": ["Soccer"]}',
    )
    social_circle = models.TextField(
        blank=True, help_text="Comma-separated student IDs (friends)"
    )

    # Academic metrics
    attendance_rate = models.FloatField(default=100.0, help_text="Current attendance %")
    average_grade = models.FloatField(default=0.0, help_text="Computed average (0-20)")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Student"
        verbose_name_plural = "Students"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        """Return the student's full name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def course_display(self):
        """Return course name for display (e.g., 'Philosophy IIIA')."""
        if self.group:
            # Try to get enrolled course name
            enrollment = self.enrolled_courses.first()
            if enrollment:
                return f"{enrollment.name} {self.group.name}"
            return self.group.name
        return "No Course"

    @property
    def tutor_name(self):
        """Return tutor's name for display."""
        if self.tutor:
            return self.tutor.full_name
        elif self.teacher_tutor:
            return self.teacher_tutor.full_name
        return None

    @property
    def is_at_risk(self):
        """Check if student is at risk (average grade < 11 = C)."""
        return self.average_grade < 11

    @property
    def letter_grade(self):
        """Convert average grade to Peruvian letter grade."""
        return Grade.numeric_to_letter(self.average_grade)

    def update_average_grade(self):
        """Recalculate average grade from all grades."""
        grades = self.grades.all()
        if grades.exists():
            self.average_grade = sum(g.numeric_score for g in grades) / grades.count()
            self.save(update_fields=["average_grade"])

    def update_attendance_rate(self):
        """Recalculate attendance rate from AttendanceRecords."""
        records = self.attendance_records.all()
        if records.exists():
            self.attendance_rate = (
                sum(r.attendance_percentage for r in records) / records.count()
            )
            self.save(update_fields=["attendance_rate"])

    def get_interest_tags(self):
        """Return list of interest names for display."""
        return list(self.interests.values_list("name", flat=True))

    def get_recent_grades(self, limit=4):
        """Return recent grades for display."""
        return self.grades.order_by("-date_recorded")[:limit]

    def get_attendance_chart_data(self, months=6):
        """Return monthly attendance data for chart."""
        records = self.attendance_records.order_by("-month")[:months]
        return [
            {"month": r.month.strftime("%b"), "percentage": r.attendance_percentage}
            for r in reversed(list(records))
        ]

    def to_dict(self):
        """Convert student to dictionary for JSON serialization."""
        return {
            "id": self.id,
            "name": self.full_name,
            "full_name": self.full_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "avatar_url": self.avatar_url,
            "group": self.group.name if self.group else None,
            "course": self.course_display,
            "tutor": self.tutor_name,
            "birthday": self.birthday.strftime("%m/%d/%Y") if self.birthday else None,
            "interests": self.get_interest_tags(),
            "attendance_rate": self.attendance_rate,
            "attendance": f"{int(self.attendance_rate)}%",
            "average_grade": round(self.average_grade, 1),
            "letter_grade": self.letter_grade,
            "is_at_risk": self.is_at_risk,
            "recent_grades": [g.to_dict() for g in self.get_recent_grades()],
            "attendance_chart": self.get_attendance_chart_data(),
        }

    def to_profile_dict(self):
        """Extended dict for full Student Profile page."""
        base = self.to_dict()
        base.update(
            {
                "observations": [o.to_dict() for o in self.observations.all()[:5]],
                "recent_activity": self._get_recent_activity(),
            }
        )
        return base

    def _get_recent_activity(self):
        """Get recent activity for 'Recent Activity' section."""
        from dashboard.models import CourseStudent

        # This would show students with similar interests or in same group
        # For now, return placeholder
        return []


# ============================================
# GRADE (Numeric 0-20 + Letter)
# ============================================


class Grade(models.Model):
    """
    Individual grade records for students.
    Supports both numeric (0-20 Peruvian scale) and letter grades.

    UI Display: "98 (A)" in Recent Grades section
    """

    GRADE_TYPE_CHOICES = [
        ("homework", "Homework"),
        ("quiz", "Quiz"),
        ("test", "Test"),
        ("presentation", "Presentation"),
        ("participation", "Participation"),
        ("project", "Project"),
        ("exam", "Exam"),
    ]

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="grades", db_index=True
    )
    course = models.ForeignKey(
        "dashboard.Course", on_delete=models.CASCADE, related_name="grades"
    )
    task = models.ForeignKey(
        "Task",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="grades",
        help_text="Optional link to Task model",
    )

    grade_type = models.CharField(max_length=20, choices=GRADE_TYPE_CHOICES)
    title = models.CharField(max_length=200, help_text="Assignment/test name")
    numeric_score = models.FloatField(help_text="Score from 0-20")
    date_recorded = models.DateField(db_index=True)
    notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Grade"
        verbose_name_plural = "Grades"
        ordering = ["-date_recorded"]
        indexes = [
            models.Index(fields=["student", "course"]),
            models.Index(fields=["date_recorded"]),
        ]

    def __str__(self):
        return (
            f"{self.student} - {self.title}: {self.numeric_score} ({self.letter_grade})"
        )

    @property
    def letter_grade(self):
        """Convert numeric score to Peruvian letter grade."""
        return self.numeric_to_letter(self.numeric_score)

    @property
    def display_grade(self):
        """Format for UI display: '98 (A)'."""
        return f"{self.numeric_score:.0f} ({self.letter_grade})"

    @staticmethod
    def numeric_to_letter(score):
        """
        Convert 0-20 numeric score to Peruvian letter grade.

        AD (Logro Destacado): 18-20
        A (Logro Esperado): 14-17
        B (En Proceso): 11-13
        C (En Inicio): 0-10
        """
        if score >= 18:
            return "AD"
        elif score >= 14:
            return "A"
        elif score >= 11:
            return "B"
        return "C"

    @staticmethod
    def letter_to_description(letter):
        """Get Spanish description for letter grade."""
        descriptions = {
            "AD": "Logro Destacado",
            "A": "Logro Esperado",
            "B": "En Proceso",
            "C": "En Inicio",
        }
        return descriptions.get(letter, "Unknown")

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student.id,
            "course_id": self.course.id,
            "course_name": self.course.name,
            "grade_type": self.grade_type,
            "title": self.title,
            "numeric_score": self.numeric_score,
            "letter_grade": self.letter_grade,
            "display_grade": self.display_grade,
            "date_recorded": self.date_recorded.isoformat(),
        }


# ============================================
# TASK (Optional - Links to Grade)
# ============================================


class Task(models.Model):
    """
    Tasks/Assignments that can be graded.
    Links to Grade model for structured grading.
    """

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    course = models.ForeignKey(
        "dashboard.Course", on_delete=models.CASCADE, related_name="tasks"
    )
    due_date = models.DateField(blank=True, null=True)
    max_score = models.FloatField(default=20.0)
    grade_type = models.CharField(
        max_length=20, choices=Grade.GRADE_TYPE_CHOICES, default="homework"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Task"
        verbose_name_plural = "Tasks"
        ordering = ["-due_date"]

    def __str__(self):
        return f"{self.title} ({self.course.name})"


# ============================================
# ATTENDANCE RECORD (Monthly Snapshots)
# ============================================


class AttendanceRecord(models.Model):
    """
    Monthly attendance snapshots for generating attendance charts.
    Stores percentage per month for the Academic Overview line graph.

    UI: Line chart showing Aug, Sep, Nov, Dec, Jan attendance trends.
    """

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="attendance_records",
        db_index=True,
    )
    course = models.ForeignKey(
        "dashboard.Course",
        on_delete=models.CASCADE,
        related_name="attendance_records",
        null=True,
        blank=True,
        help_text="Optional: course-specific attendance",
    )

    # Month for this record (first day of month)
    month = models.DateField(help_text="First day of the month for this record")

    # Attendance metrics
    attendance_percentage = models.FloatField(help_text="Attendance % for this month")
    classes_attended = models.PositiveIntegerField(default=0)
    classes_total = models.PositiveIntegerField(default=0)

    # Additional context
    notes = models.TextField(blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Attendance Record"
        verbose_name_plural = "Attendance Records"
        ordering = ["-month"]
        unique_together = [["student", "course", "month"]]
        indexes = [
            models.Index(fields=["student", "month"]),
        ]

    def __str__(self):
        return f"{self.student} - {self.month.strftime('%b %Y')}: {self.attendance_percentage}%"

    def save(self, *args, **kwargs):
        """Calculate percentage from attended/total if not set."""
        if self.classes_total > 0 and not self.attendance_percentage:
            self.attendance_percentage = (
                self.classes_attended / self.classes_total
            ) * 100
        super().save(*args, **kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student.id,
            "month": self.month.strftime("%b"),
            "month_full": self.month.strftime("%B %Y"),
            "percentage": round(self.attendance_percentage, 1),
            "classes_attended": self.classes_attended,
            "classes_total": self.classes_total,
        }


# ============================================
# TEACHER OBSERVATION (Historical Notes)
# ============================================


class TeacherObservation(models.Model):
    """
    Teacher observations/notes about students.
    Supports history of notes with timestamps.

    UI: "Sofia's recent leadership project in the group history projection..."

    Alias for StudentNote with enhanced fields for observation tracking.
    """

    OBSERVATION_TYPE_CHOICES = [
        ("general", "General Observation"),
        ("academic", "Academic Progress"),
        ("behavior", "Behavior"),
        ("leadership", "Leadership"),
        ("participation", "Participation"),
        ("concern", "Concern"),
        ("achievement", "Achievement"),
    ]

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="observations", db_index=True
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="observations"
    )

    observation_type = models.CharField(
        max_length=20, choices=OBSERVATION_TYPE_CHOICES, default="general"
    )
    text = models.TextField(help_text="Observation text")

    # Optional: linked to specific course or activity
    course = models.ForeignKey(
        "dashboard.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="observations",
    )

    # Visibility
    is_public = models.BooleanField(default=False, help_text="Visible to parents")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Teacher Observation"
        verbose_name_plural = "Teacher Observations"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Observation for {self.student} by {self.teacher} ({self.created_at.strftime('%b %d')})"

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student.id,
            "teacher_id": self.teacher.id,
            "teacher_name": self.teacher.full_name
            if hasattr(self.teacher, "full_name")
            else self.teacher.first_name,
            "observation_type": self.observation_type,
            "text": self.text,
            "course": self.course.name if self.course else None,
            "is_public": self.is_public,
            "date": self.created_at.strftime("%b %d, %Y"),
            "timestamp": self.created_at.isoformat(),
        }


# ============================================
# STUDENT NOTE (Legacy - Alias to TeacherObservation)
# ============================================


class StudentNote(models.Model):
    """
    Legacy model for backward compatibility.
    Use TeacherObservation for new features.
    """

    student = models.ForeignKey(
        Student, on_delete=models.CASCADE, related_name="notes", db_index=True
    )
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="student_notes"
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Student Note"
        verbose_name_plural = "Student Notes"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Note for {self.student} by {self.teacher}"

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student.id,
            "teacher_id": self.teacher.id,
            "teacher_name": self.teacher.first_name if self.teacher else "Unknown",
            "text": self.text,
            "date": self.created_at.strftime("%b %d") if self.created_at else "",
            "fullDate": self.created_at.strftime("%d-%b-%y, %H:%M")
            if self.created_at
            else "",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
