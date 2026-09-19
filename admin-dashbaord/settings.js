import { auth, db } from "./firebase.config.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
            console.log("Admin verified for Settings.");
        }
    } catch (err) {
        console.error("Security check error:", err);
        window.location.replace("../errorpage/errpage.html");
    }
});

// ================= LOAD SETTINGS FROM FIRESTORE =================
async function loadSettings() {
    try {
        const docRef = doc(db, "systemSettings", "hospitalConfig");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            if (document.getElementById('hospitalAddress')) {
                document.getElementById('hospitalAddress').value = data.address || '';
                document.getElementById('baseCurrency').value = data.currency || 'PKR';
                document.getElementById('taxPercentage').value = data.tax || 5;
                
                if (document.getElementById('smsNotifToggle')) document.getElementById('smsNotifToggle').checked = data.smsNotif ?? true;
                if (document.getElementById('emailNotifToggle')) document.getElementById('emailNotifToggle').checked = data.emailNotif ?? true;
                if (document.getElementById('twoFaToggle')) {
                    const twoFa = data.twoFa ?? false;
                    document.getElementById('twoFaToggle').checked = twoFa;
                    if (twoFa) document.getElementById('twoFaDetailsBox').classList.remove('d-none');
                }

                if (data.logoUrl && document.getElementById('logoPreview')) {
                    document.getElementById('logoPreview').src = data.logoUrl;
                }

                if (data.helplines && Array.isArray(data.helplines)) {
                    const list = document.getElementById('helplineList');
                    list.innerHTML = '';
                    data.helplines.forEach(number => {
                        const div = document.createElement('div');
                        div.className = 'helpline-row';
                        div.innerHTML = `
                            <input type="text" class="form-control rounded-pill px-3 helpline-input" value="${number}" placeholder="+92 300 0000000">
                            <button type="button" class="helpline-remove-btn" onclick="removeHelplineRow(this)" title="Remove"><i class="fa-solid fa-xmark"></i></button>
                        `;
                        list.appendChild(div);
                    });
                }
            }
        }
    } catch (err) {
        console.error("Settings load karne mein error aaya:", err);
    }
}

let uploadedLogoBase64 = null;

// settings.js ke andar is tarah define karein:
window.previewLogo = function(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('logoPreview').src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

// ================= SAVE HOSPITAL CONFIGURATION =================
window.handleHospitalConfigSubmit = async function(form) {
    const address = document.getElementById('hospitalAddress').value;
    const currency = document.getElementById('baseCurrency').value;

    const helplineInputs = document.querySelectorAll('.helpline-input');
    const helplines = Array.from(helplineInputs).map(input => input.value.trim()).filter(Boolean);

    const payload = {
        address: address,
        currency: currency,
        helplines: helplines,
        updatedAt: new Date()
    };

    if (uploadedLogoBase64) {
        payload.logoUrl = uploadedLogoBase64;
    }

    try {
        await setDoc(doc(db, "systemSettings", "hospitalConfig"), payload, { merge: true });
        showSettingsToast("Hospital configuration successfully save ho gayi!");
    } catch (err) {
        console.error("Error saving config:", err);
        alert("Configuration save karne mein masla ho gaya.");
    }
};

// ================= SAVE SYSTEM PREFERENCES =================
window.handleSecuritySubmit = async function(form) {
    const tax = document.getElementById('taxPercentage').value;
    const smsNotif = document.getElementById('smsNotifToggle').checked;
    const emailNotif = document.getElementById('emailNotifToggle').checked;
    const twoFa = document.getElementById('twoFaToggle').checked;

    try {
        await setDoc(doc(db, "systemSettings", "hospitalConfig"), {
            tax: tax,
            smsNotif: smsNotif,
            emailNotif: emailNotif,
            twoFa: twoFa,
            updatedAt: new Date()
        }, { merge: true });

        showSettingsToast("System preferences successfully update ho gayin!");
    } catch (err) {
        console.error("System settings error:", err);
        alert("Error: " + err.message);
    }
};

// ================= HELPER FUNCTIONS =================
window.addHelplineRow = function() {
    const list = document.getElementById('helplineList');
    const div = document.createElement('div');
    div.className = 'helpline-row';
    div.innerHTML = `
        <input type="text" class="form-control rounded-pill px-3 helpline-input" placeholder="+92 300 0000000">
        <button type="button" class="helpline-remove-btn" onclick="removeHelplineRow(this)" title="Remove"><i class="fa-solid fa-xmark"></i></button>
    `;
    list.appendChild(div);
};

window.removeHelplineRow = function(btn) {
    const row = btn.closest('.helpline-row');
    if (row) row.remove();
};

window.toggle2FA = function(checkbox) {
    const box = document.getElementById('twoFaDetailsBox');
    if (checkbox.checked) {
        box.classList.remove('d-none');
    } else {
        box.classList.add('d-none');
    }
};

function showSettingsToast(text) {
    const toast = document.getElementById('settingsSavedToast');
    const toastText = document.getElementById('settingsSavedToastText');
    if (toast && toastText) {
        toastText.textContent = text;
        toast.classList.remove('d-none');
        setTimeout(() => {
            toast.classList.add('d-none');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
});



// ===================== HOSPITAL LOGO LOCALSTORAGE PERSISTENCE =====================

// 1. Page load hote hi agar localStorage mein hospital logo save hai toh show kar dein
document.addEventListener('DOMContentLoaded', () => {
  const savedLogo = localStorage.getItem('hospitalLogo');
  if (savedLogo) {
    const logoPreview = document.getElementById('logoPreview');
    if (logoPreview) {
      logoPreview.src = savedLogo;
    }
  }
});

// 2. Logo select hone par FileReader se base64 banakar localStorage mein save karna
window.previewLogo = function(input) {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64Image = e.target.result;
      
      // LocalStorage mein save karein
      localStorage.setItem('hospitalLogo', base64Image);

      // Preview image update karein
      const logoPreview = document.getElementById('logoPreview');
      if (logoPreview) {
        logoPreview.src = base64Image;
      }
    };
    reader.readAsDataURL(file);
  }
};