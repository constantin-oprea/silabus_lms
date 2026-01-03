# app/mock_data.py

# This simulates a database table for Students
students_list = [
    {
        "id": "SA-001", "name": "Sophia Martinez", "course": "Philosophy",
        "img": "face_1.jpg", "attendance": "98%", "homework": "100%",
        "participationVal": 2, # 2 = High
        "personal": { "dob": "March 12, 2008", "hobbies": "Chess, Reading", "likes": "Quiet study", "dislikes": "Noise" },
        "gradesList": [
            { "category": "Homework", "items": [ {"name": "Unit 1 Review", "grade": "A"}, {"name": "Reading Response", "grade": "AD"}, {"name": "Vocab Sheet", "grade": "B"} ] },
            { "category": "Quizzes", "items": [ {"name": "Ethics Pop Quiz", "grade": "B"}, {"name": "Mid-Unit Quiz", "grade": "A"} ] },
            { "category": "Tests", "items": [ {"name": "Term 1 Final", "grade": "AD"} ] }
        ],
        "groups": ["Debate Team", "Group A"],
        "friends": [2, 3], # Indices refer to the list order
        "comments": [{"date": "Dec 20", "text": "Excellent point made about Plato today."}]
    },
    {
        "id": "SA-002", "name": "Liam Johnson", "course": "Social Studies",
        "img": "face_2.jpg", "attendance": "95%", "homework": "85%",
        "participationVal": 1,
        "personal": { "dob": "July 22, 2008", "hobbies": "Football, Gaming", "likes": "Group work", "dislikes": "Essays" },
        "gradesList": [
            { "category": "Homework", "items": [ {"name": "Map Assignment", "grade": "B"}, {"name": "History Essay", "grade": "C"} ] },
            { "category": "Quizzes", "items": [ {"name": "Geography Quiz", "grade": "A"} ] }
        ],
        "groups": ["History Buffs"],
        "friends": [0, 4],
        "comments": [{"date": "Dec 18", "text": "Needs to focus more during group work."}]
    },
    {
        "id": "SA-003", "name": "Noah Williams", "course": "Psychology",
        "img": "face_3.jpg", "attendance": "100%", "homework": "100%",
        "participationVal": 0,
        "personal": { "dob": "Nov 05, 2007", "hobbies": "Photography", "likes": "Art, Music", "dislikes": "Sports" },
        "gradesList": [ { "category": "Tests", "items": [ {"name": "Research Methods", "grade": "A"} ] } ],
        "groups": ["Research Alpha"],
        "friends": [0],
        "comments": []
    },
    { "id": "SA-004", "name": "Emma Brown", "course": "Philosophy", "img": "face_4.jpg", "attendance": "92%", "homework": "90%", "participationVal": 2, "personal": { "dob": "Jan 15, 2008", "hobbies": "Dance", "likes": "Debate", "dislikes": "Math" }, "gradesList": [], "groups": ["Group A"], "friends": [0], "comments": [] },
    { "id": "SA-005", "name": "Oliver Jones", "course": "Social Studies", "img": "face_5.jpg", "attendance": "88%", "homework": "75%", "participationVal": 1, "personal": { "dob": "Jun 30, 2008", "hobbies": "Coding", "likes": "Tech", "dislikes": "Reading" }, "gradesList": [], "groups": [], "friends": [1], "comments": [] }
]

# This simulates a database table for Calendar Events
events_list = [
    { "type": "type-exam", "date": "22", "month": "DEC", "title": "TOK Final Essay", "time": "10:00 AM • Class A" },
    { "type": "type-meeting", "date": "24", "month": "DEC", "title": "Faculty Meeting", "time": "02:00 PM • Room 301" },
    { "type": "type-deadline", "date": "28", "month": "DEC", "title": "Grade Submission", "time": "All Day • Online" },
    { "type": "type-meeting", "date": "05", "month": "JAN", "title": "Dept. Planning", "time": "09:00 AM • Room 101" }
]