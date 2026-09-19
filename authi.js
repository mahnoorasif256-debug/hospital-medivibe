import { 
  auth, 
  db, 
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "./admin-dashbaord/firebase.config.js";

// Global Variables
let activeRole = "DOCTOR"; 
let generatedOTP = null;
let targetResetEmail = "";

// EmailJS Credentials
const EMAILJS_SERVICE_ID = "service_axxs1d6";
const EMAILJS_TEMPLATE_ID = "template_lyw27fu";
const EMAILJS_PUBLIC_KEY = "fpfhqXhDZbRehBJbL";

// DOM Elements
const tabSignup = document.getElementById("tab-signup");
const formLogin = document.getElementById("form-login");
const formSignup = document.getElementById("form-signup");
const rolePills = document.querySelectorAll(".role-pill");
const licenseWrapper = document.getElementById("license-wrapper");
const alertBox = document.getElementById("alert-box");

const googleAuthWrapper = document.getElementById("google-auth-wrapper");
const googleBtn = document.getElementById("google-signin-btn");

// Reset Modal Elements
const forgotPasswordBtn = document.getElementById("forgot-password-btn");
const resetModal = document.getElementById("reset-modal");
const closeResetModal = document.getElementById("close-reset-modal");

const step1Container = document.getElementById("step-1-container");
const step2Container = document.getElementById("step-2-container");

const formStep1 = document.getElementById("form-step-1");
const formStep2 = document.getElementById("form-step-2");

const resetEmail = document.getElementById("reset-email");
const otpCodeInput = document.getElementById("otp-code-input");
const newPasswordInput = document.getElementById("new-password-input");
const confirmPasswordInput = document.getElementById("confirm-password-input");

const step1Alert = document.getElementById("step1-alert");
const step2Alert = document.getElementById("step2-alert");

const recBox = document.getElementById("recommendation-box");
const recMessage = document.getElementById("rec-message");
const recDocBtn = document.getElementById("rec-doc-btn");
const recPatBtn = document.getElementById("rec-pat-btn");

function resetAlerts() {
    alertBox.className = "alert hidden";
    alertBox.textContent = "";
    step1Alert.className = "alert hidden";
    step2Alert.className = "alert hidden";
    recBox.classList.add("hidden");
}

function showAlert(msg, type = "error") {
    alertBox.textContent = msg;
    alertBox.className = `alert ${type}`;
}

const tabLogin = document.getElementById("tab-login");



// Nav Tab Switchers
tabLogin?.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    formLogin.classList.remove("hidden");
    formSignup.classList.add("hidden");
    resetAlerts();
});

tabSignup?.addEventListener("click", () => {
    if (activeRole === "ADMIN") return;

    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    formSignup.classList.remove("hidden");
    formLogin.classList.add("hidden");
    resetAlerts();
});

// Role Switcher
rolePills?.forEach(pill => {
    pill.addEventListener("click", (e) => {
        rolePills.forEach(p => p.classList.remove("active"));
        const selected = e.currentTarget;
        selected.classList.add("active");
        activeRole = selected.dataset.role;

        if (activeRole === "ADMIN") {
            tabSignup.classList.add("hidden");
            licenseWrapper.classList.add("hidden");
            googleAuthWrapper.classList.add("hidden");
            tabLogin.click();
        } else if (activeRole === "DOCTOR") {
            tabSignup.classList.remove("hidden");
            licenseWrapper.classList.remove("hidden");
            googleAuthWrapper.classList.remove("hidden");
        } else {
            tabSignup.classList.remove("hidden");
            licenseWrapper.classList.add("hidden");
            googleAuthWrapper.classList.remove("hidden");
        }

        resetAlerts();
    });
});

// ----------------------------------------------------
// IN-APP PASSWORD RESET (OTP FLOW)
// ----------------------------------------------------
forgotPasswordBtn?.addEventListener("click", () => {
    resetAlerts();
    const currentEmail = document.getElementById("login-email").value.trim();
    if (currentEmail) resetEmail.value = currentEmail;

    step1Container.classList.remove("hidden");
    step2Container.classList.add("hidden");
    resetModal.classList.remove("hidden");
});

closeResetModal?.addEventListener("click", () => {
    resetModal.classList.add("hidden");
});

// Step 1: Send OTP via EmailJS
formStep1?.addEventListener("submit", async (e) => {
    e.preventDefault();
    step1Alert.classList.add("hidden");

    targetResetEmail = resetEmail.value.trim().toLowerCase();

    if (!targetResetEmail) {
        step1Alert.textContent = "Please enter a valid email address.";
        step1Alert.className = "alert error";
        return;
    }

    try {
        // 1. Database User Verification
        const q = query(collection(db, "users"), where("email", "==", targetResetEmail));
        const snap = await getDocs(q);

        if (snap.empty) {
            step1Alert.textContent = "Is email se koi account nahi mila.";
            step1Alert.className = "alert error";
            return;
        }

        // 2. Generate Single OTP Code
        const currentOTP = Math.floor(100000 + Math.random() * 900000).toString();
        generatedOTP = currentOTP; 

        console.log("=== SENDING OTP TO EMAIL ===", currentOTP);

        // 3. Send Email via EmailJS
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: targetResetEmail,
            otp_code: currentOTP
        }, EMAILJS_PUBLIC_KEY);

        console.log("=== EMAIL SENT SUCCESSFULLY ===");

        // 4. Move to Step 2 UI
        step1Container.classList.add("hidden");
        step2Container.classList.remove("hidden");

        step2Alert.textContent = `Verification code sent to ${targetResetEmail}. Check your inbox!`;
        step2Alert.className = "alert success";

    } catch (err) {
        console.error("EmailJS or DB Error:", err);
        step1Alert.textContent = "Failed to send code: " + (err.message || "Error occurred.");
        step1Alert.className = "alert error";
    }
});

// Step 2: Verify Code and Update Password
formStep2?.addEventListener("submit", async (e) => {
    e.preventDefault();
    step2Alert.classList.add("hidden");

    const enteredOTP = otpCodeInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (enteredOTP !== generatedOTP) {
        step2Alert.textContent = "Galat 6-digit confirmation code enter kiya hai.";
        step2Alert.className = "alert error";
        return;
    }

    if (newPassword !== confirmPassword) {
        step2Alert.textContent = "New Password aur Confirm Password match nahi kar rahe.";
        step2Alert.className = "alert error";
        return;
    }

    try {
        step2Alert.textContent = "Password updated successfully! Redirecting to Sign In...";
        step2Alert.className = "alert success";

        setTimeout(() => {
            resetModal.classList.add("hidden");
            document.getElementById("login-email").value = targetResetEmail;
            document.getElementById("login-password").value = newPassword;
            showAlert("Password successfully updated. Sign in with your new password.", "success");
        }, 2000);

    } catch (err) {
        console.error(err);
        step2Alert.textContent = err.message;
        step2Alert.className = "alert error";
    }
});

// ----------------------------------------------------
// GOOGLE SIGN IN
// ----------------------------------------------------
googleBtn?.addEventListener("click", async () => {
    resetAlerts();

    if (activeRole === "ADMIN") {
        showAlert("Admin Google login is disabled.", "error");
        return;
    }

    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            const initialStatus = (activeRole === "DOCTOR") ? "PENDING" : "APPROVED";

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                fullName: user.displayName || "Google User",
                email: user.email,
                role: activeRole,
                status: initialStatus,
                licenseId: null,
                createdAt: new Date().toISOString()
            });

            if (activeRole === "DOCTOR") {
                await signOut(auth);
                showAlert("Google Registration Complete! Your Doctor account is pending approval.", "success");
                return;
            }
        }

        const dbSnap = await getDoc(userDocRef);
        const userData = dbSnap.data();

        if (userData.role !== activeRole) {
            await signOut(auth);
            showAlert(`This account is registered as ${userData.role}. Select the correct tab.`, "error");
            return;
        }

        if (userData.role === "DOCTOR" && userData.status === "PENDING") {
            await signOut(auth);
            showAlert("Your Doctor account is pending admin approval.", "warning");
            return;
        }

        if (userData.role === "DOCTOR") window.location.href = "doctor-dashboard.html";
        if (userData.role === "PATIENT") window.location.href = "patient-dashboard.html";

    } catch (err) {
        console.error(err);
        showAlert(err.message, "error");
    }
});

// ----------------------------------------------------
// EMAIL/PASSWORD LOGIN
// ----------------------------------------------------
formLogin?.addEventListener("submit", async (e) => {
    e.preventDefault();
    resetAlerts();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    try {
        const creds = await signInWithEmailAndPassword(auth, email, password);
        const user = creds.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
            await signOut(auth);
            showAlert("User record not found in database.", "error");
            return;
        }

        const userData = userDocSnap.data();

        if (activeRole === "DOCTOR") {
            if (userData.role !== "DOCTOR") {
                await signOut(auth);
                showAlert("This account is not registered as a Doctor.", "error");
                return;
            }

            if (userData.status === "PENDING") {
                await signOut(auth);
                showAlert("Your Doctor account is pending approval.", "warning");
                return;
            }

            if (userData.status === "REJECTED") {
                await signOut(auth);
                showAlert("Your Doctor registration was rejected.", "error");
                return;
            }

            window.location.href = "doctor-dashboard.html";

        } else if (activeRole === "PATIENT") {
            if (userData.role !== "PATIENT") {
                await signOut(auth);
                showAlert("This account is not registered as a Patient.", "error");
                return;
            }

            window.location.href = "patient-dashboard.html";

        } else if (activeRole === "ADMIN") {
            if (userData.role !== "ADMIN") {
                await signOut(auth);
                showAlert("Access Denied! You are not an Admin.", "error");
                return;
            }

            window.location.href = "./admin-dashbaord/admin.html";
        }

    } catch (err) {
        console.error(err);

        if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
            showAlert("Invalid email or password.", "error");

            try {
                const q = query(collection(db, "users"), where("email", "==", email));
                const snap = await getDocs(q);

                if (snap.empty && activeRole !== "ADMIN") {
                    recMessage.textContent = "Account not found. Would you like to register?";
                    recBox.classList.remove("hidden");
                }
            } catch (e) {
                console.error("Query Error:", e);
            }
        } else {
            showAlert(err.message, "error");
        }
    }
});

// ----------------------------------------------------
// EMAIL/PASSWORD SIGN UP
// ----------------------------------------------------
formSignup?.addEventListener("submit", async (e) => {
    e.preventDefault();
    resetAlerts();

    if (activeRole === "ADMIN") return;

    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const license = document.getElementById("signup-license").value.trim();

    if (activeRole === "DOCTOR" && !license) {
        showAlert("Medical License ID is required.", "error");
        return;
    }

    try {
        const creds = await createUserWithEmailAndPassword(auth, email, password);
        const user = creds.user;

        const initialStatus = (activeRole === "DOCTOR") ? "PENDING" : "APPROVED";

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            fullName: name,
            email: email,
            role: activeRole,
            status: initialStatus,
            licenseId: activeRole === "DOCTOR" ? license : null,
            createdAt: new Date().toISOString()
        });

        await signOut(auth);

        if (activeRole === "DOCTOR") {
            showAlert("Doctor registration submitted! Pending admin approval.", "success");
            tabLogin.click();
        } else {
            showAlert("Registration successful! You can now sign in.", "success");
            tabLogin.click();
        }

    } catch (err) {
        console.error(err);
        showAlert(err.message, "error");
    }
});

recDocBtn?.addEventListener("click", () => {
    activeRole = "DOCTOR";
    rolePills.forEach(p => p.classList.toggle("active", p.dataset.role === "DOCTOR"));
    tabSignup.classList.remove("hidden");
    licenseWrapper.classList.remove("hidden");
    googleAuthWrapper.classList.remove("hidden");
    tabSignup.click();
});

recPatBtn?.addEventListener("click", () => {
    activeRole = "PATIENT";
    rolePills.forEach(p => p.classList.toggle("active", p.dataset.role === "PATIENT"));
    tabSignup.classList.remove("hidden");
    licenseWrapper.classList.add("hidden");
    googleAuthWrapper.classList.remove("hidden");
    tabSignup.click();
});


// //// check ///////////

window?.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const activeTab = urlParams.get('tab');

    if (activeTab === 'signup') {
        // Agar signup ka kaha hai toh Register tab ko trigger kar do
        setTimeout(() => {
            if (tabSignup) tabSignup.click();
        }, 100);
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
            
            // Login / Auth portal par redirect kar dega
            window.location.replace("../authi.html"); 
        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout nahi ho saka: " + error.message);
        }
    });
}