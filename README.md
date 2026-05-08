# FitFlow - Fitness & Nutrition Tracker 🏋️‍♂️

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-4.2+-092E20?style=flat-square&logo=django&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Architecture](https://img.shields.io/badge/Architecture-Monolithic_REST-orange?style=flat-square)

A robust, mobile-first web application designed to track daily macronutrients, hydration, physical activity, and body
metrics. Built with **Django** and **Django REST Framework (DRF)** on the backend, featuring an asynchronous, SPA-like
frontend powered by **Vanilla JavaScript** and **Chart.js**.

---

## 🏗 High-Level Architecture

The system implements a **Hybrid Monolithic Architecture**. It uses Django's classic MTV (Model-Template-View) pattern
for initial page loads and secure routing, but heavily relies on **Django REST Framework** APIs for all subsequent CRUD
operations. This allows the frontend to update asynchronously without page reloads, providing a smooth Mobile-App
experience.

### Core Modules

| Module           | Stack           | Description                                                                                    |
|:-----------------|:----------------|:-----------------------------------------------------------------------------------------------|
| **🌐 Web Core**  | `Django Views`  | Entry point. Handles template rendering, initial context, and login/registration routing.      |
| **⚡ API Layer**  | `DRF`           | RESTful endpoints (`/api/dashboard/`, `/api/food/`, etc.) serving JSON for dynamic UI updates. |
| **🎨 Frontend**  | `JS + HTML/CSS` | Custom mobile-first UI with Bottom Navigation Bar, FAB, and custom Modal system.               |
| **🗄️ Database** | `SQLite`        | Persistent storage for User Profiles, Activity Logs, and Food tracking.                        |

## 🚀 Key Technical Features

* **"Time Machine" Navigation:** Users can navigate through dates (`?date=YYYY-MM-DD`) on the dashboard. The backend
  dynamically aggregates macros, calories, and logs for the specific day on the fly.
* **Smart Macro Calculation:** The system dynamically adjusts daily carbohydrate and water goals based on the user's
  logged physical activity (e.g., burning calories increases the carb limit).
* **Asynchronous UI (SPA-feel):** All data entry (Food, Water, Workouts) uses `fetch` API and custom pop-up modals. The
  dashboard re-renders seamlessly without full page reloads.
* **Safe JavaScript Event Handling:** The frontend utilizes modern JS features (Optional Chaining `?.`, helper
  functions) to ensure rock-solid stability and prevent DOM absence crashes.
* **Interactive Data Visualization:** Integration with **Chart.js** to render dynamic, responsive weight progression
  curves.

## 🛠 Tech Stack

### Backend

* **Framework:** Django & Django REST Framework
* **Database:** SQLite (Easily migratable to PostgreSQL)
* **Authentication:** Django Session Auth

### Frontend

* **UI/UX:** Custom CSS3 (Glassmorphism, Mobile-first flexbox/grid)
* **Interactivity:** Vanilla JavaScript (ES6+)
* **Charts:** Chart.js

## 🔌 API Examples

Access via local server (Port 8000):

```http
# 1. Get Dashboard Data (Time Machine)
GET /api/dashboard/?date=2026-05-01
X-CSRFToken: <token>

# 2. Add Fast Water (250ml)
POST /api/water/
Content-Type: application/json
X-CSRFToken: <token>

{
  "amount_ml": 250,
  "date": "2026-05-01"
}

# 3. Update User Profile (Patch)
PATCH /api/profile/
Content-Type: application/json
X-CSRFToken: <token>

{
  "target_weight": 75.5,
  "goal": "bulk",
  "activity_level": "moderate"
}

```

## 🚀 Getting Started

### Prerequisites

* Python 3.10 or higher
* pip (Python package manager)

### 1. Environment Setup

Clone the repository and create a virtual environment:

```bash
git clone [https://github.com/your-username/FitFlow.git](https://github.com/your-username/FitFlow.git)
cd FitFlow
python -m venv venv

```

Activate the virtual environment:

* **Windows:** `venv\Scripts\activate`
* **Mac/Linux:** `source venv/bin/activate`

### 2. Install Dependencies

```bash
pip install -r requirements.txt

```

*(Make sure `django`, `djangorestframework`, etc., are in your requirements.txt)*

### 3. Database Migration

Apply the database migrations to set up your SQLite DB:

```bash
python manage.py makemigrations
python manage.py migrate

```

### 4. Run the Server

Execute the following command to start the application:

```bash
python manage.py runserver

```

### 5. Access

Open your browser and navigate to: **`http://127.0.0.1:8000/`**

## 💡 Why This Project Matters

This project demonstrates strong Full-Stack capabilities:

* Designing a **RESTful API** capable of complex data aggregation (Summing macros by date).
* Implementing **business logic** (dynamic goal adjustments based on activity).
* Managing secure **CSRF-protected** AJAX requests in Vanilla JS.
* Creating a modern, responsive UI without relying on heavy frontend frameworks like React or Vue, proving a deep
  understanding of DOM manipulation and CSS layout.

## 🐛 Troubleshooting & Common Issues

1. **"Uncaught TypeError: Cannot read properties of null" in Console:**

* *Cause:* Aggressive browser caching running an old version of `dashboard.js`.
* *Fix:* Perform a hard reload using `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac) to clear the static file cache.


2. **403 Forbidden on POST/PATCH requests:**

* *Cause:* Missing or invalid CSRF token.
* *Fix:* Ensure the `getToken('csrftoken')` utility in `utils.js` is correctly reading the cookie, and that the user is
  logged in.


3. **No data rendering on Dashboard:**

* *Cause:* The User Profile is incomplete.
* *Fix:* The system requires a completed profile (height, weight, goals) to calculate dynamic targets. Navigate to the
  Profile tab and save your settings first.

## 📂 Project Structure

```text
Exam/
├── config/              # Django core settings, routing, and WSGI/ASGI
├── tracker/             # Main Application
│   ├── models.py        # Database schema (Profile, FoodLog, ActivityLog, etc.)
│   ├── views.py         # API endpoints and template rendering
│   ├── serializers.py   # DRF serialization logic
│   └── urls.py          # App-specific routing
├── templates/           # HTML templates (base.html, dashboard.html, etc.)
├── static/              # Static assets
│   ├── css/style.css    # Unified custom styles
│   └── js/              # Frontend logic (dashboard.js, utils.js, profile_setup.js)
├── db.sqlite3           # Local database
└── manage.py            # Django execution script

```

## 🔐 Security Features

* **CSRF Protection:** All mutating API requests (POST, PATCH, DELETE) require a valid CSRF token extracted securely
  from cookies.
* **Authentication Walls:** API endpoints are protected using DRF's `IsAuthenticated` permission classes. Unauthorized
  access attempts are gracefully intercepted and redirected to the login page.
* **Data Isolation:** Queries are strictly filtered by `request.user` to ensure users can only access and modify their
  own health and nutrition logs.

## 📜 License

This project is licensed under the MIT License.
