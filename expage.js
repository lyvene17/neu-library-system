import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
  getFirestore, 
  addDoc, 
  collection, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAD1nb7qoLpJG29VsNtKg3FnE5Egsz-9FY",
  authDomain: "neu-library-system-ffbc9.firebaseapp.com",
  projectId: "neu-library-system-ffbc9",
  storageBucket: "neu-library-system-ffbc9.firebasestorage.app",
  messagingSenderId: "46628933145",
  appId: "1:46628933145:web:d39bae791ef31360f22488",
  measurementId: "G-D8XFWJRD9L"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

function showError(msg) {
  const el = document.getElementById("errorMsg");
  const ok = document.getElementById("successMsg");
  ok.style.display = "none";
  el.textContent = msg;
  el.style.display = "block";
}

function showSuccess(msg) {
  const el = document.getElementById("successMsg");
  const err = document.getElementById("errorMsg");
  err.style.display = "none";
  el.textContent = msg;
  el.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {

  // ------------------- TOGGLE FORMS -------------------
  window.toggleForm = function(type) {
    document.getElementById("errorMsg").style.display = "none";
    document.getElementById("successMsg").style.display = "none";
    if (type === "register") {
      document.getElementById("signInForm").style.display = "none";
      document.getElementById("registerForm").style.display = "block";
    } else {
      document.getElementById("registerForm").style.display = "none";
      document.getElementById("signInForm").style.display = "block";
    }
  };

  // ------------------- REGISTER -------------------
  window.handleRegister = async function() {
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const confirm = document.getElementById("regConfirm").value;

    if (!email.endsWith("@neu.edu.ph")) {
      showError("Only @neu.edu.ph emails are allowed.");
      return;
    }
    if (email === "admin@neu.edu.ph") {
      showError("This email cannot be registered.");
      return;
    }
    if (password.length < 6) {
      showError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      showError("Passwords do not match.");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      showSuccess("Account created! You can now sign in.");
      toggleForm("login");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        showError("Email already registered. Please sign in.");
      } else {
        showError("Error: " + err.message);
      }
    }
  };

  // ------------------- SIGN IN -------------------
  window.handleLogin = async function() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email.endsWith("@neu.edu.ph")) {
      showError("Only @neu.edu.ph emails are allowed.");
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      currentUser = result.user;

      // Admin → dashboard
      if (email === "admin@neu.edu.ph") {
        window.location.href = "admin.html";
        return;
      }

      // Check if blocked
      const blockedSnap = await getDoc(doc(db, "blockedUsers", email));
      if (blockedSnap.exists()) {
        showError("You are blocked from accessing the library.");
        await auth.signOut();
        return;
      }

      // Student → check-in form
      document.getElementById("loginCard").style.display = "none";
      document.getElementById("visitForm").style.display = "block";

    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        showError("Incorrect password. Please try again.");
      } else if (err.code === "auth/user-not-found") {
        showError("No account found. Please register first.");
      } else if (err.code === "auth/too-many-requests") {
        showError("Too many attempts. Please wait a few minutes.");
      } else {
        showError("Error: " + err.message);
      }
    }
  };

  // ------------------- CHECK-IN -------------------
  window.submitVisit = async function() {
    if (!currentUser) {
      alert("You must log in first!");
      return;
    }

    const purpose = document.getElementById("purpose").value;
    const college = document.getElementById("college").value;

    try {
      await addDoc(collection(db, "visits"), {
        name: currentUser.displayName || currentUser.email,
        email: currentUser.email,
        college: college,
        purposeOfVisit: purpose,
        timestamp: new Date()
      });

      const successEl = document.getElementById("successMessage");
      successEl.style.display = "block";
      setTimeout(() => { successEl.style.display = "none"; }, 3000);

      document.getElementById("purpose").selectedIndex = 0;
      document.getElementById("college").selectedIndex = 0;

    } catch (err) {
      alert("Database Error: " + err.message);
    }
  };

});