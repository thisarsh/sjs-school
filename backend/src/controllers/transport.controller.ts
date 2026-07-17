import { Request, Response } from 'express';
import pool from '../config/prisma';
import { handleError } from '../utils/errorHandler';

export class TransportController {
  async getTransports(req: Request, res: Response) {
    try {
      const result = await pool.query(
        `SELECT * FROM "Transport" ORDER BY "createdAt" DESC`
      );
      res.status(200).json({ data: result.rows });
    } catch (error: any) {
      console.error('Error in getTransports:', error);
      handleError(res, error);
    }
  }

  async createTransport(req: Request, res: Response) {
    try {
      const { type, name, route, vehicleNumber, driverName, driverPhone, conductorName, conductorPhone } = req.body;

      if (!type) {
        return res.status(400).json({ error: 'Vehicle type is required' });
      }

      const result = await pool.query(
        `INSERT INTO "Transport" (id, type, name, route, "vehicleNumber", "driverName", "driverPhone", "conductorName", "conductorPhone", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING *`,
        [
          type,
          name || null,
          route || null,
          vehicleNumber || null,
          driverName || null,
          driverPhone || null,
          conductorName || null,
          conductorPhone || null
        ]
      );

      res.status(201).json({ data: result.rows[0] });
    } catch (error: any) {
      console.error('Error in createTransport:', error);
      handleError(res, error);
    }
  }

  async updateTransport(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { type, name, route, vehicleNumber, driverName, driverPhone, conductorName, conductorPhone } = req.body;

      if (!type) {
        return res.status(400).json({ error: 'Vehicle type is required' });
      }

      const result = await pool.query(
        `UPDATE "Transport"
         SET type = $1, name = $2, route = $3, "vehicleNumber" = $4, "driverName" = $5, "driverPhone" = $6, "conductorName" = $7, "conductorPhone" = $8, "updatedAt" = NOW()
         WHERE id = $9
         RETURNING *`,
        [
          type,
          name || null,
          route || null,
          vehicleNumber || null,
          driverName || null,
          driverPhone || null,
          conductorName || null,
          conductorPhone || null,
          id
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transport vehicle not found' });
      }

      res.status(200).json({ data: result.rows[0] });
    } catch (error: any) {
      console.error('Error in updateTransport:', error);
      handleError(res, error);
    }
  }

  async deleteTransport(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `DELETE FROM "Transport" WHERE id = $1 RETURNING *`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transport vehicle not found' });
      }

      res.status(200).json({ message: 'Transport vehicle deleted successfully', data: result.rows[0] });
    } catch (error: any) {
      console.error('Error in deleteTransport:', error);
      handleError(res, error);
    }
  }
}
