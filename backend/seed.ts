import pool from './src/config/prisma';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create Super Admin user
    await pool.query(
      `INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
       VALUES (gen_random_uuid(), $1, $2, 'SUPER_ADMIN', NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      ['admin@sjs', hashedPassword]
    );

    // Create a Principal user
    const principalPassword = await bcrypt.hash('principal123', 10);
    await pool.query(
      `INSERT INTO "User" (id, email, password, role, "createdAt", "updatedAt") 
       VALUES (gen_random_uuid(), $1, $2, 'PRINCIPAL', NOW(), NOW())
       ON CONFLICT (email) DO NOTHING`,
      ['principal@sjs', principalPassword]
    );

    console.log('✅ Seed complete!');
    console.log('   Login as Super Admin: admin@sjs / admin123');
    console.log('   Login as Principal: principal@sjs / principal123');
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

seed();
