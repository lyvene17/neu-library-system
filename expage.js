import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
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
const googleProvider = new GoogleAuthProvider();

let currentUser = null;

const courseMap = {
  "College of Accountancy": ["BS Accountancy", "BS Accounting Information System"],
  "College of Agriculture": ["BS Agriculture"],
  "College of Arts and Sciences": ["BA Economics", "BS Psychology", "BA Public Administration", "BS Biology", "AB Political Science"],
  "College of Business Administration": ["BS Real Estate Management", "BSBA Marketing Management", "BSBA Human Resource Development and Management", "BSBA Legal Management", "BS Entrepreneurship", "BSBA Financial Management"],
  "College of Communication": ["BA Communication", "BA Broadcasting", "BA Journalism"],
  "College of Informatics and Computing Studies": ["Bachelor of Library Information Science", "BS Information Technology", "BS Information Systems", "BSEMC Game Development", "BSEMC Digital Animation", "BS Computer Science"],
  "College of Criminology": ["BS Criminology"],
  "College of Education": ["BSEd Filipino", "BSEd Mathematics", "BSEd Biological Sciences", "BSEd Physical Sciences", "BEEd General Sciences", "BEEd Special Education", "BEEd Content Courses", "BSEd Technology and Livelihood Education", "BEEd Pre-School Education", "BSEd MAPE", "BSEd English", "BSEd Social Studies"],
  "College of Engineering and Architecture": ["BS Astronomy", "BS Industrial Engineering", "BS Mechanical Engineering", "BS Architecture", "BS Electronics Engineering", "BS Electrical Engineering", "BS Civil Engineering"],
  "School of International Relations": ["BA Foreign Service"],
  "College of Law": ["Law"],
  "College of Medical Technology": ["BS Medical Technology"],
  "College of Medicine": ["Medicine"],
  "College of Midwifery": ["BS Midwifery"],
  "College of Music": ["Music Preparatory and Extended Studies", "BM Choral Conducting", "BM Piano", "BM Voice", "BM Music Education"],
  "College of Nursing": ["BS Nursing"],
  "College of Physical Therapy": ["BS Physical Therapy"],
  "College of Respiratory Therapy": ["BS Respiratory Therapy"],
};

window.updateCourses = function() {
  const college = document.getElementById("college").value;
  const courseSelect = document.getElementById("course");
  courseSelect.innerHTML = "";
  const programs = courseMap[college] || [];
  if (programs.length === 0) {
    courseSelect.innerHTML = `<option value="">-- No programs found --</option>`;
    return;
  }
  programs.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    courseSelect.appendChild(opt);
  });
};

window.updateVisitorType = function() {
  const type = document.getElementById("visitorType").value;
  const collegeLabel = document.getElementById("collegeLabel");
  const courseField = document.getElementById("courseField");
  const studentFields = document.getElementById("studentFields");

  studentFields.style.display = "block";

  if (type === "employee") {
    collegeLabel.textContent = "Department";
    courseField.style.display = "none";
  } else {
    collegeLabel.textContent = "College";
    courseField.style.display = "block";
  }
};

function updateStatusMsg(id, msg, show) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = show ? "block" : "none"; }
}

function showError(msg) {
  updateStatusMsg("errorMsg", msg, true);
  updateStatusMsg("successMsg", "", false);
}

function showSuccess(msg) {
  updateStatusMsg("successMsg", msg, true);
  updateStatusMsg("errorMsg", "", false);
}

async function handleUserAfterLogin(user) {
  const email = user.email;

  const blockedSnap = await getDoc(doc(db, "blockedUsers", email));
  if (blockedSnap.exists()) {
    showError("You are blocked from accessing the library.");
    await signOut(auth);
    return;
  }

  const adminSnap = await getDoc(doc(db, "admins", email));
  const isAdmin = adminSnap.exists() && adminSnap.data().isAdmin === true;

  if (isAdmin) {
    currentUser = user;
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("roleCard").style.display = "block";
  } else {
    currentUser = user;
    document.getElementById("loginCard").style.display = "none";
    document.getElementById("visitForm").style.display = "block";
  }
}

window.proceedAsUser = function() {
  document.getElementById("roleCard").style.display = "none";
  document.getElementById("visitForm").style.display = "block";
};

window.proceedAsAdmin = function() {
  window.location.href = "admin.html";
};

document.addEventListener("DOMContentLoaded", () => {

  window.toggleForm = function(type) {
    const signIn = document.getElementById("signInForm");
    const register = document.getElementById("registerForm");
    updateStatusMsg("errorMsg", "", false);
    updateStatusMsg("successMsg", "", false);
    if (type === "register" && register && signIn) {
      signIn.style.display = "none";
      register.style.display = "block";
    } else if (signIn && register) {
      register.style.display = "none";
      signIn.style.display = "block";
    }
  };

  window.handleGoogleLogin = async function() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const email = result.user.email;
      if (!email.endsWith("@neu.edu.ph")) {
        showError("Only @neu.edu.ph emails are allowed.");
        await signOut(auth);
        return;
      }
      await handleUserAfterLogin(result.user);
    } catch (err) {
      showError("Google login failed: " + err.message);
    }
  };

  window.handleLogin = async function() {
    const email = document.getElementById("loginEmail")?.value.trim();
    const password = document.getElementById("loginPassword")?.value;
    const enteredName = document.getElementById("loginName")?.value.trim();

    if (!email || !email.endsWith("@neu.edu.ph")) {
      showError("Only @neu.edu.ph emails are allowed.");
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      currentUser = result.user;
      if (enteredName) await updateProfile(currentUser, { displayName: enteredName });
      await handleUserAfterLogin(currentUser);
    } catch (err) {
      const msgs = {
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-credential": "Incorrect login details.",
        "auth/user-not-found": "No account found. Please register.",
        "auth/too-many-requests": "Too many attempts. Wait a bit."
      };
      showError(msgs[err.code] || "Error: " + err.message);
    }
  };

  window.handleRegister = async function() {
    const email = document.getElementById("regEmail")?.value.trim();
    const password = document.getElementById("regPassword")?.value;
    const confirm = document.getElementById("regConfirm")?.value;

    if (!email || !email.endsWith("@neu.edu.ph")) {
      showError("Only @neu.edu.ph emails are allowed.");
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
      showError(err.code === "auth/email-already-in-use" ? "Email already registered." : "Error: " + err.message);
    }
  };

  window.submitVisit = async function() {
    if (!currentUser) return alert("Please log in first!");

    const purpose = document.getElementById("purpose")?.value;
    const visitorType = document.getElementById("visitorType")?.value;
    const college = document.getElementById("college")?.value;
    const course = visitorType === "employee" 
      ? "N/A (Employee)" 
      : document.getElementById("course")?.value;

    const collegeLabel = document.getElementById("collegeLabel");
    const courseField = document.getElementById("courseField");

    if (!college) { alert("Please select a college/department."); return; }
    if (visitorType === "student" && !course) { alert("Please select a course."); return; }

    try {
      await addDoc(collection(db, "visits"), {
        name: currentUser.displayName || currentUser.email,
        email: currentUser.email,
        college: college,
        course: course,
        purposeOfVisit: purpose,
        visitorType: visitorType,
        timestamp: new Date()
      });

      const successEl = document.getElementById("successMessage");
      if (successEl) {
        successEl.style.display = "block";
        setTimeout(() => { successEl.style.display = "none"; }, 3000);
      }

      // Reset form
      document.getElementById("purpose").selectedIndex = 0;
      document.getElementById("visitorType").selectedIndex = 0;
      document.getElementById("college").selectedIndex = 0;
      document.getElementById("course").innerHTML = `<option value="">-- Select College First --</option>`;
      collegeLabel.textContent = "College";
      courseField.style.display = "block";

    } catch (err) {
      alert("Database Error: " + err.message);
    }
  };

});