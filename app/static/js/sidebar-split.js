/**
 * SPLIT SIDEBAR - Context Panel Toggle Logic
 */

document.addEventListener('DOMContentLoaded', function() {
    const contextPanel = document.getElementById('contextPanel');
    const studentsToggle = document.getElementById('studentsToggle');
    const closeContextBtn = document.getElementById('closeContextPanel');
    const topStudentsContext = document.getElementById('topStudentsContext');

    // Make context panel visible by default (as shown in mockup)
    if (contextPanel) {
        contextPanel.classList.add('active');
    }
    if (studentsToggle) {
        studentsToggle.classList.add('active');
    }

    // Toggle context panel when clicking Students icon
    if (studentsToggle) {
        studentsToggle.addEventListener('click', function(e) {
            e.preventDefault();
            contextPanel.classList.toggle('active');
            studentsToggle.classList.toggle('active');
        });
    }

    // Close context panel
    if (closeContextBtn) {
        closeContextBtn.addEventListener('click', function() {
            contextPanel.classList.remove('active');
            if (studentsToggle) {
                studentsToggle.classList.remove('active');
            }
        });
    }

    // Close context panel when clicking outside
    document.addEventListener('click', function(e) {
        const iconBar = document.querySelector('.icon-bar');
        if (contextPanel && 
            contextPanel.classList.contains('active') &&
            !contextPanel.contains(e.target) &&
            !iconBar.contains(e.target)) {
            contextPanel.classList.remove('active');
            if (studentsToggle) {
                studentsToggle.classList.remove('active');
            }
        }
    });

    // Populate Top 10 Students in context panel
    function populateTopStudents() {
        if (!topStudentsContext) return;

        // Get students data from global variable (passed from Django)
        const topStudentsDataEl = document.getElementById('topStudentsData');
        if (!topStudentsDataEl) return;

        let studentsData;
        try {
            studentsData = JSON.parse(topStudentsDataEl.textContent);
        } catch (e) {
            console.error('Error parsing students data:', e);
            return;
        }

        if (!studentsData || studentsData.length === 0) {
            topStudentsContext.innerHTML = '<p style="text-align: center; color: #9ca3af; font-size: 12px;">No students found</p>';
            return;
        }

        // Take top 10
        const top10 = studentsData.slice(0, 10);

        const html = top10.map((student, index) => `
            <div class="student-card-context">
                <img src="${student.image || '/static/images/default_avatar.png'}" 
                     alt="${student.name}" 
                     class="student-avatar-context"
                     onerror="this.src='/static/images/default_avatar.png'">
                <div class="student-info-context">
                    <div class="student-name-context">${student.name}</div>
                    <div class="student-detail-context">${student.avg_score ? student.avg_score + '%' : 'No score'} Average</div>
                </div>
            </div>
        `).join('');

        topStudentsContext.innerHTML = html;
    }

    // Initialize
    populateTopStudents();
});
