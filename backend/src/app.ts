import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import rateLimit from 'express-rate-limit';

const app = express();

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased from 300 to allow multiple users on same IP
  message: { error: 'Too many requests from this IP, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // Increased from 30 to allow multiple users on same IP to login
  message: { error: 'Too many login attempts, please try again later' }
});

// Security and utility middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use('/api', globalLimiter);

import staffRoutes from './routes/staff.routes';
import studentRoutes from './routes/student.routes';
import teacherRoutes from './routes/teacher.routes';
import parentRoutes from './routes/parent.routes';
import statsRoutes from './routes/stats.routes';
import classesRoutes from './routes/classes.routes';
import attendanceRoutes from './routes/attendance.routes';
import uploadRoutes from './routes/upload.routes';
import marksRoutes from './routes/marks.routes';
import subjectRoutes from './routes/subject.routes';
import notificationsRoutes from './routes/notifications.routes';
import leaveRoutes from './routes/leave.routes';
import complaintRoutes from './routes/complaint.routes';

// Routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/complaints', complaintRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ERP API is running' });
});

// Error handling middleware (will be expanded)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
