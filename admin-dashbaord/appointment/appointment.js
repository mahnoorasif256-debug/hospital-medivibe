import { db } from "../firebase.config.js";
import {
  collection, getDocs, addDoc, doc, updateDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Doctors grouped by department, matching the values used in the
// "filterDoctor" dropdown. In a fuller build this should come from the
// "doctors" collection in Firestore instead of being hardcoded here.
const DOCTORS_BY_DEPARTMENT = {
  cardiology:   [{ value: "dr-ayesha-khan",   label: "Dr. Ayesha Khan" }],
  orthopedics:  [{ value: "dr-bilal-ahmed",   label: "Dr. Bilal Ahmed" }],
  dermatology:  [{ value: "dr-zainab-farooq", label: "Dr. Zainab Farooq" }],
  pediatrics:   [{ value: "dr-hamza-sheikh",  label: "Dr. Hamza Sheikh" }],
};

// 1. Load Appointments from Firestore & Render
async function loadAppointments() {
  const tableBody = document.getElementById('appointmentsTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="text-center text-muted py-4">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Loading appointments...
      </td>
    </tr>`;

  try {
    const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const appointments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAppointmentsTable(appointments);
    setupFilters(appointments);

  } catch (err) {
    console.error("Error loading appointments:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger py-4">
          <i class="fa-solid fa-triangle-exclamation me-2"></i>
          Couldn't load appointments. Please refresh the page.
        </td>
      </tr>`;
  }
}

// 2. Render Table Function (Ek sath load karne ke liye)
function renderAppointmentsTable(data) {
  const tableBody = document.getElementById('appointmentsTableBody');
  const noAppointmentsFound = document.getElementById('noAppointmentsFound');

  if (!tableBody) return;

  if (data.length === 0) {
    tableBody.innerHTML = '';
    if (noAppointmentsFound) noAppointmentsFound.classList.remove('d-none');
    return;
  }
  if (noAppointmentsFound) noAppointmentsFound.classList.add('d-none');

  let html = '';
  data.forEach(apt => {
    let statusBg = "bg-warning-subtle text-warning";
    if (apt.status === "Completed") statusBg = "bg-success-subtle text-success";
    if (apt.status === "Cancelled") statusBg = "bg-danger-subtle text-danger";

    let deptBg = "bg-primary-subtle text-primary";
    if (apt.department === "orthopedics") deptBg = "bg-info-subtle text-info";
    if (apt.department === "dermatology") deptBg = "bg-danger-subtle text-danger";

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName || "Patient")}&background=e0e7ff&color=4338ca&size=64`;

    html += `
      <tr data-date="${apt.date}" data-department="${apt.department}" data-doctor="${apt.doctor}">
        <td class="ps-4"><span class="fw-semibold text-primary">#${apt.appointmentId || apt.id}</span></td>
        <td>
          <div class="d-flex align-items-center gap-3">
            <img src="${avatarUrl}" alt="Patient" class="rounded-circle" style="width:36px;height:36px;object-fit:cover;">
            <span class="fw-bold text-dark fs-7">${apt.patientName}</span>
          </div>
        </td>
        <td class="text-muted fs-7">${formatDoctorName(apt.doctor)}</td>
        <td><span class="badge ${deptBg} text-capitalize">${apt.department}</span></td>
        <td class="text-muted fs-7">${apt.date} — ${apt.timeSlot}</td>
        <td class="text-muted fs-7">Rs. ${apt.fee}</td>
        <td class="text-end pe-4">
          <div class="dropdown status-dropdown">
            <span class="badge rounded-pill ${statusBg} px-3 py-2 status-badge" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              ${apt.status || "Scheduled"} <i class="fa-solid fa-chevron-down ms-1 fs-9"></i>
            </span>
            <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
              <li><a class="dropdown-item status-option" href="#" data-id="${apt.id}" data-status="Scheduled">Scheduled</a></li>
              <li><a class="dropdown-item status-option" href="#" data-id="${apt.id}" data-status="Completed">Completed</a></li>
              <li><a class="dropdown-item status-option" href="#" data-id="${apt.id}" data-status="Cancelled">Cancelled</a></li>
            </ul>
          </div>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
  attachStatusChangeEvent();
}

function formatDoctorName(slug) {
  if (!slug) return "Dr. Assigned";
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// 3. Filter Functionality
function setupFilters(allAppointments) {
  // Clone+replace the filter controls first so we never stack duplicate
  // listeners if setupFilters ends up running more than once.
  ['filterDate', 'filterDepartment', 'filterDoctor', 'clearFiltersBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.replaceWith(el.cloneNode(true));
  });

  const dateEl = document.getElementById('filterDate');
  const deptEl = document.getElementById('filterDepartment');
  const docEl = document.getElementById('filterDoctor');
  const clearEl = document.getElementById('clearFiltersBtn');

  function applyFilters() {
    const dateVal = dateEl.value;
    const deptVal = deptEl.value;
    const docVal = docEl.value;

    const filtered = allAppointments.filter(apt => {
      const matchDate = dateVal ? apt.date === dateVal : true;
      const matchDept = deptVal ? apt.department === deptVal : true;
      const matchDoc = docVal ? apt.doctor === docVal : true;
      return matchDate && matchDept && matchDoc;
    });

    renderAppointmentsTable(filtered);
  }

  dateEl.addEventListener('input', applyFilters);
  deptEl.addEventListener('change', applyFilters);
  docEl.addEventListener('change', applyFilters);

  if (clearEl) {
    clearEl.addEventListener('click', () => {
      dateEl.value = '';
      deptEl.value = '';
      docEl.value = '';
      renderAppointmentsTable(allAppointments);
    });
  }
}

// 4. Update Status in Firestore
function attachStatusChangeEvent() {
  document.querySelectorAll('.status-option').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      const docId = e.target.getAttribute('data-id');
      const newStatus = e.target.getAttribute('data-status');
      if (!docId) return;

      try {
        const docRef = doc(db, "appointments", docId);
        await updateDoc(docRef, { status: newStatus });
        loadAppointments();
      } catch (err) {
        console.error("Error updating status:", err);
        alert("Status update nahi ho saka. Dobara koshish karein.");
      }
    });
  });
}

// 5. Book New Appointment Handler
const bookDepartmentSelect = document.getElementById('bookDepartment');
const bookDoctorSelect = document.getElementById('bookDoctor');
const bookAppointmentModalEl = document.getElementById('bookAppointmentModal');
const bookAppointmentForm = document.getElementById('bookAppointmentForm');

// Populate the Doctor dropdown whenever a Department is chosen.
// This was previously missing, so the form always saved a default doctor
// no matter what the user picked.
if (bookDepartmentSelect && bookDoctorSelect) {
  bookDepartmentSelect.addEventListener('change', () => {
    const doctors = DOCTORS_BY_DEPARTMENT[bookDepartmentSelect.value] || [];

    if (doctors.length === 0) {
      bookDoctorSelect.innerHTML = `<option selected disabled value="">No doctors found for this department</option>`;
      return;
    }

    bookDoctorSelect.innerHTML =
      `<option selected disabled value="">Select Doctor</option>` +
      doctors.map(d => `<option value="${d.value}">${d.label}</option>`).join('');
  });
}

// Reset the form (and doctor dropdown) every time the modal is closed,
// so stale values from a previous booking don't linger.
if (bookAppointmentModalEl && bookAppointmentForm) {
  bookAppointmentModalEl.addEventListener('hidden.bs.modal', () => {
    bookAppointmentForm.reset();
    if (bookDoctorSelect) {
      bookDoctorSelect.innerHTML = `<option selected disabled value="">Select Department First</option>`;
    }
  });
}

const confirmBookingBtn = document.getElementById('confirmBookingBtn');
if (confirmBookingBtn) {
  confirmBookingBtn.addEventListener('click', async () => {
    const form = bookAppointmentForm;

    const patientNameInput = document.getElementById('bookPatientName');
    const departmentSelect = bookDepartmentSelect;
    const doctorSelect = bookDoctorSelect;
    const dateInput = document.getElementById('bookDate');
    const timeSlotSelect = document.getElementById('bookTimeSlot');
    const feeInput = document.getElementById('bookFee');

    if (
      !patientNameInput.value ||
      !departmentSelect.value ||
      !doctorSelect.value ||
      !dateInput.value ||
      !timeSlotSelect.value ||
      !feeInput.value
    ) {
      alert("Barah-e-karam tamam zaroori fields pur karein!");
      return;
    }

    // The patient-name field uses a <datalist> that shows "Name (#MRN-xxxx)".
    // Strip the MRN part so only the actual name gets saved/displayed.
    const cleanPatientName = patientNameInput.value.replace(/\s*\(#?MRN[^)]*\)\s*$/i, '').trim();

    confirmBookingBtn.disabled = true;
    const originalBtnHtml = confirmBookingBtn.innerHTML;
    confirmBookingBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Booking...`;

    try {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      await addDoc(collection(db, "appointments"), {
        appointmentId: `APT-${randomId}`,
        patientName: cleanPatientName,
        department: departmentSelect.value,
        doctor: doctorSelect.value,
        date: dateInput.value,
        timeSlot: timeSlotSelect.options[timeSlotSelect.selectedIndex].text,
        fee: Number(feeInput.value),
        status: "Scheduled",
        createdAt: new Date().toISOString()
      });

      alert("Appointment successfully booked!");
      form.reset();
      doctorSelect.innerHTML = `<option selected disabled value="">Select Department First</option>`;

      const modalInstance = bootstrap.Modal.getInstance(bookAppointmentModalEl);
      if (modalInstance) modalInstance.hide();

      loadAppointments();

    } catch (err) {
      console.error("Error booking appointment:", err);
      alert("Error: " + err.message);
    } finally {
      confirmBookingBtn.disabled = false;
      confirmBookingBtn.innerHTML = originalBtnHtml;
    }
  });
}

window.addEventListener('DOMContentLoaded', loadAppointments);