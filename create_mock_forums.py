from django.core.management.base import BaseCommand
from dashboard.models import Group, Course
from students.models import Student
from core.models import User
from forums.models import Forum, Discussion, Post
import random


def run():
    print("Creating Mock Forum Data...")

    # 1. Ensure Groups/Courses
    group, _ = Group.objects.get_or_create(name="III A")
    course, _ = Course.objects.get_or_create(
        name="Philosophy", defaults={"room": "III A"}
    )

    # 2. Ensure Users/Students
    teacher_user, _ = User.objects.get_or_create(
        email="teacher@silabus.com",
        defaults={"first_name": "Teacher", "last_name": "(II-C)"},
    )

    # 3. Create Forum
    forum, created = Forum.objects.get_or_create(
        name="Philosophy IIIA Discussion",
        defaults={
            "description": "General discussion for Philosophy Class III A",
            "course": course,
            "group": group,
        },
    )
    print(f"Forum: {forum.name}")

    # 4. Create Discussion Topic (The Allegory of the Cave)
    topic, created = Discussion.objects.get_or_create(
        forum=forum,
        title="The Allegory of the Cave",
        defaults={"author_user": teacher_user},
    )
    print(f"Topic: {topic.title}")

    # 5. Create Posts (matching screenshot)

    # Post 1: Lucia (Student)
    lucia = Student.objects.filter(first_name__icontains="Lucia").first()
    if not lucia:
        lucia = Student.objects.create(
            first_name="Lucia", last_name="(II-C)", group=group
        )

    Post.objects.get_or_create(
        discussion=topic,
        body="I think the allegory of the cave, I think is the allegory of the cave. It as governs the first things econ cnamus caracteriate...",
        defaults={"author_student": lucia, "likes_count": 5},
    )

    # Post 2: Luca (Student)
    luca = Student.objects.filter(first_name__icontains="Luca").first()
    if not luca:
        luca = Student.objects.create(
            first_name="Luca", last_name="(II-C)", group=group
        )

    Post.objects.get_or_create(
        discussion=topic,
        body="I think the allegory of the cave and avtributed the first prossement?",
        defaults={"author_student": luca, "likes_count": 1},
    )

    # Post 3: Juan Lana (Student)
    juan = Student.objects.filter(first_name__icontains="Juan").first()
    if not juan:
        juan = Student.objects.create(first_name="Juan", last_name="Lana", group=group)

    Post.objects.get_or_create(
        discussion=topic,
        body="I think the allegory of the cave and awarri vocaontery.",
        defaults={"author_student": juan, "likes_count": 0},
    )

    # Post 4: Teacher
    Post.objects.get_or_create(
        discussion=topic,
        body="I think the allegory of the cave renonued the Allegory of the Cave.",
        defaults={
            "author_user": teacher_user,
            "likes_count": 1,
            "is_teacher_endorsed": True,
        },
    )

    print("Successfully populated mock forum data!")


if __name__ == "__main__":
    run()
