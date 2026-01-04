import sqlite3
import os

# Connect to the database
db_path = "db.sqlite3"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Check if column exists
    cursor.execute("PRAGMA table_info(students_student)")
    columns = [column[1] for column in cursor.fetchall()]

    if "interests" in columns:
        print("Column 'interests' already exists")
    else:
        # Add the interests column
        cursor.execute(
            'ALTER TABLE students_student ADD COLUMN interests TEXT DEFAULT "{}"'
        )
        conn.commit()
        print("Column 'interests' added successfully!")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
