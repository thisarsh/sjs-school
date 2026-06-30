# SJS School ERP — Performance and Scaling Optimization

This document outlines the performance features and scalability strategies built into the SJS School ERP architecture to handle high concurrent requests.

---

## 1. Database Connection Pooling

- **Max Connections**: The pg connection pool is configured to hold up to **30 active database connections**:
  ```typescript
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 30,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  ```
- **Idle Timeout**: Unused connections are kept alive for **30 seconds** before being safely disposed of.
- **Connection Timeout**: Request fails after **5 seconds** if a database connection cannot be acquired, protecting Express event loops from blocking.

---

## 2. Optimized Batch Queries

- **Batch Attendance Marking**: Instead of executing $N$ queries for $N$ students, the service maps lists of student IDs and statuses to insert or update daily records using a single `UNNEST` SQL operation:
  ```sql
  INSERT INTO "Attendance" (id, "studentId", date, status, "createdAt", "updatedAt")
  SELECT gen_random_uuid(), s_id, $1, stat, NOW(), NOW()
  FROM unnest($2::text[], $3::text[]) AS t(s_id, stat)
  ON CONFLICT ("studentId", date) DO UPDATE 
  SET status = EXCLUDED.status, "updatedAt" = NOW()
  ```
- **Transaction Bundling**: Marks upsert uses a transaction scope (`BEGIN`, `COMMIT`, `ROLLBACK`) on a single database client to insert arrays of scores safely without database lockups.

---

## 3. Database Indexing Suggestions

For production scalability to 10k+ students, the following indexes are configured or recommended:
- **Enforced Indexes**:
  - `User(email)` (Unique B-Tree)
  - `Student(scholarNumber)` (Unique B-Tree)
  - `Attendance(studentId, date)` (Unique Composite Index)
  - `Mark(studentId, subjectId, examType, academicYear)` (Unique Composite Index)
- **Recommended Performance Indexes**:
  - `CREATE INDEX idx_student_section ON "Student" ("sectionId")`
  - `CREATE INDEX idx_attendance_date ON "Attendance" ("date")`

---

## 4. Frontend Optimization

- **Turbopack**: Uses Turbopack for compilation speed during development.
- **Image Optimization**: Frontend employs dynamic client-side image cropping via `react-image-crop` to resize pictures before upload, minimizing bandwidth and Cloudinary storage usage.
- **API Cache**: Caches fetched student details and profile states using React Query defaults, eliminating redundant network calls during page transitions.
