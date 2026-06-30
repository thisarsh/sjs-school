import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { handleError } from '../utils/errorHandler';

const attendanceService = new AttendanceService();

export class AttendanceController {
  async getTodayAttendance(req: Request, res: Response) {
    try {
      const records = await attendanceService.getTodayAttendance();
      res.status(200).json(records);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async markAttendance(req: Request, res: Response) {
    try {
      const { attendanceData } = req.body;
      
      if (!attendanceData || !Array.isArray(attendanceData)) {
        return res.status(400).json({ error: 'attendanceData must be an array of { studentId, status }' });
      }

      const results = await attendanceService.markAttendance(attendanceData);
      res.status(200).json(results);
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getAttendanceRegister(req: Request, res: Response) {
    try {
      const { studentIds, startDate, endDate } = req.body;
      
      if (!studentIds || !Array.isArray(studentIds) || !startDate || !endDate) {
        return res.status(400).json({ error: 'studentIds array, startDate, and endDate are required' });
      }

      const records = await attendanceService.getAttendanceRegister(
        studentIds, 
        new Date(startDate), 
        new Date(endDate)
      );
      res.status(200).json(records);
    } catch (error: any) {
      handleError(res, error);
    }
  }
}
