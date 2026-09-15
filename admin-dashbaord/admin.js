import { db } from "./firebase.config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ///////////////////   Recent appointments start ////////////////////////

function loadAppointmentsFromFirestore() {
  const tableBody = document.getElementById('appointmentsTableBody');
  if (!tableBody) return;

  // 'appointments' collection se data sunain (real-time)
  onSnapshot(collection(db, "appointments"), (snapshot) => {
    tableBody.innerHTML = ""; // Purana data clear karein

    if (snapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No appointments found.</td></tr>`;
      return;
    }

    snapshot.forEach((doc) => {
      const appt = doc.data();
      
      // Status ke mutabiq badge ka color set karna
      let badgeClass = "bg-secondary";
      if (appt.status === "Checked In") badgeClass = "bg-warning text-dark";
      else if (appt.status === "In Consultation") badgeClass = "bg-info text-dark";
      else if (appt.status === "Completed") badgeClass = "bg-success";

      // Table ki row banana
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="fw-bold">${appt.patientName || 'N/A'}</div>
          <small class="text-muted">Patient ID: #${doc.id.slice(0, 6)}</small>
        </td>
        <td>${appt.doctorName || 'N/A'}</td>
        <td><span class="badge bg-light text-dark">${appt.department || 'N/A'}</span></td>
        <td>${appt.dateTime || 'N/A'}</td>
        <td><span class="badge ${badgeClass}">${appt.status || 'Pending'}</span></td>
      `;
      tableBody.appendChild(row);
    });
  });
}

// Page load hote hi function run ho jaye
window.addEventListener('DOMContentLoaded', () => {
  loadAppointmentsFromFirestore();
});

// ///////////////////   Recent appointments end ////////////////////////

















































document.addEventListener('DOMContentLoaded', () => {
  const allNavLinks = document.querySelectorAll('.nav-link');
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  // Handle "active" state for ALL nav links (plain links + dropdown toggles)
  allNavLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      // Remove active from every link first
      allNavLinks.forEach(l => l.classList.remove('active'));

      // Add active only to the clicked one
      this.classList.add('active');
    });
  });

  // Handle dropdown open/close (submenu) separately
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();

      const parentDropdown = this.closest('.nav-item.dropdown');

      // Uncomment below for accordion behavior (only one dropdown open at a time)
      /*
      document.querySelectorAll('.nav-item.dropdown.show-dropdown').forEach(item => {
        if (item !== parentDropdown) {
          item.classList.remove('show-dropdown');
        }
      });
      */

      parentDropdown.classList.toggle('show-dropdown');
    });
  });
});


// ///////////// theme toggle functionality //////////////////////



const themeToggle = document.getElementById('theme-toggle');

// Page load par check karein ke pehle se dark mode active hai ya nahi
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
  if (themeToggle) themeToggle.checked = true;
}

// Toggle change event
if (themeToggle) {
  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  });
}



// /////////////  dynamic rendering for notifications //////////////

// ================= NOTIFICATIONS =================
(function () {
  const notifContainer = document.getElementById('notifContainer');
  const notifDot        = document.querySelector('.notification-dot');
  const markAllBtn      = document.getElementById('notifMarkAll');

  if (!notifContainer) return; // is page pe notification dropdown nahi hai

  // Yahan apna real data daalo — baad mein API se bhi fetch kar sakte ho
  let notifications = [
    {
      id: 1,
      name: 'Dr. Smith',
      text: 'updated the <b>surgery</b> schedule.',
      time: '4 min ago',
        img: 'https://ui-avatars.com/api/?name=Dr+Smith&background=e0e7ff&color=4338ca&size=64',
      unread: true
    },
    {
      id: 2,
      name: 'Dr. Patel',
      text: 'completed a <b>follow-up report</b> for patient <b>Emily</b>.',
      time: '8 min ago',
      img: 'https://ui-avatars.com/api/?name=Dr+Patel&background=e0e7ff&color=4338ca&size=64',
      unread: true
    },
    {
      id: 3,
      name: 'Emily',
      text: 'booked an appointment with Dr. <b>Patel</b> for <b>April 15</b>.',
      time: '15 min ago',
      img: 'https://ui-avatars.com/api/?name=Emily&background=e0e7ff&color=4338ca&size=64',
      unread: true
    },
    {
      id: 4,
      name: 'Amelia',
      text: 'completed the <b>pre-visit health questionnaire</b>.',
      time: '20 min ago',
     img: 'https://ui-avatars.com/api/?name=Amelia&background=e0e7ff&color=4338ca&size=64',
      unread: false
    }
  ];

  function renderNotifications() {
    if (notifications.length === 0) {
      notifContainer.innerHTML = '<div class="notif-empty">You\'re all caught up. No new notifications.</div>';
    } else {
      notifContainer.innerHTML = notifications.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
        <img src="${n.img}" class="notif-avatar" alt="${n.name}" onerror="this.onerror=null; this.src='https://placehold.co/40'">
          <div class="notif-content">
            <p><b>${n.name}</b> ${n.text}</p>
            <div class="notif-time">
              <i class="fa-regular fa-clock"></i> ${n.time}
            </div>
          </div>
          <div class="notif-side">
            ${n.unread ? '<span class="notif-unread-dot"></span>' : ''}
            <button class="notif-close" data-close="${n.id}" aria-label="Dismiss">&times;</button>
          </div>
        </div>
      `).join('');
    }
    updateDot();
  }

  function updateDot() {
    const hasUnread = notifications.some(n => n.unread);
    if (notifDot) notifDot.classList.toggle('hidden', !hasUnread);
  }

  notifContainer.addEventListener('click', (e) => {
    const closeId = e.target.getAttribute('data-close');
    if (closeId) {
      e.stopPropagation();
      notifications = notifications.filter(n => String(n.id) !== closeId);
      renderNotifications();
      return;
    }
    const item = e.target.closest('.notif-item');
    if (item) {
      const id = Number(item.getAttribute('data-id'));
      const n = notifications.find(n => n.id === id);
      if (n) n.unread = false;
      renderNotifications();
    }
  });

  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      notifications.forEach(n => n.unread = false);
      renderNotifications();
    });
  }

  renderNotifications();
})();



// //////////////// photo update ///////////////////


 document.getElementById('changePhotoBtn')?.addEventListener('click', function () {
    document.getElementById('profilePhotoInput').click();
  });




  // ////////// responsiveness ////////////////

  const sidebarEl = document.querySelector('.sidebar');
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');

  function openSidebar() {
    sidebarEl.classList.add('sidebar-open');
    sidebarBackdrop.classList.add('show');
  }

  function closeSidebar() {
    sidebarEl.classList.remove('sidebar-open');
    sidebarBackdrop.classList.remove('show');
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', function () {
      if (sidebarEl.classList.contains('sidebar-open')) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeSidebar);
  }



  // ////////// notifications dynamic rendering /////////////////


  const sampleNotifications = [
  {
    id: "1",
    title: "Dr. Smith",
    message: "updated the surgery schedule.",
    time: "2 mins ago",
    unread: true,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80",
    actions: true
  },
  {
    id: "2",
    title: "Dr. Patel",
    message: "completed a follow-up report for patient Emily.",
    time: "8 mins ago",
    unread: true,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&auto=format&fit=crop&q=80",
    actions: false
  },
  {
    id: "3",
    title: "Emily",
    message: "booked an appointment with Dr. Patel for April 15.",
    time: "2 hrs ago",
    unread: false,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    actions: false
  }
];

function renderNotifications(notifications) {
  const container = document.getElementById("notifications-container");
  
  if (!container) return;

  if (notifications.length === 0) {
    container.innerHTML = `<p class="text-center text-muted py-5 mb-0">No new notifications</p>`;
    return;
  }

  container.innerHTML = notifications.map(notif => `
    <div class="d-flex align-items-center justify-content-between p-3 border-bottom ${notif.unread ? 'bg-light rounded-3 mb-2 border-0' : 'mb-2'}" data-id="${notif.id}">
      <div class="d-flex align-items-center">
        <img src="${notif.avatar}" alt="${notif.title}" class="rounded-circle me-3" width="45" height="45" style="object-fit: cover;">
        <div>
          <h6 class="fw-bold mb-1 text-dark">${notif.title} <span class="fw-normal text-muted small">${notif.message}</span></h6>
          <small class="text-muted"><i class="fa-regular fa-clock me-1"></i>${notif.time}</small>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2">
        ${notif.actions ? `
  <button class="btn btn-sm btn-outline-secondary px-3 py-1">Decline</button>
  <button class="btn btn-sm sub-btn-anim accept-btn-anim px-3 py-1">
    <span class="wave-text"><span style="--i:0">A</span><span style="--i:1">c</span><span style="--i:2">c</span><span style="--i:3">e</span><span style="--i:4">p</span><span style="--i:5">t</span></span>
  </button>
        ` : ''}
        ${notif.unread ? '<span class="badge bg-danger rounded-pill p-2 ms-2"></span>' : ''}
      </div>
    </div>
  `).join('');
}

document.addEventListener("DOMContentLoaded", () => {
  let currentNotifications = [...sampleNotifications];
  renderNotifications(currentNotifications);

  document.getElementById("mark-all-read")?.addEventListener("click", () => {
    currentNotifications.forEach(n => n.unread = false);
    renderNotifications(currentNotifications);
  });

  document.getElementById("clear-all")?.addEventListener("click", () => {
    currentNotifications = [];
    renderNotifications(currentNotifications);
  });
});



// ////// sidebar collapse ///////////



const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
const sidebarElCollapse = document.querySelector('.sidebar');

if (sidebarElCollapse && localStorage.getItem('sidebarCollapsed') === 'true') {
  sidebarElCollapse.classList.add('collapsed');
}

if (sidebarCollapseBtn && sidebarElCollapse) {
  sidebarCollapseBtn.addEventListener('click', () => {
    sidebarElCollapse.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebarElCollapse.classList.contains('collapsed'));
  });
}




  // Dynamic Time Greeting Script
  const greetingElement = document.getElementById('greetingText');
  if (greetingElement) {
      const hours = new Date().getHours();
      let timeGreeting = "Good morning";
      if (hours >= 12 && hours < 17) {
          timeGreeting = "Good afternoon";
      } else if (hours >= 17) {
          timeGreeting = "Good evening";
      }
      greetingElement.textContent = `${timeGreeting}, Mahnoor`;
  }

// /////////// charts /////////////////////

    window.addEventListener('DOMContentLoaded', () => {
    const miniOptionsBase = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } }
    };

    function makeChart(canvasId, config) {
      const el = document.getElementById(canvasId);
      if (!el) return;
      new Chart(el, config);
    }

    makeChart('doctorsMiniChart', {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{ data: [120, 160, 145, 205, 247], backgroundColor: '#2563eb', borderRadius: 3, barPercentage: 0.6 }]
      },
      options: miniOptionsBase
    });

    makeChart('patientsMiniChart', {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{ data: [2800, 3400, 2600, 3900, 4178], borderColor: '#ea580c', backgroundColor: 'rgba(234, 88, 12, 0.10)', borderWidth: 2.5, fill: true, tension: 0.45, pointRadius: 0 }]
      },
      options: miniOptionsBase
    });

    makeChart('appointmentsMiniChart', {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{ data: [9200, 8800, 10400, 9600, 12178], backgroundColor: '#0ea5e9', borderRadius: 3, barPercentage: 0.6 }]
      },
      options: miniOptionsBase
    });

    makeChart('revenueMiniChart', {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{ data: [380000, 410000, 470000, 500000, 551240], borderColor: '#16a34a', backgroundColor: 'rgba(22, 163, 74, 0.10)', borderWidth: 2.5, fill: true, tension: 0.45, pointRadius: 0 }]
      },
      options: miniOptionsBase
    });
  });




    window.addEventListener('DOMContentLoaded', () => {

    const hvEl = document.getElementById('hospitalVisitsChart');
    if (hvEl) {
      new Chart(hvEl, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [
            {
              label: 'In-Patient',
              data: [120, 190, 170, 220, 260, 210, 240],
              borderColor: '#0d6efd',
              backgroundColor: 'rgba(13, 110, 253, 0.12)',
              borderWidth: 2.5,
              fill: true,
              tension: 0.4,
              pointRadius: 0
            },
            {
              label: 'Out-Patient',
              data: [300, 280, 340, 310, 380, 360, 400],
              borderColor: '#00b4d8',
              backgroundColor: 'rgba(0, 180, 216, 0.10)',
              borderWidth: 2.5,
              fill: true,
              tension: 0.4,
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
            y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 } } }
          }
        }
      });
    }

    const opEl = document.getElementById('operationSuccessChart');
    if (opEl) {
      new Chart(opEl, {
        type: 'doughnut',
        data: {
          labels: ['Success', 'Other'],
          datasets: [{
            data: [94, 6],
            backgroundColor: ['#16a34a', '#e2e8f0'],
            borderWidth: 0,
            cutout: '78%'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: true } }
        }
      });
    }

    const reEl = document.getElementById('revenueExpensesChart');
    if (reEl) {
      new Chart(reEl, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [
            {
              label: 'Revenue',
              data: [38000, 41000, 47000, 44000, 50000, 55124],
              backgroundColor: '#16a34a',
              borderRadius: 4,
              barPercentage: 0.55
            },
            {
              label: 'Expenses',
              data: [22000, 24000, 26000, 25000, 27000, 29000],
              backgroundColor: '#ef4444',
              borderRadius: 4,
              barPercentage: 0.55
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 11 } } },
            y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: (v) => '$' + (v / 1000) + 'k' } }
          }
        }
      });
    }

  });



  // ================= PATIENTS DIRECTORY: LIVE SEARCH =================
(function () {
  const searchInput = document.getElementById('patientSearchInput');
  const tableBody    = document.getElementById('patientsTableBody');
  const emptyState   = document.getElementById('noPatientsFound');

  if (!searchInput || !tableBody) return; // is page pe table nahi hai

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    const rows = tableBody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
      const name = row.getAttribute('data-name') || '';
      const mrn  = row.getAttribute('data-mrn') || '';
      const matches = name.includes(query) || mrn.includes(query);

      row.classList.toggle('d-none', !matches);
      if (matches) visibleCount++;
    });

    emptyState.classList.toggle('d-none', visibleCount !== 0);
  });
})();



// ================= PATIENT PROFILE (EHR) LOADER =================
(function () {
  const page = document.getElementById('patientProfilePage');
  if (!page) return; // is page pe EHR section nahi hai

  // ---- Sample "database" — real app mein yeh backend/API se aayega ----
  const patients = {
    "84920": {
      name: "Fatima Noor", mrn: "#MRN-84920", age: 28, gender: "Female",
      bloodGroup: "B+", contact: "+92 300 9876543", regDate: "Jan 12, 2026",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      allergies: ["Penicillin"],
      visits: [
        { type: "Follow-up Visit", doctor: "Dr. Ayesha Khan", date: "Aug 20, 2026",
          bp: "118/76 mmHg", hr: "78 bpm",
          note: "Stable condition, continue current medication." },
        { type: "Lab Report", doctor: "Pathology Dept.", date: "Jul 02, 2026",
          bp: "—", hr: "—",
          note: "CBC results within normal range." }
      ],
      prescriptions: [
        { name: "Amoxicillin 500mg", dosage: "1 tablet, twice daily — 5 days", date: "Aug 20, 2026" }
      ]
    },
    "99421": {
      name: "Ahmed Raza", mrn: "#MRN-99421", age: 34, gender: "Male",
      bloodGroup: "A+", contact: "+92 321 4567890", regDate: "Feb 04, 2026",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      allergies: [],
      visits: [
        { type: "Initial Consultation", doctor: "Dr. Bilal Ahmed", date: "Feb 04, 2026",
          bp: "122/80 mmHg", hr: "82 bpm",
          note: "Routine checkup, no concerns raised." }
      ],
      prescriptions: []
    },
    "71203": {
      name: "Sana Malik", mrn: "#MRN-71203", age: 41, gender: "Female",
      bloodGroup: "O+", contact: "+92 333 1122334", regDate: "Mar 21, 2026",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
      allergies: ["Dust", "Sulfa Drugs"],
      visits: [
        { type: "Emergency Visit", doctor: "Dr. Zainab Farooq", date: "Sep 01, 2026",
          bp: "140/92 mmHg", hr: "95 bpm",
          note: "Hypertension flare-up, advised rest and monitoring." }
      ],
      prescriptions: [
        { name: "Amlodipine 5mg", dosage: "1 tablet, once daily", date: "Sep 01, 2026" }
      ]
    }
  };

  // ---- Read ?id= from URL ----
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const patient = id ? patients[id] : null;

  if (!patient) {
    document.querySelector('.row.g-4').classList.add('d-none');
    document.getElementById('ppNotFound').classList.remove('d-none');
    return;
  }

  // ---- Fill Bio Section ----
  document.getElementById('ppAvatar').src = patient.avatar;
  document.getElementById('ppName').textContent = patient.name;
  document.getElementById('ppMrn').textContent = patient.mrn;
  document.getElementById('ppAgeGender').textContent = `${patient.age} yrs / ${patient.gender}`;
  document.getElementById('ppBloodGroup').textContent = patient.bloodGroup;
  document.getElementById('ppContact').textContent = patient.contact;
  document.getElementById('ppRegDate').textContent = patient.regDate;

  const allergiesEl = document.getElementById('ppAllergies');
  allergiesEl.innerHTML = patient.allergies.length
    ? patient.allergies.map(a => `<span class="badge bg-danger-subtle text-danger">${a}</span>`).join('')
    : `<span class="badge bg-success-subtle text-success">No known allergies</span>`;

  // ---- Build Timeline (visits + prescriptions merged, newest first) ----
  const timelineEl = document.getElementById('ppTimeline');

  const visitItems = patient.visits.map(v => `
    <div class="ehr-item d-flex gap-3 mb-4">
      <div class="ehr-icon bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center" style="width:40px;height:40px;flex-shrink:0;">
        <i class="fa-solid fa-stethoscope"></i>
      </div>
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between">
          <h6 class="fw-bold mb-1 fs-7">${v.type} — <span class="text-muted fw-normal">${v.doctor}</span></h6>
          <small class="text-muted">${v.date}</small>
        </div>
        <div class="d-flex gap-3 fs-7 text-muted mb-1">
          <span><i class="fa-solid fa-heart-pulse text-danger me-1"></i>BP: ${v.bp}</span>
          <span><i class="fa-solid fa-wave-square text-info me-1"></i>HR: ${v.hr}</span>
        </div>
        <p class="fs-7 text-muted mb-0">${v.note}</p>
      </div>
    </div>
  `).join('');

  const prescriptionItems = patient.prescriptions.map(p => `
    <div class="ehr-item d-flex gap-3 mb-4">
      <div class="ehr-icon bg-success-subtle text-success rounded-circle d-flex align-items-center justify-content-center" style="width:40px;height:40px;flex-shrink:0;">
        <i class="fa-solid fa-pills"></i>
      </div>
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between">
          <h6 class="fw-bold mb-1 fs-7">Prescription: ${p.name}</h6>
          <small class="text-muted">${p.date}</small>
        </div>
        <p class="fs-7 text-muted mb-0">${p.dosage}</p>
      </div>
    </div>
  `).join('');

  timelineEl.innerHTML = visitItems + prescriptionItems ||
    `<p class="text-muted text-center py-4 mb-0">No medical records available yet.</p>`;
})();



// ================= AUTO-GENERATE MRN ON MODAL OPEN =================
(function () {
  const modalEl = document.getElementById('addPatientModal');
  const mrnField = document.getElementById('autoMrnField');
  if (!modalEl || !mrnField) return;

  modalEl.addEventListener('show.bs.modal', () => {
    const randomId = Math.floor(10000 + Math.random() * 89999); // 5-digit random
    mrnField.value = `#MRN-${randomId}`;
  });

  // Placeholder "register" action — real app mein yahan API call hogi
  document.getElementById('registerPatientBtn')?.addEventListener('click', () => {
    const form = document.getElementById('addPatientForm');
    if (form.checkValidity()) {
      alert(`Patient registered with ${mrnField.value}`);
      bootstrap.Modal.getInstance(modalEl).hide();
      form.reset();
    } else {
      form.reportValidity();
    }
  });
})();




// ================= APPOINTMENTS: MULTI-FILTERS =================
(function () {
  const dateInput   = document.getElementById('filterDate');
  const deptSelect  = document.getElementById('filterDepartment');
  const docSelect   = document.getElementById('filterDoctor');
  const clearBtn    = document.getElementById('clearFiltersBtn');
  const tableBody   = document.getElementById('appointmentsTableBody');
  const emptyState  = document.getElementById('noAppointmentsFound');

  if (!tableBody) return; // is page pe table nahi hai

  function applyFilters() {
    const dateVal = dateInput.value;                 // "" ya "YYYY-MM-DD"
    const deptVal = deptSelect.value.toLowerCase();
    const docVal  = docSelect.value.toLowerCase();

    const rows = tableBody.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
      const rowDate = row.getAttribute('data-date') || '';
      const rowDept = (row.getAttribute('data-department') || '').toLowerCase();
      const rowDoc  = (row.getAttribute('data-doctor') || '').toLowerCase();

      const matchesDate = !dateVal || rowDate === dateVal;
      const matchesDept = !deptVal || rowDept === deptVal;
      const matchesDoc  = !docVal  || rowDoc === docVal;

      const isMatch = matchesDate && matchesDept && matchesDoc;
      row.classList.toggle('d-none', !isMatch);
      if (isMatch) visibleCount++;
    });

    emptyState.classList.toggle('d-none', visibleCount !== 0);
  }

  [dateInput, deptSelect, docSelect].forEach(el => {
    el.addEventListener('change', applyFilters);
  });

  clearBtn.addEventListener('click', () => {
    dateInput.value = '';
    deptSelect.value = '';
    docSelect.value = '';
    applyFilters();
  });
})();


// ================= APPOINTMENTS: LIVE STATUS CONTROL =================
(function () {
  const statusStyles = {
    Scheduled: 'bg-warning-subtle text-warning',
    Completed: 'bg-success-subtle text-success',
    Cancelled: 'bg-danger-subtle text-danger'
  };

  document.querySelectorAll('.status-option').forEach(option => {
    option.addEventListener('click', function (e) {
      e.preventDefault();

      const newStatus = this.getAttribute('data-status');
      const badge = this.closest('.status-dropdown').querySelector('.status-badge');

      // Purani status-color class hatao, nayi lagao
      Object.values(statusStyles).forEach(cls => {
        cls.split(' ').forEach(c => badge.classList.remove(c));
      });
      statusStyles[newStatus].split(' ').forEach(c => badge.classList.add(c));

      // Text update karo (chevron icon preserve karte hue)
      badge.innerHTML = `${newStatus} <i class="fa-solid fa-chevron-down ms-1 fs-9"></i>`;
    });
  });
})();



// ================= BOOK APPOINTMENT MODAL LOGIC =================
(function () {
  const modalEl   = document.getElementById('bookAppointmentModal');
  const deptSel   = document.getElementById('bookDepartment');
  const docSel    = document.getElementById('bookDoctor');
  const feeInput  = document.getElementById('bookFee');
  if (!modalEl) return;

  // Department ke hisaab se doctor list aur unki default fee
  const doctorsByDept = {
    cardiology:   [{ name: 'Dr. Ayesha Khan',   fee: 2500 }],
    orthopedics:  [{ name: 'Dr. Bilal Ahmed',   fee: 3000 }],
    dermatology:  [{ name: 'Dr. Zainab Farooq', fee: 2000 }],
    pediatrics:   [{ name: 'Dr. Hamza Sheikh',  fee: 1800 }]
  };

  deptSel.addEventListener('change', () => {
    const doctors = doctorsByDept[deptSel.value] || [];
    docSel.innerHTML = doctors.length
      ? doctors.map(d => `<option value="${d.name}" data-fee="${d.fee}">${d.name}</option>`).join('')
      : `<option value="">No doctors available</option>`;

    if (doctors.length) feeInput.value = doctors[0].fee;
  });

  docSel.addEventListener('change', () => {
    const selected = docSel.options[docSel.selectedIndex];
    const fee = selected?.getAttribute('data-fee');
    if (fee) feeInput.value = fee;
  });

  document.getElementById('confirmBookingBtn')?.addEventListener('click', () => {
    const form = document.getElementById('bookAppointmentForm');
    if (form.checkValidity()) {
      alert('Appointment booked successfully!');
      bootstrap.Modal.getInstance(modalEl).hide();
      form.reset();
      docSel.innerHTML = `<option selected disabled value="">Select Department First</option>`;
    } else {
      form.reportValidity();
    }
  });
})();



  const deptIconMap = {
    Cardiology:   { icon: 'fa-heart-pulse',    bg: '#fee2e2', color: '#dc2626' },
    OPD:          { icon: 'fa-stethoscope',    bg: '#e0f2fe', color: '#0284c7' },
    Pediatrics:   { icon: 'fa-baby',           bg: '#dcfce7', color: '#16a34a' },
    Neurology:    { icon: 'fa-brain',          bg: '#ede9fe', color: '#7c3aed' },
    Orthopedics:  { icon: 'fa-bone',           bg: '#fef3c7', color: '#b45309' },
    Emergency:    { icon: 'fa-truck-medical',  bg: '#ffe4e6', color: '#e11d48' }
  };
  const fallbackIcons = [
    { icon: 'fa-hospital',    bg: '#e0e7ff', color: '#4338ca' },
    { icon: 'fa-syringe',     bg: '#cffafe', color: '#0891b2' },
    { icon: 'fa-tooth',       bg: '#fae8ff', color: '#a21caf' },
    { icon: 'fa-eye',         bg: '#fef9c3', color: '#a16207' }
  ];

  let departmentsData = [
    { id: 'dept1', name: 'Cardiology',  hod: 'Dr. Michael Smith',   activeDoctors: 6, rooms: ['201', '202', '203'], description: 'Diagnosis and treatment of heart & vascular conditions.' },
    { id: 'dept2', name: 'OPD',         hod: 'Dr. Sarah Johnson',   activeDoctors: 9, rooms: ['G-01', 'G-02', 'G-03', 'G-04'], description: 'Outpatient consultations and general check-ups.' },
    { id: 'dept3', name: 'Pediatrics',  hod: 'Dr. Adrian White',    activeDoctors: 5, rooms: ['301', '302'], description: 'Medical care for infants, children, and adolescents.' },
    { id: 'dept4', name: 'Neurology',   hod: 'Dr. Ayesha Malik',    activeDoctors: 4, rooms: ['401', '402'], description: 'Disorders of the brain, spine, and nervous system.' },
    { id: 'dept5', name: 'Orthopedics', hod: 'Dr. Ken Clark',       activeDoctors: 5, rooms: ['501', '502', '503'], description: 'Bone, joint, ligament, and muscle care.' },
    { id: 'dept6', name: 'Emergency',   hod: 'Dr. Omar Siddiqui',   activeDoctors: 8, rooms: ['ER-1', 'ER-2', 'ER-3'], description: '24/7 trauma and acute emergency response.' }
  ];

  function iconStyleFor(deptName) {
    if (deptIconMap[deptName]) return deptIconMap[deptName];
    // deterministic fallback so the same name always gets the same look
    let hash = 0;
    for (let i = 0; i < deptName.length; i++) hash = deptName.charCodeAt(i) + ((hash << 5) - hash);
    return fallbackIcons[Math.abs(hash) % fallbackIcons.length];
  }

  const grid = document.getElementById('departmentsGrid');

  function cardTemplate(dept) {
    const style = iconStyleFor(dept.name);
    const roomChips = dept.rooms.map(r => `<span class="dept-room-chip">${r}</span>`).join(' ');

    return `
      <div class="col-xl-4 col-md-6">
        <div class="mv-card dept-card p-4 h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div class="d-flex align-items-center gap-3">
              <div class="dept-icon-circle" style="background:${style.bg}; color:${style.color};">
                <i class="fa-solid ${style.icon}"></i>
              </div>
              <div>
                <h5 class="fw-bold text-dark mb-0" style="font-size: 16px;">${dept.name}</h5>
                <span class="dept-stat-badge mt-1">
                  <i class="fa-solid fa-user-doctor"></i> ${dept.activeDoctors} Active Doctors
                </span>
              </div>
            </div>
            <div class="dropdown">
              <button class="btn btn-light btn-sm rounded-circle border-0 text-muted" type="button" data-bs-toggle="dropdown" aria-label="Department actions">
                <i class="fa-solid fa-ellipsis-vertical"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm rounded-3">
                <li><a class="dropdown-item py-2 px-3 text-dark" href="#" style="font-size: 13px;"><i class="fa-solid fa-eye me-2 text-primary"></i> View Details</a></li>
                <li><a class="dropdown-item py-2 px-3 text-dark" href="#" style="font-size: 13px;"><i class="fa-solid fa-pen me-2 text-secondary"></i> Edit Department</a></li>
              </ul>
            </div>
          </div>

          <div class="dept-hod-row">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(dept.hod)}&background=e0e7ff&color=4338ca&size=64" alt="${dept.hod}" class="dept-hod-avatar" onerror="this.onerror=null;">
            <div>
              <div class="dept-hod-label">Head of Department</div>
              <div class="dept-hod-name">${dept.hod}</div>
            </div>
          </div>

          <div>
            <span class="text-muted d-block mb-2" style="font-size: 11px; font-weight: 600; text-transform: uppercase;">Assigned Rooms</span>
            <div class="d-flex flex-wrap gap-2">${roomChips}</div>
          </div>

          ${dept.description ? `<p class="text-muted mt-3 mb-0" style="font-size: 12.5px;">${dept.description}</p>` : ''}
        </div>
      </div>
    `;
  }

 function renderDepartments() {
  if (!grid) return; // is page pe departments grid nahi hai (e.g. admin dashboard)
  grid.innerHTML = departmentsData.map(cardTemplate).join('');
}


  function handleAddDepartmentSubmit(form) {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const name = document.getElementById('newDeptName').value.trim();
    const hod = document.getElementById('newDeptHod').value.trim();
    const roomsRaw = document.getElementById('newDeptRooms').value.trim();
    const description = document.getElementById('newDeptDescription').value.trim();

    departmentsData.push({
      id: 'dept-' + Date.now(),
      name,
      hod,
      activeDoctors: 0,
      rooms: roomsRaw.split(',').map(r => r.trim()).filter(Boolean),
      description
    });

    renderDepartments();
    form.reset();
    bootstrap.Modal.getInstance(document.getElementById('addDepartmentModal'))?.hide();
  }

  renderDepartments();



  // ///// invoices ///////



   const PKR_RATE = 280; // display-only conversion, adjust to your real rate

  const invoicesData = [
    { txnId: 'TXN-10234', patient: 'Fatima Noor',    mrn: '#MRN-84920', service: 'Consultation', created: '2026-03-10', due: '2026-03-10', amount: 60,  status: 'Paid' },
    { txnId: 'TXN-10235', patient: 'Ahmed Raza',      mrn: '#MRN-99421', service: 'Lab Test',      created: '2026-03-12', due: '2026-03-19', amount: 120, status: 'Unpaid' },
    { txnId: 'TXN-10236', patient: 'Sana Malik',       mrn: '#MRN-77213', service: 'Pharmacy',      created: '2026-03-14', due: '2026-03-14', amount: 45,  status: 'Paid' },
    { txnId: 'TXN-10237', patient: 'Bilal Hussain',    mrn: '#MRN-60184', service: 'Consultation', created: '2026-03-15', due: '2026-03-22', amount: 80,  status: 'Partial' },
    { txnId: 'TXN-10238', patient: 'Ayesha Siddiqui',  mrn: '#MRN-31056', service: 'Lab Test',      created: '2026-03-18', due: '2026-03-25', amount: 150, status: 'Unpaid' },
    { txnId: 'TXN-10239', patient: 'Fatima Noor',      mrn: '#MRN-84920', service: 'Pharmacy',      created: '2026-03-20', due: '2026-03-20', amount: 35,  status: 'Paid' },
    { txnId: 'TXN-10240', patient: 'Ahmed Raza',       mrn: '#MRN-99421', service: 'Consultation', created: '2026-03-22', due: '2026-03-29', amount: 60,  status: 'Partial' }
  ];

  const serviceStyle = {
    'Consultation': 'service-consultation',
    'Lab Test': 'service-lab',
    'Pharmacy': 'service-pharmacy'
  };
  const statusStyle = {
    'Paid': 'status-paid',
    'Unpaid': 'status-unpaid',
    'Partial': 'status-partial'
  };

  function avatarUrlFor(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e0e7ff&color=4338ca&size=72`;
  }

  function formatDisplayDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatAmount(usd) {
    const pkr = usd * PKR_RATE;
    return `<span class="fw-bold text-dark">$${usd}</span> <span class="text-muted" style="font-size:11.5px;">(₨${pkr.toLocaleString()})</span>`;
  }

  const tbody = document.getElementById('invoicesTableBody');
  const countEl = document.getElementById('totalInvoicesCount');
  const noResultsEl = document.getElementById('noInvoicesFound');
  const searchInput = document.getElementById('invoiceSearchInput');
  const statusFilter = document.getElementById('statusFilter');

  function rowTemplate(inv) {
    return `
      <tr>
        <td class="ps-4"><span class="fw-semibold text-primary">${inv.txnId}</span></td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${avatarUrlFor(inv.patient)}" alt="${inv.patient}" class="fin-patient-avatar" onerror="this.onerror=null;">
            <div>
              <div class="fw-semibold text-dark" style="font-size: 13px;">${inv.patient}</div>
              <div class="text-muted" style="font-size: 11.5px;">${inv.mrn}</div>
            </div>
          </div>
        </td>
        <td><span class="service-chip ${serviceStyle[inv.service] || ''}">${inv.service}</span></td>
        <td class="text-muted fs-7">${formatDisplayDate(inv.created)}</td>
        <td class="text-muted fs-7">${formatDisplayDate(inv.due)}</td>
        <td>${formatAmount(inv.amount)}</td>
        <td><span class="status-pill ${statusStyle[inv.status] || ''}">${inv.status}</span></td>
        <td class="text-end pe-4">
          <div class="d-flex justify-content-end gap-2">
            <button type="button" class="invoice-action-btn" title="Print Invoice" onclick="handlePrintInvoice('${inv.txnId}')">
              <i class="fa-solid fa-print"></i>
            </button>
            <button type="button" class="invoice-action-btn" title="Download PDF Receipt" onclick="handleDownloadReceipt('${inv.txnId}')">
              <i class="fa-solid fa-download"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  function renderInvoices(data) {
    if (countEl) countEl.textContent = data.length;
    if (tbody) tbody.innerHTML = data.map(rowTemplate).join('');
    if (noResultsEl) noResultsEl.classList.toggle('d-none', data.length > 0);
  }

  function renderSummaryCounters() {

    const totalElem = document.getElementById('statTotalEarnings');
  if (!totalElem) return;
    const total = invoicesData.reduce((sum, i) => sum + i.amount, 0);
    const paid = invoicesData.filter(i => i.status === 'Paid');
    const paidTotal = paid.reduce((sum, i) => sum + i.amount, 0);
    const unpaid = invoicesData.filter(i => i.status === 'Unpaid' || i.status === 'Partial');
    const unpaidTotal = unpaid.reduce((sum, i) => sum + i.amount, 0);

    document.getElementById('statTotalEarnings').textContent = `$${total.toLocaleString()}`;
    document.getElementById('statTotalEarningsSub').textContent = `PKR ${(total * PKR_RATE).toLocaleString()}`;

    document.getElementById('statPaidAmount').textContent = `$${paidTotal.toLocaleString()}`;
    document.getElementById('statPaidCount').textContent = `${paid.length} invoices settled`;

    document.getElementById('statOutstandingAmount').textContent = `$${unpaidTotal.toLocaleString()}`;
    document.getElementById('statOutstandingCount').textContent = `${unpaid.length} invoices pending`;
  }

  function applyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const status = statusFilter.value;
    const filtered = invoicesData.filter(inv => {
      const matchesTerm = !term || inv.patient.toLowerCase().includes(term) || inv.txnId.toLowerCase().includes(term);
      const matchesStatus = !status || inv.status === status;
      return matchesTerm && matchesStatus;
    });
    renderInvoices(filtered);
  }

  searchInput?.addEventListener('input', applyFilters);
  statusFilter?.addEventListener('change', applyFilters);

  // ---- One-click actions ----

  function findInvoice(txnId) {
    return invoicesData.find(i => i.txnId === txnId);
  }

  function invoiceHtmlFor(inv) {
    return `
      <html>
      <head>
        <title>${inv.txnId} — Medivibe Invoice</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #0f172a; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          td, th { padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 13px; }
          .total { font-weight: bold; font-size: 16px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Medivibe Hospital — Invoice Receipt</h1>
        <p style="color:#64748b;">Transaction ID: ${inv.txnId}</p>
        <table>
          <tr><th>Patient</th><td>${inv.patient} (${inv.mrn})</td></tr>
          <tr><th>Service</th><td>${inv.service}</td></tr>
          <tr><th>Created</th><td>${formatDisplayDate(inv.created)}</td></tr>
          <tr><th>Due Date</th><td>${formatDisplayDate(inv.due)}</td></tr>
          <tr><th>Status</th><td>${inv.status}</td></tr>
        </table>
        <p class="total">Amount: $${inv.amount} (₨${(inv.amount * PKR_RATE).toLocaleString()})</p>
      </body>
      </html>
    `;
  }

  // Opens a clean print-only window and triggers the browser print dialog.
  function handlePrintInvoice(txnId) {
    const inv = findInvoice(txnId);
    if (!inv) return;
    const printWin = window.open('', '_blank', 'width=700,height=800');
    printWin.document.write(invoiceHtmlFor(inv));
    printWin.document.close();
    printWin.onload = () => printWin.print();
  }

  function handleDownloadReceipt(txnId) {
    const inv = findInvoice(txnId);
    if (!inv) return;
    const blob = new Blob([invoiceHtmlFor(inv)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.txnId}-receipt.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Initial render
  renderSummaryCounters();
  renderInvoices(invoicesData);




  ///// setting //////
  

  // ---- Logo upload preview ----
function previewLogo(input) {
  if (!input.files || !input.files[0]) return;
  const reader = new FileReader();
  reader.onload = e => { document.getElementById('logoPreview').src = e.target.result; };
  reader.readAsDataURL(input.files[0]);
}

// ---- Emergency helpline dynamic rows ----
function addHelplineRow() {
  const list = document.getElementById('helplineList');
  const row = document.createElement('div');
  row.className = 'helpline-row';
  row.innerHTML = `
    <input type="text" class="form-control rounded-pill px-3 helpline-input" placeholder="+92 300 0000000">
    <button type="button" class="helpline-remove-btn" onclick="removeHelplineRow(this)" title="Remove"><i class="fa-solid fa-xmark"></i></button>
  `;
  list.appendChild(row);
}
function removeHelplineRow(btn) {
  const list = document.getElementById('helplineList');
  if (list.children.length <= 1) return; // always keep at least one number
  btn.closest('.helpline-row').remove();
}

// ---- Password visibility toggle ----
function togglePasswordVisibility(fieldId, btn) {
  const field = document.getElementById(fieldId);
  const icon = btn.querySelector('i');
  const isHidden = field.type === 'password';
  field.type = isHidden ? 'text' : 'password';
  icon.classList.toggle('fa-eye', !isHidden);
  icon.classList.toggle('fa-eye-slash', isHidden);
}

// ---- 2FA toggle reveal ----
function toggle2FA(checkbox) {
  document.getElementById('twoFaDetailsBox').classList.toggle('d-none', !checkbox.checked);
}

// ---- Save confirmation toast ----
let toastTimer = null;
function showSavedToast(message) {
  const toast = document.getElementById('settingsSavedToast');
  document.getElementById('settingsSavedToastText').textContent = message;
  toast.classList.remove('d-none');
  toast.classList.add('d-flex');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('d-none');
    toast.classList.remove('d-flex');
  }, 3000);
}

// ---- Form handlers ----
function handleHospitalConfigSubmit(form) {
  const helplines = Array.from(document.querySelectorAll('.helpline-input'))
    .map(i => i.value.trim())
    .filter(Boolean);

  const config = {
    address: document.getElementById('hospitalAddress').value.trim(),
    helplines,
    currency: document.getElementById('baseCurrency').value
  };

  console.log('Hospital configuration saved:', config);
  showSavedToast('Hospital configuration saved successfully.');
}

function handleSecuritySubmit(form) {
  const newPass = document.getElementById('newPassword').value;
  const confirmPass = document.getElementById('confirmPassword').value;
  const warning = document.getElementById('passwordMismatchWarning');

  if (newPass || confirmPass) {
    if (newPass !== confirmPass) {
      warning.classList.remove('d-none');
      return;
    }
    if (newPass.length > 0 && newPass.length < 8) {
      warning.textContent = '';
      warning.classList.remove('d-none');
      warning.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1"></i> New password must be at least 8 characters.';
      return;
    }
  }
  warning.classList.add('d-none');

  const settings = {
    taxPercentage: Number(document.getElementById('taxPercentage').value),
    smsNotifications: document.getElementById('smsNotifToggle').checked,
    emailNotifications: document.getElementById('emailNotifToggle').checked,
    twoFactorEnabled: document.getElementById('twoFaToggle').checked,
    passwordChanged: Boolean(newPass)
  };

  console.log('Security settings saved:', settings);
  showSavedToast('Security settings saved successfully.');

  // Clear password fields after a successful "save"
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
}
