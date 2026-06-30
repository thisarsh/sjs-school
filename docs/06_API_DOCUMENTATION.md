# SJS School ERP — API Endpoint Documentation

This document describes all API endpoints exposed by the SJS School ERP backend.

* **Base URL**: `http://localhost:5000/api` (default)
* **Auth Scheme**: Bearer Token in `Authorization` header (`Authorization: Bearer <JWT_TOKEN>`)

---

## 1. Authentication Module

### POST `/auth/login`
Authenticates a user and returns a JSON Web Token.
* **Type**: Public (with rate limiting: max 30 requests/15 mins)
* **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "u1-uuid-value",
      "email": "user@example.com",
      "role": "TEACHER"
    }
  }
  ```
* **Validation / Error Responses**:
  * `401 Unauthorized`: `"Invalid credentials"`
  * `429 Too Many Requests`: `"Too many login attempts, please try again later"`

### POST `/auth/refresh`
Stubs token refresh logic.
* **Type**: Public
* **Success Response (200 OK)**:
  ```json
  { "message": "Token refreshed" }
  ```

### POST `/auth/logout`
Stubs logout (stateless).
* **Type**: Protected
* **Success Response (200 OK)**:
  ```json
  { "message": "Logged out successfully" }
  ```

---

## 2. Students Module

### GET `/students/check-scholar-number`
Checks if a scholar number is already taken.
* **Type**: Public
* **Query Parameters**:
  * `scholarNumber`: `string` (Required)
* **Success Response (200 OK)**:
  ```json
  { "isDuplicate": true }
  ```

### POST `/students/apply`
Public submission of a student application.
* **Type**: Public
* **Request Body** (Zod validated):
  ```json
  {
    "firstName": "Rahul",
    "lastName": "Sharma",
    "scholarNumber": "12345",
    "classApplying": "10",
    "section": "A",
    "rollNumber": "12",
    "dob": "2012-05-14T00:00:00.000Z",
    "gender": "Male",
    "fatherName": "Amit Sharma",
    "motherName": "Sunita Sharma",
    "parentMobile": "9876543210",
    "parentSecondaryMobile": "9876543211",
    "parentEmail": "amit@example.com",
    "address": "123 Street Name",
    "aadhaarNumber": "123456789012",
    "bloodGroup": "O+",
    "profilePic": "http://cloudinary..."
  }
  ```
* **Success Response (201 Created)**:
  * Returns the newly created `StudentApplication` object.

### GET `/students/applications`
Lists all pending applications.
* **Type**: Protected (`requireRole(['TEACHER', 'PRINCIPAL'])`)
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "app-uuid",
      "firstName": "Rahul",
      "status": "PENDING",
      ...
    }
  ]
  ```

### POST `/students/applications/:id/approve`
Approves a student application, auto-generating their User, Student, and Parent accounts.
* **Type**: Protected (`requireRole(['TEACHER', 'PRINCIPAL'])`)
* **Success Response (200 OK)**:
  ```json
  {
    "message": "Application approved successfully",
    "student": { ... },
    "parent": { ... }
  }
  ```

### POST `/students/applications/:id/reject`
Rejects an application.
* **Type**: Protected (`requireRole(['TEACHER', 'PRINCIPAL'])`)
* **Success Response (200 OK)**:
  ```json
  { "message": "Application rejected" }
  ```

---

## 3. Teachers Module

### POST `/teachers/apply`
Public submission of a teaching application.
* **Type**: Public
* **Request Body** (Zod validated):
  ```json
  {
    "firstName": "Arun",
    "lastName": "Kumar",
    "email": "arun@example.com",
    "phone": "9876543210",
    "qualification": "B.Ed, M.Sc",
    "experience": "5 Years",
    "subject": "Mathematics",
    "address": "456 Main Rd",
    "classes": "9-A, 10-B",
    "profilePic": "http://cloudinary..."
  }
  ```
* **Success Response (210 Created)**:
  ```json
  { "message": "Application submitted successfully", "application": { ... } }
  ```

---

## 4. Attendance Module

### POST `/attendance`
Mark daily attendance for a batch of students.
* **Type**: Protected (`requireRole(['TEACHER', 'PRINCIPAL'])`)
* **Request Body**:
  ```json
  {
    "attendanceData": [
      { "studentId": "stud-uuid-1", "status": "PRESENT" },
      { "studentId": "stud-uuid-2", "status": "ABSENT" }
    ]
  }
  ```
* **Success Response (200 OK)**:
  * Returns an array of upserted `Attendance` objects.

### POST `/attendance/register`
Retrieve the attendance register for a group of students within a date range.
* **Type**: Protected
* **Request Body**:
  ```json
  {
    "studentIds": ["stud-uuid-1", "stud-uuid-2"],
    "startDate": "2026-06-01T00:00:00.000Z",
    "endDate": "2026-06-30T00:00:00.000Z"
  }
  ```
* **Success Response (200 OK)**:
  * Returns an array of matched `Attendance` records.

---

## 5. Marks Module

### POST `/marks`
Upsert scores for multiple students in a subject/exam.
* **Type**: Protected (`requireRole(['PRINCIPAL', 'TEACHER', 'SUPER_ADMIN'])`)
* **Request Body**:
  ```json
  {
    "marksData": [
      {
        "studentId": "stud-uuid-1",
        "subjectId": "subj-uuid-1",
        "examType": "UNIT_TEST_1",
        "score": 85.5,
        "maxScore": 100,
        "academicYear": "2025-26"
      }
    ]
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "message": "Marks saved successfully",
    "results": [ ... ]
  }
  ```

---

## 6. Leave Module

### POST `/leave`
Submit a new leave application.
* **Type**: Protected (`requireRole(['STUDENT', 'TEACHER'])`)
* **Request Body**:
  ```json
  {
    "type": "SICK",
    "fromDate": "2026-07-01T00:00:00.000Z",
    "toDate": "2026-07-03T00:00:00.000Z",
    "totalDays": 3,
    "reason": "Recovering from viral fever",
    "attachmentUrl": "http://cloudinary..."
  }
  ```
* **Success Response (200 OK)**:
  * Returns the newly created `LeaveRequest` record.

### POST `/leave/:id/status`
Approve or reject a leave request.
* **Type**: Protected (`requireRole(['PRINCIPAL', 'SUPER_ADMIN'])`)
* **Request Body**:
  ```json
  { "status": "APPROVED" } // or "REJECTED"
  ```
* **Success Response (200 OK)**:
  * Returns the updated `LeaveRequest` record.

---

## 7. Complaints Module

### POST `/complaints`
Submit a complaint. Students can toggle anonymity.
* **Type**: Protected (`requireRole(['STUDENT', 'TEACHER'])`)
* **Request Body**:
  ```json
  {
    "subject": "Inoperative water coolers",
    "description": "The first-floor water coolers are broken.",
    "isAnonymous": true
  }
  ```
* **Success Response (201 Created)**:
  * Returns the newly created `Complaint` record.

### POST `/complaints/:id/status`
Update complaint status (seen/resolved).
* **Type**: Protected (`requireRole(['PRINCIPAL', 'SUPER_ADMIN'])`)
* **Request Body**:
  ```json
  { "status": "SEEN" } // UNSEEN, SEEN, RESOLVED
  ```
* **Success Response (200 OK)**:
  * Returns the updated `Complaint` record.

---

## 8. Upload Module

### POST `/upload`
Upload a profile picture or file to Cloudinary.
* **Type**: Public (Multer memory upload)
* **Form Data**:
  * Key: `image` (File object)
* **Success Response (200 OK)**:
  ```json
  {
    "url": "https://res.cloudinary.com/..."
  }
  ```
