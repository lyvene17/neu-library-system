import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, addDoc, collection } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAD1nb7qoLpJG29VsNtKg3FnE5Egsz-9FY",
    authDomain: "neu-library-system-ffbc9.firebaseapp.com",
    projectId: "neu-library-system-ffbc9",
    storageBucket: "neu-library-system-ffbc9.firebasestorage.app",
    messagingSenderId: "46628933145",
    appId: "1:46628933145:web:d39bae791ef31360f22488"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const provider = new GoogleAuthProvider();
const db = getFirestore();

let currentUser = null;

window.login = function() {
    signInWithPopup(auth, provider)
    .then((result) => {
        const email = result.user.email;

        if (!email.endsWith("@neu.edu.ph")) {
            alert("Please use your NEU institutional email!");
            return;
        }

        if (email === "admin@neu.edu.ph") {
            window.location.href = "admin.html"; 
        } else {
            currentUser = result.user;
            document.getElementById("loginSection").style.display = "none";
            document.getElementById("visitForm").style.display = "block";
            document.getElementById("welcomeUser").innerText = "Logged in as: " + email;
        }
    })
    .catch((error) => {
        console.error(error);
        alert("Login failed: " + error.message);
    });
}

window.submitVisit = async function() {
    if (!currentUser) return;

    try {
        const purpose = document.getElementById("purpose").value;
        const college = document.getElementById("college").value;

        await addDoc(collection(db, "visits"), {
            name: currentUser.displayName,
            email: currentUser.email,
            purposeOfVisit: purpose,
            college: college,
            timestamp: new Date()
        });

        document.getElementById("successMessage").style.display = "block";
    } catch (e) {
        alert("Error saving visit: " + e.message);
    }
}