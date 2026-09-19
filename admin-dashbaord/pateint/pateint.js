import { db } from "../firebase.config.js";
import {
  collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Auto-generate MRN
function generateMRN() {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `MRN-${randomNum}`;
}

const registerModalEl = document.getElementById('addPatientModal');
if (registerModalEl) {
  registerModalEl.addEventListener('show.bs.modal', () => {
    const mrnField = document.getElementById('autoMrnField');
    if (mrnField) {
      mrnField.value = generateMRN();
    }
  });
}

// 2. Register New Patient
const registerPatientBtn = document.getElementById('registerPatientBtn');
if (registerPatientBtn) {
  registerPatientBtn.addEventListener('click', async () => {
    const fullName = document.getElementById('patientNameInput')?.value.trim();
    const mrn = document.getElementById('autoMrnField')?.value.trim();
    const age = document.getElementById('patientAgeInput')?.value.trim();
    const bloodGroup = document.getElementById('patientBloodInput')?.value;
    const emergencyContact = document.getElementById('patientContactInput')?.value.trim();
    const allergies = document.getElementById('patientAllergiesInput')?.value.trim() || "None";

    if (!fullName || !age || !bloodGroup || !emergencyContact) {
      alert("Barah-e-karam tamam zaroori fields (Name, Age, Blood Group, Contact) pur karein.");
      return;
    }

    try {
      await addDoc(collection(db, "patients"), {
        fullName,
        mrn,
        age: Number(age),
        bloodGroup,
        emergencyContact,
        allergies,
        createdAt: new Date().toISOString()
      });

      alert("Patient successfully registered!");
      
      // Form reset
      document.getElementById('addPatientForm').reset();

      // Modal close
      const modalInstance = bootstrap.Modal.getInstance(registerModalEl);
      if (modalInstance) modalInstance.hide();

      // Refresh table
      loadPatientsDirectory();

    } catch (err) {
      console.error("Error registering patient:", err);
      alert("Error saving patient: " + err.message);
    }
  });
}

// 3. Load Patients Directory Table (paginated: 3 per page)
const PATIENTS_PAGE_SIZE = 3;
let allPatientsCache = [];
let filteredPatientsCache = []; // Search cache
let patientsCurrentPage = 1;

async function loadPatientsDirectory() {
  const tableBody = document.getElementById('patientsTableBody');
  if (!tableBody) return;

  try {
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    allPatientsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    filteredPatientsCache = [...allPatientsCache];
    patientsCurrentPage = 1;
    renderPatientsPage();

  } catch (err) {
    console.error("Error loading patients directory:", err);
  }
}

function renderPatientsPage() {
  const tableBody = document.getElementById('patientsTableBody');
  if (!tableBody) return;

  if (filteredPatientsCache.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No registered patients found.</td></tr>`;
    renderPagination();
    return;
  }

  const totalPages = Math.max(1, Math.ceil(filteredPatientsCache.length / PATIENTS_PAGE_SIZE));
  if (patientsCurrentPage > totalPages) patientsCurrentPage = totalPages;

  const start = (patientsCurrentPage - 1) * PATIENTS_PAGE_SIZE;
  const pageItems = filteredPatientsCache.slice(start, start + PATIENTS_PAGE_SIZE);

  tableBody.innerHTML = '';

  pageItems.forEach(p => {
    const regDate = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "2026";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.fullName || "Patient")}&background=e0e7ff&color=4338ca&size=64`;
    const cleanMrn = p.mrn ? p.mrn.replace(/^#+/, '') : "MRN-0000";

    tableBody.innerHTML += `
      <tr>
        <td class="ps-4">
          <div class="d-flex align-items-center gap-3">
            <img src="${avatarUrl}" alt="Patient" class="rounded-circle" style="width:38px;height:38px;object-fit:cover;">
            <div>
              <h6 class="fw-bold text-dark mb-0 fs-7">${p.fullName}</h6>
              <small class="text-muted">Allergic: ${p.allergies}</small>
            </div>
          </div>
        </td>
        <td><span class="fw-semibold text-primary">#${cleanMrn}</span></td>
        <td><span class="badge bg-danger-subtle text-danger">${p.bloodGroup}</span></td>
        <td class="text-muted fs-7">${p.age} Years</td>
        <td class="text-muted fs-7">${p.emergencyContact}</td>
        <td class="text-muted fs-7">${regDate}</td>
        <td class="text-end pe-4">
          <div class="d-flex justify-content-end gap-1">
            <a href="pateint-profile.html?id=${p.id}" class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium text-nowrap">View Full File</a>
            <button type="button" class="btn btn-sm btn-outline-secondary rounded-circle edit-patient-btn" data-id="${p.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
            <button type="button" class="btn btn-sm btn-outline-danger rounded-circle delete-patient-btn" data-id="${p.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `;
  });

  // Edit button clicks
  tableBody.querySelectorAll('.edit-patient-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditPatientModal(btn.dataset.id));
  });

  // Delete button clicks
  tableBody.querySelectorAll('.delete-patient-btn').forEach(btn => {
    btn.addEventListener('click', () => deletePatient(btn.dataset.id));
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages = 1) {
  const controls = document.getElementById('paginationControls');
  const info = document.getElementById('paginationInfo');
  if (!controls) return;

  const total = filteredPatientsCache.length;
  const start = total === 0 ? 0 : (patientsCurrentPage - 1) * PATIENTS_PAGE_SIZE + 1;
  const end = Math.min(patientsCurrentPage * PATIENTS_PAGE_SIZE, total);
  if (info) info.textContent = total === 0 ? "" : `Showing ${start}–${end} of ${total} patients`;

  if (totalPages <= 1) { controls.innerHTML = ""; return; }

  let html = `<button class="btn btn-sm btn-light" ${patientsCurrentPage === 1 ? 'disabled' : ''} id="patPgPrev"><i class="fa-solid fa-chevron-left"></i></button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn btn-sm ${i === patientsCurrentPage ? 'btn-primary' : 'btn-light'} pat-pg-num" data-page="${i}">${i}</button>`;
  }
  html += `<button class="btn btn-sm btn-light" ${patientsCurrentPage === totalPages ? 'disabled' : ''} id="patPgNext"><i class="fa-solid fa-chevron-right"></i></button>`;
  controls.innerHTML = html;

  document.getElementById('patPgPrev')?.addEventListener('click', () => { patientsCurrentPage--; renderPatientsPage(); });
  document.getElementById('patPgNext')?.addEventListener('click', () => { patientsCurrentPage++; renderPatientsPage(); });
  controls.querySelectorAll('.pat-pg-num').forEach(btn => {
    btn.addEventListener('click', () => { patientsCurrentPage = Number(btn.dataset.page); renderPatientsPage(); });
  });
}

// 3b. Edit Patient
function openEditPatientModal(patientId) {
  const p = allPatientsCache.find(x => x.id === patientId);
  if (!p) return;

  document.getElementById('editPatientId').value = patientId;
  document.getElementById('editMrnField').value = p.mrn ? p.mrn.replace(/^#+/, '') : "MRN-0000";
  document.getElementById('editPatientNameInput').value = p.fullName || "";
  document.getElementById('editPatientAgeInput').value = p.age || "";
  document.getElementById('editPatientBloodInput').value = p.bloodGroup || "";
  document.getElementById('editPatientContactInput').value = p.emergencyContact || "";
  document.getElementById('editPatientAllergiesInput').value = p.allergies || "";

  const modalEl = document.getElementById('editPatientModal');
  if (modalEl) new bootstrap.Modal(modalEl).show();
}

const updatePatientBtn = document.getElementById('updatePatientBtn');
if (updatePatientBtn) {
  updatePatientBtn.addEventListener('click', async () => {
    const patientId = document.getElementById('editPatientId').value;
    const fullName = document.getElementById('editPatientNameInput')?.value.trim();
    const age = document.getElementById('editPatientAgeInput')?.value.trim();
    const bloodGroup = document.getElementById('editPatientBloodInput')?.value;
    const emergencyContact = document.getElementById('editPatientContactInput')?.value.trim();
    const allergies = document.getElementById('editPatientAllergiesInput')?.value.trim() || "None";

    if (!fullName || !age || !bloodGroup || !emergencyContact) {
      alert("Barah-e-karam tamam zaroori fields (Name, Age, Blood Group, Contact) pur karein.");
      return;
    }

    try {
      await updateDoc(doc(db, "patients", patientId), {
        fullName,
        age: Number(age),
        bloodGroup,
        emergencyContact,
        allergies
      });

      alert("Patient updated successfully!");

      const modalInstance = bootstrap.Modal.getInstance(document.getElementById('editPatientModal'));
      if (modalInstance) modalInstance.hide();

      loadPatientsDirectory();

    } catch (err) {
      console.error("Error updating patient:", err);
      alert("Error updating patient: " + err.message);
    }
  });
}

// 3c. Delete Patient
async function deletePatient(patientId) {
  const p = allPatientsCache.find(x => x.id === patientId);
  const name = p ? p.fullName : "this patient";

  if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;

  try {
    await deleteDoc(doc(db, "patients", patientId));
    loadPatientsDirectory();
  } catch (err) {
    console.error("Error deleting patient:", err);
    alert("Error deleting patient: " + err.message);
  }
}

// 4. Load Patient Profile
async function loadPatientProfile() {
  const profilePage = document.getElementById('patientProfilePage');
  if (!profilePage) return;

  const params = new URLSearchParams(window.location.search);
  const patientId = params.get('id');

  const notFoundEl = document.getElementById('ppNotFound');
  const cardContainer = profilePage.querySelector('.row.g-4');

  try {
    let docSnap = null;

    if (patientId) {
      const docRef = doc(db, "patients", patientId);
      docSnap = await getDoc(docRef);
    }

    if (!docSnap || !docSnap.exists()) {
      const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        docSnap = snap.docs[0];
      }
    }

    if (!docSnap || !docSnap.exists()) {
      if (notFoundEl) notFoundEl.classList.remove('d-none');
      if (cardContainer) cardContainer.classList.add('d-none');
      return;
    }

    if (notFoundEl) notFoundEl.classList.add('d-none');
    if (cardContainer) cardContainer.classList.remove('d-none');

    const p = docSnap.data();

    if (document.getElementById('ppName')) document.getElementById('ppName').textContent = p.fullName || "Unknown Patient";
    if (document.getElementById('ppMrn')) document.getElementById('ppMrn').textContent = "#" + (p.mrn ? p.mrn.replace(/^#+/, '') : "MRN-0000");
    if (document.getElementById('ppAgeGender')) document.getElementById('ppAgeGender').textContent = (p.age || "—") + " Years";
    if (document.getElementById('ppBloodGroup')) document.getElementById('ppBloodGroup').textContent = p.bloodGroup || "N/A";
    if (document.getElementById('ppContact')) document.getElementById('ppContact').textContent = p.emergencyContact || "—";
    if (document.getElementById('ppRegDate')) document.getElementById('ppRegDate').textContent = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "2026";
    
    const allergiesContainer = document.getElementById('ppAllergies');
    if (allergiesContainer) {
      allergiesContainer.innerHTML = `<span class="badge bg-warning-subtle text-dark">${p.allergies || "None"}</span>`;
    }

    const avatarImg = document.getElementById('ppAvatar');
    if (avatarImg) {
      avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.fullName || "Patient")}&background=e0e7ff&color=4338ca&size=128`;
    }

  } catch (err) {
    console.error("Error loading patient profile:", err);
  }
}

// 5. Patient Search Filter Logic
const patientSearchInput = document.getElementById('patientSearchInput');
if (patientSearchInput) {
  patientSearchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();

    filteredPatientsCache = allPatientsCache.filter(p => {
      const fullName = (p.fullName || '').toLowerCase();
      const mrn = (p.mrn || '').toLowerCase();
      return fullName.includes(searchTerm) || mrn.includes(searchTerm);
    });

    patientsCurrentPage = 1;
    renderPatientsPage();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  loadPatientsDirectory();
  loadPatientProfile();
});












