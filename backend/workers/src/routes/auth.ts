import { Hono } from 'hono';
import { loginSchema, registerSchema, firebaseLoginSchema, refreshTokenSchema } from '../types/schemas';
import { errorResponse, jsonResponse } from '../utils/helpers';
import { corsHeaders } from '../middleware/auth';
import { z } from 'zod';

interface Env {
  RENDER_BACKEND_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ENVIRONMENT: string;
}

const authRouter = new Hono<{ Bindings: Env }>();

// Helper to proxy requests to Render backend
async function proxyToRender(
  env: Env,
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
) {
  const url = `${env.RENDER_BACKEND_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('Proxy error:', error);
    return { ok: false, status: 500, error: 'Backend unavailable' };
  }
}

// POST /auth/register
authRouter.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validated = registerSchema.parse(body);
    
    // Forward to Render backend
    const result = await proxyToRender(
      c.env,
      'POST',
      '/api/auth/register',
      {
        email: validated.email,
        password: validated.password,
        name: validated.name,
        phone: validated.phone
      }
    );

    if (!result.ok) {
      return errorResponse(
        result.data?.message || 'Registration failed',
        result.status
      );
    }

    return jsonResponse(result.data, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.errors);
    }
    console.error('Register error:', error);
    return errorResponse('Internal server error', 500);
  }
});

// POST /auth/login
authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validated = loginSchema.parse(body);
    
    // Forward to Render backend
    const result = await proxyToRender(
      c.env,
      'POST',
      '/api/auth/login',
      validated
    );

    if (!result.ok) {
      return errorResponse(
        result.data?.message || 'Login failed',
        result.status
      );
    }

    // Cache successful login response (1 minute)
    const response = jsonResponse(result.data, result.status);
    response.headers.set('Cache-Control', 'private, max-age=60');
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.errors);
    }
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
});

// POST /auth/firebase-login
authRouter.post('/firebase-login', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validated = firebaseLoginSchema.parse(body);
    
    // Forward to Render backend
    const result = await proxyToRender(
      c.env,
      'POST',
      '/api/auth/firebase-login',
      validated
    );

    if (!result.ok) {
      return errorResponse(
        result.data?.message || 'Firebase login failed',
        result.status
      );
    }

    return jsonResponse(result.data, result.status);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.errors);
    }
    console.error('Firebase login error:', error);
    return errorResponse('Internal server error', 500);
  }
});

// POST /auth/refresh-token
authRouter.post('/refresh-token', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validated = refreshTokenSchema.parse(body);
    
    // Forward to Render backend
    const result = await proxyToRender(
      c.env,
      'POST',
      '/api/auth/refresh-token',
      validated
    );

    if (!result.ok) {
      return errorResponse(
        result.data?.message || 'Token refresh failed',
        result.status
      );
    }

    return jsonResponse(result.data, result.status);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Validation failed', 400, error.errors);
    }
    console.error('Refresh token error:', error);
    return errorResponse('Internal server error', 500);
  }
});

// POST /auth/google
authRouter.post('/google', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input has authorization code
    if (!body.code) {
      return errorResponse('Authorization code required', 400);
    }
    
    // Forward to Render backend
    const result = await proxyToRender(
      c.env,
      'POST',
      '/api/auth/google',
      body
    );

    if (!result.ok) {
      return errorResponse(
        result.data?.message || 'Google login failed',
        result.status
      );
    }

    return jsonResponse(result.data, result.status);
  } catch (error) {
    console.error('Google login error:', error);
    return errorResponse('Internal server error', 500);
  }
});

export default authRouter;
