# NEU Library Visitor Management System

A web-based library visitor management system for **New Era University** that allows students to check in and administrators to monitor visitor statistics in real-time.

🔗 **Live Site:** https://lyvene17.github.io/neu-library-system/index.html

---

## Live Features

- Student login & registration using NEU institutional email (@neu.edu.ph)
- QR code on login page for easy mobile access
- Library check-in form (purpose of visit, college & course/program)
- Admin dashboard with real-time analytics
- Visitors by Department — bar chart
- Visitors by Program — bar chart
- Visitor logs with search functionality (name, email, department, course)
- Time filter (Today, Last 7 Days, Last 30 Days)
- User management — block/unblock users
- Mobile responsive design

---

## Tech Stack

| Technology | Usage |
|---|---|
| HTML, CSS, JavaScript | Frontend |
| Firebase Authentication | User login & registration |
| Firebase Firestore | Real-time database |
| Chart.js | Analytics charts |
| Lucide Icons | UI icons |
| QRCode.js | QR code generation |
| GitHub Pages | Web hosting |

---

## Project Structure
```
neu-library/
├── index.html        # Visitor login, registration & QR code page
├── expage.css        # Visitor page styles
├── expage.js         # Visitor page logic & Firebase auth
├── admin.html        # Admin dashboard
├── dmnview.css       # Admin dashboard styles (with mobile responsive)
├── dmnview.js        # Admin logic, charts & Firestore queries
├── screenshots/
│   ├── web view/     # Desktop screenshots
│   └── mobile view/  # Mobile screenshots
└── README.md
```

---

## How to Run

1. Clone the repository
```bash
git clone https://github.com/lyvene17/neu-library-system.git
```

2. Open the folder in **VS Code**

3. Install **Live Server** extension in VS Code

4. Right-click `index.html` → **Open with Live Server**

---

## User Flow

### Student
1. Go to `index.html` or scan the QR code
2. Register using `@neu.edu.ph` email
3. Log in with your full name, email & password
4. Select purpose of visit, college and course/program
5. Submit check-in

### Admin
1. Go to `index.html`
2. Log in with `admin@neu.edu.ph`
3. Automatically redirected to `admin.html`
4. View analytics, charts, visitor logs, manage users

---

## Firebase Setup

- **Platform:** Firebase (Google)
- **Project ID:** neu-library-system-ffbc9
- **Services used:**
  - Firebase Authentication (Email/Password)
  - Cloud Firestore

### Firestore Collections

| Collection | Description |
|---|---|
| `visits` | Stores all visitor check-in records (name, email, college, course, purpose, timestamp) |
| `blockedUsers` | Stores blocked user emails |

---

## Admin Dashboard

- **Total Visits** — overall visit count
- **Unique Visitors** — individual users
- **Today's Visits** — visits for the current day
- **Visitors by Department** — bar chart
- **Visitors by Program** — bar chart
- **Visitor Logs** — searchable table (name, email, department, course, purpose, time)
- **User Management** — block/unblock students with status badge

---

## Test Credentials

### Admin Access
| Field | Value |
|---|---|
| Email | admin@neu.edu.ph |
| Password | qwerty123 |

### Student Access
| Field | Value |
|---|---|
| Email | Register using any @neu.edu.ph email |
| Password | Create your own password during registration |

---

## Screenshots

### Web View

#### Login Page
![Login](screenshots/web%20view/login_web.png)

#### Register Page
![Register](screenshots/web%20view/registr_web.png)

#### Check-in Form
![Check-in](screenshots/web%20view/checkin_web.png)

#### Check-in Success
![Success](screenshots/web%20view/success_checkin_web.png)

#### Admin Dashboard
![Dashboard](screenshots/web%20view/admindashboard.png)

#### Charts
![Charts](screenshots/web%20view/graphs.png)

#### Visitor Logs
![Visitor Logs](screenshots/web%20view/visitorlogs.png)

#### User Management
![User Management](screenshots/web%20view/usermanagement.png)

#### User Blocked
![User Blocked](screenshots/web%20view/userIsBlocked.png)

---

### Mobile View

#### Login Page
![Login Mobile](screenshots/mobile%20view/login_mobile.jpg)

#### Register Page
![Register Mobile](screenshots/mobile%20view/register_mobile.jpg)

#### Check-in Form
![Check-in Mobile](screenshots/mobile%20view/checkin_mobile.jpg)

#### Check-in Success
![Success Mobile](screenshots/mobile%20view/successCheckin.jpg)

#### Admin Dashboard
![Dashboard Mobile](screenshots/mobile%20view/dashboard.jpg)

#### Charts
![Charts Mobile](screenshots/mobile%20view/graphs.jpg)

#### Visitor Logs
![Visitor Logs Mobile](screenshots/mobile%20view/visitorlogs.jpg)

#### User Management
![User Management Mobile](screenshots/mobile%20view/usermanagement.jpg)

#### User Blocked
![User Blocked Mobile](screenshots/mobile%20view/userIsBlocked.jpg)
