// ============================================================
//  UNIFIED DOCTORS & SCHEDULE MODULE — Medivibe Hospital
//  Handles: Directory, Profile, Add Doctor, Update, Delete, Schedule Matrix
// ============================================================

import { auth, db } from "../firebase.config.js";
import {
  collection, getDocs, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAME_TO_KEY = {
  Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu",
  Friday: "Fri", Saturday: "Sat", Sunday: "Sun"
};
const SHIFT_LABELS = { morning: "Morning", evening: "Evening", night: "Night", off: "Off" };

let doctorsCache = [];

function avatarUrl(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Doctor")}&background=e0e7ff&color=4338ca&size=128`;
}

function shiftBadge(shiftKey) {
  const key = shiftKey || "off";
  const label = SHIFT_LABELS[key] || "Off";
  return `<span class="shift-badge shift-${key}">${label}</span>`;
}


// ================= 1. DOCTORS DIRECTORY (doctors.html) =================
async function loadDoctorsDirectory() {
  const container = document.getElementById('doctorsGridContainer');
  if (!container) return;

  try {
    const q = query(collection(db, "users"), where("role", "==", "DOCTOR"));
    const snap = await getDocs(q);
    
    doctorsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const totalCountEl = document.getElementById('totalDoctorsCount');
    if (totalCountEl) totalCountEl.innerText = doctorsCache.length;

    container.innerHTML = '';

    if (doctorsCache.length === 0) {
      container.innerHTML = `<div class="col-12 text-center py-5"><p class="text-muted">No doctors found. Add a new doctor using the button above.</p></div>`;
      return;
    }

    doctorsCache.forEach(docData => {
      const name = "Dr. " + (docData.fullName || "Unknown");
      const spec = docData.specialization || "General Practice";
      const email = docData.email || "";
      const avatar = docData.photoURL || avatarUrl(docData.fullName);

      container.innerHTML += `
        <div class="col-xl-3 col-sm-6" id="doctor-card-${docData.id}">
          <div class="card border-0 shadow-sm rounded-4 p-4 h-100 bg-white position-relative">
            <div class="d-flex justify-content-end mb-1">
              <div class="dropdown">
                <button class="btn btn-light btn-sm rounded-circle border-0 text-muted" type="button" data-bs-toggle="dropdown"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3">
                  <li><a class="dropdown-item py-2 px-3 text-primary" href="#" onclick="openEditDoctorModal('${docData.id}'); return false;" style="font-size: 13px;"><i class="fa-solid fa-pen-to-square me-2"></i> Edit Doctor</a></li>
                  <li><a class="dropdown-item py-2 px-3 text-danger" href="#" onclick="deleteDoctorRecord('${docData.id}'); return false;" style="font-size: 13px;"><i class="fa-solid fa-trash me-2"></i> Delete Doctor</a></li>
                </ul>
              </div>
            </div>
            <div class="text-center mb-3">
              <img src="${avatar}" alt="" class="rounded-circle shadow-sm mb-3" width="80" height="80" style="object-fit:cover;">
              <h5 class="fw-bold mb-1 text-dark" style="font-size: 16px;">
                <a href="doctor-profile.html?id=${docData.id}" class="text-decoration-none text-dark">${name}</a>
              </h5>
              <span class="text-muted d-block mb-2" style="font-size: 13px;">${spec}</span>
            </div>
            <div class="rounded-3 p-2 text-center mt-auto bg-light">
              <span class="text-muted d-block mb-1" style="font-size:11px;">${email}</span>
              <a href="doctor-profile.html?id=${docData.id}" class="btn btn-sm btn-outline-primary w-100 rounded-pill mt-2" style="font-size:12px;">View Profile</a>
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Error loading doctors directory:", err);
  }
}


// ================= 2. DOCTOR PROFILE PAGE (doctor-profile.html) =================
async function loadSingleDoctorProfile() {
  const profilePage = document.getElementById('doctorProfilePage');
  if (!profilePage) return;

  const params = new URLSearchParams(window.location.search);
  let doctorId = params.get('id');
  const nameEl = document.getElementById('profileName');

  try {
    let docSnap;
    
    if (doctorId) {
      const docRef = doc(db, "users", doctorId);
      docSnap = await getDoc(docRef);
    } else {
      const q = query(collection(db, "users"), where("role", "==", "DOCTOR"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        docSnap = snap.docs[0];
      }
    }

    if (!docSnap || !docSnap.exists()) {
      if (nameEl) nameEl.textContent = "Doctor not found in database.";
      return;
    }

    const data = docSnap.data();
    doctorId = docSnap.id; // agar URL mein id nahi thi to fallback wale doctor ki asli id yahan set ho jati hai
    profilePage.dataset.doctorId = doctorId;

    if (nameEl) nameEl.textContent = "Dr. " + (data.fullName || "N/A");
    if (document.getElementById('profileSpecialty')) document.getElementById('profileSpecialty').textContent = data.specialization || "General Practice";
    if (document.getElementById('profileEmail')) document.getElementById('profileEmail').textContent = data.email || "N/A";
    if (document.getElementById('profilePhone')) document.getElementById('profilePhone').textContent = data.phone || "—";
    if (document.getElementById('profileRoom')) document.getElementById('profileRoom').textContent = data.room || "—";
    if (document.getElementById('profileRoomStat')) document.getElementById('profileRoomStat').textContent = data.room || "—";
    if (document.getElementById('profileExperience')) document.getElementById('profileExperience').textContent = data.experience || "0";
    if (document.getElementById('profileFee')) document.getElementById('profileFee').textContent = data.fee || "2,500";
    if (document.getElementById('profileLicence')) document.getElementById('profileLicence').textContent = data.licenseId || "—";
    if (document.getElementById('profileJoined')) document.getElementById('profileJoined').textContent = data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "2026";

    const avatarImg = document.getElementById('profileAvatar');
    if (avatarImg) {
      avatarImg.src = data.photoURL || avatarUrl(data.fullName);
    }

  } catch (err) {
    console.error("Error loading profile:", err);
    if (nameEl) nameEl.textContent = "Error loading profile data.";
  }
}


// ================= 2b. EDIT DOCTOR PROFILE MODAL =================
function setupEditDoctorProfileModal() {
  const editModal = document.getElementById('editDoctorModal');
  const profilePage = document.getElementById('doctorProfilePage');
  if (!editModal || !profilePage) return; // is page pe edit modal nahi hai

  const nameInput  = document.getElementById('editProfileName');
  const emailInput = document.getElementById('editProfileEmail');
  const phoneInput = document.getElementById('editProfilePhone');
  const roomInput  = document.getElementById('editProfileRoom');
  const feeInput   = document.getElementById('editProfileFee');
  const saveBtn    = document.getElementById('saveDoctorProfileBtn');
  const form       = document.getElementById('editDoctorProfileForm');

  // Modal khulte hi current doctor ka data form mein bhar dena
  editModal.addEventListener('show.bs.modal', async () => {
    const doctorId = profilePage.dataset.doctorId;
    if (!doctorId) return;

    try {
      const docSnap = await getDoc(doc(db, "users", doctorId));
      if (!docSnap.exists()) return;
      const data = docSnap.data();

      nameInput.value  = data.fullName || "";
      emailInput.value = data.email || "";
      phoneInput.value = data.phone || "";
      roomInput.value  = data.room || "";
      feeInput.value   = data.fee || "";
    } catch (err) {
      console.error("Error pre-filling edit form:", err);
    }
  });

  // Save Changes button
  saveBtn.addEventListener('click', async () => {
    const doctorId = profilePage.dataset.doctorId;
    if (!doctorId) {
      alert("Doctor ID not found — cannot save.");
      return;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {
      await updateDoc(doc(db, "users", doctorId), {
        fullName: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        room: roomInput.value.trim(),
        fee: feeInput.value.trim()
      });

      bootstrap.Modal.getInstance(editModal)?.hide();
      await loadSingleDoctorProfile(); // page ka data turant refresh ho jaye, reload ki zaroorat nahi

    } catch (err) {
      console.error("Error saving doctor profile:", err);
      alert("Could not save changes: " + err.message);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  });
}


// ================= 3. ADD / UPDATE DOCTOR FUNCTIONS =================
function setupAddDoctorForm() {
  const addDoctorForm = document.getElementById('addDoctorForm');
  if (!addDoctorForm) return;

  if (addDoctorForm.dataset.bound) return;
  addDoctorForm.dataset.bound = "true";

  addDoctorForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const docId = addDoctorForm.dataset.editId; // Check if editing
    const fullName = document.getElementById('doctorFullName')?.value.trim();
    const email = document.getElementById('doctorEmail')?.value.trim();
    const phone = document.getElementById('doctorPhone')?.value.trim();
    const specialization = document.getElementById('doctorSpecialization')?.value;
    const room = document.getElementById('doctorRoom')?.value.trim();
    const experience = document.getElementById('doctorExperience')?.value.trim();

  if (!fullName || !email || !specialization) {
      alert("Please fill in the required fields (Name, Email, Specialization).");
      return;
    }

    // --- YAHAN PHONE VALIDATION ADD KAREIN ---
    if (phone) {
      const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
      if (!phoneRegex.test(phone)) {
        alert("Enter a valid phone number (e.g., 03001234567). Alphabets ya 'www' allow nahi hain.");
        return;
      }
    }

    try {
      if (docId) {
        // Update existing doctor record
        await updateDoc(doc(db, "users", docId), {
          fullName,
          email,
          phone,
          specialization,
          room,
          experience: Number(experience) || 0,
          updatedAt: new Date().toISOString()
        });
        alert("Doctor details updated successfully!");
        delete addDoctorForm.dataset.editId;
      } else {
        // Add new doctor record
        await addDoc(collection(db, "users"), {
          role: "DOCTOR",
          fullName,
          email,
          phone,
          specialization,
          room,
          experience: Number(experience) || 0,
          status: "APPROVED",
          createdAt: new Date().toISOString()
        });
        alert("Doctor successfully added and saved to database!");
      }

      addDoctorForm.reset();

      const modalEl = document.getElementById('addDoctorModal');
      if (modalEl) {
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        if (modalInstance) modalInstance.hide();
      }

      loadDoctorsDirectory();

    } catch (err) {
      console.error("Error saving doctor:", err);
      alert("Error saving doctor: " + err.message);
    }
  });
}

// Global functions for Edit & Delete operations
window.openEditDoctorModal = async function(doctorId) {
  const doctor = doctorsCache.find(d => d.id === doctorId);
  if (!doctor) return;

  document.getElementById('doctorFullName').value = doctor.fullName || '';
  document.getElementById('doctorEmail').value = doctor.email || '';
  document.getElementById('doctorPhone').value = doctor.phone || '';
  document.getElementById('doctorSpecialization').value = doctor.specialization || '';
  document.getElementById('doctorRoom').value = doctor.room || '';
  document.getElementById('doctorExperience').value = doctor.experience || '';

  const addDoctorForm = document.getElementById('addDoctorForm');
  if (addDoctorForm) {
    addDoctorForm.dataset.editId = doctorId;
  }

  const modalEl = document.getElementById('addDoctorModal');
  if (modalEl) {
    const modalInstance = new bootstrap.Modal(modalEl);
    modalInstance.show();
  }
};

window.deleteDoctorRecord = async function(doctorId) {
  if (!confirm("Are you sure you want to delete this doctor record?")) return;

  try {
    await deleteDoc(doc(db, "users", doctorId));
    alert("Doctor record deleted successfully.");
    loadDoctorsDirectory();
  } catch (err) {
    console.error("Error deleting doctor:", err);
    alert("Could not delete doctor: " + err.message);
  }
};


// ================= 4. SCHEDULE MATRIX & ADD SLOT =================
async function loadDoctorSchedules() {
  const tableBody = document.getElementById('scheduleTableBody');
  if (!tableBody) return;

  try {
    const doctorsQuery = query(collection(db, "users"), where("role", "==", "DOCTOR"));
    const doctorsSnap = await getDocs(doctorsQuery);

    if (doctorsSnap.empty) {
      tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No doctors found.</td></tr>`;
      doctorsCache = [];
      return;
    }

    doctorsCache = doctorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const rows = await Promise.all(doctorsCache.map(async (doctor) => {
      let scheduleData = {};
      try {
        const scheduleSnap = await getDoc(doc(db, "schedules", doctor.id));
        if (scheduleSnap.exists()) scheduleData = scheduleSnap.data();
      } catch (err) {
        console.error(`Error fetching schedule for doctor ${doctor.id}:`, err);
      }

      const name = doctor.fullName ? `Dr. ${doctor.fullName}` : "Dr. Unknown";
      const specialization = doctor.specialization || "General";
      const image = doctor.photoURL || avatarUrl(doctor.fullName);

      const dayCells = DAYS.map(dayKey => `<td class="text-center">${shiftBadge(scheduleData[dayKey])}</td>`).join('');
      const isOnDuty = DAYS.some(dayKey => scheduleData[dayKey] && scheduleData[dayKey] !== "off");

      return `
        <tr>
          <td>
            <div class="mv-person d-flex align-items-center gap-2">
              <img src="${image}" alt="${name}" class="rounded-circle doctor-avatar doctor-avatar-sm">
              <div>
                <div class="name fw-semibold" style="font-size: 13.5px;">${name}</div>
                <div class="sub text-muted" style="font-size: 12px;">${specialization}</div>
              </div>
            </div>
          </td>
          ${dayCells}
          <td class="text-center">
            <div class="form-check form-switch d-flex justify-content-center m-0">
              <input class="form-check-input doctor-duty-toggle" type="checkbox" role="switch" data-doctor-id="${doctor.id}" ${isOnDuty ? 'checked' : ''} style="cursor:pointer;">
            </div>
          </td>
        </tr>
      `;
    }));

    tableBody.innerHTML = rows.join('');
    populateScheduleDoctorDropdown();

  } catch (err) {
    console.error("Error loading schedules:", err);
  }
}

function populateScheduleDoctorDropdown() {
  const select = document.getElementById('scheduleDoctor');
  if (!select) return;

  const placeholder = `<option value="" selected disabled>Select doctor</option>`;
  const options = doctorsCache.map(d =>
    `<option value="${d.id}">${d.fullName ? `Dr. ${d.fullName}` : "Dr. Unknown"}</option>`
  ).join('');

  select.innerHTML = placeholder + options;
}

function setupAddScheduleForm() {
  const form = document.getElementById('addScheduleForm');
  if (!form) return;

  if (form.dataset.bound) return;
  form.dataset.bound = "true";

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const doctorId = document.getElementById('scheduleDoctor').value;
    const dayName = document.getElementById('scheduleDay').value;
    const shiftType = document.getElementById('scheduleShift').value;

    if (!doctorId || !dayName || !shiftType) {
      alert("Please select Doctor, Day and Shift.");
      return;
    }

    const dayKey = DAY_NAME_TO_KEY[dayName];
    if (!dayKey) return;

    try {
      await setDoc(doc(db, "schedules", doctorId), {
        doctorId,
        [dayKey]: shiftType
      }, { merge: true });

      alert("Schedule slot saved successfully!");
      form.reset();

      const modalEl = document.getElementById('addScheduleModal');
      if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

      loadDoctorSchedules();
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert("Could not save schedule: " + err.message);
    }
  });
}



// ================= 5. IN-APP MESSAGING (Send Message modal) =================
function avatarInitial(name) {
  return (name || "A").trim().charAt(0).toUpperCase();
}

function formatMessageTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function loadMessageHistory(doctorId) {
  const container = document.getElementById('messageHistoryContainer');
  if (!container) return;

  container.innerHTML = `<p class="text-muted text-center py-3 mb-0" style="font-size: 13px;">Loading messages…</p>`;

  try {
    const q = query(collection(db, "messages"), where("doctorId", "==", doctorId), orderBy("createdAt", "asc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      container.innerHTML = `<p class="text-muted text-center py-3 mb-0" style="font-size: 13px;">No messages yet — say hello!</p>`;
      return;
    }

    container.innerHTML = snap.docs.map(docSnap => {
      const m = docSnap.data();
      const isFromAdmin = m.senderRole === "ADMIN";
      return `
        <div class="d-flex ${isFromAdmin ? 'justify-content-end' : 'justify-content-start'} mb-2">
          <div style="max-width: 78%;">
            <div class="rounded-4 px-3 py-2" style="font-size: 13px; background:${isFromAdmin ? '#4f46e5' : '#f1f5f9'}; color:${isFromAdmin ? '#fff' : '#1e293b'};">
              ${m.text}
            </div>
            <div class="text-muted mt-1" style="font-size: 10.5px; text-align:${isFromAdmin ? 'right' : 'left'};">
              ${m.senderName || (isFromAdmin ? 'Admin' : 'Doctor')} · ${formatMessageTime(m.createdAt)}
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.scrollTop = container.scrollHeight;

  } catch (err) {
    console.error("Error loading message history:", err);
    container.innerHTML = `<p class="text-danger text-center py-3 mb-0" style="font-size: 13px;">Could not load messages.</p>`;
  }
}

function setupMessageButton() {
  const messageBtn = document.getElementById('messageDoctorBtn');
  const modalEl = document.getElementById('sendMessageModal');
  const sendBtn = document.getElementById('sendMessageBtn');
  const textEl = document.getElementById('messageText');
  const nameLabel = document.getElementById('sendMessageDoctorName');
  if (!messageBtn || !modalEl || !sendBtn || !textEl) return; // is page pe messaging modal nahi hai

  messageBtn.onclick = () => {
    const profilePage = document.getElementById('doctorProfilePage');
    const doctorId = profilePage?.dataset.doctorId;

    if (!doctorId) {
      alert("Doctor profile abhi load nahi hui — thodi der intezaar kar ke dobara try karein.");
      return;
    }

    if (nameLabel) {
      const nameEl = document.getElementById('profileName');
      nameLabel.textContent = nameEl ? nameEl.textContent.trim() : "Doctor";
    }

    modalEl.dataset.doctorId = doctorId;
    loadMessageHistory(doctorId);

    new bootstrap.Modal(modalEl).show();
  };

  if (sendBtn.dataset.bound) return;
  sendBtn.dataset.bound = "true";

  sendBtn.addEventListener('click', async () => {
    const doctorId = modalEl.dataset.doctorId;
    const text = textEl.value.trim();

    if (!doctorId) {
      alert("Doctor ID not found.");
      return;
    }
    if (!text) {
      alert("Message likhna zaroori hai.");
      return;
    }

    const originalText = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = "Sending...";

    try {
      await addDoc(collection(db, "messages"), {
        doctorId,
        text,
        senderRole: "ADMIN",
        senderName: auth.currentUser?.displayName || auth.currentUser?.email || "Admin",
        senderId: auth.currentUser?.uid || null,
        read: false,
        createdAt: new Date().toISOString()
      });

      textEl.value = "";
      await loadMessageHistory(doctorId);

    } catch (err) {
      console.error("Error sending message:", err);
      alert("Message send nahi ho saka: " + err.message);
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = originalText;
    }
  });
}

// ================= GLOBAL EVENT LISTENER =================
window.addEventListener('DOMContentLoaded', () => {
  loadDoctorsDirectory();
  loadSingleDoctorProfile();
  setupEditDoctorProfileModal();
  setupAddDoctorForm();
  loadDoctorSchedules();
  setupAddScheduleForm();
  setupMessageButton();
});


// Event delegation for doctor duty toggle switches
document.addEventListener('change', async (e) => {
  if (e.target && e.target.classList.contains('doctor-duty-toggle')) {
    const doctorId = e.target.dataset.doctorId;
    const isActive = e.target.checked;

    try {
      console.log("Toggle changed for:", doctorId, "Active:", isActive);
      const scheduleRef = doc(db, "schedules", doctorId);

      if (!isActive) {
        await setDoc(scheduleRef, {
          doctorId,
          Mon: "off", Tue: "off", Wed: "off", Thu: "off", Fri: "off", Sat: "off", Sun: "off"
        }, { merge: true });
      } else {
        await setDoc(scheduleRef, {
          doctorId,
          Mon: "morning", Tue: "morning", Wed: "morning", Thu: "morning", Fri: "morning", Sat: "off", Sun: "off"
        }, { merge: true });
      }

      // Matrix ko refresh karein
      if (typeof loadDoctorSchedules === 'function') {
        loadDoctorSchedules();
      }

    } catch (err) {
      console.error("Error updating schedule status:", err);
      alert("Failed to update status: " + err.message);
      // Agar error aaye to toggle ko wapas purani state par kar dein
      e.target.checked = !isActive;
    }
  }
});















