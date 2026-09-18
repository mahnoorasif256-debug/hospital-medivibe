import { db } from "../firebase.config.js";
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Real-time Firestore se Departments fetch aur render karna
function initDepartmentsRealtime() {
  const grid = document.getElementById('departmentsGrid');
  if (!grid) return;

  const q = query(collection(db, "departments"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    grid.innerHTML = '';

    if (snapshot.empty) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <p class="text-muted">No departments found. Add a new department to get started.</p>
        </div>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const dept = docSnap.data();
      const deptId = docSnap.id;
      
      let roomsArray = dept.rooms ? dept.rooms.split(',').map(r => `<span class="badge bg-light text-dark border px-2 py-1 me-1">${r.trim()}</span>`) : 'N/A';

      let hodName = dept.hod || 'Dr. Unknown';
      let initials = hodName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

      grid.innerHTML += `
        <div class="col-md-6 col-xl-4">
          <div class="card border-0 shadow-sm rounded-4 h-100 p-4 position-relative overflow-hidden">
            
            <!-- 3-Dot Options Menu -->
            <div class="position-absolute top-0 end-0 m-3 dropdown">
              <button class="btn btn-sm btn-light rounded-circle shadow-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false" style="width: 32px; height: 32px;">
                <i class="fa-solid fa-ellipsis-vertical text-muted"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                <li><a class="dropdown-item py-2 fs-7" href="#" onclick="viewDepartment('${deptId}')"><i class="fa-solid fa-eye me-2 text-primary"></i> View Details</a></li>
                <li><a class="dropdown-item py-2 fs-7" href="#" onclick="openEditModal('${deptId}')"><i class="fa-solid fa-pen-to-square me-2 text-warning"></i> Edit Department</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item py-2 fs-7 text-danger" href="#" onclick="deleteDepartment('${deptId}')"><i class="fa-solid fa-trash-can me-2"></i> Delete Department</a></li>
              </ul>
            </div>

            <div class="d-flex align-items-center mb-3">
              <div class="icon-box bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px; font-size: 20px;">
                <i class="fa-solid ${dept.icon || 'fa-hospital'}"></i>
              </div>
              <div>
                <h5 class="fw-bold text-dark mb-1">${dept.name}</h5>
                <div class="d-flex align-items-center mt-1">
                  <span class="badge bg-primary-subtle text-primary rounded-pill" style="font-size: 10px;">${dept.doctorsCount || 6} Active Doctors</span>
                </div>
              </div>
            </div>

            <!-- HOD Info Box -->
            <div class="bg-light p-2.5 rounded-3 d-flex align-items-center mb-3">
              <div class="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-2" style="width: 35px; height: 35px; font-size: 12px;">
                ${initials}
              </div>
              <div>
                <span class="d-block text-muted" style="font-size: 10px; text-transform: uppercase; letter-spacing: .5px;">Head of Department</span>
                <span class="fw-semibold text-dark fs-7">${hodName}</span>
              </div>
            </div>

            <p class="text-muted fs-7 mb-3">${dept.description || 'Clinical department handling specialized treatments.'}</p>
            
            <div class="mt-auto pt-3 border-top">
              <span class="d-block text-secondary fs-7 mb-2">ASSIGNED ROOMS</span>
              <div class="d-flex flex-wrap gap-1">
                ${Array.isArray(roomsArray) ? roomsArray.join('') : roomsArray}
              </div>
            </div>

          </div>
        </div>
      `;
    });
  }, (error) => {
    console.error("Error fetching departments: ", error);
  });
}

// 2. Modal se Naya Department Add Karna
window.handleAddDepartmentSubmit = async function(form) {
  const name = document.getElementById('newDeptName').value.trim();
  const hod = document.getElementById('newDeptHod').value.trim();
  const rooms = document.getElementById('newDeptRooms').value.trim();
  const description = document.getElementById('newDeptDescription').value.trim();

  if (!name || !hod || !rooms) {
    alert('Please fill out all required fields.');
    return;
  }

  try {
    await addDoc(collection(db, "departments"), {
      name: name,
      hod: hod,
      rooms: rooms,
      description: description || 'Specialized clinical care department.',
      icon: "fa-hospital",
      doctorsCount: Math.floor(Math.random() * 5) + 3,
      createdAt: new Date()
    });

    const modalEl = document.getElementById('addDepartmentModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    
    form.reset();
  } catch (error) {
    console.error("Error adding department: ", error);
    alert("Failed to add department.");
  }
}

// 3. View Details
window.viewDepartment = async function(deptId) {
  const docRef = doc(db, "departments", deptId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    alert(`[Department Info]\nName: ${data.name}\nHOD: ${data.hod}\nRooms: ${data.rooms}\nDescription: ${data.description}`);
  }
}

// 4. Open Edit Modal & Populate Data
window.openEditModal = async function(deptId) {
  try {
    const docRef = doc(db, "departments", deptId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      document.getElementById('editDeptId').value = deptId;
      document.getElementById('editDeptName').value = data.name || '';
      document.getElementById('editDeptHod').value = data.hod || '';
      document.getElementById('editDeptRooms').value = data.rooms || '';
      document.getElementById('editDeptDescription').value = data.description || '';

      const editModal = new bootstrap.Modal(document.getElementById('editDepartmentModal'));
      editModal.show();
    }
  } catch (error) {
    console.error("Error opening edit modal:", error);
  }
}

// 5. Handle Edit Form Submit (Firestore Update)
window.handleEditDepartmentSubmit = async function(event) {
  event.preventDefault();
  
  const deptId = document.getElementById('editDeptId').value;
  const name = document.getElementById('editDeptName').value.trim();
  const hod = document.getElementById('editDeptHod').value.trim();
  const rooms = document.getElementById('editDeptRooms').value.trim();
  const description = document.getElementById('editDeptDescription').value.trim();

  if (!deptId || !name || !hod || !rooms) return;

  try {
    const docRef = doc(db, "departments", deptId);
    await updateDoc(docRef, {
      name: name,
      hod: hod,
      rooms: rooms,
      description: description
    });

    const modalEl = document.getElementById('editDepartmentModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

  } catch (error) {
    console.error("Error updating department:", error);
    alert("Failed to update department.");
  }
}

// 6. Delete Department Function
window.deleteDepartment = async function(deptId) {
  const confirmed = confirm("Kya aap waqai is department ko delete karna chahti hain?");
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "departments", deptId));
    console.log("Department deleted successfully:", deptId);
  } catch (error) {
    console.error("Error deleting department: ", error);
    alert("Department delete karne mein error aaya hai.");
  }
}

// Page Load par initialize karein
document.addEventListener('DOMContentLoaded', () => {
  initDepartmentsRealtime();
});