import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';

const router = Router();
const attendanceController = new AttendanceController();

router.get('/today', attendanceController.getTodayAttendance);
router.post('/', attendanceController.markAttendance);
router.post('/register', attendanceController.getAttendanceRegister);

export default router;
