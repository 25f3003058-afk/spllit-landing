import { verify } from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  email?: string;
  phone?: string;
  role?: string;
  iat: number;
  exp: number;
}

export async function verifyJWT(
  token: string,
  secret: string
): Promise<AuthPayload | null> {
  try {
    const decoded = verify(token, secret) as AuthPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function corsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  };
}

export async function handleCorsPreFlight(origin?: string) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin)
  });
}
