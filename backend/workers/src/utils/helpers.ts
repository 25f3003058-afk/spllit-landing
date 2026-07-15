import { sign } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTokens(
  userId: string,
  email: string | undefined,
  secret: string,
  refreshSecret: string
) {
  const payload = {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000)
  };

  const accessToken = sign(payload, secret, { expiresIn: '1h' });
  const refreshToken = sign(payload, refreshSecret, { expiresIn: '7d' });

  return { accessToken, refreshToken };
}

export function jsonResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

export function errorResponse(
  message: string,
  status: number = 400,
  details?: any
) {
  return jsonResponse(
    {
      error: true,
      message,
      ...(details && { details })
    },
    status
  );
}
