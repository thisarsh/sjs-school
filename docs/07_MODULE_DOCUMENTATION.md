# SJS School ERP — Module Workflows

This document outlines the workflows, validations, permissions, and database structures for each major functional module.

---

## 1. Attendance Management Module

### Purpose
To enable teachers to record and monitor student presence/absence on a daily basis.

### Workflow
1. **Selection**: Teacher selects Class and Section on the UI.
2. **Retrieve Today's State**: The UI fetches student rosters and queries `/api/attendance/today` to check if attendance was already submitted.
3. **Marking**: Teacher checks/unchecks student present/absent checkboxes on the grid.
4. **Batch Upsert**: Clicking "Submit Attendance" maps student IDs and statuses, sending a single array payload to `/api/attendance`.
5. **Database Logic**: The backend runs a PostgreSQL `UNNEST` query to insert/update the `Attendance` table dynamically.

### Validation
- Payload must be an array of `{ studentId, status }`.
- Status must belong to the set: `["PRESENT", "ABSENT", "LATE"]`.

### Future Improvements
- Automatic SMS alerts to parents if a student is marked "ABSENT".
- Periodic monthly email summaries of student attendance.

---

## 2. Student Application & Onboarding Module

### Purpose
A public-facing enrollment form allowing prospective parents/students to register, upload documents, and wait for staff approval.

### Workflow
1. **Public Intake**: Parent visits `/apply/student` and enters details (Name, Class, Father Name, Aadhaar, etc.).
2. **Duplicate Check**: The form triggers `/check-scholar-number` on blur to prevent duplicate scholar IDs.
3. **Image Crop**: Parent uploads a profile picture, crops it via the frontend `ImageCropper`, and uploads it to `/api/upload` (saving the resulting Cloudinary CDN link).
4. **Save Pending**: The application is stored in the `StudentApplication` table with a state of `PENDING`.
5. **Review**: The Principal reviews pending applications under the "Applications" tab.
6. **Approval**: Clicking "Approve" triggers `/applications/:id/approve`. The backend executes a transaction that:
   - Inserts a new `User` record (hash password as `{scholarNumber}@sjs`).
   - Inserts a new `Student` record.
   - Inserts a new `Parent` record (if not already linked) with email `parent.{scholarNumber}@sjs.edu.in`.
   - Links the student to the matching Class & Section.

---

## 3. Leave Request Module

### Purpose
Allows students and teachers to submit digital leave requests rather than turning in physical slips.

### Workflow
1. **Application**: The user clicks "Apply Leave" and fills in dates, total days, leave type, and a short description.
2. **File attachment**: Optionally uploads supporting documents (e.g., medical certificates) to Cloudinary.
3. **Submission**: Handled via `POST /leave`.
4. **Principal Decision**: The Principal accesses the "Leave Requests" view, where student and teacher leave requests are displayed in separate lists.
5. **Update**: Clicking "Approve" or "Reject" fires `POST /leave/:id/status`. The database updates the request's `status` to `APPROVED` or `REJECTED`.

---

## 4. Complaint & Feedback Module

### Purpose
Provides a platform for students to report issues (anonymously if desired) and teachers to submit named complaints directly to the Principal.

### Workflow
1. **Submission**: User inputs a subject and description.
   - Students can check the "Submit anonymously" checkbox.
   - Teachers do not have this checkbox (the backend forces `isAnonymous = false`).
2. **Principal Review**: Principal reviews complaints under the "Complaints" tab.
   - If `isAnonymous` is `true`, the applicant's name is replaced with "Anonymous Student".
   - If `false`, the applicant's name, class/section, or subject specialization is displayed.
3. **Status Update**: Principal marks the complaint status as `SEEN` or `RESOLVED`, notifying the sender in their own complaint history view.
