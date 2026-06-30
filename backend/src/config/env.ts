export function validateEnv(): void {
  const requiredEnvVars = [
    'JWT_SECRET',
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    console.error('❌ Missing critical environment variables:', missingVars.join(', '));
    process.exit(1);
  }
}
