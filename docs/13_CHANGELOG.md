# SJS School ERP — Changelog

## [1.2.0] - 2026-06-29

### Added
- Created `ComingSoonModal` fallback component on frontend to cleanly handle unbuilt features.
- Configured dynamic API URL resolution via `process.env.NEXT_PUBLIC_API_URL` to replace hardcoded localhost strings.
- Implemented robust, standardized back buttons (`<-`) for better navigation inside the dashboard views.

### Changed
- Scaled backend database connection pool capacity to **30 concurrent connections** to meet the 100+ requests simultaneous load test target.
- Enhanced attendance insertion utilizing PostgreSQL `UNNEST` array operations for rapid transaction handling.

---

## [1.1.0] - 2026-06-28

### Added
- Implemented new Student and Teacher onboarding pipelines.
- Integrated Cloudinary storage solution for student and teacher profile picture attachments.
- Configured Helmet security headers and Morgan logging on the API gateway.
- Added Express-rate-limit to protect authentication endpoints from dictionary attacks.
- Built Parent portal view skeletons and Superadmin database backup SQL/CSV download utilities.

---

## [1.0.0] - 2026-06-20
- Initial stable release of SJS School ERP with base JWT authorization, basic student/teacher profiles, and class section hierarchies.
