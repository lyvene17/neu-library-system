import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Firebase config
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
const auth = getAuth();
const provider = new GoogleAuthProvider();
const db = getFirestore();

let currentUser = null;

// LOGIN
window.login = function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const email = result.user.email;

      if (!email.endsWith("@neu.edu.ph")) {
        alert("Institutional email required!");
        return;
      }

      if (email === "admin@neu.edu.ph") {
        window.location.href = "admin.html"; 
      } else {
        currentUser = result.user;
        document.getElementById("loginSection").style.display = "none";
        document.getElementById("visitForm").style.display = "block";
      }
    })
    .catch((error) => {
      console.log(error);
      alert("Login error: " + error.message);
    });
}

// SUBMIT VISIT
window.submitVisit = async function() {
  if (!currentUser) {
    alert("You must log in first!");
    return;
  }

  try {
    const purpose = document.getElementById("purpose").value;
    const college = document.getElementById("college").value;

    await addDoc(collection(db, "visits"), {
      email: currentUser.email,
      purposeOfVisit: purpose,
      college: college,
      timestamp: new Date()
    });

    document.getElementById("successMessage").style.display = "block";
  } catch (e) {
    console.error("Error adding document: ", e);
    alert("Database error: " + e.message);
  }
}