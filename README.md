# SIPAKAR LUWORO
Village Staff Attendance Application

## 📌 Features
- Login system with roles (Admin & Staff)
- Staff can:
  - Check-In & Check-Out (with geotag)
  - Submit daily performance reports (text + photo)
  - View personal attendance & reports
- Admin can:
  - Manage staff data (via JSON for now)
  - View all attendance & reports
  - Filter data by month
  - Export to Excel / PDF
- Mobile-first responsive frontend (simple HTML/JS)
- Backend: Node.js + Express

## 🚀 Quick Start (Local)
1. Clone repo:
   ```bash
   git clone https://github.com/yourname/sipakar-luworo.git
   cd sipakar-luworo
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run server:
   ```bash
   npm start
   ```
4. Open in browser: [http://localhost:10000](http://localhost:10000)

## 🔑 Default Accounts
- Admin: `admin / admin123`
- Staff: `staffa / staff123`

## ☁️ Deploy to Render
1. Push repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. New → Web Service → Connect GitHub repo
4. Render auto-detects `render.yaml`
5. Wait build → get live link!

## 📂 Project Structure
```
sipakar-luworo/
├── app.js            # Backend API
├── package.json      # Dependencies
├── render.yaml       # Render deployment config
├── public/           # Frontend files
│   └── index.html
└── data/             # JSON storage
    ├── users.json
    ├── attendance.json
    └── reports.json
```

## 📄 License
MIT License
