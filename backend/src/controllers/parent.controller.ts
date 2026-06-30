import { Request, Response } from 'express';
import { ParentService } from '../services/parent.service';
import { z } from 'zod';
import { handleError } from '../utils/errorHandler';
import { parsePaginationParams, formatPaginatedResponse } from '../utils/pagination';

const CreateParentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional()
});

export class ParentController {
  private parentService: ParentService;

  constructor() {
    this.parentService = new ParentService();
  }

  getAll = async (req: Request, res: Response) => {
    try {
      const pageParams = parsePaginationParams(req);
      const { rows, totalRecords } = await this.parentService.getAllParents(pageParams.limit, pageParams.offset);
      res.status(200).json(formatPaginatedResponse(rows, totalRecords, pageParams));
    } catch (error: any) {
      handleError(res, error);
    }
  };

  getById = async (req: Request, res: Response) => {
    try {
      const parent = await this.parentService.getParentById(req.params.id as string);
      if (!parent) return res.status(404).json({ error: 'Parent not found' });
      res.status(200).json(parent);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const validatedData = CreateParentSchema.parse(req.body);
      const parent = await this.parentService.createParent(validatedData);
      res.status(201).json(parent);
    } catch (error: any) {
      if (error && typeof error === 'object' && 'errors' in error) {
        return res.status(400).json({ error: error.errors });
      }
      handleError(res, error);
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const parent = await this.parentService.updateParent(req.params.id as string, req.body);
      res.status(200).json(parent);
    } catch (error: any) {
      handleError(res, error);
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      await this.parentService.deleteParent(req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      handleError(res, error);
    }
  };
}
