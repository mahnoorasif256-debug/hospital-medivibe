import { auth, db } from "./firebase.config.js"; 
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc , collection, getDocs, onSnapshot, query, where, orderBy, limit, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ================= AUTHENTICATION CHECK =================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.replace("../errorpage/errpage.html");
        return;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists() || userDocSnap.data().role !== "ADMIN") {
            await signOut(auth);
            window.location.replace("../errorpage/errpage.html");
        } else {
            document.body.style.display = "block";
            console.log("Admin verified, access granted.");
        }
    } catch (err) {
        console.error("Security check error:", err);
        window.location.replace("../errorpage/errpage.html");
    }
});



// ================= LOGOUT FUNCTIONALITY =================
const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
        e.preventDefault(); // Default link behavior roke ga

        try {
            await signOut(auth); // Firebase se session khatam karega
            console.log("Admin successfully logged out.");
            
            // Absolute path use karein taake har page se theek redirect ho
            window.location.replace("/authi.html"); 
        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout nahi ho saka: " + error.message);
        }
    });
}




// Centralized list of hospital departments
const HOSPITAL_DEPARTMENTS = [
  "Cardiology",
  "Orthopedics",
  "Dermatology",
  "Pediatrics",
  "Gynecology",
  "Neurology",
  "Dentistry",
  "General Medicine",
  "ENT (Ear, Nose, Throat)"
];

// Function to automatically populate all department dropdowns across the entire project
function initDynamicDepartmentDropdowns() {
  // Target all department select IDs used in modals or filters
  // NOTE: #bookDepartment aur #filterDepartment ko yahan se hata diya gaya hai —
  // yeh dono appointment.js dwara doctors ke real specialization se dynamically
  // populate hotay hain. Yahan static list dalna un dropdowns ko overwrite kar
  // deta tha aur naye added doctors dropdown mein show nahi hotay thay.
  const departmentSelects = document.querySelectorAll('#newDeptName, #editDeptName');

  departmentSelects.forEach(selectElement => {
    // Save the default first option (e.g., "Select Department" or "All Departments")
    const defaultOption = selectElement.options.length > 0 
      ? selectElement.options[0].outerHTML 
      : '<option value="" disabled selected>Select Department</option>';

    // Clear existing options and set default
    selectElement.innerHTML = defaultOption;

    // Dynamically inject options from the central array
    HOSPITAL_DEPARTMENTS.forEach(dept => {
      const option = document.createElement('option');
      option.value = dept;
      option.textContent = dept;
      selectElement.appendChild(option);
    });
  });
}

// Run automatically when any page loads
document.addEventListener('DOMContentLoaded', () => {
  initDynamicDepartmentDropdowns();
});















// ================= LIVE KPI CARDS =================
let miniChartRegistry = {};

// 6-point gentle upward trend jo asal current value par khatam ho —
// (Firestore mein din-ba-din history nahi hai, isliye sparkline ka shape
//  approximate hai lekin last point hamesha real count hota hai)
function trendTowards(endValue) {
  const safeEnd = Math.max(Number(endValue) || 0, 1);
  const start = Math.round(safeEnd * 0.4);
  const points = [];
  for (let i = 0; i < 6; i++) {
    points.push(Math.round(start + ((safeEnd - start) * i) / 5));
  }
  return points;
}

function renderMiniChart(canvasId, dataPoints, color) {
  const canvasEl = document.getElementById(canvasId);
  if (!canvasEl || typeof Chart === 'undefined') return;

  if (miniChartRegistry[canvasId]) {
    miniChartRegistry[canvasId].destroy();
  }

  miniChartRegistry[canvasId] = new Chart(canvasEl, {
    type: 'line',
    data: {
      labels: dataPoints.map((_, i) => i),
      datasets: [{
        data: dataPoints,
        borderColor: color,
        backgroundColor: color + '22',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } }
    }
  });
}

async function loadLiveDashboardStats() {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        let totalDoctors = 0;

        usersSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const role = (data.role || "").toUpperCase();
            if (role === "DOCTOR") totalDoctors++;
        });

        // Patients "users" collection mein nahi, balke apni alag "patients"
        // collection mein hain, isliye unhe alag se count karte hain.
        let totalPatients = 0;
        try {
            const patientsSnapshot = await getDocs(collection(db, "patients"));
            totalPatients = patientsSnapshot.size;
        } catch (err) {
            console.error("Patients count load karne mein error aaya:", err);
        }

        const docCountElem = document.getElementById("kpiDoctorsCount");
        const patCountElem = document.getElementById("kpiPatientsCount");

        if (docCountElem) docCountElem.innerText = totalDoctors;
        if (patCountElem) patCountElem.innerText = totalPatients;

        renderMiniChart('doctorsMiniChart', trendTowards(totalDoctors), '#0d6efd');
        renderMiniChart('patientsMiniChart', trendTowards(totalPatients), '#ef4444');

    } catch (err) {
        console.error("Stats load karne mein error aaya:", err);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    loadLiveDashboardStats();
    loadAppointmentsFromFirestore();
    // NOTE: "loadInvoicesFromFirestore()" yahan call ho raha tha lekin file
    // mein kahin define nahi tha — is se ReferenceError aa kar is poore
    // callback ko yahin par rok deta tha, jisse neeche wali 2 lines
    // (initStaticAnalyticsCharts, loadTopDoctorsWidget) kabhi chalti hi nahi
    // thi. Invoices asal mein "initInvoicesRealtime()" se load hoti hain,
    // jo neeche apne alag DOMContentLoaded listener mein already call ho
    // raha hai — is liye yahan se hata diya gaya.
    initStaticAnalyticsCharts();
    loadTopDoctorsWidget();
});

// ================= DOCTORS DIRECTORY WIDGET (Dashboard) =================
// NOTE: Firestore doctor documents mein abhi "rating" field nahi hai,
// isliye jab wo field maujood na ho to 4.5 ko placeholder rating maana hai.
async function loadTopDoctorsWidget() {
  const container = document.getElementById('topDoctorsContainer');
  if (!container) return; // is page pe doctors widget nahi hai

  function avatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Doctor")}&background=e0e7ff&color=4338ca&size=128`;
  }

  function starsHtml(rating) {
    const full = Math.round(rating);
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += `<i class="fa-${i <= full ? 'solid' : 'regular'} fa-star"></i>`;
    }
    return html;
  }

  try {
    const doctorsQuery = query(collection(db, "users"), where("role", "==", "DOCTOR"));
    const snapshot = await getDocs(doctorsQuery);

    if (snapshot.empty) {
      container.innerHTML = `<div class="col-12 text-center text-muted py-3">Koi doctor nahi mila.</div>`;
      return;
    }

    const doctors = snapshot.docs.slice(0, 4); // dashboard par sirf 4 dikhane hain

    container.innerHTML = doctors.map((docSnap) => {
      const data = docSnap.data();
      const name = data.fullName ? `Dr. ${data.fullName}` : "Dr. Unknown";
      const specialization = data.specialization || "General Practice";
      const rating = data.rating || 4.5;
      const image = data.photoURL || avatarUrl(data.fullName);

      return `
        <div class="col-xl-3 col-md-6">
          <div class="doctor-mini-card">
            <img src="${image}" class="doctor-avatar" alt="${name}">
            <div>
              <p class="doctor-name">${name}</p>
              <span class="doctor-spec-badge" style="background:#e0f2fe; color:#0284c7;">${specialization}</span>
              <div class="doctor-stars">
                ${starsHtml(rating)}
                <span class="text-muted" style="font-size:11px;">(${rating})</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Top doctors widget load karne mein error aaya:", err);
  }
}

// ================= RECENT APPOINTMENTS WIDGET =================
function loadAppointmentsFromFirestore() {
  const tableBody = document.getElementById('recentAppointmentsTableBody');
  if (!tableBody) return;

  function avatarUrl(name) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=e0e7ff&color=4338ca&size=64`;
  }

  onSnapshot(collection(db, "appointments"), (snapshot) => {
    tableBody.innerHTML = "";

    const appointmentsCountElem = document.getElementById('kpiAppointmentsCount');
    if (appointmentsCountElem) appointmentsCountElem.innerText = snapshot.size;
    renderMiniChart('appointmentsMiniChart', trendTowards(snapshot.size), '#0dcaf0');

    if (snapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No appointments found.</td></tr>`;
      return;
    }

    const docs = snapshot.docs.slice().sort((a, b) => {
      const da = a.data().createdAt?.toMillis ? a.data().createdAt.toMillis() : 0;
      const db_ = b.data().createdAt?.toMillis ? b.data().createdAt.toMillis() : 0;
      return db_ - da;
    });

    docs.forEach((docSnap) => {
      const appt = docSnap.data();
      let badgeClass = "status-checked-in";
      if (appt.status === "Pending") badgeClass = "status-checked-in";
      else if (appt.status === "Confirmed") badgeClass = "status-in-consultation";
      else if (appt.status === "Completed") badgeClass = "status-completed";
      else if (appt.status === "Cancelled") badgeClass = "status-cancelled";

      const dateTimeDisplay = appt.date
        ? `${appt.date}<br><span class="text-muted" style="font-size:11.5px;">${appt.time || ''}</span>`
        : 'N/A';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <div class="mv-person">
            <img src="${avatarUrl(appt.patientName)}" alt="">
            <div>
              <span class="name">${appt.patientName || 'N/A'}</span>
              <span class="sub">ID #${docSnap.id.slice(0, 6)}</span>
            </div>
          </div>
        </td>
        <td>
          <div class="mv-person">
            <img src="${avatarUrl(appt.doctorName)}" alt="">
            <div>
              <span class="name">${appt.doctorName || 'N/A'}</span>
              <span class="sub">${appt.reason ? appt.reason.slice(0, 24) : 'General'}</span>
            </div>
          </div>
        </td>
        <td><span class="dept-tag">${appt.department || 'General'}</span></td>
        <td>${dateTimeDisplay}</td>
        <td><span class="status-pill ${badgeClass}">${appt.status || 'Pending'}</span></td>
      `;
      tableBody.appendChild(row);
    });
  });
}

// ================= NAVIGATION & THEME TOGGLE =================

// ---- Hospital Visits + Operation Success charts ----
// NOTE: Firestore mein abhi per-day "in-patient/out-patient" ya "operation
// success" ka koi collection nahi hai, isliye ye demo/placeholder data se
// bane hain — jab wo data available ho to yahan real query laga dena.
function initStaticAnalyticsCharts() {
  const visitsEl = document.getElementById('hospitalVisitsChart');
  if (visitsEl && typeof Chart !== 'undefined') {
    new Chart(visitsEl, {
      type: 'bar',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          { label: 'In-Patient', data: [18, 22, 19, 25, 20, 14, 12], backgroundColor: '#0d6efd', borderRadius: 6 },
          { label: 'Out-Patient', data: [32, 28, 35, 30, 38, 24, 20], backgroundColor: '#00b4d8', borderRadius: 6 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
        }
      }
    });
  }

  const successEl = document.getElementById('operationSuccessChart');
  if (successEl && typeof Chart !== 'undefined') {
    new Chart(successEl, {
      type: 'doughnut',
      data: {
        labels: ['Success', 'Other'],
        datasets: [{ data: [94, 6], backgroundColor: ['#16a34a', '#e2e8f0'], borderWidth: 0 }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: { legend: { display: false }, tooltip: { enabled: false } }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const allNavLinks = document.querySelectorAll('.nav-link');
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  allNavLinks.forEach(link => {
    link.addEventListener('click', function () {
      allNavLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      const parentDropdown = this.closest('.nav-item.dropdown');
      parentDropdown.classList.toggle('show-dropdown');
    });
  });
});

const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-theme');
  if (themeToggle) themeToggle.checked = true;
}

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

// ================= NOTIFICATIONS (Firebase Firestore, Real-time) =================
(function () {
  const notifContainers = [
    document.getElementById('notifContainer'),
    document.getElementById('notifications-container')
  ].filter(Boolean);
  const notifDot = document.querySelector('.notification-dot');
  const markAllBtn = document.getElementById('mark-all-read') || document.getElementById('notifMarkAll');
  const clearAllBtn = document.getElementById('clear-all');

  if (!notifContainers.length) return;

  // Latest snapshot kept in memory so Mark-all/Clear-all/click-to-read
  // know exactly which Firestore doc ids to act on.
  let liveNotifications = [];

  // ---- Icon shown when a notification has no avatar image ----
  const TYPE_ICON = {
    appointment: { icon: 'fa-calendar-check',        bg: '#e0f2fe', color: '#0284c7' },
    message:     { icon: 'fa-comment-dots',          bg: '#ede9fe', color: '#7c3aed' },
    report:      { icon: 'fa-file-medical',          bg: '#dcfce7', color: '#16a34a' },
    alert:       { icon: 'fa-triangle-exclamation',  bg: '#fee2e2', color: '#dc2626' },
    system:      { icon: 'fa-gear',                  bg: '#f1f5f9', color: '#475569' },
    default:     { icon: 'fa-bell',                  bg: '#f1f5f9', color: '#475569' }
  };

  // ---- "x mins/hrs/days ago" helper (accepts Firestore Timestamp, {seconds}, Date, or string) ----
  function timeAgo(value) {
    if (!value) return '';
    const date = value.toDate ? value.toDate()
               : value.seconds ? new Date(value.seconds * 1000)
               : new Date(value);
    if (isNaN(date.getTime())) return '';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  }

  function avatarOrIcon(notif) {
    if (notif.avatar) {
      return `<img src="${notif.avatar}" alt="${notif.title || ''}" class="rounded-circle me-3" width="45" height="45" style="object-fit: cover;">`;
    }
    const cfg = TYPE_ICON[notif.type] || TYPE_ICON.default;
    return `
      <div class="me-3 d-flex align-items-center justify-content-center rounded-circle"
           style="width:45px; height:45px; flex-shrink:0; background:${cfg.bg}; color:${cfg.color};">
        <i class="fa-solid ${cfg.icon}"></i>
      </div>`;
  }

  function renderNotifications() {
    if (liveNotifications.length === 0) {
      const emptyHtml = `<p class="text-center text-muted py-4 mb-0">No new notifications</p>`;
      notifContainers.forEach(container => { container.innerHTML = emptyHtml; });
      updateBadge();
      return;
    }

    const listHtml = liveNotifications.map(notif => `
      <div class="d-flex align-items-center justify-content-between p-3 border-bottom notif-row ${notif.read ? 'mb-2' : 'bg-light rounded-3 mb-2 border-0'}" data-id="${notif.id}" style="cursor:pointer;">
        <div class="d-flex align-items-center">
          ${avatarOrIcon(notif)}
          <div>
            <h6 class="fw-bold mb-1 text-dark">${notif.title || 'Notification'} <span class="fw-normal text-muted small">${notif.message || ''}</span></h6>
            <small class="text-muted"><i class="fa-regular fa-clock me-1"></i>${timeAgo(notif.createdAt)}</small>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          ${notif.actions ? `
            <button class="btn btn-sm btn-outline-secondary px-3 py-1 notif-decline-btn">Decline</button>
            <button class="btn btn-sm btn-primary px-3 py-1 notif-accept-btn">Accept</button>
          ` : ''}
          ${!notif.read ? '<span class="badge bg-danger rounded-pill p-2 ms-2"></span>' : ''}
        </div>
      </div>
    `).join('');

    notifContainers.forEach(container => { container.innerHTML = listHtml; });

    updateBadge();
  }

  // ---- Red badge on the bell: reuses the existing .notification-dot element
  //      (no new HTML needed) and shows the unread count inside it. ----
  function updateBadge() {
    if (!notifDot) return;
    const unreadCount = liveNotifications.filter(n => !n.read).length;

    if (unreadCount === 0) {
      notifDot.classList.add('hidden');
      notifDot.classList.remove('has-count');
      notifDot.textContent = '';
    } else {
      notifDot.classList.remove('hidden');
      notifDot.classList.add('has-count');
      notifDot.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
    }
  }

  async function markAsRead(id) {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error("Notification ko read mark karne mein error:", err);
    }
  }

  async function markAllAsRead() {
    const unread = liveNotifications.filter(n => !n.read);
    if (!unread.length) return;
    try {
      const batch = writeBatch(db);
      unread.forEach(n => batch.update(doc(db, "notifications", n.id), { read: true }));
      await batch.commit();
    } catch (err) {
      console.error("Sab notifications read mark karne mein error:", err);
    }
  }

  async function clearAllNotifications() {
    if (!liveNotifications.length) return;
    try {
      const batch = writeBatch(db);
      liveNotifications.forEach(n => batch.delete(doc(db, "notifications", n.id)));
      await batch.commit();
    } catch (err) {
      console.error("Notifications clear karne mein error:", err);
    }
  }

  // Clicking a notification row marks it read; Accept/Decline also count as "read".
  notifContainers.forEach(container => {
    container.addEventListener('click', (e) => {
      const row = e.target.closest('[data-id]');
      if (!row) return;
      markAsRead(row.getAttribute('data-id'));
    });
  });

  if (markAllBtn) markAllBtn.addEventListener('click', markAllAsRead);
  if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllNotifications);

  // ---- Real-time Firestore listener: fires instantly on add/update/delete ----
  try {
    const notifQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(30));
    onSnapshot(notifQuery, (snapshot) => {
      liveNotifications = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      renderNotifications();
    }, (err) => {
      console.error("Notifications listen karne mein error:", err);
      const errHtml = `<p class="text-center text-muted py-4 mb-0">Notifications load nahi ho sakin.</p>`;
      notifContainers.forEach(container => { container.innerHTML = errHtml; });
    });
  } catch (err) {
    console.error("Notifications query set karne mein error:", err);
  }
})();

// ================= SIDEBAR & RESPONSIVENESS =================
const sidebarEl = document.querySelector('.sidebar');
const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

function openSidebar() {
  sidebarEl?.classList.add('sidebar-open');
  sidebarBackdrop?.classList.add('show');
}

function closeSidebar() {
  sidebarEl?.classList.remove('sidebar-open');
  sidebarBackdrop?.classList.remove('show');
}

sidebarToggleBtn?.addEventListener('click', () => {
  if (sidebarEl?.classList.contains('sidebar-open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
});

sidebarBackdrop?.addEventListener('click', closeSidebar);

const sidebarCollapseBtn = document.getElementById('sidebarCollapseBtn');
if (sidebarEl && localStorage.getItem('sidebarCollapsed') === 'true') {
  sidebarEl.classList.add('collapsed');
}

sidebarCollapseBtn?.addEventListener('click', () => {
  sidebarEl?.classList.toggle('collapsed');
  localStorage.setItem('sidebarCollapsed', sidebarEl?.classList.contains('collapsed'));
});

// Dynamic Greeting
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


// ================= INVOICES (Real-time Firestore Integration) =================
const PKR_RATE = 280;
let invoicesData = []; // Hardcoded array hata kar empty array kar diya

function initInvoicesRealtime() {
  const tbody = document.getElementById('invoicesTableBody');
  const countEl = document.getElementById('totalInvoicesCount');
  const noResultsEl = document.getElementById('noInvoicesFound');
  const statusFilter = document.getElementById('statusFilter');
  const searchInput = document.getElementById('invoiceSearchInput');
  const chartEl = document.getElementById('revenueExpensesChart');

  // Pehle yahan sirf "invoicesTableBody" (Invoices page) check hota tha,
  // is liye Overview/index page (admin.html) par — jahan invoices table
  // nahi, sirf Revenue & Expenses CHART hai — yeh poora function turant
  // return ho jata tha aur onSnapshot listener kabhi lagta hi nahi tha,
  // is liye chart hamesha khaali rehta tha.
  // Ab agar table YA chart, dono mein se koi bhi is page par maujood ho,
  // to listener lag jayega.
  if (!tbody && !chartEl) return; // Is page par na table hai na chart — kuch karne ki zaroorat nahi

  // Real-time listener for invoices collection
  onSnapshot(collection(db, "invoices"), (snapshot) => {
    invoicesData = [];
    snapshot.forEach((docSnap) => {
      invoicesData.push({ id: docSnap.id, ...docSnap.data() });
    });

    filterAndRenderInvoices();
  }, (err) => {
    console.error("Invoices load karne mein error aaya:", err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">Invoices load nahi ho sakin.</td></tr>`;
  });

  // Filter & Search Event Listeners
  if (statusFilter) statusFilter.addEventListener('change', filterAndRenderInvoices);
  if (searchInput) searchInput.addEventListener('input', filterAndRenderInvoices);
}

function filterAndRenderInvoices() {
  const statusVal = document.getElementById('statusFilter')?.value || '';
  const searchVal = document.getElementById('invoiceSearchInput')?.value.toLowerCase().trim() || '';

  const filtered = invoicesData.filter(inv => {
    const matchesStatus = statusVal === '' || inv.status === statusVal;
    const matchesSearch = (inv.txnId && inv.txnId.toLowerCase().includes(searchVal)) ||
                          (inv.patient && inv.patient.toLowerCase().includes(searchVal)) ||
                          (inv.mrn && inv.mrn.toLowerCase().includes(searchVal));
    return matchesStatus && matchesSearch;
  });

  renderInvoices(filtered);
  renderSummaryCounters(invoicesData); // Summary hamesha total data par calculate hogi
  renderRevenueExpensesChart(invoicesData);
}

// ================= REVENUE & EXPENSES CHART (Overview page) =================
// NOTE: Firestore ke "invoices" collection mein sirf REVENUE ka data hai
// (amount, status, created) — "expenses" (kharche) ka koi collection ya
// field abhi tak app mein maujood nahi. Is liye:
//   - Revenue line asal Firestore invoices se, month-wise, dynamically banti hai.
//   - Expenses line filhaal 0 par flat hai (real data available nahi).
// Jab kabhi ek "expenses" collection (jaise date + amount ke sath) bana lein,
// to neeche "expensesByMonth" ki jagah wahan se asal values bhar dein.
let revenueExpensesChartInstance = null;

function renderRevenueExpensesChart(data) {
  const canvasEl = document.getElementById('revenueExpensesChart');
  if (!canvasEl || typeof Chart === 'undefined') return;

  // Pichle 6 mahinon ke labels banayein (sabse purana pehle)
  const monthLabels = [];
  const monthKeys = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${d.getMonth()}`);
    monthLabels.push(d.toLocaleString('en-US', { month: 'short' }));
  }

  // Har mahine ka revenue total nikalein (invoice ki "created" date se)
  const revenueByMonth = new Array(monthKeys.length).fill(0);
  data.forEach(inv => {
    const rawDate = inv.createdAt || inv.created;
    if (!rawDate) return;
    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) return;
    const key = `${parsed.getFullYear()}-${parsed.getMonth()}`;
    const idx = monthKeys.indexOf(key);
    if (idx !== -1) {
      revenueByMonth[idx] += Number(inv.amount) || 0;
    }
  });

  // Expenses ka abhi koi real data source nahi hai — flat 0 rakha gaya hai
  const expensesByMonth = new Array(monthKeys.length).fill(0);

  if (revenueExpensesChartInstance) {
    revenueExpensesChartInstance.destroy();
  }

  revenueExpensesChartInstance = new Chart(canvasEl, {
    type: 'line',
    data: {
      labels: monthLabels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueByMonth,
          borderColor: '#16a34a',
          backgroundColor: '#16a34a22',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 3
        },
        {
          label: 'Expenses',
          data: expensesByMonth,
          borderColor: '#ef4444',
          backgroundColor: '#ef444422',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
      }
    }
  });
}

function renderInvoices(data) {
  const tbody = document.getElementById('invoicesTableBody');
  const countEl = document.getElementById('totalInvoicesCount');
  const noResultsEl = document.getElementById('noInvoicesFound');

  if (countEl) countEl.textContent = data.length;
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = ``;
    if (noResultsEl) noResultsEl.classList.remove('d-none');
    return;
  }

  if (noResultsEl) noResultsEl.classList.add('d-none');

  tbody.innerHTML = data.map(inv => `
    <tr>
      <td class="ps-4"><span class="fw-semibold text-primary">${inv.txnId || 'N/A'}</span></td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div>
            <div class="fw-semibold text-dark" style="font-size: 13px;">${inv.patient || 'Unknown'}</div>
            <div class="text-muted" style="font-size: 11.5px;">${inv.mrn || '#MRN-0000'}</div>
          </div>
        </div>
      </td>
      <td><span class="service-chip">${inv.service || 'General'}</span></td>
      <td class="text-muted fs-7">${inv.created || 'N/A'}</td>
      <td class="text-muted fs-7">${inv.due || 'N/A'}</td>
      <td><span class="fw-bold text-dark">$${inv.amount || 0}</span> <span class="text-muted" style="font-size:11.5px;">(₨${((inv.amount || 0) * PKR_RATE).toLocaleString()})</span></td>
      <td><span class="status-pill">${inv.status || 'Pending'}</span></td>
      <td class="text-end pe-4">
        <button type="button" class="btn btn-sm btn-light" onclick="alert('Receipt: ${inv.txnId}')"><i class="fa-solid fa-print"></i></button>
      </td>
    </tr>
  `).join('');
}

function renderSummaryCounters(data) {
  const totalElem = document.getElementById('statTotalEarnings');
  if (!totalElem) return;

  const total = data.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const paid = data.filter(i => i.status === 'Paid');
  const paidTotal = paid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const unpaid = data.filter(i => i.status === 'Unpaid' || i.status === 'Partial');
  const unpaidTotal = unpaid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  document.getElementById('statTotalEarnings').textContent = `$${total.toLocaleString()}`;
  document.getElementById('statTotalEarningsSub').textContent = `PKR ${(total * PKR_RATE).toLocaleString()}`;
  document.getElementById('statPaidAmount').textContent = `$${paidTotal.toLocaleString()}`;
  document.getElementById('statPaidCount').textContent = `${paid.length} invoices settled`;
  document.getElementById('statOutstandingAmount').textContent = `$${unpaidTotal.toLocaleString()}`;
  document.getElementById('statOutstandingCount').textContent = `${unpaid.length} invoices pending`;

  renderMiniChart('revenueMiniChart', trendTowards(total), '#16a34a');
}

// DomContentLoaded mein load function call update kar dein
document.addEventListener('DOMContentLoaded', () => {
  initInvoicesRealtime();
});





















// Profile Photo Change Trigger & Persistence
const changePhotoBtn = document.getElementById('changePhotoBtn');
const profilePhotoInput = document.getElementById('profilePhotoInput');

// Page load hote hi agar localStorage mein koi photo save hai toh sabhi jagah apply kar dein
document.addEventListener('DOMContentLoaded', () => {
  const savedPic = localStorage.getItem('adminProfilePic');
  if (savedPic) {
    const allAvatars = document.querySelectorAll('.avatar-img, .profile-toggle img, .d-flex img.rounded-circle');
    allAvatars.forEach(img => {
      img.src = savedPic;
    });
  }
});

if (changePhotoBtn && profilePhotoInput) {
  changePhotoBtn.addEventListener('click', () => {
    profilePhotoInput.click();
  });

  profilePhotoInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64Image = e.target.result;
        
        // 1. LocalStorage mein save kar dein taake refresh par bhi yaad rahe
        localStorage.setItem('adminProfilePic', base64Image);

        // 2. Profile page wali preview image update karein
        const profileImg = document.querySelector('.d-flex img.rounded-circle');
        if (profileImg) {
          profileImg.src = base64Image;
        }

        // 3. Header wali image bhi sath hi update kar dein
        const headerImgs = document.querySelectorAll('.avatar-img, .profile-toggle img');
        headerImgs.forEach(img => {
          img.src = base64Image;
        });
      };
      reader.readAsDataURL(file);
    }
  });
}



// ================= ROBUST GLOBAL SEARCH FILTER =================
document.addEventListener('DOMContentLoaded', () => {
  // Aap apne search input ka selector yahan adjust kar sakte hain agar zaroorat paray
  const searchInput = document.querySelector('.header-search input') || document.querySelector('input[type="search"]') || document.querySelector('.search-input');
  
  if (!searchInput) {
    console.warn("Search input element nahi mila! Class check karein.");
    return;
  }

  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    console.log("Searching for:", term); // Yeh console mein check karne ke liye hai

    // 1. Filter all tables (appointments, patients, billing, etc.)
    const tableRows = document.querySelectorAll('table tbody tr');
    tableRows.forEach(row => {
      // Pehli row (headers ya initial row) ko skip karein agar zaroori ho
      if (row.id.includes('Initial') || row.id.includes('Empty')) return;
      
      const text = row.textContent.toLowerCase();
      if (text.includes(term) || term === '') {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });

    // 2. Filter all cards (Doctors cards, KPI cards, etc.)
    const cards = document.querySelectorAll('.doctor-card, .card, .stat-card, #topDoctorsContainer > div');
    cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      if (text.includes(term) || term === '') {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
});





// ================= AUTOMATIC BOOK APPOINTMENT MODAL TRIGGER =================
document.addEventListener('click', (e) => {
  // Check if the clicked element (or its parent) is the appointment button
  const appointmentBtn = e.target.closest('.button-icon');
  
  if (appointmentBtn) {
    e.preventDefault();
    const modalElement = document.getElementById('bookAppointmentModal');
    if (modalElement) {
      // Bootstrap 5 modal instance create ya get kar ke show karna
      const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
      modal.show();
    }
  }
});