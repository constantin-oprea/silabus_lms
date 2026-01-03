// ===== NEW DASHBOARD JS =====

// Calendar state (exposed to window for dropdown access)
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();
window.currentCalendarMonth = currentCalendarMonth;
window.currentCalendarYear = currentCalendarYear;

document.addEventListener('DOMContentLoaded', function () {
    console.log("SilabusLMS Dashboard Loaded");

    // Render all components
    renderMonthCalendar();
    renderUpcomingEvents();
    renderCourses();
    setTimeout(() => {
        try {
            console.log("Attempting to render Top 10 students...");
            renderSidebarStudents(); 
        } catch (e) {
            console.error("Error rendering top students:", e);
        }
    }, 500);
    updateNavDateTime();

    // Update time every second
    setInterval(updateNavDateTime, 1000);

    // Calendar navigation
    const prevBtn = document.getElementById('calPrev');
    const nextBtn = document.getElementById('calNext');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentCalendarMonth--;
            if (currentCalendarMonth < 0) {
                currentCalendarMonth = 11;
                currentCalendarYear--;
            }
            // Sync to window
            window.currentCalendarMonth = currentCalendarMonth;
            window.currentCalendarYear = currentCalendarYear;
            renderMonthCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentCalendarMonth++;
            if (currentCalendarMonth > 11) {
                currentCalendarMonth = 0;
                currentCalendarYear++;
            }
            // Sync to window
            window.currentCalendarMonth = currentCalendarMonth;
            window.currentCalendarYear = currentCalendarYear;
            renderMonthCalendar();
        });
    }

    // Add Course Modal
    initAddCourseModal();
    initDatePickers();

    // Add Event Modal
    initAddEventModal();

    // Courses Carousel Navigation
    initCoursesCarousel();

    // Profile Dropdown (only on trigger click)
    initProfileDropdown();

    // Global Search Bar
    initGlobalSearch();

    // Notifications
    initNotifications();
    updateNotificationBadge();

    // Update notifications every minute
    setInterval(updateNotificationBadge, 60000);
    
    // Expose renderMonthCalendar to window for dropdown access
    window.renderMonthCalendar = renderMonthCalendar;
    
    // Add Event Modal - Custom modal system (matching Add Course modal)
    const sidebarEventBtn = document.getElementById('addEventBtnSidebar');
    const addEventModal = document.getElementById('addEventModal');
    const closeEventModalBtn = document.getElementById('closeAddEventModal');
    const cancelEventBtn = document.getElementById('cancelAddEvent');
    const saveEventBtn = document.getElementById('saveNewEvent');
    
    function openEventModal() {
        if (addEventModal) {
            addEventModal.classList.add('active');
        }
    }
    
    function closeEventModal() {
        if (addEventModal) {
            addEventModal.classList.remove('active');
        }
    }
    
    if (sidebarEventBtn) {
        sidebarEventBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openEventModal();
        });
    }
    
    if (closeEventModalBtn) closeEventModalBtn.addEventListener('click', closeEventModal);
    if (cancelEventBtn) cancelEventBtn.addEventListener('click', closeEventModal);
    
    // Close on overlay click
    if (addEventModal) {
        addEventModal.addEventListener('click', (e) => {
            if (e.target === addEventModal) {
                closeEventModal();
            }
        });
    }
    
    // Save event handler
    if (saveEventBtn) {
        saveEventBtn.addEventListener('click', () => {
            // TODO: Add actual event creation logic here
            console.log('Event created successfully!');
            closeEventModal();
        });
    }

    // Initialize event details popup
    initEventDetailsPopup();
});


// ===== PROFILE DROPDOWN =====
function initProfileDropdown() {
    const trigger = document.getElementById('profileTrigger');
    const dropdown = document.getElementById('profileDropdown');

    const profileNav = document.querySelector('.user-profile-nav');

    if (!trigger || !dropdown || !profileNav) return;

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileNav.classList.toggle('active');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!profileNav.contains(e.target)) {
            profileNav.classList.remove('active');
        }
    });
}

// ===== GLOBAL SEARCH =====
function initGlobalSearch() {
    const searchBtn = document.getElementById('searchToggleBtn');
    const searchContainer = document.getElementById('searchBarContainer');
    const searchInput = document.getElementById('globalSearchInput');
    const closeBtn = document.getElementById('searchCloseBtn');

    if (!searchBtn || !searchContainer || !searchInput) return;

    searchBtn.addEventListener('click', () => {
        searchContainer.classList.add('active');
        searchInput.focus();
    });

    closeBtn?.addEventListener('click', () => {
        searchContainer.classList.remove('active');
        searchInput.value = '';
        clearSearchHighlights();
    });

    // Search on input
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query.length > 1) {
            performGlobalSearch(query);
        } else {
            clearSearchHighlights();
        }
    });

    // Close on Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchContainer.classList.remove('active');
            searchInput.value = '';
            clearSearchHighlights();
        }
    });
}

function performGlobalSearch(query) {
    clearSearchHighlights();

    // Search in all visible text elements
    const searchableElements = document.querySelectorAll(
        '.course-card-new, .event-card-new, .student-entry, .card-title, .section-title, ' +
        '.course-info-new h4, .course-subtitle, .student-name-new, .analytics-card h4'
    );

    searchableElements.forEach(el => {
        const text = el.textContent.toLowerCase();
        if (text.includes(query)) {
            el.classList.add('search-highlight');
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

function clearSearchHighlights() {
    document.querySelectorAll('.search-highlight').forEach(el => {
        el.classList.remove('search-highlight');
    });
}

// ===== COURSES CAROUSEL =====
let coursesCarouselIndex = 0;
function initCoursesCarousel() {
    const prevBtn = document.getElementById('coursesPrev');
    const nextBtn = document.getElementById('coursesNext');
    const grid = document.getElementById('coursesGrid');

    if (!prevBtn || !nextBtn || !grid) return;

    function updateCarousel() {
        const cards = grid.querySelectorAll('.course-card-new');
        const visibleCount = 3;
        const maxIndex = Math.max(0, cards.length - visibleCount);

        coursesCarouselIndex = Math.min(Math.max(0, coursesCarouselIndex), maxIndex);

        const cardWidth = cards[0]?.offsetWidth || 200;
        const gap = 15;
        const translateX = coursesCarouselIndex * (cardWidth + gap);

        grid.style.transform = `translateX(-${translateX}px)`;

        prevBtn.disabled = coursesCarouselIndex === 0;
        nextBtn.disabled = coursesCarouselIndex >= maxIndex;
    }

    prevBtn.addEventListener('click', () => {
        coursesCarouselIndex--;
        updateCarousel();
    });

    nextBtn.addEventListener('click', () => {
        coursesCarouselIndex++;
        updateCarousel();
    });

    // Initial state
    setTimeout(updateCarousel, 100);
}

// ===== ADD COURSE MODAL =====
function initAddCourseModal() {
    const modal = document.getElementById('addCourseModal');
    const openBtn = document.getElementById('addCourseBtn');
    const closeBtn = document.getElementById('closeAddCourseModal');
    const cancelBtn = document.getElementById('cancelAddCourse');
    const saveBtn = document.getElementById('saveNewCourse');
    const addScheduleBtn = document.getElementById('addScheduleRow');

    if (!modal) return;

    // Open modal
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Add schedule row
    if (addScheduleBtn) {
        addScheduleBtn.addEventListener('click', () => {
            const scheduleList = document.getElementById('scheduleList');
            const newRow = document.createElement('div');
            newRow.className = 'schedule-row';
            newRow.innerHTML = `
                <div class="day-group">
                    <span class="day-label">Day</span>
                    <select class="form-select schedule-day">
                        <option value="Monday">Monday</option>
                        <option value="Tuesday">Tuesday</option>
                        <option value="Wednesday">Wednesday</option>
                        <option value="Thursday">Thursday</option>
                        <option value="Friday">Friday</option>
                    </select>
                </div>
                <div class="time-group">
                    <span class="time-label">Start</span>
                    <div class="time-input-row">
                        <input type="text" class="form-input time-input-small" placeholder="08:15">
                        <div class="ampm-toggle">
                            <button type="button" class="ampm-btn active" data-value="AM">AM</button>
                            <button type="button" class="ampm-btn" data-value="PM">PM</button>
                        </div>
                    </div>
                </div>
                <div class="time-group">
                    <span class="time-label">End</span>
                    <div class="time-input-row">
                        <input type="text" class="form-input time-input-small" placeholder="09:45">
                        <div class="ampm-toggle">
                            <button type="button" class="ampm-btn active" data-value="AM">AM</button>
                            <button type="button" class="ampm-btn" data-value="PM">PM</button>
                        </div>
                    </div>
                </div>
                <button class="schedule-delete-btn" title="Remove">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            scheduleList.appendChild(newRow);

            // Add AM/PM toggle handlers to new row
            initAmPmToggles(newRow);

            // Add delete handler to new row
            newRow.querySelector('.schedule-delete-btn').addEventListener('click', () => {
                newRow.remove();
            });
        });
    }

    // Initialize AM/PM toggles for initial rows
    initAmPmToggles(document);

    // Delete schedule row handlers for initial row
    document.querySelectorAll('.schedule-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.schedule-row');
            const scheduleList = document.getElementById('scheduleList');
            if (scheduleList.children.length > 1) {
                row.remove();
            }
        });
    });

    // Save course
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const courseName = document.getElementById('courseName').value;
            if (!courseName.trim()) {
                alert('Please enter a course name');
                return;
            }
            // Call API to save course to database
            const courseRoom = document.getElementById('courseRoom')?.value || '';
            fetch('/api/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: courseName, room: courseRoom }) }).then(r => r.json()).then(c => { if (typeof serverCoursesData !== 'undefined') serverCoursesData.push(c); renderCourses(); setTimeout(() => initCoursesCarousel(), 100); alert('Course created!'); }).catch(() => alert('Failed'));
            console.log('Course saved:', courseName);
            closeModal();
        });
    }
}

// Initialize AM/PM toggle buttons
function initAmPmToggles(container) {
    container.querySelectorAll('.ampm-toggle').forEach(toggle => {
        toggle.querySelectorAll('.ampm-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove active from siblings
                toggle.querySelectorAll('.ampm-btn').forEach(b => b.classList.remove('active'));
                // Add active to clicked
                btn.classList.add('active');
            });
        });
    });
}

// ===== ADD EVENT MODAL =====
function initAddEventModal() {
    const modal = document.getElementById('addEventModal');
    const openBtn = document.getElementById('addEventBtn');
    const closeBtn = document.getElementById('closeAddEventModal');
    const cancelBtn = document.getElementById('cancelAddEvent');
    const saveBtn = document.getElementById('saveNewEvent');
    const courseAssignmentGroup = document.getElementById('courseAssignmentGroup');

    if (!modal) return;

    // Open modal
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // AM/PM toggles for event modal
    initAmPmToggles(modal);

    // Event type change handler - show/hide course assignment
    const eventTypeRadios = modal.querySelectorAll('input[name="eventType"]');
    eventTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const selectedType = modal.querySelector('input[name="eventType"]:checked').value;
            // Show course assignment for oral_presentation, exam, homework
            if (selectedType === 'oral_presentation' || selectedType === 'exam' || selectedType === 'homework') {
                courseAssignmentGroup.style.display = 'block';
            } else {
                courseAssignmentGroup.style.display = 'none';
            }
        });
    });

    // Event date picker
    const eventDateInput = document.getElementById('eventDate');
    const eventDatePicker = document.getElementById('eventDatePicker');
    if (eventDateInput && eventDatePicker) {
        datePickerState.eventDate = { month: new Date().getMonth(), year: new Date().getFullYear() };
        initSingleDatePicker(eventDateInput, eventDatePicker, 'eventDate');
    }

    // Save event to database
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const eventName = document.getElementById('eventName').value;
            const eventDate = document.getElementById('eventDate').value;
            const eventTime = document.getElementById('eventTime').value;
            const eventDuration = document.getElementById('eventDuration').value;
            const eventNotes = document.getElementById('eventNotes').value;
            const eventParticipants = document.getElementById('eventParticipants').value;

            // Get selected event type
            const eventTypeRadio = modal.querySelector('input[name="eventType"]:checked');
            const eventType = eventTypeRadio ? eventTypeRadio.value : 'meeting';

            // Get AM/PM
            const ampmBtn = modal.querySelector('.ampm-toggle .ampm-btn.active');
            const ampm = ampmBtn ? ampmBtn.dataset.value : 'AM';
            const fullTime = eventTime ? `${eventTime} ${ampm}` : '';

            // Validation
            if (!eventName.trim()) {
                alert('Please enter an event name');
                return;
            }
            if (!eventDate) {
                alert('Please select a date');
                return;
            }

            // Prepare data
            const eventData = {
                title: eventName,
                event_type: eventType,
                event_date: eventDate,
                start_time: fullTime,
                duration_minutes: parseInt(eventDuration) || 60,
                notes: eventNotes,
                participants: eventParticipants
            };

            try {
                const response = await fetch('/api/events', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });

                if (response.ok) {
                    const newEvent = await response.json();
                    console.log('Event saved to database:', newEvent);

                    // Refresh events display
                    if (typeof renderUpcomingEvents === 'function') {
                        // Add to local data and re-render
                        if (typeof serverEventsData !== 'undefined') {
                            serverEventsData.unshift(newEvent);
                        }
                        renderUpcomingEvents();
                    }

                    // Clear form
                    document.getElementById('eventName').value = '';
                    document.getElementById('eventDate').value = '';
                    document.getElementById('eventTime').value = '';
                    document.getElementById('eventDuration').value = '';
                    document.getElementById('eventNotes').value = '';
                    document.getElementById('eventParticipants').value = '';

                    closeModal();
                    alert('Event created successfully!');
                } else {
                    const error = await response.json();
                    alert('Error creating event: ' + (error.error || 'Unknown error'));
                }
            } catch (err) {
                console.error('Error saving event:', err);
                alert('Failed to save event. Please try again.');
            }
        });
    }
}

// ===== DATE PICKER =====
const datePickerState = {
    startDate: { month: new Date().getMonth(), year: new Date().getFullYear() },
    endDate: { month: new Date().getMonth(), year: new Date().getFullYear() }
};

function initDatePickers() {
    const startInput = document.getElementById('courseStartDate');
    const endInput = document.getElementById('courseEndDate');
    const startPicker = document.getElementById('startDatePicker');
    const endPicker = document.getElementById('endDatePicker');

    if (startInput && startPicker) {
        initSingleDatePicker(startInput, startPicker, 'startDate');
    }
    if (endInput && endPicker) {
        initSingleDatePicker(endInput, endPicker, 'endDate');
    }

    // Close pickers when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.date-picker-wrapper')) {
            document.querySelectorAll('.date-picker-dropdown').forEach(p => p.classList.remove('active'));
        }
    });
}

function initSingleDatePicker(input, picker, stateKey) {
    // Show picker on input click
    input.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other pickers
        document.querySelectorAll('.date-picker-dropdown').forEach(p => p.classList.remove('active'));
        renderDatePicker(picker, stateKey, input);
        picker.classList.add('active');
    });
}

function renderDatePicker(picker, stateKey, input) {
    const state = datePickerState[stateKey];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const today = new Date();
    const firstDay = new Date(state.year, state.month, 1);
    const lastDay = new Date(state.year, state.month + 1, 0);

    // Adjust for Monday start
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    let daysHtml = '';

    // Previous month days
    const prevMonthLastDay = new Date(state.year, state.month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        daysHtml += `<button class="date-picker-day other-month" data-date="${state.year}-${state.month - 1}-${prevMonthLastDay - i}">${prevMonthLastDay - i}</button>`;
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const isToday = day === today.getDate() && state.month === today.getMonth() && state.year === today.getFullYear();
        daysHtml += `<button class="date-picker-day ${isToday ? 'today' : ''}" data-date="${state.year}-${state.month}-${day}">${day}</button>`;
    }

    // Next month days
    const totalCells = Math.ceil((startDay + lastDay.getDate()) / 7) * 7;
    const remaining = totalCells - (startDay + lastDay.getDate());
    for (let i = 1; i <= remaining; i++) {
        daysHtml += `<button class="date-picker-day other-month" data-date="${state.year}-${state.month + 1}-${i}">${i}</button>`;
    }

    // Month dropdown options
    const monthDropdownHtml = months.map((m, idx) => 
        `<div class="month-dropdown-item ${idx === state.month ? 'current' : ''}" data-month="${idx}">${m}</div>`
    ).join('');

    picker.innerHTML = `
        <div class="date-picker-header">
            <div class="month-dropdown-container">
                <h4 class="date-picker-month-title" style="cursor: pointer;" title="Click to select month">${months[state.month]} ${state.year}</h4>
                <div class="month-dropdown">${monthDropdownHtml}</div>
            </div>
            <div class="date-picker-nav">
                <button type="button" class="prev-month"><i class="fas fa-chevron-left"></i></button>
                <button type="button" class="next-month"><i class="fas fa-chevron-right"></i></button>
            </div>
        </div>
        <div class="date-picker-weekdays">
            <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
        </div>
        <div class="date-picker-days">
            ${daysHtml}
        </div>
    `;

    // Month title click handler
    const monthTitle = picker.querySelector('.date-picker-month-title');
    const monthDropdown = picker.querySelector('.month-dropdown');
    
    if (monthTitle && monthDropdown) {
        monthTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            monthDropdown.classList.toggle('active');
        });
        
        // Month selection handler
        monthDropdown.querySelectorAll('.month-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                state.month = parseInt(item.dataset.month);
                renderDatePicker(picker, stateKey, input);
            });
        });
    }

    // Navigation handlers
    picker.querySelector('.prev-month').addEventListener('click', (e) => {
        e.stopPropagation();
        state.month--;
        if (state.month < 0) { state.month = 11; state.year--; }
        renderDatePicker(picker, stateKey, input);
    });

    picker.querySelector('.next-month').addEventListener('click', (e) => {
        e.stopPropagation();
        state.month++;
        if (state.month > 11) { state.month = 0; state.year++; }
        renderDatePicker(picker, stateKey, input);
    });

    // Day selection handlers
    picker.querySelectorAll('.date-picker-day').forEach(dayBtn => {
        dayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const parts = dayBtn.dataset.date.split('-');
            const selectedDate = new Date(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
            const formatted = `${String(selectedDate.getDate()).padStart(2, '0')}-${monthsShort[selectedDate.getMonth()]}-${String(selectedDate.getFullYear()).slice(-2)}`;
            input.value = formatted;
            picker.classList.remove('active');
        });
    });
}

// ===== NAV DATE/TIME =====
function updateNavDateTime() {
    const el = document.getElementById('navDateTime');
    if (!el) return;

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    el.textContent = `${day}-${month}-${year} ${hours}:${minutes}`;
}

// ===== FULL MONTH CALENDAR =====
function renderMonthCalendar() {
    // Sync from window variables (for dropdown access)
    if (typeof window.currentCalendarMonth !== 'undefined') {
        currentCalendarMonth = window.currentCalendarMonth;
    }
    if (typeof window.currentCalendarYear !== 'undefined') {
        currentCalendarYear = window.currentCalendarYear;
    }
    
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

        // Build date string for data attribute
        const dateStr = `${String(day).padStart(2, '0')}-${monthsShort[currentCalendarMonth]}-${String(currentCalendarYear).slice(-2)}`;

        html += `<div class="calendar-day ${isToday ? 'today' : ''} clickable" 
                      data-date="${dateStr}" 
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

// Check if a specific day has any events
function checkDayHasEvent(day, month, year) {
    if (typeof serverEventsData === 'undefined' || !serverEventsData.length) return false;

    return serverEventsData.some(event => {
        // Handle event_date in ISO format: "YYYY-MM-DD" e.g. "2025-12-29"
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

// Get events for a specific day
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


// Show event popup for a specific day
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
            const eventTypeLabel = getEventTypeLabel(eventType);
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


    // Create or update popup modal
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
                <button class="event-popup-close" id="closeEventPopup">
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
    document.getElementById('closeEventPopup').addEventListener('click', closeEventPopup);
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

function getEventTypeLabel(type) {
    const labels = {
        'meeting': 'Meeting',
        'oral_presentation': 'Oral Presentation',
        'exam': 'Exam / Test / Quiz',
        'homework': 'Homework'
    };
    return labels[type] || 'Meeting';
}






// ===== EVENT DETAILS POPUP (Sidebar) =====
function initEventDetailsPopup() {
    const overlay = document.getElementById('eventPopupOverlay');
    const closeBtn = document.getElementById('eventPopupClose');
    if (!overlay) return;
    if (closeBtn) closeBtn.addEventListener('click', closeEventDetailsPopup);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeEventDetailsPopup(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('active')) closeEventDetailsPopup(); });
    document.querySelectorAll('.event-item-small').forEach(item => {
        item.addEventListener('click', () => showEventDetailsFromElement(item));
    });
}

function showEventDetailsFromElement(element) {
    const overlay = document.getElementById('eventPopupOverlay');
    if (!overlay) return;
    const titleEl = element.querySelector('h4');
    const timeEl = element.querySelector('.time');
    const dayEl = element.querySelector('.day');
    const monthEl = element.querySelector('.month');
    document.getElementById('eventPopupTitle').textContent = titleEl ? titleEl.textContent : 'Event';
    document.getElementById('eventPopupDate').textContent = (monthEl ? monthEl.textContent : '') + ' ' + (dayEl ? dayEl.textContent : '') + ', ' + new Date().getFullYear();
    document.getElementById('eventPopupTime').textContent = timeEl ? timeEl.textContent : 'Time not specified';
    document.getElementById('eventPopupType').textContent = 'Meeting';
    const participantsRow = document.getElementById('eventPopupParticipantsRow');
    const notesSection = document.getElementById('eventPopupNotesSection');
    if (participantsRow) participantsRow.style.display = 'none';
    if (notesSection) notesSection.style.display = 'none';
    overlay.classList.add('active');
}

function closeEventDetailsPopup() {
    const overlay = document.getElementById('eventPopupOverlay');
    if (overlay) overlay.classList.remove('active');
}
// ===== UPCOMING EVENTS =====
function renderUpcomingEvents() {
    const container = document.getElementById('upcomingEventsList');
    if (!container) return;

    // Use server data if available
    let events = [
        { title: "Upcoming Events", subtitle: "Consenuartor - School", time: "May 11 - 3:30 PM" },
        { title: "Upcoming Events", subtitle: "Consenuarter - Studist Winning", time: "April 5 - 5:30 PM" },
        { title: "Upcoming Events", subtitle: "Consenuarter - Compilation ilik", time: "April 7 - 5:30 PM" }
    ];

    if (typeof serverEventsData !== 'undefined' && serverEventsData.length > 0) {
        events = serverEventsData.slice(0, 3).map(e => ({
            title: "Upcoming Events",
            subtitle: e.title,
            time: `${e.month} ${e.date} - ${e.time}`
        }));
    }

    let html = '';
    events.forEach(event => {
        html += `
            <div class="event-card-new">
                <div class="event-card-content">
                    <h4>${event.title}</h4>
                    <p>${event.subtitle}</p>
                    <span class="event-time">${event.time}</span>
                </div>
                <i class="fas fa-chevron-right event-arrow"></i>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ===== COURSES =====
function renderCourses() {
    const container = document.getElementById('coursesGrid');
    if (!container) return;

    // Use server data if available
    let courses = [];

    if (typeof serverCoursesData !== 'undefined' && serverCoursesData.length > 0) {
        courses = serverCoursesData.map(c => ({
            name: c.name,
            subtitle: `${c.room}, High School`,
            icon: c.icon_url || '/static/images/course_illustration_1.png',
            students: c.student_count || 0,
            room: c.room || 'TBD',
            days: c.days || 'TBD'
        }));
    } else {
        // Fallback data
        courses = [
            { name: "Philosophy", subtitle: "III A, High School", icon: "/static/images/icon_Philosophy.png", students: 28, room: "III A", days: "Mon, Wed, Fri" },
            { name: "Social Studies", subtitle: "IV B, High School", icon: "/static/images/icon_social_studies.jpg", students: 32, room: "IV B", days: "Tue, Thu" },
            { name: "Projects", subtitle: "V, High School", icon: "/static/images/icon_projects.jpeg", students: 24, room: "V", days: "Mon, Wed" }
        ];
    }

    let html = '';
    courses.forEach(course => {
        const courseSlug = course.name.toLowerCase().replace(/ /g, '-');
        const courseLink = `/course/${courseSlug}`;

        html += `
            <div class="course-card-new">
                <div class="course-icon-wrapper">
                    <a href="${courseLink}">
                        <img src="${course.icon}" alt="${course.name}" class="course-icon-img"
                             onerror="this.style.display='none'">
                    </a>
                </div>
                <div class="course-info-new">
                    <a href="${courseLink}" class="course-name-link">
                        <h4>${course.name}</h4>
                    </a>
                    <p class="course-subtitle">${course.subtitle}</p>
                    <div class="course-stats">
                        <div class="course-stat">
                            <span class="stat-value">${course.students}</span>
                            <span class="stat-label">Students</span>
                        </div>
                        <div class="course-stat">
                            <span class="stat-value">${course.room}</span>
                            <span class="stat-label">Room</span>
                        </div>
                        <div class="course-stat">
                            <span class="stat-value">${course.days}</span>
                            <span class="stat-label">Schedule</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ===== MONTHLY PROGRESS CHART (CINEMATIC) =====
let progressChart = null;

function initMonthlyProgressChart() {
    const canvas = document.getElementById('monthlyProgressChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Base data
    const baseDataA = [35, 42, 38, 45, 28, 48, 52, 45, 48, 42];
    const baseDataB = [8, 10, 12, 8, 10, 6, 8, 10, 8, 12];

    progressChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            datasets: [
                {
                    label: 'Progress A',
                    data: baseDataA,
                    backgroundColor: '#5A9CB5',
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7
                },
                {
                    label: 'Progress B',
                    data: baseDataB,
                    backgroundColor: '#FACE68',
                    borderRadius: 6,
                    barPercentage: 0.6,
                    categoryPercentage: 0.7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 2000,
                easing: 'easeOutQuart',
                delay: (context) => {
                    // Stagger animation for each bar
                    return context.dataIndex * 100;
                }
            },
            transitions: {
                active: {
                    animation: {
                        duration: 300
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#636e72',
                        font: { size: 11, weight: '500' }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    max: 60,
                    grid: {
                        color: 'rgba(0,0,0,0.04)'
                    },
                    ticks: {
                        color: '#636e72',
                        font: { size: 11 },
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleFont: { size: 13, weight: '600' },
                    bodyFont: { size: 12 },
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: true
                }
            },
            onHover: (event, elements) => {
                canvas.style.cursor = elements.length ? 'pointer' : 'default';
            }
        }
    });

    // Periodic "live" updates - subtle animation every 5 seconds
    setInterval(() => {
        if (progressChart && document.visibilityState === 'visible') {
            // Subtle random variation to simulate live data
            progressChart.data.datasets[0].data = baseDataA.map(v => v + Math.round((Math.random() - 0.5) * 4));
            progressChart.data.datasets[1].data = baseDataB.map(v => v + Math.round((Math.random() - 0.5) * 2));
            progressChart.update('active');
        }
    }, 5000);
}

// ===== STUDENT PERFORMANCE ANALYTICS CHARTS =====
let gradingChart = null;
let participationChart = null;
let homeworkChart = null;

function initAnalyticsCharts() {
    initGradingChart();
    initParticipationChart();
    initHomeworkChart();
    populateCourseFilters();
    setupFilterListeners();
}

function populateCourseFilters() {
    const courses = typeof serverCoursesData !== 'undefined' ? serverCoursesData : [];
    const filterIds = ['gradingCourseFilter', 'participationCourseFilter', 'homeworkCourseFilter'];

    filterIds.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.name.toLowerCase().replace(/\s+/g, '-');
                option.textContent = course.name;
                select.appendChild(option);
            });
        }
    });
}

function setupFilterListeners() {
    // Grading filters
    document.getElementById('gradingCourseFilter')?.addEventListener('change', () => updateGradingChart());
    document.getElementById('gradingDateFilter')?.addEventListener('change', () => updateGradingChart());
    // Participation filters
    document.getElementById('participationCourseFilter')?.addEventListener('change', () => updateParticipationChart());
    document.getElementById('participationDateFilter')?.addEventListener('change', () => updateParticipationChart());
    // Homework filters
    document.getElementById('homeworkCourseFilter')?.addEventListener('change', () => updateHomeworkChart());
    document.getElementById('homeworkDateFilter')?.addEventListener('change', () => updateHomeworkChart());
}

// ===== GRADING CHART (Bar Chart) =====
function initGradingChart() {
    const ctx = document.getElementById('gradingChart');
    if (!ctx) return;

    const data = getGradingData();
    gradingChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart',
                delay: (context) => context.dataIndex * 100
            },
            plugins: {
                legend: { display: true, position: 'bottom' },
                tooltip: {
                    callbacks: {
                        afterLabel: (context) => {
                            const studentNames = data.studentNames[context.datasetIndex][context.dataIndex];
                            return studentNames.length ? `Students: ${studentNames.join(', ')}` : '';
                        }
                    }
                }
            },
            scales: {
                y: { beginAtZero: true, title: { display: true, text: 'Students' } },
                x: { title: { display: true, text: 'Grade' } }
            },
            interaction: { mode: 'index', intersect: false }
        }
    });
}

function getGradingData() {
    // Sample data with student names for tooltips
    return {
        labels: ['AD', 'A', 'B', 'C'],
        datasets: [
            { label: 'Philosophy', data: [3, 8, 12, 5], backgroundColor: 'rgba(0, 31, 63, 0.8)', borderRadius: 6 },
            { label: 'Social Studies', data: [5, 10, 8, 4], backgroundColor: 'rgba(90, 156, 181, 0.8)', borderRadius: 6 },
            { label: 'Projects', data: [2, 6, 10, 7], backgroundColor: 'rgba(204, 255, 0, 0.8)', borderRadius: 6 }
        ],
        studentNames: [
            [['Ana F.', 'Luis H.', 'Maria Q.'], ['Carlos M.', 'Pedro S.', 'Rosa P.', 'José C.', 'Lucía C.', 'Carmen V.', 'Miguel R.', 'Juan G.'], ['12 students'], ['5 students']],
            [['5 students'], ['10 students'], ['8 students'], ['4 students']],
            [['2 students'], ['6 students'], ['10 students'], ['7 students']]
        ]
    };
}

function updateGradingChart() {
    if (!gradingChart) return;
    gradingChart.data = getGradingData();
    gradingChart.update('active');
}

// ===== PARTICIPATION CHART (Radar Chart) =====
function initParticipationChart() {
    const ctx = document.getElementById('participationChart');
    if (!ctx) return;

    participationChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Questions Asked', 'Discussions', 'Group Work', 'Presentations', 'Attendance'],
            datasets: [
                { label: 'Philosophy', data: [85, 70, 90, 65, 95], borderColor: '#001F3F', backgroundColor: 'rgba(0, 31, 63, 0.2)', pointBackgroundColor: '#001F3F' },
                { label: 'Social Studies', data: [75, 85, 80, 70, 88], borderColor: '#5A9CB5', backgroundColor: 'rgba(90, 156, 181, 0.2)', pointBackgroundColor: '#5A9CB5' },
                { label: 'Projects', data: [60, 90, 95, 80, 70], borderColor: '#CCFF00', backgroundColor: 'rgba(204, 255, 0, 0.2)', pointBackgroundColor: '#CCFF00' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1500, easing: 'easeOutQuart' },
            plugins: { legend: { display: true, position: 'bottom' } },
            scales: { r: { beginAtZero: true, max: 100 } }
        }
    });
}

function updateParticipationChart() {
    if (!participationChart) return;
    participationChart.update('active');
}

// ===== HOMEWORK CHART (Doughnut Chart) =====
function initHomeworkChart() {
    const ctx = document.getElementById('homeworkChart');
    if (!ctx) return;

    homeworkChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Submitted', 'Late', 'Missing'],
            datasets: [{
                data: [75, 15, 10],
                backgroundColor: ['#001F3F', '#5A9CB5', '#CCFF00'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { animateRotate: true, animateScale: true, duration: 1500, easing: 'easeOutQuart' },
            plugins: {
                legend: { display: true, position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.label}: ${context.raw}%`
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function updateHomeworkChart() {
    if (!homeworkChart) return;
    homeworkChart.update('active');
}

// ===== NOTIFICATION SYSTEM =====
let notificationState = {
    readNotifications: JSON.parse(localStorage.getItem('readNotifications') || '[]')
};

function initNotifications() {
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const notificationWrapper = document.getElementById('notificationWrapper');
    const markAllReadBtn = document.getElementById('markAllRead');

    if (!notificationBtn || !notificationDropdown) return;

    // Toggle dropdown
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('active');
        if (notificationDropdown.classList.contains('active')) {
            renderNotificationList();
        }
    });

    // Mark all as read
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            const notifications = getUpcomingNotifications();
            notifications.forEach(n => {
                if (!notificationState.readNotifications.includes(n.id)) {
                    notificationState.readNotifications.push(n.id);
                }
            });
            localStorage.setItem('readNotifications', JSON.stringify(notificationState.readNotifications));
            renderNotificationList();
            updateNotificationBadge();
        });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (notificationWrapper && !notificationWrapper.contains(e.target)) {
            notificationDropdown.classList.remove('active');
        }
    });
}

function getUpcomingNotifications() {
    const notifications = [];
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (typeof serverEventsData !== 'undefined' && serverEventsData.length > 0) {
        serverEventsData.forEach((event, index) => {
            let eventDate = null;

            // Parse event date in ISO format: "YYYY-MM-DD"
            if (event.event_date) {
                const parts = event.event_date.split('-');
                if (parts.length === 3) {
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    const day = parseInt(parts[2]);
                    eventDate = new Date(year, month, day);

                    // Add time if available
                    if (event.start_time) {
                        const timeParts = event.start_time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                        if (timeParts) {
                            let hours = parseInt(timeParts[1]);
                            const minutes = parseInt(timeParts[2]);
                            const ampm = timeParts[3];
                            if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
                            if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
                            eventDate.setHours(hours, minutes);
                        }
                    }
                }
            } else if (event.month && event.date) {
                // Legacy format
                const monthsShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
                const monthIdx = monthsShort.indexOf(event.month.toUpperCase());
                const year = event.year || now.getFullYear();
                eventDate = new Date(year, monthIdx, parseInt(event.date));
            }

            // Check if event is within next 24 hours
            if (eventDate && eventDate >= now && eventDate <= next24h) {
                notifications.push({
                    id: `event-${index}-${event.title}`,
                    type: 'event',
                    title: event.title,
                    time: eventDate,
                    eventType: event.event_type || 'meeting'
                });
            }
        });
    }

    return notifications;
}


function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    const notifications = getUpcomingNotifications();
    const unreadCount = notifications.filter(n => !notificationState.readNotifications.includes(n.id)).length;

    badge.textContent = unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : '';
}

function renderNotificationList() {
    const list = document.getElementById('notificationList');
    if (!list) return;

    const notifications = getUpcomingNotifications();

    if (notifications.length === 0) {
        list.innerHTML = '<div class="notification-empty"><i class="fas fa-bell-slash"></i><p>No upcoming notifications</p></div>';
        return;
    }

    // Sort by time
    notifications.sort((a, b) => a.time - b.time);

    let html = '';
    notifications.forEach(notification => {
        const isUnread = !notificationState.readNotifications.includes(notification.id);
        const timeStr = formatTimeRemaining(notification.time);
        const iconClass = notification.type === 'event' ? 'event-icon' : 'message-icon';
        const icon = notification.type === 'event' ? 'fa-calendar-alt' : 'fa-envelope';

        html += `
            <div class="notification-item ${isUnread ? 'unread' : ''}" data-id="${notification.id}">
                <div class="notification-icon ${iconClass}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="notification-content">
                    <p class="notification-title">${notification.title}</p>
                    <span class="notification-time">${timeStr}</span>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;

    // Add click handlers to mark individual as read
    list.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            if (!notificationState.readNotifications.includes(id)) {
                notificationState.readNotifications.push(id);
                localStorage.setItem('readNotifications', JSON.stringify(notificationState.readNotifications));
                item.classList.remove('unread');
                updateNotificationBadge();
            }
        });
    });
}

function formatTimeRemaining(date) {
    const now = new Date();
    const diffMs = date - now;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
        return `In ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `In ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
        return date.toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' });
    }
}

// ===== TOP 10 STUDENTS (STATIC) =====
// ===== TOP 10 STUDENTS (STATIC) =====
function renderSidebarStudents() {
    const container = document.getElementById('sidebarTopStudentsList');
    console.log("renderSidebarStudents called. Container found:", !!container);
    if (!container) return;

    const students = [
        { name: "Martinez Espinoza", details: "IVC, Philosophy", img: "face_1.jpg" },
        { name: "Roman Belarus", details: "IIA, Social Studies, English", img: "face_2.jpg" },
        { name: "Liam Carter", details: "VA, Math, Physics", img: "face_3.jpg" },
        { name: "Sophia Turner", details: "IIIB, History", img: "face_4.jpg" },
        { name: "Noah Parker", details: "IVB, Chemistry", img: "face_5.jpg" },
        { name: "Olivia Green", details: "IIA, Biology", img: "face_6.jpg" },
        { name: "Ethan White", details: "VC, Geography", img: "face_7.jpg" },
        { name: "Ava King", details: "IIIC, Literature", img: "face_8.jpg" },
        { name: "Mason Scott", details: "IVA, PE, Art", img: "face_9.jpg" },
        { name: "Isabella Hill", details: "VB, Music", img: "face_10.jpg" }
    ];

    container.innerHTML = students.map(s => `
        <div class="sidebar-student-item">
            <img src="/static/images/${s.img}" class="sidebar-student-avatar" alt="${s.name}">
            <div class="sidebar-student-info">
                <div class="student-name">${s.name}</div>
                <div class="student-details">${s.details}</div>
            </div>
        </div>
    `).join('');
}

// ===== STUDENT FILTER MODAL LOGIC =====
(function initStudentFilterModal() {
    const modal = document.getElementById('studentSelectModal');
    const errorDiv = document.getElementById('studentSelectError');
    const listDiv = document.getElementById('studentSelectList');
    const closeBtn = document.getElementById('closeStudentSelectModal');
    const cancelBtn = document.getElementById('cancelStudentSelect');
    
    if (!modal) return;
    
    let currentChartType = null; // 'grading', 'participation', 'homework'
    
    // Close modal handlers
    function closeModal() {
        modal.classList.remove('active');
        // Reset to "All Students" if cancelled without selection
        if (currentChartType) {
            const filterEl = document.getElementById(currentChartType + 'StudentFilter');
            if (filterEl && filterEl.value === 'one') {
                filterEl.value = 'all';
            }
        }
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Handle student filter change
    function handleStudentFilterChange(chartType) {
        const courseFilter = document.getElementById(chartType + 'CourseFilter');
        const studentFilter = document.getElementById(chartType + 'StudentFilter');
        
        if (!courseFilter || !studentFilter) return;
        
        if (studentFilter.value === 'one') {
            currentChartType = chartType;
            
            if (courseFilter.value === 'all') {
                // Show error - no course selected
                errorDiv.style.display = 'flex';
                listDiv.style.display = 'none';
            } else {
                // Show student list for selected course
                errorDiv.style.display = 'none';
                listDiv.style.display = 'flex';
                populateStudentList(courseFilter.value, chartType);
            }
            
            modal.classList.add('active');
        }
    }
    
    function populateStudentList(courseId, chartType) {
        // Get students from serverStudentsData or fallback demo data
        const students = (typeof serverStudentsData !== 'undefined' && serverStudentsData.length > 0)
            ? serverStudentsData
            : [
                { id: '1', name: 'Martinez Espinoza', course: 'Philosophy', img: 'face_1.jpg' },
                { id: '2', name: 'Roman Belarus', course: 'Social Studies', img: 'face_2.jpg' },
                { id: '3', name: 'Liam Carter', course: 'Math', img: 'face_3.jpg' },
                { id: '4', name: 'Sophia Turner', course: 'History', img: 'face_4.jpg' },
                { id: '5', name: 'Noah Parker', course: 'Chemistry', img: 'face_5.jpg' }
            ];
        
        listDiv.innerHTML = students.map(s => `
            <div class="student-select-item" data-student-id="${s.id}" data-chart="${chartType}">
                <img src="/static/images/${s.img || 'face_1.jpg'}" class="student-select-avatar" 
                     alt="${s.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}'">
                <div class="student-select-info">
                    <div class="student-select-name">${s.name}</div>
                    <div class="student-select-course">${s.course || 'Student'}</div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers for selection
        listDiv.querySelectorAll('.student-select-item').forEach(item => {
            item.addEventListener('click', function() {
                const studentId = this.dataset.studentId;
                const studentName = this.querySelector('.student-select-name').textContent;
                
                // Store selected student (could be used for chart filtering)
                window.selectedStudent = { id: studentId, name: studentName, chart: chartType };
                
                // Update filter text to show selected student name
                const filterEl = document.getElementById(chartType + 'StudentFilter');
                if (filterEl) {
                    // Add selected student as option if not exists
                    let opt = filterEl.querySelector(`option[value="student_${studentId}"]`);
                    if (!opt) {
                        opt = document.createElement('option');
                        opt.value = `student_${studentId}`;
                        opt.textContent = studentName;
                        filterEl.appendChild(opt);
                    }
                    filterEl.value = `student_${studentId}`;
                }
                
                modal.classList.remove('active');
                console.log(`Selected student: ${studentName} for ${chartType} chart`);
            });
        });
    }
    
    // Attach listeners to all student filters
    ['grading', 'participation', 'homework'].forEach(chartType => {
        const filter = document.getElementById(chartType + 'StudentFilter');
        if (filter) {
            filter.addEventListener('change', () => handleStudentFilterChange(chartType));
        }
    });
})();

// ===== TIME INPUT AUTO-FORMATTING =====
function formatTimeInput(value) {
    if (!value) return '';
    
    // Remove all non-digit characters
    let digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    
    // Handle different input lengths
    let hours, minutes;
    
    if (digits.length <= 2) {
        // Single or double digit - assume hours
        hours = digits.padStart(2, '0');
        minutes = '00';
    } else if (digits.length === 3) {
        // 3 digits: H:MM or HH:M
        hours = digits.substring(0, 1).padStart(2, '0');
        minutes = digits.substring(1).padStart(2, '0');
    } else {
        // 4+ digits: HHMM
        hours = digits.substring(0, 2);
        minutes = digits.substring(2, 4);
    }
    
    // Validate and clamp values
    let h = parseInt(hours, 10);
    let m = parseInt(minutes, 10);
    
    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;
    
    // Clamp hours to 0-23, minutes to 0-59
    h = Math.min(Math.max(h, 0), 23);
    m = Math.min(Math.max(m, 0), 59);
    
    return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0');
}

// Apply time formatting to all time inputs
function initTimeInputFormatting() {
    const timeInputs = document.querySelectorAll('.time-input-small, .time-input-medium, input[placeholder*=":"]');
    
    timeInputs.forEach(input => {
        if (input.dataset.timeFormatted) return; // Already initialized
        input.dataset.timeFormatted = 'true';
        
        input.addEventListener('blur', function() {
            const formatted = formatTimeInput(this.value);
            if (formatted) {
                this.value = formatted;
            }
        });
        
        // Also handle Enter key
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                this.blur();
            }
        });
    });
}

// Initialize time formatting on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initTimeInputFormatting);

// Re-initialize when new schedule rows are added dynamically
const scheduleAddBtn = document.getElementById('addScheduleRow');
if (scheduleAddBtn) {
    scheduleAddBtn.addEventListener('click', () => {
        setTimeout(initTimeInputFormatting, 100);
    });
}

// ===== CALENDAR MONTH DROPDOWN =====
(function initCalendarMonthDropdown() {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Find all calendar month titles
    const monthTitles = document.querySelectorAll('#calendarMonthTitle, .calendar-month-title, [id*="monthTitle"]');
    
    monthTitles.forEach(titleEl => {
        if (!titleEl || titleEl.dataset.dropdownInit) return;
        titleEl.dataset.dropdownInit = 'true';
        
        // Make title clickable
        titleEl.style.cursor = 'pointer';
        titleEl.title = 'Click to select month';
        
        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'month-dropdown-container';
        dropdownContainer.style.position = 'relative';
        dropdownContainer.style.display = 'inline-block';
        
        // Wrap title in container
        titleEl.parentNode.insertBefore(dropdownContainer, titleEl);
        dropdownContainer.appendChild(titleEl);
        
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'month-dropdown';
        dropdown.innerHTML = monthNames.map((name, idx) => 
            `<div class="month-dropdown-item" data-month="${idx}">${name}</div>`
        ).join('');
        dropdownContainer.appendChild(dropdown);
        
        // Toggle dropdown on click
        titleEl.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
            
            // Highlight current month
            const currentText = titleEl.textContent;
            dropdown.querySelectorAll('.month-dropdown-item').forEach(item => {
                item.classList.remove('current');
                if (currentText.includes(item.textContent)) {
                    item.classList.add('current');
                }
            });
        });
        
        // Handle month selection
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('.month-dropdown-item');
            if (!item) return;
            
            const selectedMonth = parseInt(item.dataset.month);
            const currentText = titleEl.textContent;
            const yearMatch = currentText.match(/\d{4}/);
            const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
            
            // Update global calendar month if exists
            if (typeof window.currentCalendarMonth !== 'undefined') {
                window.currentCalendarMonth = selectedMonth;
            }
            if (typeof window.currentCalendarYear !== 'undefined') {
                window.currentCalendarYear = year;
            }
            
            // Update title
            titleEl.textContent = `${monthNames[selectedMonth]} ${year}`;
            
            // Trigger calendar re-render if function exists
            if (typeof window.renderMonthCalendar === 'function') {
                window.renderMonthCalendar();
            } else if (typeof renderMainCalendar === 'function') {
                renderMainCalendar();
            }
            
            // Dispatch custom event for other listeners
            document.dispatchEvent(new CustomEvent('calendarMonthChanged', {
                detail: { month: selectedMonth, year: year }
            }));
            
            dropdown.classList.remove('active');
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!dropdownContainer.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });
})();

