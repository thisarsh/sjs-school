# SJS School ERP — Project Roadmap & Known Issues

This document highlights the status of completed work, features currently in development, and outstanding issues/vulnerabilities.

---

## 1. Feature Map Status

### Completed ✅
- **Secure Auth**: JWT logins + middleware role protection.
- **Onboarding Pipeline**: Public student/teacher application forms with cropping and Cloudinary photo host.
- **Attendance Ledger**: Single-day batch marking (UNNEST SQL) and attendance register search.
- **Principal Control Panel**: Core administrative suite to approve profiles, reassign class teachers, and view statistical counts.
- **Superadmin Panel**: Staff creation portal and full database backups/exports.
- **Complaint Board**: Anonymity toggle for students, status tracking for Principal.

### In Progress ⚠️
- **Marks Ledger**: Full frontend integration for teachers to input and view exam grades.
- **Notification Center**: Global alerts dashboard for pupils.

### Planned / Future Roadmap 📅
- **Fee Management**: Wire up the backend fee models with parent payment screens.
- **Timetable Scheduler**: Dynamic timetable builder for classroom sections.
- **SMS System**: Integrate Twilio or local gateway to dispatch absent alert SMS messages to parents.

---

## 2. Known Issues & Security Vulnerabilities

- **Stateless Logout**: Backend lacks a token blacklist; logged out JWT tokens remain valid until expiry (24 hours).
- **Public Uploads**: `/api/upload` lacks auth check. A malicious client could flood Cloudinary with unauthenticated uploads.
- **Anonymity Masking**: Anonymity is handled via application-level masking. The database still stores the `applicantId` on the complaint record, which is correct for database reference but requires strict access control.
