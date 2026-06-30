# SJS School ERP — Role Permissions Matrix

This document provides a detailed breakdown of role-based permissions across the entire ERP platform.

---

## Permission Matrix by Feature

| Feature / Action | Student | Parent | Teacher | Principal | Superadmin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Authentication** | | | | | |
| Log in | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reset own password | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Student Profiles** | | | | | |
| View own profile | ✓ | — | — | — | — |
| View linked child profile | — | ✓ | — | — | — |
| View all student profiles | ✗ | ✗ | ✓ | ✓ | ✓ |
| Create/Edit student profiles | ✗ | ✗ | ✗ | ✓ | ✓ |
| Soft-delete students | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Teacher Profiles** | | | | | |
| View own profile | — | — | ✓ | — | — |
| View other teachers | ✗ | ✗ | ✗ | ✓ | ✓ |
| Create/Edit/Delete teachers | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Attendance** | | | | | |
| View own attendance summary | ✓ | — | — | — | — |
| View child attendance summary| — | ✓ | — | — | — |
| View section attendance register| ✗ | ✗ | ✓ | ✓ | ✓ |
| Mark daily attendance | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Marks & Grading** | | | | | |
| View own marks | ✓ | — | — | — | — |
| View child marks | — | ✓ | — | — | — |
| View section marks | ✗ | ✗ | ✓ | ✓ | ✓ |
| Upsert/Edit marks | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Leave Applications** | | | | | |
| Apply for leave | ✓ | ✗ | ✓ | ✗ | ✗ |
| View own leave history | ✓ | ✗ | ✓ | ✗ | ✗ |
| View all leave requests | ✗ | ✗ | ✗ | ✓ | ✓ |
| Approve / Reject leaves | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Complaints / Grievances** | | | | | |
| Submit complaints (Anonymous) | ✓ | ✗ | ✗ | ✗ | ✗ |
| Submit complaints (Named) | ✓ | ✗ | ✓ | ✗ | ✗ |
| View own complaints history | ✓ | ✗ | ✓ | ✗ | ✗ |
| View all complaints | ✗ | ✗ | ✗ | ✓ | ✓ |
| Update complaint status | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Student Applications** | | | | | |
| Submit new application (Public) | ✓ | ✓ | ✓ | ✓ | ✓ |
| View application status | ✓ | ✓ | ✓ | ✓ | ✓ |
| View all applications list | ✗ | ✗ | ✓ | ✓ | ✓ |
| Approve / Reject applications | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Teacher Applications** | | | | | |
| Submit application (Public) | ✓ | ✓ | ✓ | ✓ | ✓ |
| View all applications list | ✗ | ✗ | ✗ | ✓ | ✓ |
| Approve / Reject applications | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Class & Section Mgmt** | | | | | |
| View class hierarchy | ✗ | ✗ | ✓ | ✓ | ✓ |
| Assign class teachers | ✗ | ✗ | ✗ | ✓ | ✓ |
| Assign subject teachers | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Notifications** | | | | | |
| View received notifications | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create general notifications | ✗ | ✗ | ✓ | ✓ | ✓ |
| Delete notifications | ✗ | ✗ | ✗ | ✓ | ✓ |
| **Data Export & Admin Stats** | | | | | |
| View Superadmin stats | ✗ | ✗ | ✗ | ✗ | ✓ |
| Create staff accounts (Supabase)| ✗ | ✗ | ✗ | ✗ | ✓ |
| Export school data (SQL/CSV) | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## Role Permissions Detail

### Student (`STUDENT`)
* **✓ Can Do**:
  * Log in using scholar number based auto-generated credentials (`{scholarNumber}@sjs.edu.in`).
  * View their own dashboard, stats, and monthly attendance calendar.
  * Apply for student leaves (medical, personal, etc.) with description and optional attachments.
  * Submit student complaints anonymously or named.
  * View their own examination marks across subjects.
  * Access notifications sent to their class, section, or specifically to them.
* **✗ Cannot Do**:
  * Edit their own profile pictures (must be updated via crop tool or admin).
  * Mark attendance.
  * Access any administrative dashboards or directories.
  * Edit academic marks, class schedules, or class teacher assignments.

### Teacher (`TEACHER`)
* **✓ Can Do**:
  * Mark daily attendance for any section using batch-marking arrays.
  * Access Student Directory to search and view student details.
  * View/edit student marks for subjects taught.
  * Create class or general notices/notifications.
  * Apply for teacher leaves and review their own leave history.
  * Submit complaints (always named, anonymity is disabled).
  * Class teachers can manage and view specific student details inside their assigned sections.
* **✗ Cannot Do**:
  * Create, update, or soft-delete student/teacher accounts.
  * Re-assign class teachers or edit school-wide hierarchy.
  * Approve/reject other teachers' leave requests.
  * Manage school finances, fees, or data exports.

### Parent (`PARENT`)
* **✓ Can Do**:
  * Log in using their designated portal.
  * View linked children's attendance, marks, and profile details.
  * Track fee payment details (once fully wired up).
* **✗ Cannot Do**:
  * Submit leaves directly (must be submitted via student account).
  * Edit academic, profile, or financial details.

### Principal (`PRINCIPAL`) / School Admin (`SCHOOL_ADMIN`)
* **✓ Can Do**:
  * Access all modules and administrative views inside the principal dashboard.
  * Approve or reject pending Student and Teacher applications.
  * Add, update, and soft-delete students.
  * Assign class teachers and subject teachers to sections.
  * View all school complaints, mark status as SEEN or RESOLVED.
  * View all student/teacher leave requests and approve/reject them.
  * Review school-wide statistics (active student count, teacher count, class counts, average attendance).
* **✗ Cannot Do**:
  * Manage global system configurations for other school databases.
  * Create new staff logins directly via Supabase Auth Admin.

### Superadmin (`SUPER_ADMIN`)
* **✓ Can Do**:
  * Access the global Superadmin control panel.
  * Create new Principal, School Admin, and Accountant credentials.
  * Export SQL database backups or school CSV files directly from the UI.
  * View system-wide usage statistics across the platform.
* **✗ Cannot Do**:
  * Violate single-school database constraints without proper multi-school routing (future roadmap).
