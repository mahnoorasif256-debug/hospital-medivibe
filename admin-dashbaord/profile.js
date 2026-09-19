import { auth, db } from "./firebase.config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/docmtwzxm/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "blog_preset";

let selectedProfileFile = null;

// File selection and preview for profile image
window.previewProfileImage = function(input) {
    if (input.files && input.files[0]) {
        selectedProfileFile = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const imgElement = document.getElementById('adminProfileImg');
            if (imgElement) imgElement.src = e.target.result;
        }
        reader.readAsDataURL(input.files[0]);
    }
};

// Cloudinary Upload Helper
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData
    });

    const data = await response.json();
    if (data.secure_url) {
        return data.secure_url;
    } else {
        throw new Error("Cloudinary upload failed");
    }
}

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
            loadAdminProfile(user.uid);
        }
    } catch (err) {
        console.error("Auth check error:", err);
        window.location.replace("../errorpage/errpage.html");
    }
});

// ================= LOAD ADMIN PROFILE DATA =================
async function loadAdminProfile(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (document.getElementById('adminFirstName')) {
                document.getElementById('adminFirstName').value = data.firstName || '';
                document.getElementById('adminLastName').value = data.lastName || '';
                document.getElementById('adminEmail').value = data.email || '';
                document.getElementById('adminPhone').value = data.phone || '';
                document.getElementById('adminAddress').value = data.address || '';
                document.getElementById('adminCity').value = data.city || '';
                document.getElementById('adminCountry').value = data.country || '';
                
                if (data.photoURL && document.getElementById('adminProfileImg')) {
                    document.getElementById('adminProfileImg').src = data.photoURL;
                }
            }
        }
    } catch (err) {
        console.error("Profile load error:", err);
    }
}

// ================= SAVE PROFILE CHANGES =================
window.handleProfileSubmit = async function(form) {
    const user = auth.currentUser;
    if (!user) return;

    const firstName = document.getElementById('adminFirstName').value;
    const lastName = document.getElementById('adminLastName').value;
    const phone = document.getElementById('adminPhone').value;
    const address = document.getElementById('adminAddress').value;
    const city = document.getElementById('adminCity').value;
    const country = document.getElementById('adminCountry').value;

    try {
        let photoURL = null;
        if (selectedProfileFile) {
            photoURL = await uploadToCloudinary(selectedProfileFile);
        }

        const updateData = {
            firstName: firstName,
            lastName: lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            phone: phone,
            address: address,
            city: city,
            country: country,
            updatedAt: new Date()
        };

        if (photoURL) {
            updateData.photoURL = photoURL;
        }

        await setDoc(doc(db, "users", user.uid), updateData, { merge: true });

        alert("Profile successfully update ho gayi!");
    } catch (err) {
        console.error("Profile update error:", err);
        alert("Profile save karne mein masla ho gaya.");
    }
};

// ================= UPDATE PASSWORD =================
window.handleProfilePasswordSubmit = async function(form) {
    const currentPass = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;

    if (newPass !== confirmPass) {
        alert("New password aur confirm password match nahi kar rahe.");
        return;
    }

    try {
        const user = auth.currentUser;
        if (user && currentPass) {
            const credential = EmailAuthProvider.credential(user.email, currentPass);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPass);
            alert("Password kamyabi ke sath update ho gaya!");
            form.reset();
        }
    } catch (err) {
        console.error("Password update error:", err);
        alert("Password update nahi ho saka: " + err.message);
    }
};