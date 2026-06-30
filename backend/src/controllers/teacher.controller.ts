import { Request, Response } from 'express';
import { TeacherService } from '../services/teacher.service';
import { z } from 'zod';
import { handleError } from '../utils/errorHandler';
import { parsePaginationParams, formatPaginatedResponse } from '../utils/pagination';

const CreateTeacherSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  schoolId: z.string().uuid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional()
});

const ApplyTeacherSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^[1-9][0-9]{9}$/, "Phone number must be strictly 10 digits (no starting 0 or +91)"),
  address: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  subject: z.string().min(1),
  classes: z.string().optional(),
  profilePic: z.string().optional()
});

const UpdateTeacherMeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().regex(/^[1-9][0-9]{9}$/, "Phone number must be strictly 10 digits (no starting 0 or +91)").optional(),
  address: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  subject: z.string().optional(),
  classes: z.string().optional(),
  profilePic: z.string().optional()
});

export class TeacherController {
  private teacherService: TeacherService;

  constructor() {
    this.teacherService = new TeacherService();
  }

  getMe = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const teacher = await this.teacherService.getMe(userId);
      res.status(200).json(teacher);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  updateMe = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const validatedData = UpdateTeacherMeSchema.parse(req.body);
      const teacher = await this.teacherService.updateTeacherMe(userId, validatedData);
      res.status(200).json(teacher);
    } catch (error: any) {
      if (error && typeof error === 'object' && 'errors' in error) {
        return res.status(400).json({ error: error.errors });
      }
      handleError(res, error);
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const pageParams = parsePaginationParams(req);
      const { rows, totalRecords } = await this.teacherService.getAllTeachers(pageParams.limit, pageParams.offset);
      res.status(200).json(formatPaginatedResponse(rows, totalRecords, pageParams));
    } catch (error: any) {
      handleError(res, error);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const teacher = await this.teacherService.getTeacherById(req.params.id as string);
      if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
      res.status(200).json(teacher);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateTeacherSchema.parse(req.body);
      const teacher = await this.teacherService.createTeacher(validatedData);
      res.status(201).json(teacher);
    } catch (error: any) {
      if (error && typeof error === 'object' && 'errors' in error) {
        return res.status(400).json({ error: error.errors });
      }
      handleError(res, error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const teacher = await this.teacherService.updateTeacher(req.params.id as string, req.body);
      res.status(200).json(teacher);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.teacherService.deleteTeacher(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      handleError(res, error);
    }
  };

  // --- Teacher Application Workflow ---

  apply = async (req: Request, res: Response) => {
    try {
      const validatedData = ApplyTeacherSchema.parse(req.body);
      const application = await this.teacherService.applyForTeaching(validatedData);
      res.status(201).json({ message: 'Application submitted successfully', application });
    } catch (error: any) {
      if (error && typeof error === 'object' && 'errors' in error) {
        return res.status(400).json({ error: error.errors });
      }
      if (error.message === 'DUPLICATE_EMAIL') {
        return res.status(409).json({ error: 'DUPLICATE_EMAIL', message: 'Email already exists. Please wait for response.' });
      }
      handleError(res, error);
    }
  };

  getApplications = async (req: Request, res: Response) => {
    try {
      const pageParams = parsePaginationParams(req);
      const { rows, totalRecords } = await this.teacherService.getApplications(pageParams.limit, pageParams.offset);
      res.status(200).json(formatPaginatedResponse(rows, totalRecords, pageParams));
    } catch (error: any) {
      handleError(res, error);
    }
  };

  approveApplication = async (req: Request, res: Response) => {
    try {
      const result = await this.teacherService.approveApplication(req.params.id as string);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  rejectApplication = async (req: Request, res: Response) => {
    try {
      const result = await this.teacherService.rejectApplication(req.params.id as string);
      res.status(200).json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
