/**
 * STUDENTS PROFILE PAGE JS
 * Handles Virtual Scrolling for 125+ students and Dynamic Profile Rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
    initStudentsApp();
});

let state = {
    students: [],           // All student data
    filteredStudents: [],   // Currently visible students after filter
    selectedStudentId: null,
    
    // Virtual Scroll State
    rowHeight: 70,          // Height of each student card in px
    visibleRows: 20,        // Number of rows to render (viewport height / rowHeight + buffer)
    scrollTop: 0,           // Current scroll position
};

// Global Chart Instance
let academicChart = null;

function initStudentsApp() {
    // 1. Initialize State with Server Data
    if (typeof serverStudentsData !== 'undefined') {
        state.students = serverStudentsData;
        state.filteredStudents = [...state.students];
    }

    // 2. Setup Virtual Scroll
    const container = document.getElementById('virtualScrollContainer');
    if (container) {
        container.addEventListener('scroll', onScroll);
        // Initial sizing check
        calculateVisibleRows();
        window.addEventListener('resize', calculateVisibleRows);
    }

    // 3. Setup Filters
    const courseFilter = document.getElementById('courseFilter');
    if (courseFilter) {
        courseFilter.addEventListener('change', (e) => filterStudents(e.target.value));
    }

    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => sortStudents(e.target.value));
    }

    // 4. Initial Render
    filterStudents('all'); // This will trigger renderList

    // 5. Select first student if available
    if (state.filteredStudents.length > 0) {
        selectStudent(state.filteredStudents[0].id);
    }
}

/* =========================================
   VIRTUAL SCROLL LOGIC
   ========================================= */

function calculateVisibleRows() {
    const container = document.getElementById('virtualScrollContainer');
    if (!container) return;
    const height = container.clientHeight;
    state.visibleRows = Math.ceil(height / state.rowHeight) + 5; // +5 buffer
    renderVirtualList();
}

function onScroll(e) {
    state.scrollTop = e.target.scrollTop;
    requestAnimationFrame(renderVirtualList);
}

function renderVirtualList() {
    const container = document.getElementById('studentListContent');
    const spacer = document.getElementById('virtualSpacer');
    if (!container || !spacer) return;

    const totalHeight = state.filteredStudents.length * state.rowHeight;
    spacer.style.height = `${totalHeight}px`;

    const startIndex = Math.floor(state.scrollTop / state.rowHeight);
    const endIndex = Math.min(state.filteredStudents.length, startIndex + state.visibleRows);
    
    // Render only visible items
    const visibleData = state.filteredStudents.slice(startIndex, endIndex);
    
    // Create HTML snippet
    const html = visibleData.map((student, idx) => {
        const absoluteIndex = startIndex + idx;
        const topPos = absoluteIndex * state.rowHeight;
        const isActive = student.id === state.selectedStudentId ? 'active' : '';
        
        return `
            <div class="student-list-item ${isActive}" 
                 style="position: absolute; top: ${topPos}px; left: 0; right: 0; height: ${state.rowHeight}px;"
                 onclick="selectStudent(${student.id})">
                <img src="${student.avatar_url || getDefaultAvatar(student.name)}" 
                     class="student-list-avatar" 
                     onerror="this.src='${getDefaultAvatar(student.name)}'">
                <div class="student-list-info">
                    <h4>${student.name}</h4>
                    <span>${student.course || 'No Course'}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function getDefaultAvatar(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
}

/* =========================================
   FILTERING & SORTING
   ========================================= */

function filterStudents(courseName) {
    if (courseName === 'all') {
        state.filteredStudents = [...state.students];
    } else {
        state.filteredStudents = state.students.filter(s => {
            // Check formatted course string or raw group name
            return (s.course && s.course.includes(courseName)) || 
                   (s.group && s.group === courseName);
        });
    }
    
    // Reset scroll
    const scrollContainer = document.getElementById('virtualScrollContainer');
    if (scrollContainer) scrollContainer.scrollTop = 0;
    state.scrollTop = 0;

    renderVirtualList();
}

function sortStudents(criteria) {
    if (criteria === 'name_asc') {
        state.filteredStudents.sort((a, b) => a.name.localeCompare(b.name));
    } else if (criteria === 'name_desc') {
        state.filteredStudents.sort((a, b) => b.name.localeCompare(a.name));
    }
    renderVirtualList();
}

/* =========================================
   PROFILE RENDERING
   ========================================= */

function selectStudent(id) {
    state.selectedStudentId = id;
    
    // Re-render list to update active state
    renderVirtualList();

    // Find student data
    const student = state.students.find(s => s.id === id);
    if (!student) return;

    // UPDATE HEADER
    document.getElementById('pAvatar').src = student.avatar_url || getDefaultAvatar(student.name);
    document.getElementById('pName').textContent = student.name;
    document.getElementById('pCourse').textContent = `Course: ${student.course}`;
    document.getElementById('pAvg').textContent = `${student.average_grade} (${student.letter_grade || 'N/A'})`;

    // UPDATE BIO
    document.getElementById('pDob').textContent = student.birthday || 'Not set';
    document.getElementById('pTutor').textContent = student.tutor || 'No tutor appointed';
    
    // Interests Tags
    const interestsContainer = document.getElementById('pInterests');
    if (student.interests && student.interests.length > 0) {
        interestsContainer.innerHTML = student.interests.map(
            tag => `<span class="interest-tag">${tag}</span>`
        ).join('');
    } else {
        interestsContainer.innerHTML = '<span style="color:#999; font-size:0.85rem;">No interests added yet.</span>';
    }

    // UPDATE ACADEMIC CHART
    document.getElementById('pAttendanceRate').textContent = (student.attendance_rate || 100).toFixed(0) + '%';
    renderChart(student);

    // RECENT ACTIVITY (Mock logic if empty)
    const activityContainer = document.getElementById('pActivity');
    if (student.recent_activity && student.recent_activity.length > 0) {
        // Render real activity if available
        activityContainer.innerHTML = student.recent_activity.map(a => `<div>${a}</div>`).join('');
    } else {
        activityContainer.innerHTML = `
            <div style="font-size:0.85rem; color:#666; padding:10px 0;">
                <i class="fas fa-check-circle" style="color:var(--primary-green); margin-right:5px;"></i> Submitted History Essay
            </div>
            <div style="font-size:0.85rem; color:#666; padding:5px 0;">
                <i class="fas fa-check-circle" style="color:var(--primary-green); margin-right:5px;"></i> Attended Philosophy IIIA
            </div>
        `;
    }

    // TEACHER NOTES
    const noteArea = document.getElementById('pTeacherNotes');
    // Find latest "general" observation or note
    const lastNote = (student.observations && student.observations.length > 0) 
        ? student.observations[0].text 
        : '';
    noteArea.value = lastNote;
    
    // Setup auto-save listener (debounced)
    noteArea.oninput = debounce(() => {
        document.getElementById('notesStatus').textContent = 'Saving...';
        setTimeout(() => {
            document.getElementById('notesStatus').textContent = 'Saved just now';
            // Here you would call API to save
            console.log(`Saved note for student ${id}: ${noteArea.value}`);
        }, 800);
    }, 1000);
}

/* =========================================
   CHART LOGIC
   ========================================= */

function renderChart(student) {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    
    if (academicChart) {
        academicChart.destroy();
    }

    // Mock data if student doesn't have detailed chart data
    let labels = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let data = [95, 98, 92, 96, 99];

    if (student.attendance_chart && student.attendance_chart.length > 0) {
        labels = student.attendance_chart.map(r => r.month);
        data = student.attendance_chart.map(r => r.percentage);
    }

    academicChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Attendance',
                data: data,
                borderColor: '#2C5545', // Primary Green
                borderWidth: 2,
                backgroundColor: 'rgba(44, 85, 69, 0.05)', // Very subtle fill
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#2C5545',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#2C5545',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 10,
                    cornerRadius: 6,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 60,
                    max: 100,
                    grid: {
                        color: '#F1F5F9',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#64748b',
                        font: { size: 11 }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
        }
    });
}

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
