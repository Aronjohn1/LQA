# LQA System - Librarian QRCode Attendance

## 📋 Overview

The LQA (Learning Quality Assessment) System is a comprehensive platform designed to manage and assess the learning quality across multiple educational levels including college, senior, junior, elementary, teacher, and instructor levels.

---

## 🏗️ System Architecture & Flow

### **Overall System Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Login Page → Dashboard → Features (User Role-Based)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP REST API
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Backend (Node.js + Express)                    │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Auth Layer │→ │ Controllers  │→ │ Business Logic       │    │
│  │ Middleware │  │ (Role-Based) │  │ (Education Levels)   │    │
│  └────────────┘  └──────────────┘  └──────────────────────┘    │
└────────────────────────┬────────────────────────────────────────┘
                         │ Database Operations
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL + Prisma ORM)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │   User   │ │Attendance│ │ Request  │ │ Education Levels │   │
│  │ Profiles │ │ Records  │ │  Mgmt    │ │ (College/Senior/junior/elementary)) │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### **User Authentication Flow**

```
1. User Login (Email/ID + Password)
   ↓
2. Backend Validation & JWT Generation
   ↓
3. Token Stored in Frontend (AuthContext)
   ↓
4. Authenticated Requests with Token Header
   ↓
5. Role-Based Access Control (RBAC)
   ↓
6. Dashboard/Features Access
```

### **Educational Levels Supported**

- **College** - Institution-level assessments
- **Senior** - Senior secondary level (11-12)
- **Junior** - Junior secondary level (9-10)
- **Elementary** - Primary level (1-8)
- **Teacher** - Teaching staff assessments
- **Instructor** - Instructor evaluations

Each level has:
- Individual attendance records
- Assessment requests
- Performance tracking
- Quality metrics

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 18+
- **Build Tool**: Vite
- **State Management**: React Context API
- **HTTP Client**: Axios
- **UI Components**: Custom React Components
- **Icons**: React Icons (react-icons)
- **Styling**: Tailwind CSS

### **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **API Style**: REST

### **Database**
- **Primary DB**: PostgreSQL
- **Migration Tool**: Prisma Migrations
- **Data Seeding**: Prisma Seed

---

## 📁 Project Structure

```
LQA SYSTEM/
├── frontend/                    # React Frontend Application
│   ├── src/
│   │   ├── Login.jsx           # Login Page (Improved UI)
│   │   ├── Dashboard.jsx       # Main Dashboard
│   │   ├── components/         # Reusable Components
│   │   ├── context/            # React Context (Auth, State)
│   │   ├── services/           # API Services
│   │   ├── pages/              # Page Components
│   │   └── assets/             # Images, Logos
│   ├── package.json
│   └── vite.config.js
│
└── backend/                     # Node.js/Express Backend
    ├── models/                  # Sequelize Models
    │   ├── user.js
    │   ├── college.js
    │   ├── senior.js
    │   ├── junior.js
    │   ├── elementary.js
    │   ├── teacher.js
    │   ├── instructor.js
    │   ├── attendancecollege.js
    │   └── request_*.js
    ├── controllers/             # Route Handlers
    │   ├── authController.js
    │   ├── userController.js
    │   ├── attendanceController.js
    │   ├── profileController.js
    │   └── requestController.js
    ├── routes/                  # API Routes
    │   ├── auth.js
    │   ├── user.js
    │   ├── attendance.js
    │   ├── profile.js
    │   └── request.js
    ├── middleware/              # Auth & Role Middleware
    │   ├── authMiddleware.js
    │   └── roleMiddleware.js
    ├── migrations/              # Database Migrations
    ├── utils/                   # Utility Functions
    │   ├── generateQRCode.js
    │   ├── excelParser.js
    │   ├── reportGenerator.js
    │   └── accountSecurity.js
    ├── uploads/                 # User Profile Images
    ├── prisma/                  # Prisma Schema & Migrations
    ├── server.js                # Entry Point
    ├── package.json
    └── config/                  # Configuration Files
```

---

## 🚀 Key Features

### **Authentication & Authorization**
- Secure user login with JWT tokens
- Role-based access control (RBAC)
- Password encryption with account security features
- Profile management with image upload

### **Attendance Management**
- Track attendance across all education levels
- Separate records for each level (College, Senior, Junior, etc.)
- Attendance reports and analytics

### **Request Management**
- Create and manage assessment requests
- Level-specific request workflows
- Request status tracking and approvals

### **User Profiles**
- User information management
- Role assignment (Student, Teacher, Admin, etc.)
- Profile picture upload and storage

### **Reports & Analytics**
- Excel report generation
- QR code generation for attendance
- Data export functionality

---

## 📦 Installation & Setup

### **Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### **Backend Setup**
```bash
cd backend
npm install
npm start
```

### **Database Setup**
```bash
# Run migrations
npx prisma migrate dev

# Seed initial data
npm run seed
```

---

## 🔌 API Endpoints

### **Authentication**
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### **Users**
- `GET /user/` - Get all users
- `GET /user/:id` - Get user by ID
- `PUT /user/:id` - Update user profile

### **Attendance**
- `POST /attendance/` - Create attendance record
- `GET /attendance/` - Get attendance records
- `PUT /attendance/:id` - Update attendance

### **Requests**
- `POST /request/` - Create assessment request
- `GET /request/` - Get requests
- `PUT /request/:id` - Update request status

### **Profile**
- `GET /profile/` - Get user profile
- `PUT /profile/` - Update profile

---

## 🔐 Security Features

- JWT token-based authentication
- Password hashing and encryption
- Role-based middleware protection
- Protected API endpoints
- Secure file uploads

---

## 📞 Support & Contributing

For issues, feature requests, or contributions, please refer to the project documentation or contact the development team.

---

**Last Updated**: June 2026
