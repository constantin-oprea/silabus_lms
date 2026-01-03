from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model for SilabusLMS Teacher Management System.
    Uses email as the primary authentication field instead of username.
    """

    # Remove username field (we'll use email instead)
    username = None

    # Core fields
    email = models.EmailField("Email address", unique=True, db_index=True)
    first_name = models.CharField("First name", max_length=50)
    last_name = models.CharField("Last name", max_length=50)

    # Role and position
    ROLE_CHOICES = [
        ("teacher", "Teacher"),
        ("admin", "Administrator"),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="teacher")
    position = models.CharField(
        max_length=200, default="Philosophy Teacher", help_text="Teaching position(s)"
    )

    # Profile
    avatar_url = models.CharField(max_length=500, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Custom manager
    objects = UserManager()

    # Use email as the username field
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}"

    def to_dict(self):
        """Return a dictionary representation of the user."""
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "role": self.role,
            "position": self.position,
            "avatar_url": self.avatar_url,
        }
