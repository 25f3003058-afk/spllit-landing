import { z } from 'zod';

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters')
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

export const firebaseLoginSchema = z.object({
  idToken: z.string().min(1, 'ID token required'),
  email: z.string().email('Invalid email format').optional(),
  name: z.string().optional(),
  photo: z.string().url().optional()
});

export const googleLoginSchema = z.object({
  code: z.string().min(1, 'Authorization code required'),
  redirectUri: z.string().url('Invalid redirect URI')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required')
});

// Query schemas
export const rideSearchSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  date: z.string().optional(),
  maxDistance: z.number().optional(),
  limit: z.number().default(10).max(100),
  offset: z.number().default(0)
});

export const userProfileSchema = z.object({
  userId: z.string().uuid('Invalid user ID')
});

export const announcementQuerySchema = z.object({
  limit: z.number().default(20).max(100),
  offset: z.number().default(0),
  role: z.enum(['user', 'subadmin', 'admin']).optional()
});
