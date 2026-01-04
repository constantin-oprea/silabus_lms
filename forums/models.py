from django.db import models
from django.conf import settings
from students.models import Student


class Forum(models.Model):
    """
    A discussion forum, usually linked to a Group or Course.
    e.g., "Philosophy IIIA Discussion", "General Announcements"
    """

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Optional links to context
    course = models.ForeignKey(
        "dashboard.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="forums",
    )
    group = models.ForeignKey(
        "dashboard.Group",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="forums",
    )

    icon_class = models.CharField(
        max_length=50,
        default="fa-comments",
        help_text="FontAwesome class e.g. fa-comments",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def active_categories_count(self):
        """Mock count for UI '12 active categories'"""
        return self.discussions.count()

    @property
    def new_posts_count(self):
        """Mock count for UI '5 new'"""
        return 5  # Placeholder


class Discussion(models.Model):
    """
    A specific topic/thread within a forum.
    e.g., "The Allegory of the Cave"
    """

    forum = models.ForeignKey(
        Forum, on_delete=models.CASCADE, related_name="discussions"
    )
    title = models.CharField(max_length=255)

    # Author (Can be User or Student) - Creator of the topic
    author_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_discussions",
    )
    author_student = models.ForeignKey(
        Student,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_discussions",
    )

    is_pinned = models.BooleanField(default=False)
    is_closed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_pinned", "-updated_at"]

    def __str__(self):
        return self.title


class Post(models.Model):
    """
    Individual posts/replies within a discussion.
    Supports threaded replies via 'parent'.
    """

    discussion = models.ForeignKey(
        Discussion, on_delete=models.CASCADE, related_name="posts"
    )
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="replies"
    )

    # AUTHORSHIP: Dual FK strategy to support both Teacher (User) and Student
    author_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="forum_posts",
    )
    author_student = models.ForeignKey(
        Student,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="forum_posts",
    )

    body = models.TextField()

    # Engagement
    likes_count = models.PositiveIntegerField(default=0)
    is_teacher_endorsed = models.BooleanField(
        default=False, help_text="Teacher: 1 points / Highlight"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Post by {self.author_name} in {self.discussion}"

    @property
    def author_name(self):
        if self.author_student:
            return self.author_student.full_name
        if self.author_user:
            return self.author_user.full_name
        return "Unknown"

    @property
    def author_avatar(self):
        if self.author_student:
            return self.author_student.avatar_url
        if self.author_user:
            return self.author_user.avatar_url
        return None

    @property
    def author_role_label(self):
        """Returns '(II-C)' for student or 'Teacher (II-C)'"""
        if self.author_student:
            if self.author_student.group:
                return f"({self.author_student.group.name})"
            return ""
        if self.author_user:
            # Try to infer group from discussion context if needed, or just specific title
            return "Teacher"
        return ""
