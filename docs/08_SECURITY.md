# SJS School ERP — Security Specifications

This document outlines the security controls, validations, and measures implemented in the SJS School ERP to protect user data and ensure secure access.

---

## 1. Authentication Security

- **JWT Tokens**: Access tokens are signed using the `HS256` algorithm via the `jsonwebtoken` package.
- **Expiry**: Tokens expire exactly **24 hours** after generation, minimizing the window of opportunity for intercepted tokens.
- **Hashing**: Passwords are never stored in plain text. They are hashed using **bcrypt** with a work factor of **10 salt rounds**.
- **Rate Limiting**:
  - Global API: Limit set to **300 requests per 15 minutes** per IP.
  - Auth Endpoints: `/api/auth/login` is limited to **30 requests per 15 minutes** per IP to prevent brute-force attacks.

---

## 2. Authorization (RBAC)

- **Role-Based Access Control (RBAC)**: Enforced via the `requireRole` middleware on the backend:
  ```typescript
  export const requireRole = (roles: Role[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  };
  ```
- **Context Isolation**: For student endpoints (e.g., retrieving marks or profile details), the API validates that the requested `studentId` belongs to the logged-in user context before returning records.

---

## 3. Data Protection

- **Parameterized Queries**: Since the application uses raw SQL via `node-postgres` instead of Prisma runtime queries, all database operations utilize parameterized queries (e.g., `$1, $2, $3`) rather than string concatenation. This provides **SQL Injection (SQLi) protection**.
- **SSL Connections**: Database traffic is forced over SSL/TLS:
  ```typescript
  ssl: { rejectUnauthorized: false }
  ```
- **Helmet**: Helmet middleware is active, configuring standard HTTP response security headers (CSP, HSTS, X-Frame-Options, etc.).

---

## 4. File Upload Security

- **Memory Storage**: Multer uses memory storage rather than disk storage, preventing malicious scripts from being uploaded to the backend directory.
- **Type Checking**: File uploads validate the MIME type:
  ```typescript
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  ```
- **File Size Restrictions**: Maximum file upload sizes are restricted on `/api/upload` to **10 MB** to mitigate Denial of Service (DoS) attacks via large uploads.
- **Cloudinary CDN**: Uploaded profiles are hosted on Cloudinary, isolating target execution of media assets.
