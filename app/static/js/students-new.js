// ===== STUDENTS PAGE NEW JS =====
// Using same calendar model as dashboard for consistent events across pages

document.addEventListener('DOMContentLoaded', function () {
    initStudentsPage();
});

let selectedStudentIndex = 0;
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
let logsCalendarDate = new Date();

function initStudentsPage() {
    renderStudentsList();
    renderMonthCalendar(); // Use same function name as dashboard

    // Select first student by default
    if (serverStudentsData && serverStudentsData.length > 0) {
        selectStudent(0);
    }

    // Course filter listener
    const filterDropdown = document.getElementById('courseFilterDropdown');
    if (filterDropdown) {
        filterDropdown.addEventListener('change', function () {
            renderStudentsList(this.value);
        });
    }

    // Calendar navigation (same as dashboard)
    const calPrev = document.getElementById('studentCalPrev');
    const calNext = document.getElementById('studentCalNext');

    if (calPrev) {
        calPrev.addEventListener('click', () => {
            currentCalendarMonth--;
            if (currentCalendarMonth < 0) {
                currentCalendarMonth = 11;
                currentCalendarYear--;
            }
            renderMonthCalendar();
        });
    }

    if (calNext) {
        calNext.addEventListener('click', () => {
            currentCalendarMonth++;
            if (currentCalendarMonth > 11) {
                currentCalendarMonth = 0;
                currentCalendarYear++;
            }
            renderMonthCalendar();
        });
    }
}

// ===== STUDENT LIST =====
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

// ===== SELECT STUDENT =====
function selectStudent(index) {
    selectedStudentIndex = index;
    const student = serverStudentsData[index];
    if (!student) return;

    // Update active state in list
    document.querySelectorAll('.student-dir-card').forEach(card => {
        card.classList.toggle('active', parseInt(card.dataset.index) === index);
    });

    // Update header
    const avatar = document.getElementById('headerAvatar');
    const name = document.getElementById('headerName');
    const courseTag = document.getElementById('headerCourseTag');

    if (avatar) {
        avatar.src = `/static/images/${student.img}`;
        avatar.onerror = function () {
            this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=C9A227&color=fff&size=90`;
        };
    }
    if (name) name.textContent = student.name;
    if (courseTag) courseTag.textContent = student.course;

    // Update personal profile
    const birthday = document.getElementById('profileBirthday');
    const hobbies = document.getElementById('profileHobbies');

    if (birthday) birthday.textContent = student.personal?.dob || '--';
    if (hobbies) hobbies.textContent = student.personal?.hobbies || '--';

    // Update grades
    renderGrades(student);

    // Update metrics
    const metricAttendance = document.getElementById('metricAttendance');
    const metricHomework = document.getElementById('metricHomework');
    const homeworkBarFill = document.getElementById('homeworkBarFill');
    const participationSlider = document.getElementById('participationSlider');

    if (metricAttendance) metricAttendance.textContent = student.attendance || '--%';
    if (metricHomework) metricHomework.textContent = student.homework || '--%';
    if (homeworkBarFill) {
        const hw = parseInt(student.homework) || 0;
        homeworkBarFill.style.width = hw + '%';
    }
    if (participationSlider) {
        participationSlider.value = student.participationVal || 1;
        updateParticipationLabels(student.participationVal || 1);
    }

    // Update social circle
    renderSocialCircle(student);

    // Update teacher's log
    renderTeachersLog(student);
}

// ===== RENDER GRADES (Horizontal Rows) =====
function renderGrades(student) {
    const homeworkList = document.getElementById('homeworkList');
    const quizzesList = document.getElementById('quizzesList');
    const testsList = document.getElementById('testsList');
    const homeworkCount = document.getElementById('homeworkCount');
    const quizzesCount = document.getElementById('quizzesCount');
    const testsCount = document.getElementById('testsCount');

    // Clear lists
    if (homeworkList) homeworkList.innerHTML = '';
    if (quizzesList) quizzesList.innerHTML = '';
    if (testsList) testsList.innerHTML = '';

    let hwItems = [], quizItems = [], testItems = [];

    if (student.gradesList) {
        student.gradesList.forEach(category => {
            if (category.category === 'Homework') {
                hwItems = category.items || [];
            } else if (category.category === 'Quizzes') {
                quizItems = category.items || [];
            } else if (category.category === 'Tests') {
                testItems = category.items || [];
            }
        });
    }

    // Render homework
    if (homeworkCount) homeworkCount.textContent = `(${hwItems.length} items)`;
    hwItems.forEach(item => {
        if (homeworkList) homeworkList.appendChild(createGradeItem(item));
    });

    // Render quizzes
    if (quizzesCount) quizzesCount.textContent = `(${quizItems.length} items)`;
    quizItems.forEach(item => {
        if (quizzesList) quizzesList.appendChild(createGradeItem(item));
    });

    // Render tests
    if (testsCount) testsCount.textContent = `(${testItems.length} items)`;
    testItems.forEach(item => {
        if (testsList) testsList.appendChild(createGradeItem(item));
    });
}

function createGradeItem(item) {
    const div = document.createElement('div');
    div.className = 'grade-item';
    const gradeClass = `grade-${item.grade.toLowerCase()}`;
    div.innerHTML = `
        <span class="grade-item-name">${item.name}</span>
        <span class="grade-badge ${gradeClass}">${item.grade}</span>
    `;
    return div;
}

function updateParticipationLabels(value) {
    const labelLow = document.getElementById('labelLow');
    const labelMedium = document.getElementById('labelMedium');
    const labelHigh = document.getElementById('labelHigh');

    if (labelLow) labelLow.classList.toggle('active', value === 0);
    if (labelMedium) labelMedium.classList.toggle('active', value === 1);
    if (labelHigh) labelHigh.classList.toggle('active', value === 2);
}

// ===== RENDER SOCIAL CIRCLE (with name tooltip) =====
function renderSocialCircle(student) {
    const container = document.getElementById('socialFriendsList');
    if (!container) return;

    container.innerHTML = '';

    if (student.friends && student.friends.length > 0) {
        student.friends.forEach(friendIndex => {
            const friend = serverStudentsData[friendIndex];
            if (friend) {
                const img = document.createElement('img');
                img.className = 'social-friend-avatar';
                img.src = `/static/images/${friend.img}`;
                img.alt = friend.name;
                img.title = friend.name; // Shows name on hover
                img.onerror = function () {
                    this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=2E5D4B&color=fff`;
                };
                img.onclick = () => selectStudent(friendIndex);
                container.appendChild(img);
            }
        });
    } else {
        container.innerHTML = '<p style="color: #888; font-size: 13px;">No friends assigned</p>';
    }
}

// ===== RENDER TEACHER'S LOG (max 4 + show more) =====
function renderTeachersLog(student) {
    const container = document.getElementById('logEntries');
    const showMoreBtn = document.getElementById('showMoreLogsBtn');
    if (!container) return;

    container.innerHTML = '';

    if (student.comments && student.comments.length > 0) {
        const maxToShow = 4;
        const commentsToShow = student.comments.slice(-maxToShow).reverse();

        commentsToShow.forEach(comment => {
            container.appendChild(createLogEntry(comment));
        });

        // Show "Show More" button if more than 4 comments
        if (showMoreBtn) {
            showMoreBtn.style.display = student.comments.length > maxToShow ? 'block' : 'none';
        }
    } else {
        container.innerHTML = '<p style="color: #888; font-size: 13px; text-align: center; padding: 15px;">No notes yet</p>';
        if (showMoreBtn) showMoreBtn.style.display = 'none';
    }
}

function createLogEntry(comment) {
    const entry = document.createElement('div');
    entry.className = 'log-entry';

    // Format: dd-mmm-yy, hh:mm (24h)
    // If comment.date is "Dec 29" (legacy), try to add year/time
    let dateDisplay = comment.fullDate || comment.date;

    // If new format isn't present, construct a fake one for demo purposes if needed, 
    // or just try to format what we have.
    // Assuming new comments will have 'timestamp' or we generate one.
    if (!comment.fullDate && comment.date && comment.date.length < 10) {
        // Legacy "Dec 29" -> "29-Dec-25, 09:00" (mock)
        const parts = comment.date.split(' ');
        if (parts.length === 2) {
            const mon = parts[0];
            const day = parts[1];
            dateDisplay = `${day}-${mon}-25, 09:00`; // Mock legacy time
        }
    }

    // Use teacherFirstName from template, fallback to 'Demo'
    const teacherName = typeof teacherFirstName !== 'undefined' ? teacherFirstName : 'Demo';

    entry.innerHTML = `
        <div class="log-entry-header">
            <img src="/static/images/avatar.png" alt="Teacher" class="log-entry-avatar"
                 onerror="this.src='https://ui-avatars.com/api/?name=Teacher+${teacherName}&background=2E5D4B&color=fff'">
            <div class="log-entry-meta">
                <span class="log-entry-author">Teacher ${teacherName}</span>
                <span class="log-entry-time">${dateDisplay}</span>
            </div>
        </div>
        <p class="log-entry-text">${comment.text}</p>
    `;
    return entry;
}

// ===== ADD LOG NOTE =====
async function addLogNote() {
    const input = document.getElementById('newLogInput');
    if (!input || !input.value.trim()) return;

    const student = serverStudentsData[selectedStudentIndex];
    if (!student) return;

    const noteText = input.value.trim();
    
    // Get student ID - use database ID if available, otherwise use index + 1
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
        
        // Add to local data
        if (!student.comments) student.comments = [];
        student.comments.unshift({
            id: savedNote.id,
            date: savedNote.date,
            fullDate: savedNote.fullDate,
            text: savedNote.text
        });

        renderTeachersLog(student);
        input.value = '';
        
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note. Please try again.');
    }
}


// ===== EXPORT LOG TO PDF =====
function exportLogToPDF() {
    const student = serverStudentsData[selectedStudentIndex];
    if (!student) {
        alert('No student selected');
        return;
    }
    alert(`Exporting ${student.name}'s Teacher Log to PDF...`);
}

// ===== EXPORT GRADES TO PDF =====
function exportGradesToPDF() {
    const student = serverStudentsData[selectedStudentIndex];
    if (!student) {
        alert('No student selected');
        return;
    }
    alert(`Exporting ${student.name}'s Grades to PDF...`);
}

// ===== LOGS POPUP =====
function openLogsPopup() {
    const popup = document.getElementById('logsFullPopup');
    if (popup) {
        popup.classList.add('active');
        renderLogsPopupCalendar();
        renderLogsPopupEntries();
    }
}

function closeLogsPopup() {
    const popup = document.getElementById('logsFullPopup');
    if (popup) popup.classList.remove('active');
}

function renderLogsPopupCalendar() {
    const titleEl = document.getElementById('logsCalendarTitle');
    const daysContainer = document.getElementById('logsCalendarDays');
    if (!titleEl || !daysContainer) return;

    const year = logsCalendarDate.getFullYear();
    const month = logsCalendarDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    titleEl.textContent = `${monthNames[month]} ${year}`;
    daysContainer.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const student = serverStudentsData[selectedStudentIndex];
    const commentDates = getCommentDates(student);

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const dayEl = document.createElement('div');
        dayEl.className = 'logs-cal-day other-month';
        dayEl.textContent = prevMonthLastDay - i;
        daysContainer.appendChild(dayEl);
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'logs-cal-day';

        const dateStr = `${monthNames[month]} ${day}`;
        if (commentDates.includes(dateStr)) {
            dayEl.classList.add('has-log');
        }

        dayEl.textContent = day;
        dayEl.onclick = () => filterLogsByDate(day, month, year);
        daysContainer.appendChild(dayEl);
    }

    // Next month days
    const totalCells = Math.ceil((startDay + lastDay.getDate()) / 7) * 7;
    const remainingCells = totalCells - (startDay + lastDay.getDate());
    for (let i = 1; i <= remainingCells; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'logs-cal-day other-month';
        dayEl.textContent = i;
        daysContainer.appendChild(dayEl);
    }
}

function getCommentDates(student) {
    if (!student || !student.comments) return [];
    return student.comments.map(c => c.date);
}

function renderLogsPopupEntries(filterDate = null) {
    const container = document.getElementById('logsPopupList');
    if (!container) return;

    container.innerHTML = '';
    const student = serverStudentsData[selectedStudentIndex];
    if (!student || !student.comments || student.comments.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No notes found</p>';
        return;
    }

    let comments = [...student.comments].reverse();
    if (filterDate) {
        comments = comments.filter(c => c.date === filterDate);
    } else {
        comments = comments.slice(0, 7);
    }

    if (comments.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">No notes for this date</p>';
        return;
    }

    comments.forEach(comment => {
        const entry = document.createElement('div');
        entry.className = 'logs-popup-entry';

        // Use teacherFirstName from template, fallback to 'Demo'
        const teacherName = typeof teacherFirstName !== 'undefined' ? teacherFirstName : 'Demo';

        entry.innerHTML = `
            <div class="logs-popup-entry-header">
                <span class="logs-popup-entry-author">Teacher ${teacherName}</span>
                <span class="logs-popup-entry-date">${comment.date}</span>
            </div>
            <p class="logs-popup-entry-text">${comment.text}</p>
        `;
        container.appendChild(entry);
    });
}

function filterLogsByDate(day, month, year) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const filterDate = `${monthNames[month]} ${day}`;
    renderLogsPopupEntries(filterDate);

    // Update selected state
    document.querySelectorAll('.logs-cal-day').forEach(el => el.classList.remove('selected'));
    event.target.classList.add('selected');
}

function navigateLogsCalendar(direction) {
    logsCalendarDate.setMonth(logsCalendarDate.getMonth() + direction);
    renderLogsPopupCalendar();
}


// ===== MONTH CALENDAR (COPIED FROM DASHBOARD) =====
// This is the exact same calendar logic as dashboard-new.js
function renderMonthCalendar() {
    const container = document.getElementById('calendarDaysGrid');
    const titleEl = document.getElementById('calendarMonthTitle');
    if (!container) return;

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Update title
    if (titleEl) {
        titleEl.textContent = `${months[currentCalendarMonth]} ${currentCalendarYear}`;
    }

    const today = new Date();
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1);
    const lastDay = new Date(currentCalendarYear, currentCalendarMonth + 1, 0);

    // Get day of week for first day (0 = Sunday, adjust for Monday start)
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    let html = '';

    // Previous month days
    const prevMonthLastDay = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${prevMonthLastDay - i}</div>`;
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const isToday = day === today.getDate() &&
            currentCalendarMonth === today.getMonth() &&
            currentCalendarYear === today.getFullYear();

        html += `<div class="calendar-day ${isToday ? 'today' : ''} clickable" 
                      data-day="${day}" 
                      data-month="${currentCalendarMonth}" 
                      data-year="${currentCalendarYear}">${day}</div>`;
    }

    // Next month days to fill grid
    const totalCells = Math.ceil((startDay + lastDay.getDate()) / 7) * 7;
    const remaining = totalCells - (startDay + lastDay.getDate());
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month">${i}</div>`;
    }

    container.innerHTML = html;

    // Add click handlers for ALL current month days (not just those with events)
    container.querySelectorAll('.calendar-day.clickable').forEach(dayEl => {
        dayEl.addEventListener('click', () => {
            const day = parseInt(dayEl.dataset.day);
            const month = parseInt(dayEl.dataset.month);
            const year = parseInt(dayEl.dataset.year);
            showEventPopup(day, month, year);
        });
    });
}

// Check if a specific day has any events (SAME AS DASHBOARD)
function checkDayHasEvent(day, month, year) {
    if (typeof serverEventsData === 'undefined' || !serverEventsData.length) return false;

    return serverEventsData.some(event => {
        // Handle event_date in ISO format: "YYYY-MM-DD"
        if (event.event_date) {
            const eventDateParts = event.event_date.split('-');
            if (eventDateParts.length === 3) {
                const eventYear = parseInt(eventDateParts[0]);
                const eventMonth = parseInt(eventDateParts[1]) - 1; // JS months are 0-indexed
                const eventDay = parseInt(eventDateParts[2]);
                if (eventDay === day && eventMonth === month && eventYear === year) {
                    return true;
                }
            }
        }

        // Also check legacy month/date fields
        if (event.month && event.date) {
            const monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const eventMonth = monthsShort.indexOf(event.month.toUpperCase());
            const eventDay = parseInt(event.date);
            if (eventDay === day && eventMonth === month) {
                return true;
            }
        }
        return false;
    });
}

// Get events for a specific day (SAME AS DASHBOARD)
function getEventsForDay(day, month, year) {
    if (typeof serverEventsData === 'undefined' || !serverEventsData.length) return [];

    return serverEventsData.filter(event => {
        // Handle event_date in ISO format: "YYYY-MM-DD"
        if (event.event_date) {
            const eventDateParts = event.event_date.split('-');
            if (eventDateParts.length === 3) {
                const eventYear = parseInt(eventDateParts[0]);
                const eventMonth = parseInt(eventDateParts[1]) - 1;
                const eventDay = parseInt(eventDateParts[2]);
                if (eventDay === day && eventMonth === month && eventYear === year) {
                    return true;
                }
            }
        }
        // Legacy format
        if (event.month && event.date) {
            const monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const eventMonth = monthsShort.indexOf(event.month.toUpperCase());
            const eventDay = parseInt(event.date);
            if (eventDay === day && eventMonth === month) {
                return true;
            }
        }
        return false;
    });
}

// Show event popup (SAME AS DASHBOARD)
function showEventPopup(day, month, year) {
    const events = getEventsForDay(day, month, year);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dateDisplay = `${months[month]} ${day}, ${year}`;

    // Create popup HTML
    let eventsHtml;
    if (events.length === 0) {
        eventsHtml = `
            <div class="no-events-message">
                <i class="fas fa-calendar-times"></i>
                <p>No events scheduled for this day</p>
            </div>
        `;
    } else {
        eventsHtml = events.map(event => {
            const eventType = event.event_type || event.type || 'meeting';
            const eventTypeBadge = getEventTypeBadge(eventType);
            const timeDisplay = event.start_time || event.time || 'Not specified';
            const durationDisplay = event.duration_minutes ? `${event.duration_minutes} minutes` : 'Not specified';
            const participantsDisplay = event.participants
                ? (Array.isArray(event.participants) ? event.participants.filter(p => p.trim()).join(', ') : event.participants.split('\n').filter(p => p.trim()).join(', '))
                : '';
            const notesDisplay = event.notes || '';

            return `
                <div class="event-popup-item">
                    <div class="event-popup-name">
                        <i class="fas fa-bookmark"></i>
                        <h4>${event.title}</h4>
                    </div>
                    <div class="event-popup-details">
                        <div class="event-detail">
                            <i class="fas fa-calendar-alt"></i>
                            <span class="detail-label">Date & Time:</span>
                            <span class="detail-value">${dateDisplay} at ${timeDisplay}</span>
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-hourglass-half"></i>
                            <span class="detail-label">Duration:</span>
                            <span class="detail-value">${durationDisplay}</span>
                        </div>
                        <div class="event-detail">
                            <i class="fas fa-tag"></i>
                            <span class="detail-label">Event Type:</span>
                            ${eventTypeBadge}
                        </div>
                        ${participantsDisplay ? `
                        <div class="event-detail">
                            <i class="fas fa-users"></i>
                            <span class="detail-label">Participants:</span>
                            <span class="detail-value">${participantsDisplay}</span>
                        </div>
                        ` : ''}
                        ${notesDisplay ? `
                        <div class="event-detail event-notes-section">
                            <i class="fas fa-sticky-note"></i>
                            <span class="detail-label">Notes:</span>
                            <p class="detail-notes">${notesDisplay}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update existing popup or create new one
    let popup = document.getElementById('eventViewPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'eventViewPopup';
        popup.className = 'event-view-popup-overlay';
        document.body.appendChild(popup);
    }

    popup.innerHTML = `
        <div class="event-view-popup">
            <div class="event-view-popup-header">
                <h3><i class="fas fa-calendar-day"></i> ${dateDisplay}</h3>
                <button class="event-popup-close" id="closeEventPopupBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="event-view-popup-body">
                ${eventsHtml}
            </div>
        </div>
    `;

    popup.classList.add('active');

    // Close handlers
    document.getElementById('closeEventPopupBtn').addEventListener('click', closeEventPopup);
    popup.addEventListener('click', (e) => {
        if (e.target === popup) closeEventPopup();
    });

    // Escape key handler
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeEventPopup();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeEventPopup() {
    const popup = document.getElementById('eventViewPopup');
    if (popup) {
        popup.classList.remove('active');
    }
}

function getEventTypeBadge(type) {
    const types = {
        'meeting': { icon: 'fa-handshake', label: 'Meeting', color: '#5A9CB5' },
        'oral_presentation': { icon: 'fa-microphone', label: 'Presentation', color: '#9B59B6' },
        'exam': { icon: 'fa-file-alt', label: 'Exam', color: '#E74C3C' },
        'homework': { icon: 'fa-book', label: 'Homework', color: '#F39C12' }
    };
    const t = types[type] || types['meeting'];
    return `<span class="event-type-badge" style="background: ${t.color}"><i class="fas ${t.icon}"></i> ${t.label}</span>`;
}
