import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'drivesense-prototype-secret-key-2026',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '24h') as any,
  dbPath: process.env.DB_PATH || './drivesense.db',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  passThreshold: parseInt(process.env.PASS_THRESHOLD || '70', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
