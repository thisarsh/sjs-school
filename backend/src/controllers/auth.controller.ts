import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { handleError } from '../utils/errorHandler';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.status(200).json(result);
    } catch (error: any) {
      console.error("Login Error:", error);
      res.status(401).json({ error: error.message });
    }
  };

  refresh = async (req: Request, res: Response) => {
    try {
      // Logic for refresh token
      res.status(200).json({ message: 'Token refreshed' });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      // Logic for logout
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      handleError(res, error);
    }
  };
}
