# 🎓 Campus Connect: Student Analytics Platform

**Campus Connect** is a professional **AI-Driven Academic Early-Warning System** designed to bridge the gap between data and academic success. Built with a modern "Stitch UI" aesthetic, it provides real-time predictive monitoring to help educators identify at-risk students and improve overall learning outcomes.

---

## 🚀 Key Features

-   **🔍 Predictive Analytics:** Automatically categorizes students (Excellent, Good, At-Risk, Failing) based on real-time academic data and attendance patterns.
-   **📊 Dynamic Dashboards:** Specialized views for **Students**, **Teachers**, and **Admins** with interactive charts (Chart.js) for performance tracking.
-   **✅ Management Suite:** Effortless attendance tracking, grade management, and student record updates for educators.
-   **🤖 AI-Style Global Search:** Centralized command bar for quick access to student insights and navigation.
-   **📱 Modern UI/UX:** Clean, light-mode interface inspired by modern design systems, featuring glassmorphism and subtle animations.

---

## 🛠️ Tech Stack

-   **Backend:** Node.js, Express.js
-   **Database:** SQLite (Relational schema with triggers for GPA calculation and performance status updates)
-   **Frontend:** HTML5, Vanilla JavaScript, CSS3 (Custom Design System)
-   **Visualization:** Chart.js

---

## 📂 Project Structure

-   `/frontend`: All client-side assets (HTML, CSS, JS).
-   `server.js`: Express REST API endpoints and middleware.
-   `schema.sql`: Database architecture (Tables, Views, Triggers).
-   `init_db.js`: Database initialization and seeding script.
-   `generate_seed.js`: Script to generate realistic mock data.

---

## 💻 Local Setup

1.  **Clone the Repo:**
    ```bash
    git clone https://github.com/Hiral-del/Campus-Connect.git
    cd Campus-Connect
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Initialize Database:**
    ```bash
    npm run init-db
    ```

4.  **Run the App:**
    ```bash
    npm start
    ```
    Visit `http://localhost:3000` in your browser.

---

## 🔐 Demo Credentials

-   **Admin:** `admin` / `admin123`
-   **Teacher:** `dr_sharma` / `prof123`
-   **Student:** `ananya0` / `student123`

---

## 📄 License
This project is licensed under the MIT License.
