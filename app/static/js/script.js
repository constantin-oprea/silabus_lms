document.addEventListener('DOMContentLoaded', function () {
    console.log("SilabusLMS Script Loaded");

    // ======================================================
    // 0. USER PROFILE DROPDOWN
    // ======================================================
    const userProfileNav = document.getElementById('userProfileNav');
    const profileDropdown = document.getElementById('profileDropdown');

    if (userProfileNav && profileDropdown) {
        // Toggle dropdown on click
        userProfileNav.addEventListener('click', function (e) {
            // Don't toggle if clicking on a dropdown item
            if (e.target.closest('.dropdown-item')) return;

            this.classList.toggle('active');
            e.stopPropagation();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!userProfileNav.contains(e.target)) {
                userProfileNav.classList.remove('active');
            }
        });

        // Close dropdown on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                userProfileNav.classList.remove('active');
            }
        });
    }

    // ======================================================
    // 1. DATA INITIALIZATION (Mock DB + Server Data)
    // ======================================================
    let fullStudentDB = [
        {
            id: "SA-001", name: "Sophia Martinez", course: "Philosophy",
            img: "face_1.jpg", attendance: "98%", homework: "100%", participationVal: 2,
            personal: { dob: "March 12, 2008", hobbies: "Chess, Reading", likes: "Quiet study", dislikes: "Noise" },
            gradesList: [
                { category: "Homework", items: [{ name: "Unit 1 Review", grade: "A" }, { name: "Reading Response", grade: "AD" }] },
                { category: "Quizzes", items: [{ name: "Ethics Pop Quiz", grade: "B" }] }
            ],
            groups: ["Debate Team"], friends: [1, 2], // Indices for Liam & Noah
            comments: [{ date: "Dec 20", text: "Excellent point made about Plato today." }]
        },
        {
            id: "SA-002", name: "Liam Johnson", course: "Social Studies",
            img: "face_2.jpg", attendance: "95%", homework: "85%", participationVal: 1,
            personal: { dob: "July 22, 2008", hobbies: "Football, Gaming", likes: "Group work", dislikes: "Essays" },
            gradesList: [{ category: "Homework", items: [{ name: "Map Assignment", grade: "B" }] }],
            groups: ["Sports"], friends: [0],
            comments: []
        },
        {
            id: "SA-003", name: "Noah Williams", course: "Psychology",
            img: "face_3.jpg", attendance: "100%", homework: "100%", participationVal: 0,
            personal: { dob: "Nov 05, 2007", hobbies: "Photography", likes: "Art", dislikes: "Sports" },
            gradesList: [{ category: "Tests", items: [{ name: "Research Methods", grade: "A" }] }],
            groups: [], friends: [0],
            comments: []
        }
    ];

    // Try to load server data if available
    if (typeof serverStudentsData !== 'undefined' && serverStudentsData !== null) {
        fullStudentDB = serverStudentsData;
    }

    let eventItemsData = [
        { type: "type-exam", date: "22", month: "DEC", title: "TOK Final Essay", time: "10:00 AM" },
        { type: "type-meeting", date: "24", month: "DEC", title: "Faculty Meeting", time: "02:00 PM" }
    ];

    if (typeof serverEventsData !== 'undefined' && serverEventsData !== null) {
        eventItemsData = serverEventsData;
    }

    // ======================================================
    // 2. DASHBOARD LOGIC (Student List & Charts)
    // ======================================================
    try {
        const studentList = document.getElementById('mainStudentList');
        if (studentList) {
            studentList.innerHTML = '';
            // Show first 10 students
            fullStudentDB.slice(0, 10).forEach(s => {
                const imgPath = s.img ? `/static/images/${s.img}` : 'https://ui-avatars.com/api/?name=' + s.name;
                studentList.innerHTML += `
                    <div class="student-item">
                        <img src="${imgPath}" class="face-zoom" onerror="this.src='https://ui-avatars.com/api/?name=${s.name}'">
                        <div><strong class="student-name">${s.name}</strong><br><small>${s.attendance || "A"} Attendance</small></div>
                    </div>`;
            });

            // Render Chart
            const chartCanvas = document.getElementById('progressChart');
            if (chartCanvas && typeof Chart !== 'undefined') {
                const ctxMain = chartCanvas.getContext('2d');
                new Chart(ctxMain, {
                    type: 'bar',
                    data: { labels: ['HW', 'Tests', 'Part.', 'Atten.'], datasets: [{ label: 'Class', data: [85, 90, 75, 95], backgroundColor: '#00897B', borderRadius: 4 }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
        }
    } catch (e) { console.error("Dashboard Logic Error:", e); }

    // ======================================================
    // 3. CALENDAR & EVENTS (Safe Mode)
    // ======================================================
    try {
        let currentCalendarMonth = new Date().getMonth();
        let currentCalendarYear = new Date().getFullYear();

        function renderMainCalendar() {
            const calendarDays = document.getElementById('calendarDays');
            if (!calendarDays) return;

            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

            const mName = document.getElementById('monthName');
            if (mName) mName.innerText = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;

            let daysHTML = "";
            // Padding days - adjusted for Monday start (0=Sunday becomes 6, 1=Monday becomes 0)
            let firstDayIndex = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
            firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
            for (let i = 0; i < firstDayIndex; i++) daysHTML += `<div class="calendar-day faded"></div>`;

            // Get event dates for current month
            const currentMonthAbbr = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][currentCalendarMonth];
            const eventDates = eventItemsData
                .filter(e => e.month === currentMonthAbbr)
                .map(e => parseInt(e.date));

            // Actual days
            const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
            const today = new Date();
            for (let i = 1; i <= daysInMonth; i++) {
                const isToday = i === today.getDate() && currentCalendarMonth === today.getMonth() && currentCalendarYear === today.getFullYear() ? "current-day" : "";
                const hasEvent = eventDates.includes(i) ? "has-event" : "";
                daysHTML += `<div class="calendar-day ${isToday} ${hasEvent}" data-day="${i}">${i}</div>`;
            }
            calendarDays.innerHTML = daysHTML;

            // Add click handlers to calendar days
            calendarDays.querySelectorAll('.calendar-day:not(.faded)').forEach(dayEl => {
                dayEl.addEventListener('click', function () {
                    const selectedDay = parseInt(this.dataset.day);
                    if (selectedDay) {
                        filterEventsByDay(selectedDay, currentMonthAbbr);
                    }
                });
            });
        }

        // Initial render
        renderMainCalendar();

        // Month navigation
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');

        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', function () {
                currentCalendarMonth--;
                if (currentCalendarMonth < 0) {
                    currentCalendarMonth = 11;
                    currentCalendarYear--;
                }
                renderMainCalendar();
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', function () {
                currentCalendarMonth++;
                if (currentCalendarMonth > 11) {
                    currentCalendarMonth = 0;
                    currentCalendarYear++;
                }
                renderMainCalendar();
            });
        }

        // Event Pagination Logic
        let currentEventPage = 0;
        const eventsPerPage = 6;
        let filteredEvents = eventItemsData;
        let selectedDayFilter = null;

        // Helper function to convert event to Date object
        function getEventDate(event) {
            const monthMap = {
                "JAN": 0, "FEB": 1, "MAR": 2, "APR": 3, "MAY": 4, "JUN": 5,
                "JUL": 6, "AUG": 7, "SEP": 8, "OCT": 9, "NOV": 10, "DEC": 11
            };
            const year = new Date().getFullYear();
            const month = monthMap[event.month];
            const day = parseInt(event.date);
            return new Date(year, month, day);
        }

        // Sort events chronologically
        function sortEvents(events) {
            return events.sort((a, b) => getEventDate(a) - getEventDate(b));
        }

        // Filter future events (today and onwards)
        function getFutureEvents(events) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return events.filter(e => getEventDate(e) >= today);
        }

        function filterEventsByDay(day, month) {
            selectedDayFilter = { day, month };
            // When filtering by day, show all events for that day (past or future)
            filteredEvents = sortEvents(eventItemsData.filter(e => parseInt(e.date) === day && e.month === month));
            currentEventPage = 0;
            renderEvents();
            updateEventHeader();
        }

        window.resetEventsView = function () {
            selectedDayFilter = null;
            // Reset to future events only
            filteredEvents = sortEvents(getFutureEvents(eventItemsData));
            currentEventPage = 0;
            renderEvents();
            updateEventHeader();
        }

        // Initialize with sorted future events
        filteredEvents = sortEvents(getFutureEvents(eventItemsData));

        function updateEventHeader() {
            const headerTitle = document.getElementById('eventHeaderTitle');
            if (headerTitle) {
                if (selectedDayFilter) {
                    headerTitle.textContent = `Events on ${selectedDayFilter.month} ${selectedDayFilter.day}`;
                } else {
                    headerTitle.textContent = 'Upcoming Events';
                }
            }
        }

        function renderEvents() {
            const eventList = document.getElementById('eventList');
            const emptyState = document.getElementById('emptyState');
            const prevBtn = document.getElementById('prevEvent');
            const nextBtn = document.getElementById('nextEvent');

            if (!eventList) return;

            const startIdx = currentEventPage * eventsPerPage;
            const endIdx = startIdx + eventsPerPage;
            const eventsToShow = filteredEvents.slice(startIdx, endIdx);

            if (eventsToShow.length === 0) {
                eventList.style.display = 'none';
                if (emptyState) emptyState.style.display = 'flex';
            } else {
                eventList.style.display = '';
                if (emptyState) emptyState.style.display = 'none';

                eventList.innerHTML = '';
                eventsToShow.forEach(e => {
                    eventList.innerHTML += `
                        <div class="event-item ${e.type}">
                            <div class="event-date-box"><span class="day">${e.date}</span><span class="month">${e.month}</span></div>
                            <div class="event-info"><span class="event-title">${e.title}</span><span class="event-time">${e.time}</span></div>
                        </div>`;
                });
            }

            // Update navigation buttons
            if (prevBtn) {
                if (currentEventPage > 0) {
                    prevBtn.classList.remove('disabled');
                    prevBtn.style.cursor = 'pointer';
                } else {
                    prevBtn.classList.add('disabled');
                    prevBtn.style.cursor = 'not-allowed';
                }
            }

            if (nextBtn) {
                if (endIdx < filteredEvents.length) {
                    nextBtn.classList.remove('disabled');
                    nextBtn.style.cursor = 'pointer';
                } else {
                    nextBtn.classList.add('disabled');
                    nextBtn.style.cursor = 'not-allowed';
                }
            }
        }

        // Listen for cross-tab profile updates
        const updateChannel = new BroadcastChannel('user_profile_updates');
        updateChannel.onmessage = (event) => {
            if (event.data.type === 'avatar_update') {
                document.querySelectorAll('.nav-avatar').forEach(img => img.src = event.data.url);
                const profileImg = document.getElementById('profileImage');
                if (profileImg) profileImg.src = event.data.url;
            }
        };

        // Initialize event rendering
        renderEvents();

        // Navigation button handlers
        const prevEventBtn = document.getElementById('prevEvent');
        const nextEventBtn = document.getElementById('nextEvent');

        if (prevEventBtn) {
            prevEventBtn.addEventListener('click', function () {
                if (currentEventPage > 0) {
                    currentEventPage--;
                    renderEvents();
                }
            });
        }

        if (nextEventBtn) {
            nextEventBtn.addEventListener('click', function () {
                const maxPage = Math.ceil(filteredEvents.length / eventsPerPage) - 1;
                if (currentEventPage < maxPage) {
                    currentEventPage++;
                    renderEvents();
                }
            });
        }
    } catch (e) { console.error("Calendar Logic Error:", e); }

    // ======================================================
    // 4. STUDENTS PAGE LOGIC (The Profile Loader)
    // ======================================================
    try {
        const dirList = document.getElementById('directoryList');

        // Handle Deep Linking to Student Card
        const urlParams = new URLSearchParams(window.location.search);
        const studentId = urlParams.get('id');

        // Only run this if we are actually on the Students page
        if (dirList) {
            if (studentId) {
                // Wait a bit for the fullStudentDB to be ready if it's dynamic
                setTimeout(() => {
                    if (window.loadReportCard) window.loadReportCard(studentId);
                }, 100);
            }

            // -- Function to Render Directory --
            function renderDirectory() {
                dirList.innerHTML = '';
                const countBadge = document.getElementById('totalStudentsCount');
                if (countBadge) countBadge.innerText = fullStudentDB.length;

                fullStudentDB.forEach(s => {
                    const imgPath = s.img ? `/static/images/${s.img}` : 'https://ui-avatars.com/api/?name=' + s.name;
                    dirList.innerHTML += `
                        <div class="dir-item" onclick="loadReportCard('${s.id}')">
                            <img src="${imgPath}" class="dir-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${s.name}'">
                            <div class="dir-info"><h5>${s.name}</h5><small>${s.course}</small></div>
                        </div>`;
                });
            }

            // -- Function to Load Profile --
            window.loadReportCard = function (id) {
                const student = fullStudentDB.find(s => s.id === id);
                if (!student) return;

                // 1. Basic Info
                document.getElementById('rcName').innerText = student.name;
                const imgPath = student.img ? `/static/images/${student.img}` : 'https://ui-avatars.com/api/?name=' + student.name;
                const photoEl = document.getElementById('rcPhoto');
                if (photoEl) photoEl.src = imgPath;

                // 2. Personal Info (Safe Access)
                const p = student.personal || {};
                const setTxt = (id, txt) => { const el = document.getElementById(id); if (el) el.innerText = txt || "--"; };

                setTxt('rcBirthday', p.dob);
                setTxt('rcHobbies', p.hobbies);
                setTxt('rcLikes', p.likes);
                setTxt('rcDislikes', p.dislikes);

                // 3. Metrics
                setTxt('rcAttendance', student.attendance);
                setTxt('rcHomework', student.homework);

                // 4. Grades
                const gradesContainer = document.getElementById('rcGradesList');
                if (gradesContainer) {
                    gradesContainer.innerHTML = '';
                    if (student.gradesList && student.gradesList.length > 0) {
                        student.gradesList.forEach(cat => {
                            let taskHTML = '';
                            cat.items.forEach(task => {
                                let badgeClass = 'grade-b';
                                if (task.grade === 'A') badgeClass = 'grade-a';
                                if (task.grade === 'AD') badgeClass = 'grade-ad';
                                taskHTML += `<div class="task-item"><span class="task-name">${task.name}</span><span class="task-grade-badge ${badgeClass}">${task.grade}</span></div>`;
                            });
                            gradesContainer.innerHTML += `<div class="grade-category-block"><h5 class="category-title">${cat.category}</h5><div class="task-list">${taskHTML}</div></div>`;
                        });
                    } else {
                        gradesContainer.innerHTML = '<div style="padding:10px; color:#aaa;">No grades available</div>';
                    }
                }

                // 5. Friends (Social Circle)
                const friendsContainer = document.getElementById('rcFriends');
                if (friendsContainer) {
                    friendsContainer.innerHTML = '';
                    if (student.friends && student.friends.length > 0) {
                        student.friends.forEach(fIndex => {
                            const friend = fullStudentDB[fIndex];
                            if (friend) {
                                const fImg = friend.img ? `/static/images/${friend.img}` : 'https://ui-avatars.com/api/?name=' + friend.name;
                                friendsContainer.innerHTML += `<img src="${fImg}" class="friend-img" title="${friend.name}" onerror="this.src='https://ui-avatars.com/api/?name=${friend.name}'">`;
                            }
                        });
                    } else {
                        friendsContainer.innerHTML = '<span style="font-size:11px; color:#aaa;">No close friends listed.</span>';
                    }
                }

                // 6. Comments
                const commentList = document.getElementById('rcCommentsList');
                if (commentList) {
                    commentList.innerHTML = '';
                    if (!student.comments || student.comments.length === 0) {
                        commentList.innerHTML = '<div style="color:#aaa; font-style:italic; padding:10px;">No comments yet.</div>';
                    } else {
                        student.comments.forEach(c => {
                            commentList.innerHTML += `<div class="comment-item"><span class="comment-date">${c.date}</span>${c.text}</div>`;
                        });
                    }
                }
            };

            // -- INIT --
            renderDirectory();

            // *** AUTO-LOAD RANDOM STUDENT ***
            if (fullStudentDB.length > 0) {
                const randomIndex = Math.floor(Math.random() * fullStudentDB.length);
                loadReportCard(fullStudentDB[randomIndex].id);
            }
        }
    } catch (e) { console.error("Student Page Logic Error:", e); }

    // ======================================================
    // 5. GLOBAL UI (Cards Tilt)
    // ======================================================
    // ======================================================
    // 6. TOP 10 STUDENTS GLOBAL RENDER
    // ======================================================
    window.renderTopStudents = function () {
        const container = document.getElementById('topStudentsList');
        if (!container) return;

        // Try to fetch from API for latest data
        fetch('/api/students/top')
            .then(response => response.json())
            .then(students => {
                if (!students || students.length === 0) {
                    // Fallback to local data if API fails or is empty
                    students = [
                        { id: "1", name: "Carlos Mendoza", room: "III B", courses: "Social Studies, Projects", avatar: "/static/images/face_1.jpg" },
                        { id: "2", name: "María Quispe", room: "IV A", courses: "Philosophy, Projects", avatar: "/static/images/face_2.jpg" },
                        { id: "3", name: "Luis Huamán", room: "III A", courses: "Social Studies, Philosophy", avatar: "/static/images/face_3.jpg" },
                        { id: "4", name: "Ana Flores", room: "III A", courses: "Projects", avatar: "/static/images/face_4.jpg" },
                        { id: "5", name: "José Chávez", room: "IV B", courses: "Social Studies", avatar: "/static/images/face_5.jpg" }
                    ];
                }

                let html = '';
                students.forEach((student) => {
                    const studentLink = `/students?id=${student.id || ''}`;
                    html += `
                        <div class="student-item-new">
                            <a href="${studentLink}">
                                <img src="${student.avatar}" 
                                     class="student-avatar-new face-zoom" alt="${student.name}"
                                     onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=2E5D4B&color=fff&size=40'">
                            </a>
                            <div class="student-info-new">
                                <a href="${studentLink}" class="student-name-link">
                                    <p class="student-name-new">${student.name}</p>
                                </a>
                                <p class="student-role-new">${student.room} · ${student.courses}</p>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            })
            .catch(err => {
                console.error("Failed to fetch top students:", err);
            });
    };

    // Initial render
    window.renderTopStudents();

    if (typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(document.querySelectorAll(".stat-card"), { max: 5, speed: 400, glare: true, "max-glare": 0.1, scale: 1.02 });
    }
});