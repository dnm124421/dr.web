// ===== INTERNATIONAL CONSULTATION PAGE LOGIC =====
// Immediate Theme Detection (avoids flash of light mode)
(function () {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

// ─── State ──────────────────────────────────────────────────────────────────
let currentStep = 1;
let selectedDate = null;
let selectedTime = null;
let calendarDate = new Date();

const AVAILABLE_TIMES = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
];
// Simulate a few "booked" slots
const BOOKED_SLOTS = {
    // key: "YYYY-MM-DD", value: array of already-booked times
};

// ─── Utility helpers ─────────────────────────────────────────────────────────
function pad(n) { return String(n).padStart(2, '0'); }

function isoDate(y, m, d) {
    return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatDisplayDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function generateBookingRef() {
    return 'CARD-TX-' + Math.floor(10000 + Math.random() * 90000);
}

// ─── Step Navigation ─────────────────────────────────────────────────────────
window.nextStep = function () {
    if (currentStep === 1) {
        if (!validateStep1()) return;
        setStep(2);
        renderCalendar();
    }
};

window.prevStep = function () {
    if (currentStep === 2) setStep(1);
    else if (currentStep === 3) setStep(2);
};

function setStep(n) {
    if (n > currentStep) {
        for (let i = currentStep; i < n; i++) {
            document.getElementById(`formStep${i}`).classList.remove('active');
            document.getElementById(`stepNode${i}`).classList.remove('active');
            document.getElementById(`stepNode${i}`).classList.add('completed');
            document.querySelector(`#stepNode${i} .step-circle`).innerHTML = '<i class="fa-solid fa-check"></i>';
        }
    } else {
        for (let i = currentStep; i > n; i--) {
            document.getElementById(`formStep${i}`).classList.remove('active');
            document.getElementById(`stepNode${i}`).classList.remove('active');
            document.getElementById(`stepNode${i}`).classList.remove('completed');
            document.querySelector(`#stepNode${i} .step-circle`).innerHTML = i;
        }
        document.getElementById(`stepNode${n}`).classList.remove('completed');
        document.querySelector(`#stepNode${n} .step-circle`).innerHTML = n;
    }

    currentStep = n;
    document.getElementById(`formStep${currentStep}`).classList.add('active');
    document.getElementById(`stepNode${currentStep}`).classList.add('active');

    // Update stepper progress bar
    const progress = ((currentStep - 1) / 3) * 95;
    document.getElementById('stepperProgress').style.width = `${progress}%`;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Step 1 Validation ───────────────────────────────────────────────────────
function validateStep1() {
    const fields = [
        { id: 'fullName', label: 'Full Name' },
        { id: 'patientAge', label: 'Age' },
        { id: 'patientGender', label: 'Gender' },
        { id: 'patientCountry', label: 'Country' },
        { id: 'timeZone', label: 'Time Zone' },
        { id: 'patientEmail', label: 'Email Address' },
        { id: 'patientPhone', label: 'Phone Number' },
        { id: 'medicalHistory', label: 'Medical History / Reason' },
    ];

    for (const field of fields) {
        const el = document.getElementById(field.id);
        if (!el) continue;
        const val = el.value.trim();
        if (!val) {
            el.focus();
            el.style.borderColor = 'var(--danger)';
            showToast(`Please fill in: ${field.label}`, 'error');
            setTimeout(() => { el.style.borderColor = ''; }, 3000);
            return false;
        }
    }

    // Email format
    const emailEl = document.getElementById('patientEmail');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) {
        emailEl.focus();
        emailEl.style.borderColor = 'var(--danger)';
        showToast('Please enter a valid email address.', 'error');
        setTimeout(() => { emailEl.style.borderColor = ''; }, 3000);
        return false;
    }

    return true;
}

// ─── File Upload Handling ────────────────────────────────────────────────────
const uploadedFiles = [];

window.handleFileSelect = function (event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
            showToast(`"${file.name}" exceeds 10MB limit.`, 'error');
            return;
        }
        if (!uploadedFiles.some(f => f.name === file.name)) {
            uploadedFiles.push(file);
        }
    });
    renderFileList();
};

function renderFileList() {
    const list = document.getElementById('uploadedFileList');
    list.innerHTML = uploadedFiles.map((f, i) => `
        <div class="file-item">
            <span><i class="fa-solid fa-file-medical" style="color: var(--secondary); margin-right: 0.5rem;"></i>${f.name} <span style="color: var(--text-muted);">(${(f.size / 1024).toFixed(0)} KB)</span></span>
            <button onclick="removeFile(${i})" aria-label="Remove file"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `).join('');
}

window.removeFile = function (index) {
    uploadedFiles.splice(index, 1);
    renderFileList();
};

// Drag & drop support for upload zone
document.addEventListener('DOMContentLoaded', () => {
    const zone = document.getElementById('uploadZone');
    if (zone) {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.style.borderColor = 'var(--secondary)';
            zone.style.backgroundColor = 'rgba(201, 168, 76, 0.05)';
        });
        zone.addEventListener('dragleave', () => {
            zone.style.borderColor = '';
            zone.style.backgroundColor = '';
        });
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.style.borderColor = '';
            zone.style.backgroundColor = '';
            const dt = e.dataTransfer;
            if (dt && dt.files.length) handleFileSelect({ target: { files: dt.files } });
        });
    }
});

// ─── Calendar Rendering ──────────────────────────────────────────────────────
function renderCalendar() {
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const y = calendarDate.getFullYear();
    const m = calendarDate.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    document.getElementById('calendarMonthYear').textContent = `${MONTH_NAMES[m]} ${y}`;

    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    let html = DAY_NAMES.map(d => `<div class="day-label">${d}</div>`).join('');

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day disabled"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cellDate = new Date(y, m, d);
        const iso = isoDate(y, m, d);
        const isToday = cellDate.getTime() === today.getTime();
        const isPast = cellDate < today;
        const isSunday = cellDate.getDay() === 0; // no Sundays
        const isActive = iso === selectedDate;

        let cls = 'calendar-day';
        if (isPast || isSunday) cls += ' disabled';
        if (isToday) cls += ' today';
        if (isActive) cls += ' active';

        const clickAttr = (!isPast && !isSunday) ? `onclick="selectDate('${iso}')"` : '';
        html += `<div class="${cls}" ${clickAttr}>${d}</div>`;
    }

    document.getElementById('calendarGrid').innerHTML = html;
}

window.prevMonth = function () {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
};

window.nextMonth = function () {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
};

window.selectDate = function (iso) {
    selectedDate = iso;
    selectedTime = null;
    document.getElementById('selectedDateText').textContent = formatDisplayDate(iso);
    renderCalendar();
    renderTimeSlots();
    updateBookingBtn();
};

// ─── Time Slot Rendering ─────────────────────────────────────────────────────
function renderTimeSlots() {
    const bookedForDay = BOOKED_SLOTS[selectedDate] || [];
    const html = AVAILABLE_TIMES.map(t => {
        const isBooked = bookedForDay.includes(t);
        const isActive = t === selectedTime;
        let cls = 'time-slot';
        if (isBooked) cls += ' disabled';
        if (isActive) cls += ' active';
        const clickAttr = !isBooked ? `onclick="selectTime('${t}')"` : '';
        return `<div class="${cls}" ${clickAttr}>${t}</div>`;
    }).join('');

    document.getElementById('timeSlotsGrid').innerHTML = html || '<p style="color: var(--text-muted); font-size: 0.9rem;">No slots available for this day.</p>';
}

window.selectTime = function (time) {
    selectedTime = time;
    renderTimeSlots();
    updateBookingBtn();
};

function updateBookingBtn() {
    const btn = document.getElementById('confirmBookingBtn');
    if (btn) {
        btn.disabled = !(selectedDate && selectedTime);
    }
}

// ─── Booking Submission ──────────────────────────────────────────────────────
window.submitBooking = function () {
    if (!selectedDate || !selectedTime) {
        showToast('Please select a date and time slot.', 'error');
        return;
    }

    const tz = document.getElementById('timeZone').value;
    document.getElementById('paymentDateTimeSummary').textContent =
        `${formatDisplayDate(selectedDate)} at ${selectedTime} (${tz})`;

    setStep(3);
};

// ─── Secure Payment Processing Simulation ────────────────────────────────────
window.processPayment = function () {
    const cardName = document.getElementById('cardNameInput').value.trim();
    const cardNumber = document.getElementById('cardNumberInput').value.trim();
    const cardExpiry = document.getElementById('cardExpiryInput').value.trim();
    const cardCvv = document.getElementById('cardCvvInput').value.trim();

    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        showToast('Please fill in all card details for payment simulation.', 'error');
        return;
    }

    const btn = document.getElementById('payNowBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Payment...';

    // Simulate payment authorization delay (2 seconds)
    setTimeout(() => {
        const name = document.getElementById('fullName').value.trim();
        const tz = document.getElementById('timeZone').value;
        const ref = generateBookingRef();

        // Populate success page (Step 4)
        document.getElementById('summaryName').textContent = name;
        document.getElementById('summaryDateTime').textContent =
            `${formatDisplayDate(selectedDate)} at ${selectedTime} (${tz})`;
        document.getElementById('summaryReferenceId').textContent = ref;

        // Populate WhatsApp button link with details
        const shareWhatsAppBtn = document.getElementById('shareWhatsAppBtn');
        if (shareWhatsAppBtn) {
            const textMsg = `Hello Dr. Ayesha Sharma Support, I have completed the consultation payment for ${name}. Ref ID: ${ref}, Date: ${formatDisplayDate(selectedDate)} at ${selectedTime} (${tz}). Here is my payment screenshot:`;
            shareWhatsAppBtn.href = `https://wa.me/919810000000?text=${encodeURIComponent(textMsg)}`;
        }

        setStep(4);
        showToast('Payment successful & booked!', 'success');

        btn.innerHTML = originalText;
        btn.disabled = false;
    }, 2000);
};
