// ===== SETTINGS PAGE JAVASCRIPT =====

document.addEventListener('DOMContentLoaded', function () {
    // Update date/time in navbar
    updateDateTime();
    setInterval(updateDateTime, 60000);

    // Initialize components
    initProfilePictureUpload();
    initTabNavigation();
    initMessageForm();
    initCourseFilter();
    initStudentMessageButtons();
    initAddStudentForm();
    initEventManagement();
    initFileImport();
    initEditStudentModal();
});

// ===== DATE/TIME =====
function updateDateTime() {
    const now = new Date();
    const options = {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    const formatted = now.toLocaleDateString('en-GB', options).replace(',', '');
    const navDateTime = document.getElementById('navDateTime');
    if (navDateTime) {
        navDateTime.textContent = formatted;
    }
}

// ===== TAB NAVIGATION =====
function initTabNavigation() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const tabId = this.dataset.tab;

            // Update button states
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update content visibility
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}Tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

// ===== PROFILE PICTURE UPLOAD WITH CROPPER =====
function initProfilePictureUpload() {
    const profileImageContainer = document.querySelector('.profile-image-container');
    const changePictureBtn = document.getElementById('changePictureBtn');
    const avatarInput = document.getElementById('avatarInput');
    const profileImage = document.getElementById('profileImage');

    // Modal elements
    const cropModal = document.getElementById('cropModal');
    const cropImage = document.getElementById('cropImage');
    const closeCropBtn = document.getElementById('closeCropBtn');
    const cancelCropBtn = document.getElementById('cancelCropBtn');
    const saveCropBtn = document.getElementById('saveCropBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetCropBtn = document.getElementById('resetCropBtn');

    let cropper = null;

    // Open file selector
    const openFileSelector = () => avatarInput.click();
    if (profileImageContainer) profileImageContainer.addEventListener('click', openFileSelector);
    if (changePictureBtn) changePictureBtn.addEventListener('click', openFileSelector);

    // Handle file selection
    if (avatarInput) {
        avatarInput.addEventListener('change', function (e) {
            const file = this.files[0];
            if (!file) return;

            // Validate file type
            const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showToast('Please select a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                // Set image source and open modal
                cropImage.src = e.target.result;
                openCropModal();
            };
            reader.readAsDataURL(file);
        });
    }

    function openCropModal() {
        if (cropModal) {
            cropModal.classList.add('active');

            // Initialize Cropper
            if (cropper) {
                cropper.destroy();
            }

            cropper = new Cropper(cropImage, {
                aspectRatio: 1,
                viewMode: 0,
                dragMode: 'move',
                autoCropArea: 0.8,
                restore: false,
                guides: false,
                center: false,
                highlight: false,
                cropBoxMovable: false,
                cropBoxResizable: false,
                toggleDragModeOnDblclick: false,
                minCropBoxWidth: 200,
                minCropBoxHeight: 200,
                zoomOnWheel: true,
            });
        }
    }

    function closeCropModal() {
        if (cropModal) {
            cropModal.classList.remove('active');
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            avatarInput.value = '';
        }
    }

    // Modal event listeners
    if (closeCropBtn) closeCropBtn.addEventListener('click', closeCropModal);
    if (cancelCropBtn) cancelCropBtn.addEventListener('click', closeCropModal);

    // Zoom listeners
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => cropper && cropper.zoom(0.1));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => cropper && cropper.zoom(-0.1));
    if (resetCropBtn) resetCropBtn.addEventListener('click', () => cropper && cropper.reset());

    if (saveCropBtn) {
        saveCropBtn.addEventListener('click', function () {
            if (!cropper) return;

            const canvas = cropper.getCroppedCanvas({
                width: 400,
                height: 400,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });

            canvas.toBlob(async function (blob) {
                const formData = new FormData();
                formData.append('avatar', blob, 'avatar.png');

                saveCropBtn.textContent = 'Uploading...';
                saveCropBtn.disabled = true;

                try {
                    const response = await fetch('/api/settings/avatar', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();

                    if (response.ok) {
                        const newAvatarUrl = data.avatar_url;
                        if (profileImage) profileImage.src = newAvatarUrl;
                        document.querySelectorAll('.nav-avatar').forEach(img => img.src = newAvatarUrl);

                        const updateChannel = new BroadcastChannel('user_profile_updates');
                        updateChannel.postMessage({ type: 'avatar_update', url: newAvatarUrl });

                        showToast('Profile picture updated successfully!', 'success');
                        closeCropModal();
                    } else {
                        showToast(data.error || 'Failed to upload image', 'error');
                    }
                } catch (error) {
                    console.error('Upload error:', error);
                    showToast('Failed to upload image. Please try again.', 'error');
                } finally {
                    saveCropBtn.textContent = 'Save & Upload';
                    saveCropBtn.disabled = false;
                }
            }, 'image/png');
        });
    }
}

// ===== MESSAGE FORM =====
function initMessageForm() {
    const messageForm = document.getElementById('messageForm');

    if (messageForm) {
        messageForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const recipientSelect = document.getElementById('recipientSelect');
            const subject = document.getElementById('messageSubject').value.trim();
            const message = document.getElementById('messageContent').value.trim();

            if (!message) {
                showToast('Please enter a message', 'error');
                return;
            }

            const selectedOptions = Array.from(recipientSelect.selectedOptions);
            let studentIds = [];

            if (selectedOptions.some(opt => opt.value === 'all')) {
                studentIds = Array.from(recipientSelect.options)
                    .filter(opt => opt.value !== 'all')
                    .map(opt => parseInt(opt.value));
            } else {
                studentIds = selectedOptions.map(opt => parseInt(opt.value));
            }

            if (studentIds.length === 0) {
                showToast('Please select at least one recipient', 'error');
                return;
            }

            try {
                const response = await fetch('/api/settings/message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject: subject,
                        message: message,
                        student_ids: studentIds
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast(`Message sent to ${data.recipients} student(s)!`, 'success');
                    messageForm.reset();
                } else {
                    showToast(data.error || 'Failed to send message', 'error');
                }
            } catch (error) {
                console.error('Message error:', error);
                showToast('Failed to send message. Please try again.', 'error');
            }
        });
    }
}

// ===== COURSE FILTER =====
function initCourseFilter() {
    const courseFilter = document.getElementById('courseFilter');
    const studentsGrid = document.getElementById('studentsGrid');

    if (courseFilter && studentsGrid) {
        courseFilter.addEventListener('change', async function () {
            const courseId = this.value;
            const studentCards = studentsGrid.querySelectorAll('.student-card');

            if (!courseId) {
                studentCards.forEach(card => card.style.display = 'flex');
            } else {
                try {
                    const response = await fetch(`/api/settings/students?course_id=${courseId}`);
                    const students = await response.json();
                    const studentIds = students.map(s => s.id.toString());

                    studentCards.forEach(card => {
                        const cardStudentId = card.dataset.studentId;
                        if (cardStudentId && studentIds.includes(cardStudentId)) {
                            card.style.display = 'flex';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                } catch (error) {
                    console.error('Filter error:', error);
                    studentCards.forEach(card => card.style.display = 'flex');
                }
            }
        });
    }
}

// ===== INDIVIDUAL STUDENT MESSAGE BUTTONS =====
function initStudentMessageButtons() {
    const recipientSelect = document.getElementById('recipientSelect');

    document.querySelectorAll('.message-student-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const studentId = this.dataset.studentId;
            const studentName = this.dataset.studentName;

            // Switch to messages tab
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            document.querySelector('.tab-btn[data-tab="messages"]').classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById('messagesTab').classList.add('active');

            if (recipientSelect) {
                Array.from(recipientSelect.options).forEach(opt => {
                    opt.selected = opt.value === studentId;
                });
            }

            document.getElementById('messageSubject')?.focus();
            showToast(`Composing message to ${studentName}`, 'success');
        });
    });
}

// ===== ADD STUDENT FORM =====
function initAddStudentForm() {
    const addStudentForm = document.getElementById('addStudentForm');
    const courseSelect = document.getElementById('studentCourse');
    const socialCircleSelect = document.getElementById('studentSocialCircle');

    // Update social circle when course changes
    if (courseSelect && socialCircleSelect) {
        courseSelect.addEventListener('change', async function () {
            const courseId = this.value;

            if (!courseId) {
                socialCircleSelect.innerHTML = '<option value="" disabled>Select a course first to see available students</option>';
                socialCircleSelect.disabled = true;
                return;
            }

            try {
                const response = await fetch(`/api/settings/courses/${courseId}/students`);
                if (!response.ok) throw new Error('Failed to fetch students');

                const students = await response.json();

                if (students.length === 0) {
                    socialCircleSelect.innerHTML = '<option value="" disabled>No students in this course yet</option>';
                    socialCircleSelect.disabled = true;
                } else {
                    socialCircleSelect.innerHTML = students.map(s =>
                        `<option value="${s.id}">${s.name}</option>`
                    ).join('');
                    socialCircleSelect.disabled = false;
                }
            } catch (error) {
                console.error('Error fetching course students:', error);
                socialCircleSelect.innerHTML = '<option value="" disabled>Error loading students</option>';
                socialCircleSelect.disabled = true;
            }
        });
    }

    // Handle form submission
    if (addStudentForm) {
        addStudentForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const firstName = document.getElementById('studentFirstName').value.trim();
            const lastName = document.getElementById('studentLastName').value.trim();
            const email = document.getElementById('studentEmail').value.trim();
            const birthday = document.getElementById('studentBirthday').value;
            const courseId = document.getElementById('studentCourse').value;
            const hobbies = document.getElementById('studentHobbies').value.trim();

            const socialCircleOptions = document.getElementById('studentSocialCircle').selectedOptions;
            const socialCircle = Array.from(socialCircleOptions).map(opt => parseInt(opt.value));

            if (!firstName || !lastName) {
                showToast('Please enter first and last name', 'error');
                return;
            }

            if (!courseId) {
                showToast('Please select a course', 'error');
                return;
            }

            try {
                const response = await fetch('/api/settings/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        birthday: birthday,
                        course_id: parseInt(courseId),
                        hobbies: hobbies,
                        social_circle: socialCircle
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast(`Student ${data.student.name} added to ${data.student.course}!`, 'success');
                    addStudentForm.reset();
                    document.getElementById('studentSocialCircle').innerHTML = '<option value="" disabled>Select a course first to see available students</option>';
                    document.getElementById('studentSocialCircle').disabled = true;
                    // Optionally reload page to show new student
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showToast(data.error || 'Failed to add student', 'error');
                }
            } catch (error) {
                console.error('Add student error:', error);
                showToast('Failed to add student. Please try again.', 'error');
            }
        });
    }
}

// ===== EVENT MANAGEMENT =====
function initEventManagement() {
    let eventToDelete = null;
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const deleteConfirmMessage = document.getElementById('deleteConfirmMessage');
    const confirmDeleteBtn = document.getElementById('confirmDelete');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const closeDeleteModal = document.getElementById('closeDeleteModal');

    // Delete event buttons
    document.querySelectorAll('.delete-event-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            eventToDelete = this.dataset.eventId;
            const eventItem = this.closest('.event-item');
            const eventTitle = eventItem.querySelector('.event-title').textContent;

            deleteConfirmMessage.textContent = `Are you sure you want to delete "${eventTitle}"?`;
            deleteConfirmModal.classList.add('active');
        });
    });

    // Close modal handlers
    function closeModal() {
        deleteConfirmModal.classList.remove('active');
        eventToDelete = null;
    }

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeModal);
    if (closeDeleteModal) closeDeleteModal.addEventListener('click', closeModal);

    // Confirm delete
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async function () {
            if (!eventToDelete) return;

            try {
                const response = await fetch(`/api/settings/events/${eventToDelete}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (response.ok) {
                    // Remove event from DOM
                    const eventItem = document.querySelector(`.event-item[data-event-id="${eventToDelete}"]`);
                    if (eventItem) {
                        eventItem.style.animation = 'fadeOut 0.3s ease';
                        setTimeout(() => eventItem.remove(), 300);
                    }

                    // Update count
                    const eventsCount = document.getElementById('eventsCount');
                    if (eventsCount) {
                        const remaining = document.querySelectorAll('.event-item').length - 1;
                        eventsCount.textContent = `${remaining} events`;
                    }

                    showToast('Event deleted successfully', 'success');
                    closeModal();
                } else {
                    showToast(data.error || 'Failed to delete event', 'error');
                }
            } catch (error) {
                console.error('Delete error:', error);
                showToast('Failed to delete event. Please try again.', 'error');
            }
        });
    }
}

// ===== FILE IMPORT =====
function initFileImport() {
    const fileUploadZone = document.getElementById('fileUploadZone');
    const importFile = document.getElementById('importFile');
    const uploadContent = document.querySelector('.upload-content');
    const fileSelected = document.getElementById('fileSelected');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const importSubmitBtn = document.getElementById('importSubmitBtn');
    const importForm = document.getElementById('importForm');
    const importResults = document.getElementById('importResults');
    const importResultsContent = document.getElementById('importResultsContent');

    if (!fileUploadZone || !importFile) return;

    // Click to open file dialog
    fileUploadZone.addEventListener('click', () => {
        if (!fileSelected.classList.contains('hidden')) return;
        importFile.click();
    });

    // Drag and drop
    fileUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadZone.classList.add('dragover');
    });

    fileUploadZone.addEventListener('dragleave', () => {
        fileUploadZone.classList.remove('dragover');
    });

    fileUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadZone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    // File input change
    importFile.addEventListener('change', function () {
        if (this.files.length > 0) {
            handleFileSelect(this.files[0]);
        }
    });

    function handleFileSelect(file) {
        const validExtensions = ['csv', 'xlsx', 'xls'];
        const ext = file.name.split('.').pop().toLowerCase();

        if (!validExtensions.includes(ext)) {
            showToast('Please select a CSV or Excel file', 'error');
            return;
        }

        fileName.textContent = file.name;
        uploadContent.classList.add('hidden');
        fileSelected.classList.remove('hidden');
        importSubmitBtn.disabled = false;
    }

    // Remove file
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            importFile.value = '';
            uploadContent.classList.remove('hidden');
            fileSelected.classList.add('hidden');
            importSubmitBtn.disabled = true;
        });
    }

    // Form submission
    if (importForm) {
        importForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const courseId = document.getElementById('importCourse').value;
            if (!courseId) {
                showToast('Please select a course', 'error');
                return;
            }

            if (!importFile.files.length) {
                showToast('Please select a file', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('file', importFile.files[0]);
            formData.append('course_id', courseId);

            importSubmitBtn.disabled = true;
            importSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';

            try {
                const response = await fetch('/api/settings/students/import', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    // Show results
                    importResults.classList.remove('hidden');

                    let html = `<p class="import-success"><i class="fas fa-check-circle"></i> ${data.message}</p>`;
                    html += `<p>Course: <strong>${data.course}</strong></p>`;

                    if (data.students_added.length > 0) {
                        html += '<ul>';
                        data.students_added.forEach(s => {
                            html += `<li>${s.name} (Row ${s.row})</li>`;
                        });
                        html += '</ul>';
                    }

                    if (data.errors.length > 0) {
                        html += '<p class="import-error"><i class="fas fa-exclamation-triangle"></i> Errors:</p><ul>';
                        data.errors.forEach(err => {
                            html += `<li>Row ${err.row}: ${err.error}</li>`;
                        });
                        html += '</ul>';
                    }

                    importResultsContent.innerHTML = html;
                    showToast(`Imported ${data.students_added.length} students!`, 'success');

                    // Reset form
                    importFile.value = '';
                    uploadContent.classList.remove('hidden');
                    fileSelected.classList.add('hidden');

                } else {
                    showToast(data.error || 'Import failed', 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                showToast('Import failed. Please try again.', 'error');
            } finally {
                importSubmitBtn.disabled = false;
                importSubmitBtn.innerHTML = '<i class="fas fa-upload"></i> Import Students';
            }
        });
    }
}

// ===== EDIT STUDENT MODAL =====
function initEditStudentModal() {
    const editModal = document.getElementById('editStudentModal');
    const editForm = document.getElementById('editStudentForm');
    const closeEditBtn = document.getElementById('closeEditStudentModal');
    const cancelEditBtn = document.getElementById('cancelEditStudent');

    // Edit button click handlers
    document.querySelectorAll('.edit-student-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const studentId = this.dataset.studentId;

            // Get student data
            try {
                const response = await fetch(`/api/settings/students?student_id=${studentId}`);
                // Find the student in the response
                const students = await response.json();

                // For now, we'll populate from the DOM since we have the data
                const card = this.closest('.student-card');
                const nameParts = card.querySelector('.student-name').textContent.trim().split(' ');
                const email = card.querySelector('.student-email').textContent.trim();
                const birthdayEl = card.querySelector('.student-meta');

                document.getElementById('editStudentId').value = studentId;
                document.getElementById('editFirstName').value = nameParts[0] || '';
                document.getElementById('editLastName').value = nameParts.slice(1).join(' ') || '';
                document.getElementById('editEmail').value = email !== 'No email' ? email : '';

                // Load social circle options
                // This would require knowing the course - simplified for now
                const socialCircleSelect = document.getElementById('editSocialCircle');
                socialCircleSelect.innerHTML = '<option>Loading...</option>';

                editModal.classList.add('active');

            } catch (error) {
                console.error('Error loading student:', error);
                showToast('Failed to load student data', 'error');
            }
        });
    });

    // Close modal
    function closeEditModal() {
        editModal.classList.remove('active');
        editForm.reset();
    }

    if (closeEditBtn) closeEditBtn.addEventListener('click', closeEditModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);

    // Save changes
    if (editForm) {
        editForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const studentId = document.getElementById('editStudentId').value;
            const firstName = document.getElementById('editFirstName').value.trim();
            const lastName = document.getElementById('editLastName').value.trim();
            const email = document.getElementById('editEmail').value.trim();
            const birthday = document.getElementById('editBirthday').value;
            const hobbies = document.getElementById('editHobbies').value.trim();

            const socialCircleOptions = document.getElementById('editSocialCircle').selectedOptions;
            const socialCircle = Array.from(socialCircleOptions).map(opt => parseInt(opt.value)).filter(v => !isNaN(v));

            try {
                const response = await fetch(`/api/settings/students/${studentId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        birthday: birthday,
                        hobbies: hobbies,
                        social_circle: socialCircle
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast('Student updated successfully!', 'success');
                    closeEditModal();
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showToast(data.error || 'Failed to update student', 'error');
                }
            } catch (error) {
                console.error('Update error:', error);
                showToast('Failed to update student. Please try again.', 'error');
            }
        });
    }
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(-20px); }
    }
`;
document.head.appendChild(style);
