# SJS School ERP — Business Rules

This document captures every business rule implemented in the system, organized by module.

---

## 1. Authentication

| # | Rule | Enforcement |
|---|------|-------------|
| A1 | User must have a valid email + password to log in | `auth.service.ts` — bcrypt compare |
| A2 | Passwords are hashed with bcrypt (10 salt rounds) before storage | `student.service.ts`, `teacher.service.ts` |
| A3 | JWT token expires in 24 hours | `auth.service.ts` — `expiresIn: '1d'` |
| A4 | Token contains only `userId` and `role` | JWT payload |
| A5 | If JWT is invalid/expired, return 403 Forbidden | `auth.middleware.ts` |
| A6 | If no Authorization header, return 401 Unauthorized | `auth.middleware.ts` |
| A7 | On 401 response, frontend clears localStorage and redirects to login | `lib/api.ts` response interceptor |
| A8 | Soft-deleted users (`isDeleted = true`) cannot log in | `auth.service.ts` — WHERE clause |
| A9 | Each user has exactly ONE role | Schema constraint (single `role` field) |
| A10 | Refresh token endpoint exists but returns stub (not implemented) | `auth.controller.ts` |
| A11 | Logout endpoint exists but is stateless (no token blacklist) | `auth.controller.ts` |

---

## 2. Attendance

| # | Rule | Enforcement |
|---|------|-------------|
| AT1 | Only ONE attendance record per student per calendar day | DB: `@@unique([studentId, date])` |
| AT2 | Attendance uses UPSERT — marking again on the same day updates the status | `ON CONFLICT DO UPDATE` |
| AT3 | Batch marking: all students in a section are marked at once | `UNNEST` array operation |
| AT4 | Valid statuses: "PRESENT", "ABSENT", "LATE" | Controlled by frontend UI |
| AT5 | Today's date is calculated server-side with `setHours(0,0,0,0)` | `attendance.service.ts` |
| AT6 | Attendance percentage = (PRESENT days / total days) × 100, rounded | Calculated client-side for student dashboard |
| AT7 | Attendance register shows data for a date range per student list | `getAttendanceRegister()` |
| AT8 | Any teacher can mark attendance (no section restriction at API level) | ⚠️ Gap: API doesn't verify teacher's assigned section |
| AT9 | Principal can view attendance across all classes via stats endpoint | `stats.routes.ts` |

---

## 3. Marks & Grading

| # | Rule | Enforcement |
|---|------|-------------|
| M1 | One mark record per student + subject + examType + academicYear | DB: `@@unique` constraint |
| M2 | Marks entry uses UPSERT — re-entering overwrites the previous score | `ON CONFLICT DO UPDATE` |
| M3 | Marks entry is wrapped in a database transaction | `BEGIN/COMMIT/ROLLBACK` in `marks.controller.ts` |
| M4 | Default max score is 100 | DB: `DEFAULT 100` |
| M5 | Default academic year is "2025-26" | DB: `DEFAULT "2025-26"` |
| M6 | Students can only view their OWN marks | `marks.controller.ts` — checks `userId` |
| M7 | Teachers and Principals can view and edit marks for all students | Route: `requireRole(['PRINCIPAL', 'TEACHER', 'SUPER_ADMIN'])` |
| M8 | Deleting a student CASCADE-deletes their marks | Schema: `onDelete: Cascade` |
| M9 | Deleting a subject CASCADE-deletes marks in that subject | Schema: `onDelete: Cascade` |

---

## 4. Fees

| # | Rule | Enforcement |
|---|------|-------------|
| F1 | One fee record per student + feeType + month + academicYear | DB: `@@unique` constraint |
| F2 | Fee structure defines template amounts per class and fee type | `FeeStructure` table |
| F3 | Receipt numbers must be globally unique | DB: `@unique` on `receiptNumber` |
| F4 | Default fee status is "paid" | DB: `DEFAULT "paid"` |
| F5 | `collectedById` tracks which user collected the payment | Schema field |
| F6 | Fee management UI is partially built | Frontend: scaffolded at `/fee` |

---

## 5. Leave Management

| # | Rule | Enforcement |
|---|------|-------------|
| L1 | Only Students and Teachers can apply for leave | `leave.controller.ts` — role check |
| L2 | Leave reason is capped at 150 characters | Zod: `z.string().max(150)` |
| L3 | Total days must be ≥ 1 | Zod: `z.number().min(1)` |
| L4 | Leave date range is validated (fromDate, toDate as ISO datetime) | Zod: `z.string().datetime()` |
| L5 | Attachments (medical certificates) are optional | Optional Cloudinary URL |
| L6 | Leave types: "SICK", "CASUAL", "EMERGENCY", "PERSONAL", "OTHER" | Controlled by frontend select |
| L7 | Default status: PENDING | DB: `DEFAULT "PENDING"` |
| L8 | Only Principal/SuperAdmin/SchoolAdmin can approve or reject | `leave.controller.ts` — role check |
| L9 | Valid status transitions: PENDING → APPROVED or PENDING → REJECTED | Controller validates `['APPROVED', 'REJECTED']` |
| L10 | Student leaves show class/section info in principal view | SQL JOIN with Section and Class tables |
| L11 | Teacher leaves show subject info in principal view | SQL JOIN with Teacher table |
| L12 | A leave record links to either a studentId OR teacherId, never both | Schema design (both nullable) |

---

## 6. Complaints / Grievances

| # | Rule | Enforcement |
|---|------|-------------|
| C1 | Only Students and Teachers can submit complaints | Route: `requireRole(['STUDENT', 'TEACHER'])` |
| C2 | Students CAN submit anonymously | `isAnonymous` field |
| C3 | Teachers CANNOT submit anonymously — forced to `false` | `complaint.controller.ts`: `role === 'TEACHER' ? false : Boolean(isAnonymous)` |
| C4 | Anonymous complaints show "Anonymous Student" to the principal | `getAllComplaints()` — masks identity |
| C5 | Non-anonymous complaints populate applicant name and extra info | JOINs to Student/Teacher tables |
| C6 | Default status: UNSEEN | DB: `DEFAULT "UNSEEN"` |
| C7 | Valid statuses: UNSEEN, SEEN, RESOLVED | Controller validates allowed values |
| C8 | Only Principal/SuperAdmin can view ALL complaints | Route: `requireRole(['PRINCIPAL', 'SUPER_ADMIN'])` |
| C9 | Only Principal/SuperAdmin can update complaint status | Route: `requireRole(['PRINCIPAL', 'SUPER_ADMIN'])` |
| C10 | Students/Teachers see only their OWN complaints | `getMyComplaints()` filters by `applicantId` |

---

## 7. Student Applications

| # | Rule | Enforcement |
|---|------|-------------|
| SA1 | Scholar number must be unique across all applications AND enrolled students | DB: `@unique`, pre-check endpoint |
| SA2 | Scholar number duplicate check is available as a public API endpoint | `/api/students/check-scholar-number` |
| SA3 | Application starts with status PENDING | DB: `DEFAULT "PENDING"` |
| SA4 | Only Teachers and Principals can approve/reject applications | Route: `requireRole` |
| SA5 | On approval: System auto-creates User (STUDENT role) + Student record + Parent record | `student.service.ts` — `approveApplication()` |
| SA6 | Auto-generated password: `{scholarNumber}@sjs` | `student.service.ts` |
| SA7 | Auto-generated email: `{scholarNumber}@sjs.edu.in` | `student.service.ts` |
| SA8 | Student is auto-placed into the matching class/section based on `classApplying` | Lookup Class + Section, set `sectionId` |
| SA9 | Parent is created with `fatherName` as firstName, phone as `parentMobile` | `student.service.ts` |
| SA10 | Parent auto-generated email: `parent.{scholarNumber}@sjs.edu.in` | `student.service.ts` |
| SA11 | Application form is publicly accessible (no auth required) | Route: before `authMiddleware` |

---

## 8. Teacher Applications

| # | Rule | Enforcement |
|---|------|-------------|
| TA1 | Email must be unique across all teacher applications | DB: `@unique` on email |
| TA2 | Phone must be 10 digits, no leading zero or +91 | Zod regex: `/^[1-9][0-9]{9}$/` |
| TA3 | Duplicate email returns 409 DUPLICATE_EMAIL error | `teacher.service.ts` |
| TA4 | On approval: System creates User (TEACHER role) + Teacher record | `teacher.service.ts` |
| TA5 | Auto-generated password: `{email.split('@')[0]}@sjs` or similar | `teacher.service.ts` |
| TA6 | Only Principal/SuperAdmin/SchoolAdmin can approve | Route: `requireRole` |
| TA7 | Application form is publicly accessible (no auth required) | Route: before `authMiddleware` |

---

## 9. Class & Section Management

| # | Rule | Enforcement |
|---|------|-------------|
| CS1 | Classes are pre-seeded: PG, Nursery, KG, 1–12 | `seed_static_classes.js` |
| CS2 | Each class has at least one section (A) | Seeding script |
| CS3 | Section can have at most one class teacher | `Section.classTeacherId` FK |
| CS4 | Subject teachers are stored as JSON string in Section | `subjectTeachers` field |
| CS5 | Assigning a new class teacher removes the old teacher's class assignment | `class.controller.ts` — updates Teacher.classes |
| CS6 | Class hierarchy is ordered: PG → Nursery → KG → 1 → 2 → ... → 12 | Hardcoded `CASE` in SQL |

---

## 10. Notifications

| # | Rule | Enforcement |
|---|------|-------------|
| N1 | Notifications can be targeted at: everyone, a class, a section, or a student | Optional FK fields |
| N2 | Only Principal/Teacher/SuperAdmin can create notifications | Route: `requireRole` |
| N3 | Only Principal/SuperAdmin can delete notifications | Route: `requireRole` |
| N4 | Notifications are returned most recent first, limited to 50 | SQL: `ORDER BY createdAt DESC LIMIT 50` |
| N5 | Read tracking is per student per notification | `NotificationRead` composite PK |

---

## 11. Timetable

| # | Rule | Enforcement |
|---|------|-------------|
| T1 | One entry per section + day + period + academicYear | DB: `@@unique` constraint |
| T2 | Timetable data is currently managed but frontend is "Coming Soon" | `ComingSoonModal` |

---

## 12. File Uploads

| # | Rule | Enforcement |
|---|------|-------------|
| U1 | Only image files: JPEG, PNG, WebP | Multer `fileFilter` |
| U2 | Maximum file size: 10 MB | Multer `limits.fileSize` |
| U3 | Images are auto-converted to WebP format | Cloudinary upload options |
| U4 | Images are stored in the `erp_profiles` folder on Cloudinary | Upload controller config |
| U5 | Upload endpoint is public (no auth) | ⚠️ Security gap: should require auth |
