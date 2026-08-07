import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Reads a signing secret, refusing to fall back to a literal in production.
 *
 * These previously defaulted to 'fallback-secret-change-in-production' and
 * 'fallback-refresh-secret'. A deploy that forgot to set JWT_SECRET therefore
 * signed every token with a string committed to this repository — anyone
 * reading it could mint a token for any user id and be authenticated as them.
 * It failed silently, which is the worst property an auth secret can have.
 *
 * Development keeps a generated value so a fresh clone runs without setup; it
 * is random per process, so tokens simply stop working on restart rather than
 * being forgeable.
 */
function requiredSecret(name: string): string {
  const value = process.env[name];
  if (value && value.length >= 16) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${name} is missing or too short (need 16+ chars). Refusing to start with a guessable signing key.`,
    );
  }

  console.warn(`[security] ${name} unset — using a random per-process value for development.`);
  return randomBytes(32).toString('hex');
}

const JWT_SECRET = requiredSecret('JWT_SECRET');
const JWT_REFRESH_SECRET = requiredSecret('JWT_REFRESH_SECRET');

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Hash phone number for privacy (one-way hash)
 */
export function hashPhone(phone: string): string {
  /**
   * The pepper must be stable — it is baked into every stored phoneHash, so a
   * value that changes orphans every existing row. It therefore falls back to
   * JWT_SECRET (also stable per deploy) rather than to a random value, and only
   * refuses to guess in production.
   */
  const pepper = process.env.PHONE_HASH_PEPPER || process.env.JWT_SECRET;
  if (!pepper) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('PHONE_HASH_PEPPER (or JWT_SECRET) must be set — refusing to hash phones with a literal.');
    }
    return createHash('sha256').update(`dev-pepper:${phone}`).digest('hex');
  }
  return createHash('sha256').update(`${pepper}:${phone}`).digest('hex');
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(userId: string, email: string): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(userId: string): string {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(
    { userId },
    JWT_REFRESH_SECRET,
    { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
  );
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): { userId: string; email: string } {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify JWT refresh token
 */
export function verifyRefreshToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Same measurement in metres.
 *
 * Exists because `calculateDistance` returns kilometres and several callers
 * assumed metres — comparing its result against `radiusKm * 1000` silently
 * disabled the filter, and labelling it `distanceMetres` reported 5 km as
 * "5 m away". Use this whenever the consumer wants metres, rather than
 * multiplying at the call site and getting it wrong again.
 */
export function calculateDistanceMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateDistance(lat1, lon1, lat2, lon2) * 1000;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if two times are within specified minutes of each other
 */
export function isTimeWithinWindow(
  time1: Date,
  time2: Date,
  windowMinutes: number
): boolean {
  const diffMs = Math.abs(time1.getTime() - time2.getTime());
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes <= windowMinutes;
}

/**
 * Sanitize user object (remove sensitive data)
 */
export function sanitizeUser(user: any) {
  const { password, phoneHash, ...sanitized } = user;
  return sanitized;
}
