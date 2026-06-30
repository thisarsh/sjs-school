# SJS School ERP — Complete Feature Checklist

This document details every feature available across all user portals in the SJS School ERP.

---

## 1. Student Portal

- [x] **Dashboard Overview**: Summary of daily attendance percentage with animated SVG progress rings, today's status card, and a mobile hero card greeting.
- [x] **9-Grid Action System**: Direct links to student sub-views:
  - [x] **Attendance Calendar**: Monthly color-coded attendance register (Present = Green, Absent = Red, Late = Yellow).
  - [x] **Leave Application**: Apply for leaves, submit reasons, attach medical certificates via Cloudinary, and view status history.
  - [x] **Complaint Desk**: File anonymous or named complaints directly with the Principal.
  - [x] **Timetable View** *(Placeholder)*: Coming Soon modal.
  - [x] **Homework View** *(Placeholder)*: Coming Soon modal.
  - [x] **Marks & Results** *(Placeholder)*: Coming Soon modal.
  - [x] **Notices & Announcements** *(Placeholder)*: Coming Soon modal.
  - [x] **Study Material** *(Placeholder)*: Coming Soon modal.
  - [x] **Fees Dashboard** *(Placeholder)*: Coming Soon modal.
- [x] **Profile Screen**: Display user personal data (Aadhaar, blood group, roll number, admission details) with a responsive back button to home.

---

## 2. Teacher Portal

- [x] **Today's Overview**: Home dashboard listing current greeting, profile card summary, and student counts.
- [x] **Roster Directory**: List all pupils, filter and search by name/scholar number, check pending application histories, and edit records.
- [x] **Daily Attendance Marking**: Batch attendance grid allowing teachers to select, mark, and update entire classroom rosters in a single click.
- [x] **Leave Request Panel**: Submit teacher leaves (Sick, Personal) and view history logs.
- [x] **Complaint Center**: Submit named complaints directly to administration.
- [x] **Notices Module**: Place announcements on the shared notices stream.
- [x] **Marks Entry & View** *(Placeholder)*: Coming Soon modal.
- [x] **Homework Assignments** *(Placeholder)*: Coming Soon modal.
- [x] **Discipline Logs** *(Placeholder)*: Coming Soon modal.
- [x] **Performance Reports** *(Placeholder)*: Coming Soon modal.
- [x] **Timetable Schedules** *(Placeholder)*: Coming Soon modal.

---

## 3. Principal Portal

- [x] **Executive Dashboard**: School stats summary (total student counts, teaching staff counts, class sizes, today's average attendance rate).
- [x] **Applications Pipeline**: Review, approve, or reject incoming Student and Teacher applications.
- [x] **Account Management**: Create and configure student profiles and assign default credentials.
- [x] **Class Hierarchy Config**: Manage grade listings, assign class teachers to specific sections, and configure subject teachers.
- [x] **Leave Request Panel**: Approve or reject pending student/teacher leave applications.
- [x] **Complaints Board**: Read all student and teacher complaints (anonymized for students if checked) and update status (UNSEEN, SEEN, RESOLVED).
- [x] **Notices Editor**: Write, distribute, and manage school announcements.

---

## 4. Superadmin Portal

- [x] **Global Statistics**: View school sizes and active system metrics.
- [x] **Staff Account Creation**: Direct integration with Supabase Auth Admin to provision Principal, School Admin, and Accountant credentials.
- [x] **Direct Data Export**: Download raw database snapshots as SQL files or export data tables into CSV format for offline backups.
