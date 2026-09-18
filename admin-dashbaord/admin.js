import { auth, db } from "./firebase.config.js"; 
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc , collection, getDocs, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
    loadInvoicesFromFirestore();
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

// ================= NOTIFICATIONS (Cleaned & Unified) =================
(function () {
  const notifContainer = document.getElementById('notifications-container') || document.getElementById('notifContainer');
  const notifDot = document.querySelector('.notification-dot');
  const markAllBtn = document.getElementById('mark-all-read') || document.getElementById('notifMarkAll');
  const clearAllBtn = document.getElementById('clear-all');

  if (!notifContainer) return;

  let notifications = [
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

  function renderNotifications() {
    if (notifications.length === 0) {
      notifContainer.innerHTML = `<p class="text-center text-muted py-4 mb-0">No new notifications</p>`;
      updateDot();
      return;
    }

    notifContainer.innerHTML = notifications.map(notif => `
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
            <button class="btn btn-sm btn-primary px-3 py-1">Accept</button>
          ` : ''}
          ${notif.unread ? '<span class="badge bg-danger rounded-pill p-2 ms-2"></span>' : ''}
        </div>
      </div>
    `).join('');
    updateDot();
  }

  function updateDot() {
    const hasUnread = notifications.some(n => n.unread);
    if (notifDot) notifDot.classList.toggle('hidden', !hasUnread);
  }

  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      notifications.forEach(n => n.unread = false);
      renderNotifications();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      notifications = [];
      renderNotifications();
    });
  }

  renderNotifications();
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


// ================= INVOICES (Firestore Integration with Fallback) =================
const PKR_RATE = 280;
let invoicesData = [
  { txnId: 'TXN-10234', patient: 'Fatima Noor', mrn: '#MRN-84920', service: 'Consultation', created: '2026-03-10', due: '2026-03-10', amount: 60, status: 'Paid' },
  { txnId: 'TXN-10235', patient: 'Ahmed Raza', mrn: '#MRN-99421', service: 'Lab Test', created: '2026-03-12', due: '2026-03-19', amount: 120, status: 'Unpaid' }
];

async function loadInvoicesFromFirestore() {
  const tbody = document.getElementById('invoicesTableBody');
  const chartCanvas = document.getElementById('revenueExpensesChart');
  if (!tbody && !chartCanvas) return; // is page pe na table hai na chart

  try {
    const querySnapshot = await getDocs(collection(db, "invoices"));
    if (!querySnapshot.empty) {
      invoicesData = [];
      querySnapshot.forEach((docSnap) => {
        invoicesData.push({ id: docSnap.id, ...docSnap.data() });
      });
    }
  } catch (err) {
    console.log("Using default invoices data as fallback.");
  }
  renderSummaryCounters();
  renderInvoices(invoicesData);
  renderRevenueExpensesChart(invoicesData);
}

// ---- Revenue & Expenses chart: revenue asal invoices se, expenses
// abhi tak koi collection na hone ki wajah se revenue ka 55% placeholder hai ----
let revenueExpensesChartInstance = null;
function renderRevenueExpensesChart(data) {
  const el = document.getElementById('revenueExpensesChart');
  if (!el || typeof Chart === 'undefined') return;

  const monthlyRevenue = {};
  data.forEach(inv => {
    const monthKey = (inv.created || '').slice(0, 7); // "YYYY-MM"
    if (!monthKey) return;
    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (Number(inv.amount) || 0);
  });

  const months = Object.keys(monthlyRevenue).sort();
  const revenueValues = months.map(m => monthlyRevenue[m]);
  const expenseValues = revenueValues.map(v => Math.round(v * 0.55));

  if (revenueExpensesChartInstance) revenueExpensesChartInstance.destroy();

  revenueExpensesChartInstance = new Chart(el, {
    type: 'bar',
    data: {
      labels: months.length ? months : ['No data'],
      datasets: [
        { label: 'Revenue', data: revenueValues.length ? revenueValues : [0], backgroundColor: '#16a34a', borderRadius: 6 },
        { label: 'Expenses', data: expenseValues.length ? expenseValues : [0], backgroundColor: '#ef4444', borderRadius: 6 }
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
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No invoices found.</td></tr>`;
    if (noResultsEl) noResultsEl.classList.remove('d-none');
    return;
  }

  if (noResultsEl) noResultsEl.classList.add('d-none');

  tbody.innerHTML = data.map(inv => `
    <tr>
      <td class="ps-4"><span class="fw-semibold text-primary">${inv.txnId}</span></td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <div>
            <div class="fw-semibold text-dark" style="font-size: 13px;">${inv.patient}</div>
            <div class="text-muted" style="font-size: 11.5px;">${inv.mrn || '#MRN-0000'}</div>
          </div>
        </div>
      </td>
      <td><span class="service-chip">${inv.service}</span></td>
      <td class="text-muted fs-7">${inv.created}</td>
      <td class="text-muted fs-7">${inv.due}</td>
      <td><span class="fw-bold text-dark">$${inv.amount}</span> <span class="text-muted" style="font-size:11.5px;">(₨${(inv.amount * PKR_RATE).toLocaleString()})</span></td>
      <td><span class="status-pill">${inv.status}</span></td>
      <td class="text-end pe-4">
        <button type="button" class="btn btn-sm btn-light" onclick="alert('Receipt: ${inv.txnId}')"><i class="fa-solid fa-print"></i></button>
      </td>
    </tr>
  `).join('');
}

function renderSummaryCounters() {
  const totalElem = document.getElementById('statTotalEarnings');
  if (!totalElem) return;

  const total = invoicesData.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const paid = invoicesData.filter(i => i.status === 'Paid');
  const paidTotal = paid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const unpaid = invoicesData.filter(i => i.status === 'Unpaid' || i.status === 'Partial');
  const unpaidTotal = unpaid.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  document.getElementById('statTotalEarnings').textContent = `$${total.toLocaleString()}`;
  document.getElementById('statTotalEarningsSub').textContent = `PKR ${(total * PKR_RATE).toLocaleString()}`;
  document.getElementById('statPaidAmount').textContent = `$${paidTotal.toLocaleString()}`;
  document.getElementById('statOutstandingAmount').textContent = `$${unpaidTotal.toLocaleString()}`;

  renderMiniChart('revenueMiniChart', trendTowards(total), '#16a34a');
}