import { Request, Response } from 'express';
import { StudentService } from '../services/student.service';
import { z } from 'zod';
import { handleError } from '../utils/errorHandler';
import { parsePaginationParams, formatPaginatedResponse } from '../utils/pagination';

const CreateStudentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  schoolId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  scholarNumber: z.string().min(1),
  dob: z.string().datetime().optional()
});

export class StudentController {
  private studentService: StudentService;

  constructor() {
    this.studentService = new StudentService();
  }

  apply = async (req: Request, res: Response) => {
    try {
      const application = await this.studentService.apply(req.body);
      res.status(201).json(application);
    } catch (error: any) {
      console.error('Apply error:', error);
      handleError(res, error);
    }
  };

  checkScholarNumber = async (req: Request, res: Response) => {
    try {
      const { scholarNumber } = req.query;
      if (!scholarNumber) {
        return res.status(400).json({ error: 'Scholar number is required' });
      }

      const existingStudent = await this.studentService.checkScholarNumber(scholarNumber as string);
      res.status(200).json({ isDuplicate: existingStudent });
    } catch (error: any) {
      handleError(res, error);
    }
  };

  getApplications = async (req: Request, res: Response) => {
    try {
      const pageParams = parsePaginationParams(req);
      const { rows, totalRecords } = await this.studentService.getApplications(pageParams.limit, pageParams.offset);
      res.status(200).json(formatPaginatedResponse(rows, totalRecords, pageParams));
    } catch (error: any) {
      handleError(res, error);
    }
  };

  approveApplication = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const result = await this.studentService.approveApplication(req.params.id as string, user);
      res.status(200).json(result);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  rejectApplication = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const result = await this.studentService.rejectApplication(req.params.id as string, user);
      res.status(200).json(result);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const pageParams = parsePaginationParams(req);
      const { rows, totalRecords } = await this.studentService.getAllStudents(pageParams.limit, pageParams.offset);
      res.status(200).json(formatPaginatedResponse(rows, totalRecords, pageParams));
    } catch (error: any) {
      handleError(res, error);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const student = await this.studentService.getStudentById(req.params.id as string);
      if (!student) return res.status(404).json({ error: 'Student not found' });
      res.status(200).json(student);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  getMe = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      if (!user || !user.userId) return res.status(401).json({ error: 'Unauthorized' });
      const student = await this.studentService.getStudentByUserId(user.userId);
      if (!student) return res.status(404).json({ error: 'Student profile not found' });
      res.status(200).json(student);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateStudentSchema.parse(req.body);
      const student = await this.studentService.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error: any) {
      if (error && typeof error === 'object' && 'errors' in error) {
        return res.status(400).json({ error: error.errors });
      }
      handleError(res, error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const student = await this.studentService.updateStudent(req.params.id as string, req.body);
      res.status(200).json(student);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.studentService.deleteStudent(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      handleError(res, error);
    }
  };
}
