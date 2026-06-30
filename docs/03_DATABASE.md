# SJS School ERP — Database Documentation

## Overview
- **Database**: PostgreSQL (hosted on Supabase)
- **Schema Definition**: Prisma (`prisma/schema.prisma`)
- **Query Method**: Raw SQL via `pg` Pool (Prisma is NOT used at runtime)
- **Total Models**: 20
- **Enums**: 1 (`Role`)

---

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| Student : "has"
    User ||--o| Teacher : "has"
    User ||--o| Parent : "has"
    User ||--o| SchoolAdmin : "has"
    User ||--o{ Notification : "creates"
    
    School ||--o{ Student : "enrolls"
    School ||--o{ Teacher : "employs"
    School ||--o{ Class : "contains"
    School ||--o{ SchoolAdmin : "managed by"
    
    Class ||--o{ Section : "divided into"
    Class ||--o{ Subject : "teaches"
    Class ||--o{ Notification : "targets"
    
    Section ||--o{ Student : "assigned to"
    Section ||--o| Teacher : "class teacher"
    Section ||--o{ Timetable : "scheduled"
    Section ||--o{ Notification : "targets"
    
    Student ||--o{ Attendance : "has"
    Student ||--o{ Fee : "pays"
    Student ||--o{ Mark : "receives"
    Student ||--o{ LeaveRequest : "applies"
    Student ||--o{ Notification : "targets"
    Student ||--o{ NotificationRead : "reads"
    Student }o--o| Parent : "child of"
    
    Teacher ||--o{ Timetable : "teaches"
    Teacher ||--o{ LeaveRequest : "applies"
    
    Subject ||--o{ Mark : "graded in"
    Subject ||--o{ Timetable : "scheduled"
    
    Notification ||--o{ NotificationRead : "tracked by"
```

---

## Table Documentation

---

### 1. User

**Purpose**: Central authentication entity. Every person in the system (student, teacher, parent, admin) has exactly one User record. This is the login identity.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK, auto-generated | Unique user identifier |
| `email` | `String` | UNIQUE, NOT NULL | Login email address |
| `password` | `String` | NOT NULL | bcrypt-hashed password |
| `role` | `Role (enum)` | NOT NULL | One of: SUPER_ADMIN, SCHOOL_ADMIN, PRINCIPAL, TEACHER, STUDENT, PARENT, ACCOUNTANT |
| `createdAt` | `DateTime` | DEFAULT now() | Account creation timestamp |
| `updatedAt` | `DateTime` | Auto-updated | Last modification timestamp |
| `isDeleted` | `Boolean` | DEFAULT false | Soft-delete flag |

**Relations**: Has one-to-one relationships with Student, Teacher, Parent, SchoolAdmin. Has one-to-many with Notification (as creator).

**Indexes**: Unique index on `email`.

**Business Rules**:
- A User can only have ONE role
- Soft deletion (`isDeleted = true`) prevents login but preserves data
- Email must be globally unique across all roles

---

### 2. School

**Purpose**: Represents a physical school institution. Currently single-school deployment, but schema supports multi-school.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | School identifier |
| `name` | `String` | NOT NULL | School name |
| `address` | `String?` | Optional | Physical address |
| `logoUrl` | `String?` | Optional | School logo (Cloudinary URL) |
| `createdAt` | `DateTime` | DEFAULT now() | Creation timestamp |
| `updatedAt` | `DateTime` | Auto-updated | Last modification |
| `isDeleted` | `Boolean` | DEFAULT false | Soft-delete flag |

**Relations**: Has many Classes, Students, Teachers, SchoolAdmins.

---

### 3. SchoolAdmin

**Purpose**: Links a User with SCHOOL_ADMIN role to a specific School.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | Admin identifier |
| `userId` | `String` | UNIQUE, FK → User.id | Linked user account |
| `schoolId` | `String` | FK → School.id | Assigned school |

---

### 4. Teacher

**Purpose**: Teacher profile data. Linked to a User for authentication.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | Teacher identifier |
| `userId` | `String` | UNIQUE, FK → User.id | Auth account |
| `schoolId` | `String` | FK → School.id | Employing school |
| `firstName` | `String` | NOT NULL | First name |
| `lastName` | `String` | NOT NULL | Last name |
| `phone` | `String?` | Optional | Contact number |
| `address` | `String?` | Optional | Address |
| `qualification` | `String?` | Optional | Degree/certification |
| `experience` | `String?` | Optional | Years of experience |
| `subject` | `String?` | Optional | Primary teaching subject |
| `classes` | `String?` | Optional | Comma-separated class assignments (e.g., "1-A, 2-B") |
| `profilePic` | `String?` | Optional | Cloudinary URL |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | Auto-updated | |

**Relations**: Has many Sections (as class teacher via `Section.classTeacherId`), Timetable entries, LeaveRequests.

**Business Rules**:
- `classes` field is a denormalized comma-separated string, updated when class teacher assignments change
- A teacher can be class teacher of multiple sections

---

### 5. Parent

**Purpose**: Parent/guardian profile. Can be linked to multiple students (children).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | Parent identifier |
| `userId` | `String` | UNIQUE, FK → User.id | Auth account |
| `firstName` | `String` | NOT NULL | |
| `lastName` | `String` | NOT NULL | |
| `phone` | `String?` | Optional | Primary contact |
| `secondaryPhone` | `String?` | Optional | Alternate contact |
| `email` | `String?` | Optional | Email address |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | Auto-updated | |

**Relations**: Has many Students (children).

---

### 6. Student

**Purpose**: Student profile with academic placement data.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | Student identifier |
| `userId` | `String` | UNIQUE, FK → User.id | Auth account |
| `schoolId` | `String` | FK → School.id | Enrolled school |
| `parentId` | `String?` | FK → Parent.id | Parent/guardian |
| `sectionId` | `String?` | FK → Section.id | Current class/section |
| `firstName` | `String` | NOT NULL | |
| `lastName` | `String` | NOT NULL | |
| `scholarNumber` | `String` | UNIQUE, NOT NULL | School admission/scholar number |
| `dob` | `DateTime?` | Optional | Date of birth |
| `gender` | `String?` | Optional | M/F/Other |
| `rollNumber` | `String?` | Optional | Class roll number |
| `address` | `String?` | Optional | |
| `aadhaarNumber` | `String?` | Optional | Indian national ID |
| `bloodGroup` | `String?` | Optional | |
| `profilePic` | `String?` | Optional | Cloudinary URL |
| `isDeleted` | `Boolean` | DEFAULT false | Soft-delete |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | Auto-updated | |

**Relations**: Has many Attendance, Fee, Mark, Notification, NotificationRead, LeaveRequest records.

**Indexes**: Unique index on `scholarNumber`, unique index on `userId`.

**Business Rules**:
- `scholarNumber` is the primary public identifier (used in URLs like `/student/9876`)
- Student is linked to a Section, which determines their Class
- Soft deletion preserves historical data

---

### 7. Class

**Purpose**: Represents a grade level (e.g., "1", "2", "PG", "Nursery", "KG").

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | |
| `schoolId` | `String` | FK → School.id | |
| `name` | `String` | NOT NULL | Grade name: PG, Nursery, KG, 1–12 |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | Auto-updated | |

**Relations**: Has many Sections, Subjects, Notifications.

**Business Rules**:
- Classes are ordered in the UI using a hardcoded CASE statement: PG → Nursery → KG → 1 → ... → 12

---

### 8. Section

**Purpose**: A division within a class (e.g., Class 1 Section A, Class 1 Section B).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | |
| `classId` | `String` | FK → Class.id | Parent class |
| `name` | `String` | NOT NULL | Section name (A, B, C...) |
| `classTeacherId` | `String?` | FK → Teacher.id | Assigned class teacher |
| `subjectTeachers` | `String?` | Optional | JSON string mapping subject → {teacherId, teacherName} |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | Auto-updated | |

**Relations**: Has many Students, Timetable entries, Notifications.

**Business Rules**:
- `subjectTeachers` is stored as a JSON string (not a native JSON column)
- Parsed and updated via `JSON.parse()`/`JSON.stringify()` in the controller
- A section can have at most one class teacher

---

### 9. Attendance

**Purpose**: Daily attendance record per student.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | |
| `studentId` | `String` | FK → Student.id | |
| `date` | `DateTime` | NOT NULL | Date of attendance |
| `status` | `String` | NOT NULL | "PRESENT", "ABSENT", "LATE" |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | Auto-updated | |

**Indexes**: `@@unique([studentId, date])` — ensures one record per student per day.

**Business Rules**:
- Only one attendance record per student per calendar day (enforced at DB level)
- Uses UPSERT (`ON CONFLICT ... DO UPDATE`) for idempotent marking
- Batch insert via `UNNEST` for performance (all students in a section at once)

---

### 10. Fee

**Purpose**: Individual fee payment record.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String` | PK | |
| `studentId` | `String` | FK → Student.id | |
| `feeType` | `String` | NOT NULL | e.g., "tuition", "transport", "exam" |
| `feeTypeLabel` | `String` | NOT NULL | Human-readable label |
| `amount` | `Float` | NOT NULL | Amount in INR |
| `month` | `String` | NOT NULL | e.g., "April", "May" |
| `academicYear` | `String` | DEFAULT "2025-26" | |
| `status` | `String` | DEFAULT "paid" | "paid", "pending", "overdue" |
| `receiptNumber` | `String?` | UNIQUE, Optional | |
| `paidOn` | `DateTime?` | Optional | Payment date |
| `collectedById` | `String?` | Optional | User ID of collector |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | | |

**Indexes**: `@@unique([studentId, feeType, month, academicYear])` — one fee per type per month per student.

---

### 11. FeeStructure

**Purpose**: Template defining fee amounts for each class.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String` | PK | |
| `className` | `String` | NOT NULL | Grade name |
| `feeType` | `String` | NOT NULL | Fee category |
| `feeTypeLabel` | `String` | NOT NULL | Display label |
| `amount` | `Float` | DEFAULT 0 | Monthly amount in INR |
| `academicYear` | `String` | DEFAULT "2025-26" | |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | | |

**Indexes**: `@@unique([className, feeType, academicYear])`

---

### 12. Mark

**Purpose**: Exam scores for a student in a specific subject.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String` | PK | |
| `studentId` | `String` | FK → Student.id, CASCADE DELETE | |
| `subjectId` | `String` | FK → Subject.id, CASCADE DELETE | |
| `examType` | `String` | NOT NULL | e.g., "UNIT_TEST_1", "HALF_YEARLY", "FINAL" |
| `score` | `Float` | NOT NULL | Marks obtained |
| `maxScore` | `Float` | DEFAULT 100 | Maximum possible marks |
| `academicYear` | `String` | DEFAULT "2025-26" | |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | | |

**Indexes**: `@@unique([studentId, subjectId, examType, academicYear])`

**Business Rules**:
- Uses UPSERT for idempotent mark entry
- Marks entry is wrapped in a database transaction (BEGIN/COMMIT/ROLLBACK)
- Cascade delete: deleting a student or subject removes associated marks

---

### 13. Subject

**Purpose**: Academic subject linked to a specific class.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String` | PK | |
| `name` | `String` | NOT NULL | e.g., "Mathematics", "English" |
| `classId` | `String` | FK → Class.id, CASCADE DELETE | |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | | |

**Indexes**: `@@unique([name, classId])` — unique subject per class.

---

### 14. Notification

**Purpose**: School announcements and targeted notifications.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String` | PK | |
| `title` | `String` | NOT NULL | |
| `body` | `String` | NOT NULL | |
| `type` | `String` | DEFAULT "general" | Notification category |
| `targetClassId` | `String?` | FK → Class.id | If class-specific |
| `targetSectionId` | `String?` | FK → Section.id | If section-specific |
| `targetStudentId` | `String?` | FK → Student.id | If student-specific |
| `academicYear` | `String` | DEFAULT "2025-26" | |
| `createdById` | `String` | FK → User.id | Creator |
| `createdAt` | `DateTime` | DEFAULT now() | |

**Business Rules**:
- Notifications can target: all (no target IDs), a class, a section, or a specific student
- Recent 50 notifications returned by default

---

### 15. NotificationRead

**Purpose**: Tracks which students have read which notifications.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `notificationId` | `String` | PK (composite), FK → Notification.id, CASCADE DELETE | |
| `studentId` | `String` | PK (composite), FK → Student.id, CASCADE DELETE | |
| `readAt` | `DateTime` | DEFAULT now() | When the student read it |

**Indexes**: Composite primary key `@@id([notificationId, studentId])`

---

### 16. StudentApplication

**Purpose**: Pending student enrollment applications submitted via the public form.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | |
| `firstName` | `String` | NOT NULL | |
| `lastName` | `String` | NOT NULL | |
| `scholarNumber` | `String` | UNIQUE | Pre-assigned by admin |
| `classApplying` | `String` | NOT NULL | Target class |
| `section` | `String?` | Optional | Target section |
| `rollNumber` | `String?` | Optional | |
| `dob` | `String` | NOT NULL | Date of birth (stored as string) |
| `gender` | `String` | NOT NULL | |
| `fatherName` | `String` | NOT NULL | |
| `motherName` | `String` | NOT NULL | |
| `parentMobile` | `String` | NOT NULL | |
| `parentSecondaryMobile` | `String?` | Optional | |
| `parentEmail` | `String?` | Optional | |
| `address` | `String` | NOT NULL | |
| `aadhaarNumber` | `String?` | Optional | |
| `bloodGroup` | `String?` | Optional | |
| `profilePic` | `String?` | Optional | Cloudinary URL |
| `status` | `String` | DEFAULT "PENDING" | PENDING → APPROVED / REJECTED |
| `createdAt` | `DateTime` | DEFAULT now() | |

**Business Rules**:
- On approval, the service creates: User (STUDENT role), Student record, Parent record, and links them
- Scholar number is pre-assigned and checked for duplicates before submission

---

### 17. TeacherApplication

**Purpose**: Pending teacher job applications.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String` | PK | |
| `firstName` | `String` | NOT NULL | |
| `lastName` | `String` | NOT NULL | |
| `email` | `String` | UNIQUE | |
| `phone` | `String` | NOT NULL | |
| `qualification` | `String?` | Optional | |
| `experience` | `String?` | Optional | |
| `subject` | `String` | NOT NULL | |
| `address` | `String?` | Optional | |
| `classes` | `String?` | Optional | |
| `profilePic` | `String?` | Optional | |
| `status` | `String` | DEFAULT "PENDING" | |
| `createdAt` | `DateTime` | DEFAULT now() | |

**Business Rules**:
- On approval, creates User (TEACHER role) + Teacher record
- Email checked for duplicates

---

### 18. Timetable

**Purpose**: Weekly class schedule linking sections, subjects, and teachers to time periods.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String` | PK | |
| `sectionId` | `String` | FK → Section.id, CASCADE DELETE | |
| `day` | `String` | NOT NULL | e.g., "Monday", "Tuesday" |
| `period` | `Int` | NOT NULL | Period number (1, 2, 3...) |
| `teacherId` | `String?` | FK → Teacher.id | |
| `subjectId` | `String?` | FK → Subject.id | |
| `academicYear` | `String` | DEFAULT "2025-26" | |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | | |

**Indexes**: `@@unique([sectionId, day, period, academicYear])`

---

### 19. LeaveRequest

**Purpose**: Leave applications from students or teachers.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | |
| `studentId` | `String?` | FK → Student.id | If student leave |
| `teacherId` | `String?` | FK → Teacher.id | If teacher leave |
| `type` | `String` | NOT NULL | e.g., "SICK", "CASUAL", "EMERGENCY" |
| `fromDate` | `DateTime` | NOT NULL | |
| `toDate` | `DateTime` | NOT NULL | |
| `totalDays` | `Int` | NOT NULL, min 1 | |
| `reason` | `String` | NOT NULL, max 150 chars | |
| `attachmentUrl` | `String?` | Optional | Medical certificate etc. (Cloudinary) |
| `status` | `String` | DEFAULT "PENDING" | PENDING → APPROVED / REJECTED |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | Auto-updated | |

**Business Rules**:
- Either `studentId` OR `teacherId` is set, never both
- Input validated via Zod schema (reason max 150 chars, totalDays ≥ 1)

---

### 20. Complaint

**Purpose**: Grievance/complaint submissions from students and teachers.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | `String (UUID)` | PK | |
| `subject` | `String` | NOT NULL | Complaint subject line |
| `description` | `String` | NOT NULL | Detailed description |
| `isAnonymous` | `Boolean` | DEFAULT false | Whether identity is hidden |
| `role` | `Role (enum)` | NOT NULL | STUDENT or TEACHER |
| `applicantId` | `String` | NOT NULL | Student.id or Teacher.id |
| `status` | `String` | DEFAULT "UNSEEN" | UNSEEN → SEEN → RESOLVED |
| `createdAt` | `DateTime` | DEFAULT now() | |
| `updatedAt` | `DateTime` | Auto-updated | |

**Business Rules**:
- Students CAN submit anonymously; Teachers CANNOT (forced to `false`)
- Principal sees all complaints; anonymous ones show "Anonymous Student"
- Status progression: UNSEEN → SEEN → RESOLVED

---

## Role Enum

```sql
CREATE TYPE "Role" AS ENUM (
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'PRINCIPAL',
  'TEACHER',
  'STUDENT',
  'PARENT',
  'ACCOUNTANT'
);
```
