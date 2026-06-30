# SJS School ERP — Deployment & Infrastructure Configuration

This document describes how to deploy and configure SJS School ERP in a production environment.

---

## 1. Environment Variables

Create `.env` files in both the frontend and backend directories.

### Backend `.env`
```env
PORT=5000
DATABASE_URL="postgresql://postgres:your-db-password@db.supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="generate-a-long-secure-random-key"
CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
CLOUDINARY_API_KEY="your-cloudinary-key"
CLOUDINARY_API_SECRET="your-cloudinary-secret"
SUPABASE_URL="https://your-supabase-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-for-admin-operations"
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"
```

---

## 2. Infrastructure Deployment Steps

### Database Deployment (Supabase / Postgres)
1. Provision a PostgreSQL instance.
2. Run database migrations from the backend directory:
   ```bash
   npx prisma db push
   ```
3. Run the static class structure seed script:
   ```bash
   npm run seed
   ```

### Backend Deployment (e.g., Render, Railway, AWS EC2)
1. Configure host setting to build using the command:
   ```bash
   npm run build
   ```
   *(Note: Ensure TypeScript is compiled using `tsc`)*
2. Start script:
   ```bash
   node dist/server.js
   ```
3. Set the database connection pool settings depending on the size of the server instance (default is `max: 30`).

### Frontend Deployment (e.g., Vercel, Netlify, Cloudflare Pages)
1. Build command:
   ```bash
   npm run build
   ```
2. Output directory: `.next`
3. Expose the API server domain in `NEXT_PUBLIC_API_URL`.

---

## 3. Storage Setup (Cloudinary)
1. Log in to your Cloudinary dashboard.
2. Under "Settings", verify that upload presets are not required, or verify that files uploaded to `erp_profiles` are default format `webp` with auto quality to save delivery bandwidth.
