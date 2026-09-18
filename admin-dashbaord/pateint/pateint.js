import { db } from "../firebase.config.js";
import {
  collection, getDocs, doc, getDoc, addDoc, query, orderBy
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

// 3. Load Patients Directory Table
async function loadPatientsDirectory() {
  const tableBody = document.getElementById('patientsTableBody');
  if (!tableBody) return;

  try {
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    tableBody.innerHTML = '';

    if (snap.empty) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No registered patients found.</td></tr>`;
      return;
    }

    snap.docs.forEach(d => {
      const p = d.data();
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
            <a href="pateint-profile.html?id=${d.id}" class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium text-nowrap">View Full File</a>
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error("Error loading patients directory:", err);
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

window.addEventListener('DOMContentLoaded', () => {
  loadPatientsDirectory();
  loadPatientProfile();
});














