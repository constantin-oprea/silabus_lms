from django.db import models
from django.conf import settings


class Student(models.Model):
    """
    Students enrolled in courses.
    Each student can be part of a group and enrolled in multiple courses.
    """

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True, blank=True, null=True, db_index=True)

    # Group membership
    group = models.ForeignKey(
        "dashboard.Group",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )

    # Profile information
    avatar_url = models.CharField(max_length=500, blank=True, null=True)
    birthday = models.DateField(blank=True, null=True, help_text="Date of birth")
    hobbies = models.TextField(blank=True, help_text="Comma-separated hobbies")
    social_circle = models.TextField(
        blank=True, help_text="Comma-separated student IDs (friends in course)"
    )

    # Academic metrics
    attendance_rate = models.FloatField(default=100.0, help_text="Percentage (0-100)")
    average_grade = models.FloatField(default=0.0)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)

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

    def to_dict(self):
        """Convert student to dictionary for JSON serialization."""
        # Generate default avatar based on student gender/name
        default_avatar = (
            f"student_avatars/{self.first_name.lower()}_{self.last_name.lower()}.jpg"
        )

        return {
            "id": self.id,
            "name": self.full_name,
            "full_name": self.full_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "img": default_avatar,  # For JavaScript compatibility
            "avatar": default_avatar,  # Alternative field name
            "group": self.group.name if self.group else None,
            "course": self.group.name if self.group else "No Course",  # For JavaScript
            "attendance": f"{int(self.attendance_rate)}%",
            "attendance_rate": self.attendance_rate,
            "average_grade": self.average_grade,
            "homework": "85%",  # Placeholder - calculate from actual homework
            "hobbies": self.hobbies,
            "social_circle": self.social_circle,
            "participationVal": 1,  # Placeholder - could be a real field
            "personal": {
                "dob": self.birthday.strftime("%B %d, %Y") if self.birthday else None,
                "hobbies": self.hobbies,
            },
            "friends": [],  # Placeholder - could parse social_circle
            "comments": [],  # Could load from StudentNote
            "gradesList": [],  # Placeholder for grade categories
        }


class StudentNote(models.Model):
    """
    Teacher notes/comments about students (Teacher's Log).
    Teachers can add observations, feedback, or important information about students.
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
        """Return a dictionary representation of the student note."""
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
