```python
from django.core.wsgi import get_wsgi_application
import os
import sqlite3

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cadmus.settings')
application = get_wsgi_application()

# Import Django models
from forums.models import Forum, Discussion, Post
from students.models import Student

# Connect to the database (for direct sqlite3 inspection)
db_path = "db.sqlite3"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def inspect_django_models():
    print("\n--- FORUMS (via Django ORM) ---")
    try:
        for f in Forum.objects.all():
            print(f"Forum: {f.name} (Course: {f.course})")
            for d in f.discussions.all():
                print(f"  Topic: {d.title} (Posts: {d.posts.count()})")
                for p in d.posts.all():
                    author = p.author_student.first_name if p.author_student else (p.author_user.first_name if p.author_user else "Unknown")
                    print(f"    - [{author}]: {p.body[:30]}...")
    except Exception as e:
        print(f"Error inspecting Django models: {e}")

try:
    # List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("Available tables (via sqlite3):")
    for table in tables:
        print(f"  - {table[0]}")

    # Check students tables specifically
    student_tables = [t[0] for t in tables if "student" in t[0].lower()]

    if student_tables:
        print(f"\nStudent-related tables (via sqlite3): {student_tables}")
        for table_name in student_tables:
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print(f"\nColumns in {table_name}:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")

except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
