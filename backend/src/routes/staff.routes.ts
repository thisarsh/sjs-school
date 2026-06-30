import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// We need to disable TypeScript errors for req/res if types are incomplete, but let's just type them correctly.
router.post('/create', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Securely create user bypassing sign-up flow
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role }
    });

    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }

    // The database trigger handles inserting into `profiles`.
    res.status(201).json({ message: 'Staff account created successfully', user: authData.user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
