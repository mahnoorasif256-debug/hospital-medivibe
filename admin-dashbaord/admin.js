
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
        img: '../images/doctor-01.jpg',
      unread: true
    },
    {
      id: 2,
      name: 'Dr. Patel',
      text: 'completed a <b>follow-up report</b> for patient <b>Emily</b>.',
      time: '8 min ago',
      img: '../images/doctor-02.webp',
      unread: true
    },
    {
      id: 3,
      name: 'Emily',
      text: 'booked an appointment with Dr. <b>Patel</b> for <b>April 15</b>.',
      time: '15 min ago',
      img: '../images/doctor-03.webp',
      unread: true
    },
    {
      id: 4,
      name: 'Amelia',
      text: 'completed the <b>pre-visit health questionnaire</b>.',
      time: '20 min ago',
     img: '../images/doctor-04.webp',
      unread: false
    }
  ];

  function renderNotifications() {
    if (notifications.length === 0) {
      notifContainer.innerHTML = '<div class="notif-empty">You\'re all caught up. No new notifications.</div>';
    } else {
      notifContainer.innerHTML = notifications.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
         <img src="${n.img}" class="notif-avatar" alt="${n.name}" onerror="this.src='https://via.placeholder.com/40'">
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