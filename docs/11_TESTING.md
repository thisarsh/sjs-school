# SJS School ERP — Verification & Testing Protocol

This document details how to verify, test, and audit the SJS School ERP application across all environments.

---

## 1. Manual Testing Scenarios

### A. Authentication & Gatekeeping
1. **Scenario**: Access Student dashboard without logging in.
   * **Test**: Navigate to `/student`.
   * **Result**: App should redirect immediately back to `/`.
2. **Scenario**: Unauthorized role access.
   * **Test**: Log in as a student, then navigate directly to `/principal`.
   * **Result**: Access is denied or redirects to student portal.

### B. Application Process
1. **Scenario**: Public applicant registers with existing scholar number.
   * **Test**: Open `/apply/student`, enter an existing scholar number, and trigger `onBlur`.
   * **Result**: UI displays a red warning: *"This scholar number is already registered"* and submission is disabled.
2. **Scenario**: Approve Student Application.
   * **Test**: Principal clicks "Approve" on a pending student application.
   * **Result**: Student is removed from pending applications. Log in using `scholarNumber@sjs.edu.in` and password `{scholarNumber}@sjs`. Login succeeds.

### C. Attendance & Marks
1. **Scenario**: Multiple submissions of today's attendance.
   * **Test**: Teacher marks section attendance twice on the same day.
   * **Result**: Verification in SQL table shows exactly 1 row updated per student instead of duplicate entries.
2. **Scenario**: Enter exam marks.
   * **Test**: Teacher submits a set of marks.
   * **Result**: Student dashboard displays updated scores for the corresponding subject.

---

## 2. Load and Stress Testing Recommendation

To satisfy the production requirement of **100+ requests simultaneously**:
* **Tools**: Use `autocannon` or `k6` to benchmark auth and stats routes.
* **Command Example (Autocannon)**:
  ```bash
  npx autocannon -c 100 -d 10 http://localhost:5000/health
  ```
* **Performance Check**: The database connection pool size of **30** should handle concurrent requests without dropping connection packets.
