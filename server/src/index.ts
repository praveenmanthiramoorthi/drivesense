import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { initializeSchema } from './database/schema';
import { seedDatabase } from './database/seed';

// Route imports
import authRoutes from './routes/auth.routes';
import applicantRoutes from './routes/applicant.routes';
import learnerTestRoutes from './routes/learnerTest.routes';
import bookingRoutes from './routes/booking.routes';
import rtoRoutes from './routes/rto.routes';
import videoRoutes from './routes/video.routes';
import aiAnalysisRoutes from './routes/aiAnalysis.routes';
import evaluationRoutes from './routes/evaluation.routes';
import reviewRoutes from './routes/review.routes';
import auditRoutes from './routes/audit.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.resolve(config.uploadDir)));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/applicant', applicantRoutes);
app.use('/api/learner-test', learnerTestRoutes);
app.use('/api/booking', bookingRoutes);
app.use('/api/rto', rtoRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'DriveSense AI Backend', timestamp: new Date().toISOString() });
});

// Initialize database and start server
async function start() {
  try {
    initializeSchema();
    await seedDatabase();

    app.listen(config.port, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════╗');
      console.log('║       🚗 DriveSense AI — Backend        ║');
      console.log('╠══════════════════════════════════════════╣');
      console.log(`║  Server:  http://localhost:${config.port}          ║`);
      console.log(`║  API:     http://localhost:${config.port}/api      ║`);
      console.log('╚══════════════════════════════════════════╝');
      console.log('');
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
