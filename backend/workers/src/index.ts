import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRouter from './routes/auth';
import publicRouter from './routes/public';
import { corsHeaders, handleCorsPreFlight } from './middleware/auth';

interface Env {
  RENDER_BACKEND_URL: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ENVIRONMENT: string;
  CACHE: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('*', cors({
  origin: ['https://spllit.app', 'https://www.spllit.app', 'http://localhost:5173', 'https://spllit-landing.vercel.app'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
    version: '1.0.0'
  });
});

// API Routes
const api = new Hono();

// Authentication routes
api.route('/auth', authRouter);

// Public data routes
api.route('', publicRouter);

// Mount API routes
app.route('/api', api);

// Fallback for unmapped routes - proxy to Render backend
app.all('*', async (c) => {
  const method = c.req.method;
  
  // Handle preflight
  if (method === 'OPTIONS') {
    return handleCorsPreFlight(c.req.header('origin'));
  }

  try {
    const url = new URL(c.req.url);
    const backendUrl = `${c.env.RENDER_BACKEND_URL}${url.pathname}${url.search}`;
    
    // For POST/PUT/PATCH, forward body
    let body: any = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        body = await c.req.json();
      } catch {
        // Body might not be JSON
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Forward authorization header
    const authHeader = c.req.header('authorization');
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const response = await fetch(backendUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    return c.json(data, response.status);
  } catch (error) {
    console.error('Fallback proxy error:', error);
    return c.json({ error: 'Service unavailable' }, 503);
  }
});

export default app;
