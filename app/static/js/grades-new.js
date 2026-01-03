// ===== GRADES PAGE JS =====
// Reusing concepts from students-new.js but specialized for Grading Matrix

document.addEventListener('DOMContentLoaded', function () {
    initGradesPage();
});

let selectedStudentIndex = 0;
// Mock grading data structure
// In real app, this would come from serverStudentsData
let gradingData = {
    dates: ['07/10/2021', '07/10/2021', '07/10/2022', '07/11/2022', '07/12/2022', '08/11/2022'],
    categories: [
        { name: 'Quiz', grades: ['A', 'B+', 'A', '', 'A', 'B+'] },
        { name: 'Test', grades: ['A', 'B+', 'D', '', 'A', 'B+'] },
        { name: 'Oral Presentation', grades: ['', '', '', '', '', ''] },
        { name: 'Homework', grades: ['A', 'B+', '', '', '', ''] }
    ]
};

function initGradesPage() {
    renderStudentsList();
    renderGradingMatrix();

    // Reuse calendar/log logic if possible or re-implement simplistic version
    // Ideally we'd modulize this, but for now copy-paste basic logic to ensure it works standalone
    initSidebarWidgets();

    // Select first student
    if (serverStudentsData && serverStudentsData.length > 0) {
        selectStudent(0);
    }
}

// ===== STUDENT LIST (Reused) =====
function renderStudentsList(filterCourse = 'all') {
    const container = document.getElementById('studentsListContainer');
    if (!container || !serverStudentsData) return;

    container.innerHTML = '';

    serverStudentsData.forEach((student, index) => {
        if (filterCourse !== 'all' && student.course !== filterCourse) return;

        const isActive = index === selectedStudentIndex;
        const card = document.createElement('div');
        card.className = `student-dir-card ${isActive ? 'active' : ''}`;
        card.dataset.index = index;
        card.onclick = () => selectStudent(index);

        card.innerHTML = `
            <img src="/static/images/${student.img}" alt="${student.name}" class="student-dir-avatar" 
                 onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=2E5D4B&color=fff'">
            <div class="student-dir-info">
                <p class="student-dir-name">${student.name}</p>
                <p class="student-dir-course">${student.course}</p>
            </div>
        `;

        container.appendChild(card);
    });
}

function selectStudent(index) {
    selectedStudentIndex = index;
    const student = serverStudentsData[index];
    if (!student) return;

    // Update list active state
    document.querySelectorAll('.student-dir-card').forEach(card => {
        card.classList.toggle('active', parseInt(card.dataset.index) === index);
    });

    // Update Header
    document.getElementById('headerName').innerHTML = `Grading: ${student.name}`;
    document.getElementById('headerCourseTag').textContent = student.course;

    const avatar = document.getElementById('headerAvatar');
    if (avatar) avatar.src = `/static/images/${student.img}`;

    // Update Grading Title
    document.getElementById('gradingTitle').textContent = `${student.course} Grades`;

    // (Re)Render matrix - in real app, we'd fetch specific grades for this student
    // Here we just shuffle distinct for demo or keep same
    renderGradingMatrix();
}

// ===== GRADING MATRIX =====
function renderGradingMatrix() {
    const table = document.getElementById('gradingMatrix');
    if (!table) return;

    // HEADERS
    const theadRow = table.querySelector('thead tr');
    // Clear headers except first
    while (theadRow.children.length > 1) {
        theadRow.removeChild(theadRow.lastChild);
    }

    gradingData.dates.forEach(date => {
        const th = document.createElement('th');
        th.textContent = date;
        theadRow.appendChild(th);
    });

    // BODY
    const tbody = document.getElementById('gradingBody');
    tbody.innerHTML = '';

    gradingData.categories.forEach(cat => {
        const tr = document.createElement('tr');

        // Category Name
        const tdName = document.createElement('td');
        tdName.textContent = cat.name;
        tr.appendChild(tdName);

        // Grades
        cat.grades.forEach(grade => {
            const td = document.createElement('td');
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'grade-input';
            input.value = grade;
            td.appendChild(input);
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });
}

function addGradeColumn() {
    // Add a new date column
    const today = new Date().toLocaleDateString('en-GB'); // dd/mm/yyyy roughly
    gradingData.dates.push(today);

    // Add empty grades for each category
    gradingData.categories.forEach(cat => {
        cat.grades.push('');
    });

    renderGradingMatrix();
}

function addEvaluationRow() {
    // Add a new category
    const name = prompt("Enter Evaluation Category Name (e.g., Essay):", "New Eval");
    if (name) {
        const emptyGrades = new Array(gradingData.dates.length).fill('');
        gradingData.categories.push({ name: name, grades: emptyGrades });
        renderGradingMatrix();
    }
}

// ===== SIDEBAR WIDGETS (Minimal Re-impl for Demo) =====
function initSidebarWidgets() {
    // Calendar logic would go here, identical to students-new.js
    // For now, static or simple interaction
    // Can allow "Add Note" to work for visual completeness
}

async function addLogNote() {
    const input = document.getElementById('newLogInput');
    const logs = document.getElementById('logEntries');
    if (!input || !input.value.trim() || !logs) return;

    const student = serverStudentsData[selectedStudentIndex];
    if (!student) return;

    const noteText = input.value.trim();
    const studentId = student.id || (selectedStudentIndex + 1);

    try {
        // Call API to save note to database
        const response = await fetch(`/api/students/${studentId}/notes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: noteText })
        });

        if (!response.ok) {
            throw new Error('Failed to save note');
        }

        const savedNote = await response.json();
        
        // Use teacherFirstName from template, fallback to 'Demo'
        const teacherName = typeof teacherFirstName !== 'undefined' ? teacherFirstName : 'Demo';

        const entry = document.createElement('div');
        entry.className = 'log-entry';

        entry.innerHTML = `
            <div class="log-entry-header">
                <img src="/static/images/avatar.png" class="log-entry-avatar"
                     onerror="this.src='https://ui-avatars.com/api/?name=Teacher+${teacherName}&background=2E5D4B&color=fff'">
                <div class="log-entry-meta">
                    <span class="log-entry-author">Teacher ${teacherName}</span>
                    <span class="log-entry-time">${savedNote.fullDate}</span>
                </div>
            </div>
            <p class="log-entry-text">${savedNote.text}</p>
        `;
        logs.prepend(entry);
        input.value = '';
        
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note. Please try again.');
    }
}


function exportLogToPDF() {
    alert("Exporting Log to PDF...");
}
