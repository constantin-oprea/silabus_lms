/**
 * MY LAYOUT - Right Panel JavaScript
 * Handles collapse/expand, carousel, and widget rendering
 */

document.addEventListener('DOMContentLoaded', function() {
    const rightPanel = document.getElementById('myLayoutRightPanel');
    const collapseBtn = document.getElementById('collapsePanelBtn');
    
    let currentPage = 0;
    const studentsPerPage = 6;

    // Collapse/Expand Panel
    if (collapseBtn) {
        collapseBtn.addEventListener('click', function() {
            rightPanel.classList.toggle('collapsed');
            
            // Change icon direction
            const icon = this.querySelector('i');
            if (rightPanel.classList.contains('collapsed')) {
                icon.className = 'bi bi-chevron-double-right';
            } else {
                icon.className = 'bi bi-chevron-double-left';
            }
        });
    }

    // Render TOP 10 STUDENTS Carousel
    function renderStudents() {
        const studentsGrid = document.getElementById('studentsGrid');
        if (!studentsGrid || typeof mockData === 'undefined') return;

        const students = mockData.students;
        const start = currentPage * studentsPerPage;
        const end = start + studentsPerPage;
        const visibleStudents = students.slice(start, end);

        studentsGrid.innerHTML = visibleStudents.map(student => `
            <div class="student-card">
                <div class="student-avatar">
                    ${student.avatar ? 
                        `<img src="${student.avatar}" alt="${student.name}">` :
                        `<i class="bi bi-person-fill"></i>`
                    }
                </div>
                <div class="student-name">${student.name}</div>
            </div>
        `).join('');
    }

    // Render Carousel Pagination and Setup Listeners
    function renderPagination() {
        const paginationContainer = document.getElementById('carouselPagination');
        if (!paginationContainer || typeof mockData === 'undefined') return;

        const students = mockData.students;
        const totalPages = Math.ceil(students.length / studentsPerPage);
        
        // Generate dots
        let dotsHtml = '';
        for (let i = 0; i < totalPages; i++) {
            dotsHtml += `<span class="pagination-dot ${i === currentPage ? 'active' : ''}" data-page="${i}"></span>`;
        }
        paginationContainer.innerHTML = dotsHtml;

        // Add listeners to new dots
        const paginationDots = paginationContainer.querySelectorAll('.pagination-dot');
        paginationDots.forEach(dot => {
            dot.addEventListener('click', function() {
                const page = parseInt(this.dataset.page);
                currentPage = page;
                
                // Update active state
                renderPagination(); // Re-render to update active class simpler
                
                // Render new page of students
                renderStudents();
            });
        });
    }

    // Render Upcoming Events
    function renderEvents() {
        const eventsList = document.getElementById('eventsList');
        if (!eventsList || typeof mockData === 'undefined') return;

        const events = mockData.events.slice(0, 3); // Only latest 3

        eventsList.innerHTML = events.map(event => `
            <div class="event-card">
                <div class="event-date-badge">
                    <div class="event-date">${event.date}</div>
                    <div class="event-month">${event.month}</div>
                </div>
                <div class="event-details">
                    <h4 class="event-title">${event.title}</h4>
                    <div class="event-meta">${event.time} - ${event.location}</div>
                </div>
            </div>
        `).join('');
    }

    // Render Latest Comments
    function renderComments() {
        const commentsList = document.getElementById('commentsList');
        if (!commentsList || typeof mockData === 'undefined') return;

        const comments = mockData.comments.slice(0, 4); // Only last 4

        commentsList.innerHTML = comments.map(comment => `
            <div class="comment-card ${comment.status}">
                <p class="comment-text">${comment.text}</p>
                <div class="comment-meta">
                    <strong>- ${comment.author}</strong>, ${comment.timeAgo}, on '${comment.course}'
                </div>
            </div>
        `).join('');
    }

    // Initialize all widgets
    function initializeWidgets() {
        renderStudents();
        renderPagination();
        renderEvents();
        renderComments();
    }

    // Run initialization
    initializeWidgets();
});
