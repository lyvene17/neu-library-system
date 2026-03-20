import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ── FIREBASE INIT ──
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
let filteredVisits = [];
let currentPage = 1;
const PAGE_SIZE = 15;
let deptChart, programChart, anDeptChart, purposePieChart, peakChart, dowChart;

const COLORS = ["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981","#06b6d4","#6366f1","#84cc16","#ef4444","#f97316"];

// ── AUTH GUARD ──
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "index.html"; return; }
  const adminSnap = await getDoc(doc(db, "admins", user.email));
  const isAdmin = adminSnap.exists() && adminSnap.data().isAdmin === true;
  if (!isAdmin && user.email !== "admin@neu.edu.ph") {
    alert("Access denied! Admins only.");
    window.location.href = "index.html";
    return;
  }
  lucide.createIcons();
  await loadVisits();
});

// ── LOAD VISITS ──
async function loadVisits() {
  const querySnapshot = await getDocs(collection(db, "visits"));
  allVisits = [];
  querySnapshot.forEach((d) => {
    const data = d.data();
    allVisits.push({
      name: data.name || "",
      email: data.email || "",
      department: data.college || "",
      course: data.course || "N/A",
      purpose: data.purposeOfVisit || "",
      visitorType: data.visitorType || "student",
      timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
    });
  });
  allVisits.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  filteredVisits = [...allVisits];
  renderDashboard(allVisits);
  renderLogTable(filteredVisits);
  renderUsers();
  renderAnalytics(allVisits);
}

// ── SIDEBAR / MAIN TAB SWITCH ──
window.switchMainTab = function(tab, el) {
  // Hide all sections
  document.querySelectorAll(".main-tab-content").forEach(c => c.classList.remove("active"));
  // Deactivate all nav items
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  // Show selected section
  document.getElementById(`tab-${tab}`).classList.add("active");
  // Activate clicked nav item
  el.classList.add("active");
  // Re-render icons (lucide needs this after DOM changes)
  lucide.createIcons();
  // If analytics tab, re-render charts
  if (tab === "analytics") renderAnalytics();
}

// ── ANALYTICS TAB SWITCH ──
window.switchAnalyticsTab = function(tab, event) {
  document.querySelectorAll("#tab-analytics .tab-trigger").forEach(t => t.classList.remove("active"));
  document.querySelectorAll("#tab-analytics .tab-content").forEach(c => c.classList.remove("active"));
  event.currentTarget.classList.add("active");
  document.getElementById(`an-${tab}`).classList.add("active");
  lucide.createIcons();
}

// ── DASHBOARD ──
function renderDashboard(filtered) {
  const total = filtered.length;
  const unique = new Set(filtered.map(v => v.email)).size;
  const today = new Date().toDateString();
  const todayCount = filtered.filter(v => new Date(v.timestamp).toDateString() === today).length;

  document.getElementById("stat-total").innerText = total;
  document.getElementById("stat-unique").innerText = unique;
  document.getElementById("stat-today").innerText = todayCount;
  document.getElementById("current-date").innerText = new Date().toLocaleDateString();

  // Dept chart
  const deptCounts = {};
  filtered.forEach(v => { deptCounts[v.department] = (deptCounts[v.department] || 0) + 1; });
  const ctx1 = document.getElementById("deptChart").getContext("2d");
  if (deptChart) deptChart.destroy();
  deptChart = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: Object.keys(deptCounts).map(k => k.replace("College of ", "").replace("School of ", "")),
      datasets: [{ label: "Visitors", data: Object.values(deptCounts), backgroundColor: "#3b82f6", borderRadius: 5 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: "#f1f5f9" }, beginAtZero: true } }
    }
  });

  // Program chart
  const progCounts = {};
  filtered.forEach(v => {
    if (v.course && v.course !== "N/A" && v.course !== "N/A (Employee)")
      progCounts[v.course] = (progCounts[v.course] || 0) + 1;
  });
  const ctx2 = document.getElementById("programChart").getContext("2d");
  if (programChart) programChart.destroy();
  programChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: Object.keys(progCounts),
      datasets: [{ label: "Visitors", data: Object.values(progCounts), backgroundColor: "#8b5cf6", borderRadius: 5 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: "#f1f5f9" }, beginAtZero: true } }
    }
  });

  // Quick stats
  const purposes = ["Study","Research","Borrow/Return Books","Use Computer","Student Lounge","Printing","Panata"];
  const grid = document.getElementById("quickStatsGrid");
  grid.innerHTML = purposes.map(p => {
    const count = filtered.filter(v => v.purpose === p).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `<div class="quick-stat-item">
      <p>${p}</p>
      <div class="qs-value">${count}</div>
      <div class="qs-pct">${pct}% of total</div>
    </div>`;
  }).join("");
}

// ── ANALYTICS ──
window.renderAnalytics = function(data) {
  const filter = document.getElementById("analyticsFilter")?.value || "month";
  const now = new Date();
  let start = new Date();
  if (filter === "week")    start.setDate(now.getDate() - 7);
  else if (filter === "month")   start.setMonth(now.getMonth() - 1);
  else if (filter === "quarter") start.setMonth(now.getMonth() - 3);
  else if (filter === "year")    start.setFullYear(now.getFullYear() - 1);

  const filtered = (data || allVisits).filter(v => new Date(v.timestamp) >= start);
  const total = filtered.length;
  const unique = new Set(filtered.map(v => v.email)).size;

  // Avg daily visits
  const days = {};
  filtered.forEach(v => {
    const d = new Date(v.timestamp).toLocaleDateString("en-US", { month:"short", day:"numeric" });
    days[d] = (days[d] || 0) + 1;
  });
  const dayCount = Object.keys(days).length;
  const avg = dayCount > 0 ? Math.round(total / dayCount) : 0;

  // Dept
  const deptCounts = {};
  filtered.forEach(v => { deptCounts[v.department] = (deptCounts[v.department] || 0) + 1; });
  const topCollege = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];

  document.getElementById("an-total").innerText = total;
  document.getElementById("an-unique").innerText = unique;
  document.getElementById("an-avg").innerText = avg;
  document.getElementById("an-top-college").innerText = topCollege ? topCollege[0].replace("College of ", "") : "—";
  document.getElementById("an-top-college-count").innerText = topCollege ? `${topCollege[1]} visits` : "";

  // Dept chart (analytics)
  const ctx2 = document.getElementById("anDeptChart").getContext("2d");
  if (anDeptChart) anDeptChart.destroy();
  const deptSorted = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
  anDeptChart = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: deptSorted.map(d => d[0].replace("College of ", "").replace("School of ", "")),
      datasets: [{ label: "Visitors", data: deptSorted.map(d => d[1]), backgroundColor: "#3b82f6", borderRadius: 5 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: { x: { grid: { color: "#f1f5f9" }, beginAtZero: true }, y: { grid: { display: false } } }
    }
  });

  // Purpose pie
  const purposeCounts = {};
  filtered.forEach(v => { purposeCounts[v.purpose] = (purposeCounts[v.purpose] || 0) + 1; });
  const ctx3 = document.getElementById("purposePieChart").getContext("2d");
  if (purposePieChart) purposePieChart.destroy();
  purposePieChart = new Chart(ctx3, {
    type: "doughnut",
    data: {
      labels: Object.keys(purposeCounts),
      datasets: [{ data: Object.values(purposeCounts), backgroundColor: COLORS, borderWidth: 2, borderColor: "#fff" }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { font: { size: 12 } } } }
    }
  });

  // Purpose breakdown bars
  const breakdown = document.getElementById("purposeBreakdown");
  breakdown.innerHTML = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1]).map(([name, val], i) => `
    <div class="purpose-item">
      <div class="purpose-item-header">
        <div style="display:flex; align-items:center;">
          <span class="purpose-dot" style="background:${COLORS[i % COLORS.length]}"></span>
          <span style="font-size:13px; font-weight:500;">${name}</span>
        </div>
        <span style="font-size:13px; font-weight:600;">${val}</span>
      </div>
      <div class="purpose-bar-bg">
        <div class="purpose-bar" style="width:${total > 0 ? (val / total * 100) : 0}%; background:${COLORS[i % COLORS.length]};"></div>
      </div>
    </div>
  `).join("");

  // Peak hours
  const hours = {};
  filtered.forEach(v => { const h = new Date(v.timestamp).getHours(); hours[h] = (hours[h] || 0) + 1; });
  const peakData = Array.from({ length: 24 }, (_, i) => ({
    hour: i < 12 ? `${i || 12}AM` : `${i === 12 ? 12 : i - 12}PM`,
    visits: hours[i] || 0
  }));
  const ctx4 = document.getElementById("peakHoursChart").getContext("2d");
  if (peakChart) peakChart.destroy();
  peakChart = new Chart(ctx4, {
    type: "bar",
    data: {
      labels: peakData.map(d => d.hour),
      datasets: [{ label: "Visits", data: peakData.map(d => d.visits), backgroundColor: "#8b5cf6", borderRadius: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: "#f1f5f9" }, beginAtZero: true } }
    }
  });

  // Day of week
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dowCounts = {};
  filtered.forEach(v => { const d = new Date(v.timestamp).getDay(); dowCounts[d] = (dowCounts[d] || 0) + 1; });
  const dowData = dayNames.map((n, i) => ({ name: n, visits: dowCounts[i] || 0 }));
  const ctx5 = document.getElementById("dayOfWeekChart").getContext("2d");
  if (dowChart) dowChart.destroy();
  dowChart = new Chart(ctx5, {
    type: "bar",
    data: {
      labels: dowData.map(d => d.name),
      datasets: [{ label: "Visits", data: dowData.map(d => d.visits), backgroundColor: "#10b981", borderRadius: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { grid: { color: "#f1f5f9" }, beginAtZero: true } }
    }
  });

  // Insights
  const busiest  = dowData.reduce((m, d) => d.visits > m.visits ? d : m, dowData[0]);
  const peakHour = peakData.reduce((m, h) => h.visits > m.visits ? h : m, peakData[0]);
  const topPurpose = Object.entries(purposeCounts).sort((a, b) => b[1] - a[1])[0];
  document.getElementById("insightsGrid").innerHTML = `
    <div class="insight-card insight-blue">
      <h4>Busiest Day</h4>
      <p class="insight-value">${busiest?.name || "—"}</p>
      <p class="insight-sub">${busiest?.visits || 0} visits</p>
    </div>
    <div class="insight-card insight-purple">
      <h4>Peak Hour</h4>
      <p class="insight-value">${peakHour?.hour || "—"}</p>
      <p class="insight-sub">Most popular time</p>
    </div>
    <div class="insight-card insight-green">
      <h4>Top Purpose</h4>
      <p class="insight-value">${topPurpose?.[0] || "—"}</p>
      <p class="insight-sub">${topPurpose?.[1] || 0} visits</p>
    </div>
    <div class="insight-card insight-orange">
      <h4>Leading College</h4>
      <p class="insight-value">${topCollege?.[0]?.replace("College of ", "") || "—"}</p>
      <p class="insight-sub">${topCollege?.[1] || 0} visits</p>
    </div>
  `;
}

// ── FILTER VISITS (Dashboard filters) ──
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
    const w = new Date(); w.setDate(now.getDate() - 7);
    filtered = allVisits.filter(v => new Date(v.timestamp) >= w);
  } else if (filter === "month") {
    const m = new Date(); m.setDate(now.getDate() - 30);
    filtered = allVisits.filter(v => new Date(v.timestamp) >= m);
  } else if (filter === "custom") {
    const s = document.getElementById("startDate").value;
    const e = document.getElementById("endDate").value;
    if (s && e) {
      const sd = new Date(s); const ed = new Date(e); ed.setHours(23, 59, 59);
      filtered = allVisits.filter(v => { const t = new Date(v.timestamp); return t >= sd && t <= ed; });
    }
  }

  if (purposeFilter) filtered = filtered.filter(v => v.purpose === purposeFilter);
  if (collegeFilter) filtered = filtered.filter(v => v.department === collegeFilter);
  if (visitorTypeFilter) filtered = filtered.filter(v => (v.visitorType || "student") === visitorTypeFilter);

  renderDashboard(filtered);
}

// ── LOG TABLE ──
function renderLogTable(data) {
  const isMobile = window.innerWidth <= 768;
  const body = document.getElementById("visitorLogsBody");
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginated = data.slice(start, start + PAGE_SIZE);

  document.getElementById("logCount").innerText = `${data.length} record${data.length !== 1 ? "s" : ""} found`;

  if (isMobile) {
    document.querySelector("#visitorTable thead").classList.add("desktop-table");
    body.innerHTML = paginated.map(log => `
      <tr>
        <td colspan="7" style="padding:0.5rem; border:none; background:transparent;">
          <div class="log-card">
            <div class="log-name">${log.name}</div>
            <div class="log-email">${log.email}</div>
            <div class="log-row">
              <span class="log-dept">${log.department}</span>
              <span class="badge">${log.purpose}</span>
            </div>
            <div class="log-row">
              <span class="log-dept">${log.course}</span>
              <span class="badge ${log.visitorType === 'employee' ? 'badge-employee' : 'badge-active'}">${log.visitorType === 'employee' ? 'Employee' : 'Student'}</span>
            </div>
            <div class="log-row">
              <span class="log-time">${new Date(log.timestamp).toLocaleString([], {month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
            </div>
          </div>
        </td>
      </tr>
    `).join("");
  } else {
    document.querySelector("#visitorTable thead").classList.remove("desktop-table");
    body.innerHTML = paginated.map(log => `
      <tr>
        <td style="font-weight:500">${log.name}</td>
        <td style="color:#64748b">${log.email}</td>
        <td>${log.department}</td>
        <td>${log.course}</td>
        <td><span class="badge">${log.purpose}</span></td>
        <td><span class="badge ${log.visitorType === 'employee' ? 'badge-employee' : 'badge-active'}">${log.visitorType === 'employee' ? 'Employee' : 'Student'}</span></td>
        <td style="color:#64748b">${new Date(log.timestamp).toLocaleString([], {month:"short",day:"numeric",year:"numeric",hour:"2-digit",minute:"2-digit"})}</td>
      </tr>
    `).join("");
  }

  renderPagination(data.length);
}

function renderPagination(total) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const bar = document.getElementById("pagination");
  if (totalPages <= 1) { bar.innerHTML = ""; return; }

  let btns = "";
  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    btns += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }

  bar.innerHTML = `
    <span>Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, total)} of ${total}</span>
    <div class="pagination-btns">
      <button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
      ${btns}
      <button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next</button>
    </div>
  `;
}

window.goToPage = function(page) {
  currentPage = page;
  renderLogTable(filteredVisits);
}

// ── SEARCH (Logs tab) ──
window.handleSearch = function() {
  const q = document.getElementById("logSearch").value.toLowerCase().trim();
  const timeF = document.getElementById("logTimeFilter").value;
  const purposeF = document.getElementById("logPurposeFilter").value;
  const now = new Date();
  let f = allVisits;

  if (timeF === "day") f = f.filter(v => new Date(v.timestamp).toDateString() === now.toDateString());
  else if (timeF === "week") { const w = new Date(); w.setDate(now.getDate() - 7); f = f.filter(v => new Date(v.timestamp) >= w); }
  else if (timeF === "month") { const m = new Date(); m.setDate(now.getDate() - 30); f = f.filter(v => new Date(v.timestamp) >= m); }

  if (purposeF) f = f.filter(v => v.purpose === purposeF);
  if (q) f = f.filter(v =>
    (v.name || "").toLowerCase().includes(q) ||
    (v.email || "").toLowerCase().includes(q) ||
    (v.department || "").toLowerCase().includes(q) ||
    (v.purpose || "").toLowerCase().includes(q) ||
    (v.course || "").toLowerCase().includes(q)
  );

  filteredVisits = f;
  currentPage = 1;
  renderLogTable(filteredVisits);
}

// ── USER TAB SWITCH ──
window.switchUserTab = function(tab, el) {
  document.querySelectorAll("#tab-users .tab-trigger").forEach(t => t.classList.remove("active"));
  document.querySelectorAll("#tab-users .tab-content").forEach(c => c.classList.remove("active"));
  el.classList.add("active");
  document.getElementById(`user-tab-${tab}`).classList.add("active");
  lucide.createIcons();
}

// ── USERS ──
async function renderUsers() {
  const body_active  = document.getElementById("activeUsersBody");
  const body_blocked = document.getElementById("blockedUsersBody");
  const uniqueUsers  = {};
  allVisits.forEach(v => { uniqueUsers[v.email] = v.name; });

  const users = Object.keys(uniqueUsers);
  const usersWithStatus = await Promise.all(users.map(async email => {
    const bd = await getDoc(doc(db, "blockedUsers", email));
    return { email, name: uniqueUsers[email], isBlocked: bd.exists() };
  }));

  const active  = usersWithStatus.filter(u => !u.isBlocked);
  const blocked = usersWithStatus.filter(u => u.isBlocked);

  document.getElementById("stat-total-users").innerText  = usersWithStatus.length;
  document.getElementById("stat-active-users").innerText = active.length;
  document.getElementById("stat-blocked-users").innerText = blocked.length;
  document.getElementById("activeUsersTitle").innerText  = `Active Users (${active.length})`;
  document.getElementById("blockedUsersTitle").innerText = `Blocked Users (${blocked.length})`;

  const isMobile = window.innerWidth <= 768;

  function userRow(user) {
    if (isMobile) {
      return `<tr><td colspan="4" style="padding:0.5rem; border:none; background:transparent;">
        <div class="user-card">
          <div class="user-info">
            <div class="user-name">${user.name}</div>
            <div class="user-email">${user.email}</div>
          </div>
          <div class="user-actions">
            <span class="badge ${user.isBlocked ? 'badge-blocked' : 'badge-active'}">${user.isBlocked ? 'Blocked' : 'Active'}</span>
            ${user.isBlocked
              ? `<button class="btn btn-success" onclick="unblockUser('${user.email}')">Unblock</button>`
              : `<button class="btn btn-danger"  onclick="blockUser('${user.email}')">Block</button>`}
          </div>
        </div>
      </td></tr>`;
    }
    return `<tr>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td><span class="badge ${user.isBlocked ? 'badge-blocked' : 'badge-active'}">${user.isBlocked ? 'Blocked' : 'Active'}</span></td>
      <td class="text-right">${user.isBlocked
        ? `<button class="btn btn-success" onclick="unblockUser('${user.email}')">Unblock</button>`
        : `<button class="btn btn-danger"  onclick="blockUser('${user.email}')">Block</button>`}</td>
    </tr>`;
  }

  body_active.innerHTML  = active.map(userRow).join("");
  body_blocked.innerHTML = blocked.map(userRow).join("");

  lucide.createIcons();
}

window.filterUsers = function() {
  const q = document.getElementById("userSearch").value.toLowerCase();
  document.querySelectorAll("#activeUsersBody tr, #blockedUsersBody tr").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(q) ? "" : "none";
  });
}

window.blockUser = async function(email) {
  if (!confirm(`Block ${email}?`)) return;
  await setDoc(doc(db, "blockedUsers", email), { blocked: true });
  await renderUsers();
}

window.unblockUser = async function(email) {
  if (!confirm(`Unblock ${email}?`)) return;
  await deleteDoc(doc(db, "blockedUsers", email));
  await renderUsers();
}