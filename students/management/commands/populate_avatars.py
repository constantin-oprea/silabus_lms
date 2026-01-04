import os
import random
from django.core.management.base import BaseCommand
from django.conf import settings
from students.models import Student


class Command(BaseCommand):
    help = "Populates student avatars using local AI-generated images"

    def handle(self, *args, **kwargs):
        self.stdout.write("Populating avatars from local AI images...")

        # 1. Setup directory
        media_root = settings.MEDIA_ROOT
        students_dir = os.path.join(media_root, "students")

        # 2. Get available images
        valid_images = [
            f
            for f in os.listdir(students_dir)
            if f.endswith(".png") or f.endswith(".jpg")
        ]

        if not valid_images:
            self.stdout.write(self.style.ERROR(f"No images found in {students_dir}"))
            return

        self.stdout.write(f"Found {len(valid_images)} avatar templates: {valid_images}")

        # 3. Get all students
        students = Student.objects.all()
        count = students.count()
        self.stdout.write(f"Found {count} students in database.")

        if count == 0:
            self.stdout.write(self.style.WARNING("No students found in database."))
            return

        # 4. Assign images
        for i, student in enumerate(students):
            # Simple round-robin assignment or random choice
            # Ideally we would match gender if we had that data, but we don't strictly have gender field
            # We'll just assign randomly for variety

            selected_image = random.choice(valid_images)

            # Path relative to MEDIA_ROOT, but with leading slash for direct use
            relative_path = f"/media/students/{selected_image}"
            student.avatar_url = relative_path
            student.save()

            if i % 20 == 0:
                self.stdout.write(f"Processed {i + 1}/{count} students...")

        self.stdout.write(
            self.style.SUCCESS(f"Successfully updated avatars for {count} students!")
        )
