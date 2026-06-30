# SJS School ERP — Project Overview

## ERP Name
**SJS School ERP** (Saraswati Jyothi School ERP)

## Purpose
A comprehensive, production-grade School Enterprise Resource Planning system designed to digitize and streamline all administrative, academic, and operational workflows for K-12 schools. The system replaces paper-based processes with a centralized digital platform accessible by all stakeholders.

## Target Schools
Indian K-12 schools, specifically institutions with:
- Pre-Primary to Class 12 (grades: PG, Nursery, KG, 1–12)
- Multiple sections per class (A, B, C, etc.)
- 200–5,000+ students per school
- 10–200 teaching staff

## Current Users
| Role | Count (Approx.) | Access Method |
|------|-----------------|---------------|
| Students | ~200+ active | Mobile web dashboard |
| Teachers | ~20+ active | Mobile web dashboard |
| Principal | 1 | Full admin web dashboard |
| Parents | ~200+ (linked) | Parent portal |
| Superadmin | 1 | System-wide admin panel |

---

## Roles

| Role | System Enum | Description |
|------|------------|-------------|
| **Student** | `STUDENT` | Views attendance, marks, applies for leave/complaints, accesses profile |
| **Teacher** | `TEACHER` | Marks attendance, manages students in assigned sections, applies for leave/complaints, views attendance register |
| **Class Teacher** | `TEACHER` (with `Section.classTeacherId` reference) | A teacher who is additionally assigned as the class teacher for a specific section. Inherits all teacher permissions, plus can manage students in their section |
| **Principal** | `PRINCIPAL` | Full school management: approve/reject applications, manage classes, view all attendance, approve/reject leave, view complaints, manage accounts & fees, send notifications |
| **Accountant** | `ACCOUNTANT` | Manages fee collection and financial records (role defined in schema, UI not yet built) |
| **Parent** | `PARENT` | Views children's academic data, attendance, and school communications |
| **School Admin** | `SCHOOL_ADMIN` | Administrative role for school-level operations (equivalent to Principal in many permissions) |
| **Superadmin** | `SUPER_ADMIN` | System-wide administration: view all schools, manage staff accounts, export data, system statistics |

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 16.2.9 | React framework with SSR, file-based routing, Turbopack |
| React | 19.x | UI library |
| TypeScript | 6.x | Type safety |
| @tanstack/react-query | Latest | Server state management, data fetching, caching |
| Axios | Latest | HTTP client with interceptors |
| Font Awesome | CDN | Icon library |
| Google Fonts (Outfit) | CDN | Typography |
| Vanilla CSS | — | Styling (no Tailwind) |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20.x+ | Runtime |
| Express.js | 5.2.1 | HTTP framework |
| TypeScript | 6.x | Type safety |
| pg (node-postgres) | 8.22.0 | PostgreSQL driver (raw SQL queries) |
| Prisma | 7.8.0 | Schema definition and migrations only (NOT used for queries) |
| Zod | 4.4.3 | Request validation |
| bcrypt | 6.0.0 | Password hashing |
| jsonwebtoken | 9.0.3 | JWT authentication |
| Helmet | 8.2.0 | HTTP security headers |
| express-rate-limit | 8.5.2 | Rate limiting |
| Multer | 2.2.0 | File upload handling (memory storage) |
| Morgan | 1.11.0 | HTTP request logging |
| Cloudinary | 2.10.0 | Image storage and CDN |

### Database
| Technology | Details |
|-----------|---------|
| PostgreSQL | Hosted on Supabase |
| Connection | Direct connection via `pg` Pool (30 max connections) |
| SSL | Enabled (rejectUnauthorized: false) |
| Migrations | Managed via Prisma Migrate |

### Storage
| Service | Purpose |
|---------|---------|
| Cloudinary | Profile pictures, leave attachments (folder: `erp_profiles`, auto-converted to WebP) |

### Deployment
| Component | Platform |
|-----------|----------|
| Database | Supabase (PostgreSQL) |
| Backend | Local development (port 5000) |
| Frontend | Local development (port 3000) |
| File Storage | Cloudinary CDN |

---

## Folder Structure

```
erp2/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema (337 lines, 20 models)
│   ├── src/
│   │   ├── app.ts                 # Express app setup, middleware, route registration
│   │   ├── server.ts              # Server entry point (port 5000)
│   │   ├── config/
│   │   │   ├── prisma.ts          # PostgreSQL connection pool (pg)
│   │   │   └── cloudinary.ts      # Cloudinary configuration
│   │   ├── controllers/           # 12 controllers
│   │   │   ├── auth.controller.ts
│   │   │   ├── attendance.controller.ts
│   │   │   ├── class.controller.ts
│   │   │   ├── complaint.controller.ts
│   │   │   ├── leave.controller.ts
│   │   │   ├── marks.controller.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── parent.controller.ts
│   │   │   ├── student.controller.ts
│   │   │   ├── subject.controller.ts
│   │   │   ├── teacher.controller.ts
│   │   │   └── upload.controller.ts
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts  # JWT verification + role-based access
│   │   ├── routes/                # 14 route files
│   │   │   ├── auth.routes.ts
│   │   │   ├── attendance.routes.ts
│   │   │   ├── classes.routes.ts
│   │   │   ├── complaint.routes.ts
│   │   │   ├── leave.routes.ts
│   │   │   ├── marks.routes.ts
│   │   │   ├── notifications.routes.ts
│   │   │   ├── parent.routes.ts
│   │   │   ├── staff.routes.ts
│   │   │   ├── stats.routes.ts
│   │   │   ├── student.routes.ts
│   │   │   ├── subject.routes.ts
│   │   │   ├── teacher.routes.ts
│   │   │   └── upload.routes.ts
│   │   ├── services/              # 5 service files
│   │   │   ├── auth.service.ts
│   │   │   ├── attendance.service.ts
│   │   │   ├── parent.service.ts
│   │   │   ├── student.service.ts
│   │   │   └── teacher.service.ts
│   │   └── utils/
│   │       └── errorHandler.ts    # Centralized error handling
│   ├── seed_*.js                  # Various seeding scripts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                     # Login page
│   │   │   ├── layout.tsx                   # Root layout
│   │   │   ├── globals.css                  # Global styles
│   │   │   ├── login.css                    # Login page styles
│   │   │   ├── student/page.tsx             # Student dashboard (401 lines)
│   │   │   ├── teacher/page.tsx             # Teacher dashboard (254 lines)
│   │   │   ├── principal/page.tsx           # Principal dashboard (1908 lines)
│   │   │   ├── superadmin/page.tsx          # Superadmin dashboard
│   │   │   ├── parent/page.tsx              # Parent portal
│   │   │   ├── fee/page.tsx                 # Fee management UI
│   │   │   └── apply/
│   │   │       ├── student/page.tsx         # Public student application form
│   │   │       └── teacher/page.tsx         # Public teacher application form
│   │   ├── components/
│   │   │   ├── ImageCropper.tsx             # Profile picture cropping
│   │   │   ├── shared/
│   │   │   │   ├── ComplaintForm.tsx         # Shared complaint form (student/teacher)
│   │   │   │   ├── ComplaintForm.css
│   │   │   │   └── ComingSoonModal.tsx       # Placeholder modal for unbuilt features
│   │   │   ├── student/
│   │   │   │   ├── StudentAttendanceSummary.tsx
│   │   │   │   ├── StudentAttendanceCalendar.tsx
│   │   │   │   └── LeaveForm.tsx
│   │   │   └── teacher/
│   │   │       ├── TeacherHome.tsx           # Teacher home grid
│   │   │       ├── AttendanceMarking.tsx     # Mark attendance
│   │   │       ├── AttendanceRegister.tsx    # View attendance register
│   │   │       ├── StudentDirectory.tsx      # Student list and management
│   │   │       └── TeacherProfileView.tsx    # Teacher profile editing
│   │   ├── lib/
│   │   │   ├── api.ts                       # Axios instance with auth interceptors
│   │   │   └── cropImage.ts                 # Image crop utility
│   │   └── logo.png, school.jpg             # Brand assets
│   └── package.json
│
├── docs/                                     # THIS DOCUMENTATION FOLDER
└── run.bat                                    # Windows batch script to start both servers
```

---

## Current Status

| Module | Status | Notes |
|--------|--------|-------|
| Authentication (Login/JWT) | ✅ Complete | Working with bcrypt + JWT |
| Student Dashboard | ✅ Complete | Attendance, Leave, Complaint, Profile |
| Teacher Dashboard | ✅ Complete | Attendance marking, student directory, leave, complaints |
| Principal Dashboard | ✅ Complete | Full school management (1900+ lines) |
| Superadmin Dashboard | ✅ Complete | Stats, staff creation, data export |
| Student Applications | ✅ Complete | Public form → approval workflow |
| Teacher Applications | ✅ Complete | Public form → approval workflow |
| Attendance System | ✅ Complete | Mark, register, calendar view |
| Leave Management | ✅ Complete | Apply, approve/reject |
| Complaint System | ✅ Complete | Anonymous (student), non-anonymous (teacher), principal review |
| Marks & Grading | ⚠️ Partial | Backend complete, frontend "Coming Soon" |
| Fee Management | ⚠️ Partial | Backend schema exists, UI scaffolded |
| Notifications | ⚠️ Partial | Backend CRUD complete, frontend limited |
| Parent Portal | ⚠️ Partial | Login works, limited dashboard |
| Timetable | ⚠️ Partial | Backend schema exists, frontend "Coming Soon" |
| Homework | 🔲 Not Started | Schema not defined |
| Transport | 🔲 Not Started | Not in schema |
| Inventory | 🔲 Not Started | Not in schema |
| SMS/Email/Push Notifications | 🔲 Not Started | No notification service integrated |
| Reports & Analytics | 🔲 Not Started | No report generation |

---

## Future Roadmap

### Phase 1 — Core Completion (Current)
- Complete Marks & Grading frontend
- Complete Fee Management frontend
- Implement Timetable management
- Homework assignment system

### Phase 2 — Communication
- SMS notifications (absent alerts, fee reminders)
- Email notifications (leave status, announcements)
- Push notifications (Firebase)
- Parent-Teacher communication

### Phase 3 — Advanced Features
- Report cards and progress reports
- Advanced analytics and dashboards
- Transport management
- Inventory management
- Library management

### Phase 4 — Enterprise
- Multi-school support
- Audit logging
- Redis caching layer
- Horizontal scaling
- Mobile app (React Native)
