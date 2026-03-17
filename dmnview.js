import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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

let allVisits = [];
let deptChart, programChart;

// ------------------- Auth Guard -------------------
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const adminSnap = await getDoc(doc(db, "admins", user.email));
  const isAdmin = adminSnap.exists() && adminSnap.data().isAdmin === true;

  // Also allow admin@neu.edu.ph
  if (!isAdmin && user.email !== "admin@neu.edu.ph") {
    alert("Access denied! Admins only.");
    window.location.href = "index.html";
    return;
  }

  lucide.createIcons();
  await loadVisits();
});

// ------------------- Load Visits -------------------
async function loadVisits() {
  const querySnapshot = await getDocs(collection(db, "visits"));
  allVisits = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    allVisits.push({
      name: data.name,
      email: data.email,
      department: data.college,
      course: data.course || "N/A",
      purpose: data.purposeOfVisit,
      visitorType: data.visitorType || "student",
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
    });
  });
  allVisits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  renderLogs(allVisits);
  renderUsers();
  updateStats();
  generateCharts();
}

// ------------------- Stats -------------------
function updateStats(filtered = allVisits) {
  const total = filtered.length;
  const uniqueUsers = new Set(filtered.map(v => v.email)).size;
  const today = new Date().toDateString();
  const todayVisits = filtered.filter(v => new Date(v.timestamp).toDateString() === today).length;

  document.getElementById("stat-total").innerText = total;
  document.getElementById("stat-unique").innerText = uniqueUsers;
  document.getElementById("stat-today").innerText = todayVisits;
  document.getElementById("current-date").innerText = new Date().toLocaleDateString();
}

// ------------------- Render Logs -------------------
function renderLogs(data) {
  const body = document.getElementById("visitorLogsBody");
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    body.innerHTML = data.map(log => `
      <tr class="mobile-card-row">
        <td colspan="7" style="padding:0.5rem; border:none; background:transparent;">
          <div class="log-card">
            <div class="log-name">${log.name}</div>
            <div class="log-email">${log.email}</div>
            <div class="log-row">
              <span class="log-dept">${log.department}</span>
              <span class="badge">${log.purpose}</span>
            </div>
            <div class="log-row">
              <span class="log-dept">${log.course || "N/A"}</span>
              <span class="badge ${log.visitorType === 'employee' ? 'badge-blocked' : 'badge-active'}">
                ${log.visitorType === 'employee' ? 'Employee' : 'Student'}
              </span>
            </div>
            <div class="log-row">
              <span class="log-time">${new Date(log.timestamp).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</span>
            </div>
          </div>
        </td>
      </tr>
    `).join("");
    document.querySelector("#visitorTable thead").classList.add("desktop-table");
  } else {
    document.querySelector("#visitorTable thead").classList.remove("desktop-table");
    body.innerHTML = data.map(log => `
      <tr>
        <td style="font-weight:500">${log.name}</td>
        <td style="color:#6b7280">${log.email}</td>
        <td>${log.department}</td>
        <td>${log.course || "N/A"}</td>
        <td><span class="badge">${log.purpose}</span></td>
        <td><span class="badge ${log.visitorType === 'employee' ? 'badge-blocked' : 'badge-active'}">${log.visitorType === 'employee' ? 'Employee' : 'Student'}</span></td>
        <td style="color:#6b7280">${new Date(log.timestamp).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</td>
      </tr>
    `).join("");
  }
}

// ------------------- Render Users -------------------
function renderUsers() {
  const body = document.getElementById("userListBody");
  const uniqueUsers = {};
  allVisits.forEach(v => { uniqueUsers[v.email] = v.name; });

  const users = Object.keys(uniqueUsers);
  const isMobile = window.innerWidth <= 768;

  Promise.all(users.map(async email => {
    const blockedDoc = await getDoc(doc(db, "blockedUsers", email));
    const isBlocked = blockedDoc.exists();
    return { email, name: uniqueUsers[email], isBlocked };
  })).then(usersWithStatus => {
    if (isMobile) {
      document.querySelector("#users-tab thead").classList.add("desktop-table");
      body.innerHTML = usersWithStatus.map(user => `
        <tr>
          <td colspan="4" style="padding:0.5rem; border:none; background:transparent;">
            <div class="user-card">
              <div class="user-info">
                <div class="user-name">${user.name}</div>
                <div class="user-email">${user.email}</div>
              </div>
              <div class="user-actions">
                <span class="badge ${user.isBlocked ? 'badge-blocked' : 'badge-active'}">
                  ${user.isBlocked ? 'Blocked' : 'Active'}
                </span>
                ${user.isBlocked
                  ? `<button class="btn btn-success" onclick="unblockUser('${user.email}')">Unblock</button>`
                  : `<button class="btn btn-danger" onclick="blockUser('${user.email}')">Block</button>`
                }
              </div>
            </div>
          </td>
        </tr>
      `).join("");
    } else {
      document.querySelector("#users-tab thead").classList.remove("desktop-table");
      body.innerHTML = usersWithStatus.map(user => `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>
            <span class="badge ${user.isBlocked ? 'badge-blocked' : 'badge-active'}">
              ${user.isBlocked ? 'Blocked' : 'Active'}
            </span>
          </td>
          <td class="text-right">
            ${user.isBlocked
              ? `<button class="btn btn-success" onclick="unblockUser('${user.email}')">Unblock</button>`
              : `<button class="btn btn-danger" onclick="blockUser('${user.email}')">Block</button>`
            }
          </td>
        </tr>
      `).join("");
    }
  });
}

// ------------------- Block / Unblock -------------------
window.blockUser = async function(email) {
  await setDoc(doc(db, "blockedUsers", email), { blocked: true });
  alert("User blocked!");
  renderUsers();
}

window.unblockUser = async function(email) {
  await deleteDoc(doc(db, "blockedUsers", email));
  alert("User unblocked!");
  renderUsers();
}

// ------------------- Search -------------------
window.handleSearch = function() {
  const q = document.getElementById("logSearch").value.toLowerCase().trim();
  const filter = document.getElementById("timeFilter").value;
  const purposeFilter = document.getElementById("purposeFilter")?.value;
  const collegeFilter = document.getElementById("collegeFilter")?.value;
  const visitorTypeFilter = document.getElementById("visitorTypeFilter")?.value;
  const now = new Date();
  let filtered = allVisits;

  if (filter === "day") {
    filtered = allVisits.filter(v => new Date(v.timestamp).toDateString() === now.toDateString());
  } else if (filter === "week") {
    const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
    filtered = allVisits.filter(v => new Date(v.timestamp) >= weekAgo);
  } else if (filter === "month") {
    const monthAgo = new Date(); monthAgo.setDate(now.getDate() - 30);
    filtered = allVisits.filter(v => new Date(v.timestamp) >= monthAgo);
  }

  if (purposeFilter) filtered = filtered.filter(v => v.purpose === purposeFilter);
  if (collegeFilter) filtered = filtered.filter(v => v.department === collegeFilter);
  if (visitorTypeFilter) filtered = filtered.filter(v => (v.visitorType || "student") === visitorTypeFilter);

  if (q) {
    filtered = filtered.filter(v =>
      (v.name || "").toLowerCase().includes(q) ||
      (v.email || "").toLowerCase().includes(q) ||
      (v.department || "").toLowerCase().includes(q) ||
      (v.purpose || "").toLowerCase().includes(q) ||
      (v.course || "").toLowerCase().includes(q) ||
      (v.visitorType || "").toLowerCase().includes(q)
    );
  }

  renderLogs(filtered);
}

// ------------------- Tab Switch -------------------
window.switchTab = function(tab, event) {
  document.querySelectorAll(".tab-trigger").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  event.currentTarget.classList.add("active");
  document.getElementById(`${tab}-tab`).classList.add("active");
}

// ------------------- Charts -------------------
function generateCharts(filtered = allVisits) {
  const deptCounts = {};
  const courseCounts = {};
  filtered.forEach(v => {
    deptCounts[v.department] = (deptCounts[v.department] || 0) + 1;
    if (v.course && v.course !== "N/A" && v.course !== "N/A (Employee)") {
      courseCounts[v.course] = (courseCounts[v.course] || 0) + 1;
    }
  });
  createDeptChart(deptCounts);
  createProgramChart(courseCounts);
}

function createDeptChart(data) {
  const ctx = document.getElementById("deptChart").getContext("2d");
  if (deptChart) deptChart.destroy();
  deptChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [{ label: "Visitors", data: Object.values(data), backgroundColor: "#3b82f6" }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function createProgramChart(data) {
  const ctx = document.getElementById("purposeChart").getContext("2d");
  if (programChart) programChart.destroy();
  programChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(data),
      datasets: [{ label: "Visitors", data: Object.values(data), backgroundColor: "#8b5cf6" }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// ------------------- Filter Visits -------------------
window.filterVisits = function() {
  const filter = document.getElementById("timeFilter").value;
  const purposeFilter = document.getElementById("purposeFilter")?.value;
  const collegeFilter = document.getElementById("collegeFilter")?.value;
  const visitorTypeFilter = document.getElementById("visitorTypeFilter")?.value;
  const now = new Date();
  let filtered = allVisits;

  const customRange = document.getElementById("customRange");
  customRange.style.display = filter === "custom" ? "flex" : "none";

  if (filter === "day") {
    filtered = allVisits.filter(v => new Date(v.timestamp).toDateString() === now.toDateString());
  } else if (filter === "week") {
    const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7);
    filtered = allVisits.filter(v => new Date(v.timestamp) >= weekAgo);
  } else if (filter === "month") {
    const monthAgo = new Date(); monthAgo.setDate(now.getDate() - 30);
    filtered = allVisits.filter(v => new Date(v.timestamp) >= monthAgo);
  } else if (filter === "custom") {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59);
      filtered = allVisits.filter(v => {
        const t = new Date(v.timestamp);
        return t >= startDate && t <= endDate;
      });
    }
  }

  if (purposeFilter) filtered = filtered.filter(v => v.purpose === purposeFilter);
  if (collegeFilter) filtered = filtered.filter(v => v.department === collegeFilter);
  if (visitorTypeFilter) filtered = filtered.filter(v => (v.visitorType || "student") === visitorTypeFilter);

  renderLogs(filtered);
  generateCharts(filtered);
  updateStats(filtered);
}