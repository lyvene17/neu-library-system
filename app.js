import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

import {
getAuth,
GoogleAuthProvider,
signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

import {
getFirestore,
addDoc,
collection,
getDocs,
doc,
setDoc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {

apiKey: "AIzaSyAD1nb7qoLpJG29VsNtKg3FnE5Egsz-9FY",
authDomain: "neu-library-system-ffbc9.firebaseapp.com",
projectId: "neu-library-system-ffbc9",
storageBucket: "neu-library-system-ffbc9.firebasestorage.app",
messagingSenderId: "46628933145",
appId: "1:46628933145:web:d39bae791ef31360f22488"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const provider = new GoogleAuthProvider();

const db = getFirestore(app);

let currentUser=null;
let allVisits=[];

window.login = async function(){

const result = await signInWithPopup(auth,provider);

const email = result.user.email;

currentUser=result.user;

if(email==="[admin@neu.edu.ph](mailto:admin@neu.edu.ph)"){

document.getElementById("loginCard").style.display="none";
document.getElementById("adminDashboard").style.display="block";

loadVisits();

return;

}

const blockedRef = doc(db,"blockedUsers",email);
const blockedSnap = await getDoc(blockedRef);

if(blockedSnap.exists()){
alert("You are blocked");
return;
}

document.getElementById("loginCard").style.display="none";
document.getElementById("visitForm").style.display="block";

}

window.submitVisit = async function(){

const purpose=document.getElementById("purpose").value;
const college=document.getElementById("college").value;

await addDoc(collection(db,"visits"),{

name:currentUser.displayName,
email:currentUser.email,
college:college,
purposeOfVisit:purpose,
timestamp:new Date()

});

document.getElementById("successMessage").style.display="block";

}

async function loadVisits(){

const snapshot = await getDocs(collection(db,"visits"));

allVisits=[];

snapshot.forEach(doc=>{

const data=doc.data();

allVisits.push({

name:data.name,
email:data.email,
department:data.college,
purpose:data.purposeOfVisit,
timestamp:data.timestamp.toDate()

});

});

renderLogs(allVisits);
renderUsers();
updateStats();
generateCharts();

}

function renderLogs(data){

const body=document.getElementById("visitorLogsBody");

body.innerHTML=data.map(v=>`

<tr>
<td>${v.name}</td>
<td>${v.email}</td>
<td>${v.department}</td>
<td>${v.purpose}</td>
<td>${new Date(v.timestamp).toLocaleTimeString()}</td>
</tr>

`).join("");

}

function renderUsers(){

const body=document.getElementById("userListBody");

const unique={};

allVisits.forEach(v=>{

unique[v.email]=v.name;

});

const users=Object.keys(unique);

body.innerHTML=users.map(email=>`

<tr>
<td>${unique[email]}</td>
<td>${email}</td>
<td>Active</td>
<td><button onclick="blockUser('${email}')">Block</button></td>
</tr>

`).join("");

}

window.blockUser = async function(email){

await setDoc(doc(db,"blockedUsers",email),{

blocked:true

});

alert("User Blocked");

}

function updateStats(){

const total=allVisits.length;

const uniqueUsers=new Set(allVisits.map(v=>v.email)).size;

const today=new Date().toDateString();

const todayVisits=allVisits.filter(v=>
new Date(v.timestamp).toDateString()===today
).length;

document.getElementById("stat-total").innerText=total;

document.getElementById("stat-unique").innerText=uniqueUsers;

document.getElementById("stat-today").innerText=todayVisits;

}

window.handleSearch=function(){

const q=document.getElementById("logSearch").value.toLowerCase();

const filtered=allVisits.filter(v=>

v.name.toLowerCase().includes(q) ||
v.email.toLowerCase().includes(q)

);

renderLogs(filtered);

}

function generateCharts(){

const deptCounts={};
const purposeCounts={};

allVisits.forEach(v=>{

deptCounts[v.department]=(deptCounts[v.department]||0)+1;
purposeCounts[v.purpose]=(purposeCounts[v.purpose]||0)+1;

});

new Chart(document.getElementById("deptChart"),{

type:"bar",

data:{
labels:Object.keys(deptCounts),
datasets:[{
label:"Visitors",
data:Object.values(deptCounts)
}]
}

});

new Chart(document.getElementById("purposeChart"),{

type:"doughnut",

data:{
labels:Object.keys(purposeCounts),
datasets:[{
data:Object.values(purposeCounts)
}]
}

});

}
