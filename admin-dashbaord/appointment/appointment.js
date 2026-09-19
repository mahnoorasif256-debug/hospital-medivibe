import { db } from "../firebase.config.js";
import {
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Global cache for fetched doctors
let allFetchedDoctors = [];

// Pagination variables
let currentPage = 1;
const rowsPerPage = 5;
let allFetchedAppointments = [];
let currentFilteredAppointments = [];

// 0. Load Doctors from Firestore & Keep Default Options Visible (Real-time)
function loadDoctorsForDropdowns() {
  // Pehle default/static options render kar dein taaki loading ya empty ka masla na ho
  const defaultDepartments = ["cardiology", "neurology", "pediatrics", "orthopedics", "dermatology", "dentistry", "general medicine"];
  updateDepartmentDropdowns(defaultDepartments);

  // onSnapshot real-time listener hai — jese hi koi naya doctor Firestore mein
  // add/edit/delete hoga, yeh callback turant dobara chalega aur dropdowns
  // (department + doctor filter/select) khud-ba-khud refresh ho jayenge.
  // Ab page reload/refresh ki zaroorat nahi rahegi.
  // NOTE: Doctors asal mein "users" collection mein role:"DOCTOR" ke sath
  // save hotay hain (doctors.js ka "Add New Doctor" form dekhein) — pehle
  // yahan galti se ek alag "doctors" collection dekhi ja rahi thi, jahan
  // naya add kiya gaya doctor kabhi pohnchta hi nahi tha.
  const doctorsQuery = query(collection(db, "users"), where("role", "==", "DOCTOR"));
  onSnapshot(doctorsQuery, (snap) => {
    allFetchedDoctors = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const departmentsSet = new Set(defaultDepartments);
    allFetchedDoctors.forEach(docData => {
      if (docData.specialization) {
        departmentsSet.add(docData.specialization.toLowerCase());
      }
    });

    // Firestore se milne wale updated departments ke sath dropdowns ko dubara refresh karein
    updateDepartmentDropdowns(Array.from(departmentsSet));

    // Agar Book Appointment modal khula hua hai aur ek department already
    // selected hai, to doctor dropdown ko bhi turant refresh kar dein taake
    // naya doctor foran dikhne lage.
    if (bookDepartmentSelect && bookDepartmentSelect.value) {
      refreshBookDoctorOptions();
    }
  }, (err) => {
    console.error("Error listening to doctors collection:", err);
  });
}

// Helper function to populate dropdowns easily
function updateDepartmentDropdowns(departments) {
  const filterDeptEl = document.getElementById('filterDepartment');
  const bookDeptEl = document.getElementById('bookDepartment');

  let filterDeptHtml = `<option value="">All Departments</option>`;
  let bookDeptHtml = `<option selected disabled value="">Select Department</option>`;

  departments.forEach(dept => {
    const formattedDept = dept.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    filterDeptHtml += `<option value="${dept}">${formattedDept}</option>`;
    bookDeptHtml += `<option value="${dept}">${formattedDept}</option>`;
  });

  if (filterDeptEl) filterDeptEl.innerHTML = filterDeptHtml;
  if (bookDeptEl) bookDeptEl.innerHTML = bookDeptHtml;
}

// 1. Load Appointments from Firestore & Render
async function loadAppointments() {
  const tableBody = document.getElementById('appointmentsTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="8" class="text-center text-muted py-4">
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Loading appointments...
      </td>
    </tr>`;

  try {
    const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    allFetchedAppointments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    currentFilteredAppointments = [...allFetchedAppointments];
    
    currentPage = 1;
    renderAppointmentsTable();
    setupFilters();

  } catch (err) {
    console.error("Error loading appointments:", err);
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-danger py-4">
          <i class="fa-solid fa-triangle-exclamation me-2"></i>
          Couldn't load appointments. Please refresh the page.
        </td>
      </tr>`;
  }
}

// 2. Render Table Function with Pagination
function renderAppointmentsTable() {
  const tableBody = document.getElementById('appointmentsTableBody');
  const noAppointmentsFound = document.getElementById('noAppointmentsFound');
  const paginationContainer = document.getElementById('paginationContainer');

  if (!tableBody) return;

  if (currentFilteredAppointments.length === 0) {
    tableBody.innerHTML = '';
    if (noAppointmentsFound) noAppointmentsFound.classList.remove('d-none');
    if (paginationContainer) paginationContainer.classList.add('d-none');
    return;
  }
  
  if (noAppointmentsFound) noAppointmentsFound.classList.add('d-none');
  if (paginationContainer) paginationContainer.classList.remove('d-none');

  const totalItems = currentFilteredAppointments.length;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = currentFilteredAppointments.slice(startIndex, endIndex);

  let html = '';
  paginatedData.forEach(apt => {
    let statusBg = "bg-warning-subtle text-warning";
    if (apt.status === "Completed") statusBg = "bg-success-subtle text-success";
    if (apt.status === "Cancelled") statusBg = "bg-danger-subtle text-danger";

    let deptBg = "bg-primary-subtle text-primary";

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.patientName || "Patient")}&background=e0e7ff&color=4338ca&size=64`;

    html += `
      <tr>
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
        <td class="text-end pe-4">
          <button type="button" class="btn btn-sm btn-outline-danger delete-appointment-btn" data-id="${apt.id}" title="Delete appointment">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
  renderPaginationUI(totalItems, startIndex, endIndex, totalPages);
  attachStatusChangeEvent();
  attachDeleteEvent();
}

function renderPaginationUI(totalItems, startIndex, endIndex, totalPages) {
  const paginationInfo = document.getElementById('paginationInfo');
  const paginationList = document.getElementById('paginationList');

  if (paginationInfo) {
    const displayedEnd = endIndex > totalItems ? totalItems : endIndex;
    const displayedStart = totalItems === 0 ? 0 : startIndex + 1;
    paginationInfo.textContent = `Showing ${displayedStart} to ${displayedEnd} of ${totalItems} entries`;
  }

  if (paginationList) {
    let paginationHtml = `
      <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
      </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
      paginationHtml += `
        <li class="page-item ${currentPage === i ? 'active' : ''}">
          <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>
      `;
    }

    paginationHtml += `
      <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
        <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
      </li>
    `;

    paginationList.innerHTML = paginationHtml;

    paginationList.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const selectedPage = parseInt(e.target.getAttribute('data-page'));
        if (!isNaN(selectedPage) && selectedPage >= 1 && selectedPage <= totalPages) {
          currentPage = selectedPage;
          renderAppointmentsTable();
        }
      });
    });
  }
}

function formatDoctorName(slug) {
  if (!slug) return "Dr. Assigned";
  if (!slug.includes('-')) return slug;
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// 3. Filter Functionality & Dynamic Doctor Filter based on Department
function setupFilters() {
  const dateEl = document.getElementById('filterDate');
  const deptEl = document.getElementById('filterDepartment');
  const docEl = document.getElementById('filterDoctor');
  const clearEl = document.getElementById('clearFiltersBtn');

  function applyFilters() {
    const dateVal = dateEl.value;
    const deptVal = deptEl.value.toLowerCase();
    const docVal = docEl.value;

    currentFilteredAppointments = allFetchedAppointments.filter(apt => {
      const matchDate = dateVal ? apt.date === dateVal : true;
      const matchDept = deptVal ? apt.department?.toLowerCase() === deptVal : true;
      const matchDoc = docVal ? apt.doctor === docVal : true;
      return matchDate && matchDept && matchDoc;
    });

    currentPage = 1;
    renderAppointmentsTable();
  }

  // Update Doctor filter dropdown options when Department filter changes
  if (deptEl && docEl) {
    deptEl.addEventListener('change', () => {
      const selectedDept = deptEl.value.toLowerCase();
      const filteredDocs = selectedDept 
        ? allFetchedDoctors.filter(d => d.specialization && d.specialization.toLowerCase() === selectedDept)
        : allFetchedDoctors;

      let docHtml = `<option value="">All Doctors</option>`;
      filteredDocs.forEach(d => {
        const docVal = d.id || d.fullName;
        docHtml += `<option value="${docVal}">${d.fullName || d.name}</option>`;
      });
      docEl.innerHTML = docHtml;
      applyFilters();
    });
  }

  if (dateEl) dateEl.addEventListener('input', applyFilters);
  if (docEl) docEl.addEventListener('change', applyFilters);

  if (clearEl) {
    clearEl.addEventListener('click', () => {
      dateEl.value = '';
      deptEl.value = '';
      docEl.innerHTML = `<option value="">All Doctors</option>` + 
        allFetchedDoctors.map(d => `<option value="${d.id || d.fullName}">${d.fullName || d.name}</option>`).join('');
      currentFilteredAppointments = [...allFetchedAppointments];
      currentPage = 1;
      renderAppointmentsTable();
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
        alert("Status update nahi ho saka.");
      }
    });
  });
}

// 4b. Delete Appointment from Firestore
function attachDeleteEvent() {
  document.querySelectorAll('.delete-appointment-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const button = e.target.closest('.delete-appointment-btn');
      const docId = button.getAttribute('data-id');
      if (!docId) return;

      const confirmDelete = confirm("Kya aap waqai is appointment ko delete karna chahte hain? Yeh action wapas nahi ho sakta.");
      if (!confirmDelete) return;

      try {
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;

        await deleteDoc(doc(db, "appointments", docId));

        // Local cache se bhi turant hata dein taake UI turant update ho
        allFetchedAppointments = allFetchedAppointments.filter(a => a.id !== docId);
        currentFilteredAppointments = currentFilteredAppointments.filter(a => a.id !== docId);
        renderAppointmentsTable();

      } catch (err) {
        console.error("Error deleting appointment:", err);
        alert("Appointment delete nahi ho saka: " + err.message);
        button.disabled = false;
        button.innerHTML = `<i class="fa-solid fa-trash"></i>`;
      }
    });
  });
}

// 5. Book New Appointment Dynamic Handlers
const bookDepartmentSelect = document.getElementById('bookDepartment');
const bookDoctorSelect = document.getElementById('bookDoctor');
const bookAppointmentModalEl = document.getElementById('bookAppointmentModal');
const bookAppointmentForm = document.getElementById('bookAppointmentForm');

// Helper: Doctor dropdown ko current selected department ke hisaab se refresh karta hai
function refreshBookDoctorOptions() {
  if (!bookDepartmentSelect || !bookDoctorSelect) return;
  const selectedDept = bookDepartmentSelect.value.toLowerCase();
  const filteredDoctors = allFetchedDoctors.filter(d =>
    d.specialization && d.specialization.toLowerCase() === selectedDept
  );

  if (filteredDoctors.length === 0) {
    bookDoctorSelect.innerHTML = `<option selected disabled value="">No doctors found in this department</option>`;
    return;
  }

  const previouslySelected = bookDoctorSelect.value;
  bookDoctorSelect.innerHTML =
    `<option selected disabled value="">Select Doctor</option>` +
    filteredDoctors.map(d => `<option value="${d.id || d.fullName}">${d.fullName || d.name}</option>`).join('');

  // Agar pehle se koi doctor selected tha aur woh ab bhi list mein hai, to usay wapas select rakhein
  if (previouslySelected && filteredDoctors.some(d => (d.id || d.fullName) === previouslySelected)) {
    bookDoctorSelect.value = previouslySelected;
  }
}

if (bookDepartmentSelect && bookDoctorSelect) {
  bookDepartmentSelect.addEventListener('change', refreshBookDoctorOptions);
}

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

    if (!patientNameInput.value || !departmentSelect.value || !doctorSelect.value || !dateInput.value || !timeSlotSelect.value || !feeInput.value) {
      alert("Barah-e-karam tamam zaroori fields pur karein!");
      return;
    }

    const cleanPatientName = patientNameInput.value.replace(/\s*\(#?MRN[^)]*\)\s*$/, '').trim();

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

// Fetch patients for datalist suggestion
async function loadPatientsForDatalist() {
  const datalist = document.getElementById('patientSuggestions');
  if (!datalist) return;

  try {
    const querySnapshot = await getDocs(collection(db, "patients"));
    let optionsHtml = '';

    querySnapshot.forEach((doc) => {
      const patient = doc.data();
      const name = patient.fullName || patient.name || "Patient";
      const mrn = patient.mrn || `MRN-${Math.floor(10000 + Math.random() * 90000)}`;
      optionsHtml += `<option value="${name} (#${mrn})">`;
    });

    datalist.innerHTML = optionsHtml;
  } catch (err) {
    console.error("Error loading patient suggestions:", err);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadDoctorsForDropdowns();
  loadAppointments();
  loadPatientsForDatalist();
});

