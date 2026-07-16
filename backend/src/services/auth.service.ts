import pool from '../config/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  async login(email: string, password: string) {
    // Query user from database directly via pg
    const result = await pool.query(
      'SELECT id, email, password, role FROM "User" WHERE email = $1 AND "isDeleted" = false',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret
      // { expiresIn: '1d' } // Commented out to keep user logged in permanently
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }
}
