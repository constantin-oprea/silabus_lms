// Course Creation Modal JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('createCourseModal');
    const openModalBtns = document.querySelectorAll('#openCreateCourseModalBtn, #openCreateCourseModalEmptyStateBtn');
    const closeModalBtn = document.getElementById('closeCreateCourseModal');
    const cancelBtn = document.getElementById('cancelCreateCourse');
    const form = document.getElementById('createCourseForm');
    const scheduleContainer = document.getElementById('scheduleContainer');
    const addScheduleBtn = document.getElementById('addScheduleBtn');

    let scheduleCounter = 0;

    // Open Modal
    openModalBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                modal.classList.add('active');
            });
        }
    });

    // Close Modal
    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            form.reset();
            scheduleContainer.innerHTML = '';
            scheduleCounter = 0;
            // Reset file previews
            document.querySelectorAll('.upload-preview').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.upload-zone-modern').forEach(el => el.classList.remove('has-file'));
        }, 300);
    }

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    // Close on outside click
    modal?.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Schedule Management
    function createScheduleRow() {
        const row = document.createElement('div');
        row.className = 'schedule-row-modern';
        row.dataset.scheduleId = scheduleCounter++;

        row.innerHTML = `
            <select class="schedule-select schedule-day" name="schedule_day[]" required>
                <option value="">Select Day</option>
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday</option>
            </select>
            
            <input type="time" class="schedule-time-input schedule-start" name="schedule_start[]" required>
            
            <input type="time" class="schedule-time-input schedule-end" name="schedule_end[]" required>
            
            <input type="text" class="schedule-time-input schedule-room" name="schedule_room[]" placeholder="Room" required>
            
            <button type="button" class="btn-delete-schedule" title="Delete session">
                <i class="bi bi-trash"></i>
            </button>
        `;

        // Add delete functionality
        const deleteBtn = row.querySelector('.btn-delete-schedule');
        deleteBtn.addEventListener('click', function() {
            row.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => row.remove(), 300);
        });

        return row;
    }

    // Add schedule button
    if (addScheduleBtn) {
        addScheduleBtn.addEventListener('click', function() {
            const scheduleRow = createScheduleRow();
            scheduleContainer.appendChild(scheduleRow);
        });
    }

    // Add first schedule row by default
    if (scheduleContainer) {
        const firstRow = createScheduleRow();
        scheduleContainer.appendChild(firstRow);
    }

    // File Upload Handlers
    function handleFileUpload(uploadZone, fileInput, previewContainer, fileType) {
        uploadZone.addEventListener('click', function() {
            fileInput.click();
        });

        uploadZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadZone.style.borderColor = '#198754';
        });

        uploadZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadZone.style.borderColor = '#d1d5db';
        });

        uploadZone.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadZone.style.borderColor = '#d1d5db';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFilePreview(files[0], previewContainer, uploadZone, fileType);
            }
        });

        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleFilePreview(file, previewContainer, uploadZone, fileType);
            }
        });
    }

    function handleFilePreview(file, previewContainer, uploadZone, fileType) {
        uploadZone.classList.add('has-file');
        previewContainer.classList.add('active');
        
        if (fileType === 'image') {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewContainer.innerHTML = `
                    <img src="${e.target.result}" class="preview-image" alt="Course image preview">
                    <p class="upload-hint mt-2">${file.name}</p>
                `;
            };
            reader.readAsDataURL(file);
        } else if (fileType === 'pdf') {
            previewContainer.innerHTML = `
                <div class="preview-file-name">
                    <i class="bi bi-file-earmark-pdf text-danger"></i>
                    <span>${file.name}</span>
                </div>
            `;
        }
    }

    // Initialize file uploads
    const imageUploadZone = document.getElementById('imageUploadZone');
    const imageInput = document.getElementById('courseImageInput');
    const imagePreview = document.getElementById('imagePreview');
    
    const syllabusUploadZone = document.getElementById('syllabusUploadZone');
    const syllabusInput = document.getElementById('courseSyllabusInput');
    const syllabusPreview = document.getElementById('syllabusPreview');

    if (imageUploadZone && imageInput && imagePreview) {
        handleFileUpload(imageUploadZone, imageInput, imagePreview, 'image');
    }

    if (syllabusUploadZone && syllabusInput && syllabusPreview) {
        handleFileUpload(syllabusUploadZone, syllabusInput, syllabusPreview, 'pdf');
    }

    // Form Submission
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            
            // Build schedule JSON
            const schedules = [];
            const days = document.querySelectorAll('.schedule-day');
            const starts = document.querySelectorAll('.schedule-start');
            const ends = document.querySelectorAll('.schedule-end');
            const rooms = document.querySelectorAll('.schedule-room');
            
            for (let i = 0; i < days.length; i++) {
                if (days[i].value && starts[i].value && ends[i].value) {
                    schedules.push({
                        day: days[i].value,
                        start_time: starts[i].value,
                        end_time: ends[i].value,
                        room: rooms[i].value || ''
                    });
                }
            }
            
            formData.append('schedule_json', JSON.stringify(schedules));
            
            // Collect grading systems
            const gradingSystems = [];
            document.querySelectorAll('input[name="grading_systems"]:checked').forEach(cb => {
                gradingSystems.push(cb.value);
            });
            gradingSystems.forEach(gs => formData.append('grading_systems[]', gs));
            
            // Show loading state
            const submitBtn = document.getElementById('submitCreateCourse');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Creating...';
            
            // Submit via AJAX
            fetch('/dashboard/create-course/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Success - close modal and reload page
                    closeModal();
                    location.reload();
                } else {
                    // Error
                    alert('Error: ' + (data.message || 'Failed to create course'));
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
        });
    }
});

// Animation for slide out
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
