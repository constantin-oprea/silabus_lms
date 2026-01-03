from django.db import models


class LessonPlan(models.Model):
    """
    Lesson plans for courses.
    Teachers can create detailed lesson plans with objectives, content, materials, and homework.
    """

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("completed", "Completed"),
    ]

    title = models.CharField(max_length=200)
    course = models.ForeignKey(
        "dashboard.Course", on_delete=models.CASCADE, related_name="lesson_plans"
    )
    lesson_date = models.DateField(blank=True, null=True)

    # Lesson plan content
    objectives = models.TextField(
        blank=True, help_text="Learning objectives for this lesson"
    )
    content = models.TextField(
        blank=True, help_text="Main lesson content and activities"
    )
    materials = models.TextField(
        blank=True, help_text="Required materials and resources"
    )
    homework = models.TextField(blank=True, help_text="Homework assignments")
    notes = models.TextField(blank=True, help_text="Additional notes")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Lesson Plan"
        verbose_name_plural = "Lesson Plans"
        ordering = ["-lesson_date", "-created_at"]

    def __str__(self):
        return f"{self.title} - {self.course.name}"

    def to_dict(self):
        """Return a dictionary representation of the lesson plan."""
        return {
            "id": self.id,
            "title": self.title,
            "course_id": self.course.id,
            "course_name": self.course.name if self.course else None,
            "lesson_date": self.lesson_date.isoformat() if self.lesson_date else None,
            "objectives": self.objectives,
            "content": self.content,
            "materials": self.materials,
            "homework": self.homework,
            "notes": self.notes,
            "status": self.status,
        }
