import { Hono } from 'hono';
import { announcementQuerySchema, rideSearchSchema } from '../types/schemas';
import { errorResponse, jsonResponse } from '../utils/helpers';
import { z } from 'zod';

interface Env {
  RENDER_BACKEND_URL: string;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
}

const publicRouter = new Hono<{ Bindings: Env }>();

// Helper to proxy GET requests to Render backend with caching
async function proxyAndCache(
  env: Env,
  path: string,
  cacheKey: string,
  cacheTTL: number = 300
) {
  const url = `${env.RENDER_BACKEND_URL}${path}`;
  
  try {
    // Try to get from KV cache first
    if (env.CACHE) {
      const cached = await env.CACHE.get(cacheKey);
      if (cached) {
        const response = jsonResponse(JSON.parse(cached), 200);
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('Cache-Control', `public, max-age=${cacheTTL}`);
        return response;
      }
    }

    // Fetch from backend
    const response = await fetch(url, { method: 'GET' });
    
    if (!response.ok) {
      return errorResponse('Not found', response.status);
    }

    const data = await response.json();

    // Cache the response
    if (env.CACHE) {
      await env.CACHE.put(cacheKey, JSON.stringify(data), {
        expirationTtl: cacheTTL
      });
    }

    const resp = jsonResponse(data, 200);
    resp.headers.set('X-Cache', 'MISS');
    resp.headers.set('Cache-Control', `public, max-age=${cacheTTL}`);
    return resp;
  } catch (error) {
    console.error('Proxy error:', error);
    return errorResponse('Backend unavailable', 503);
  }
}

// GET /announcements
publicRouter.get('/announcements', async (c) => {
  try {
    const query = c.req.query();
    
    // Parse and validate query params
    const validated = announcementQuerySchema.parse({
      limit: query.limit ? parseInt(query.limit) : 20,
      offset: query.offset ? parseInt(query.offset) : 0,
      role: query.role
    });

    const cacheKey = `announcements:${JSON.stringify(validated)}`;
    const path = `/api/announcements?limit=${validated.limit}&offset=${validated.offset}${
      validated.role ? `&role=${validated.role}` : ''
    }`;

    return proxyAndCache(c.env, path, cacheKey, 600); // 10 min cache
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid query parameters', 400, error.errors);
    }
    console.error('Announcements error:', error);
    return errorResponse('Internal server error', 500);
  }
});

// GET /rides/search
publicRouter.get('/rides/search', async (c) => {
  try {
    const query = c.req.query();
    
    // Parse and validate query params
    const validated = rideSearchSchema.parse({
      origin: query.origin,
      destination: query.destination,
      date: query.date,
      maxDistance: query.maxDistance ? parseInt(query.maxDistance) : undefined,
      limit: query.limit ? parseInt(query.limit) : 10,
      offset: query.offset ? parseInt(query.offset) : 0
    });

    // Build query string
    const params = new URLSearchParams({
      limit: validated.limit.toString(),
      offset: validated.offset.toString()
    });
    
    if (validated.origin) params.append('origin', validated.origin);
    if (validated.destination) params.append('destination', validated.destination);
    if (validated.date) params.append('date', validated.date);
    if (validated.maxDistance) params.append('maxDistance', validated.maxDistance.toString());

    const cacheKey = `rides:search:${params.toString()}`;
    const path = `/api/rides/search?${params.toString()}`;

    return proxyAndCache(c.env, path, cacheKey, 120); // 2 min cache for search
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse('Invalid query parameters', 400, error.errors);
    }
    console.error('Ride search error:', error);
    return errorResponse('Internal server error', 500);
  }
});

// GET /users/:id (public profile)
publicRouter.get('/users/:id', async (c) => {
  try {
    const userId = c.req.param('id');

    if (!userId || userId.length === 0) {
      return errorResponse('User ID required', 400);
    }

    const cacheKey = `user:profile:${userId}`;
    const path = `/api/users/${userId}`;

    return proxyAndCache(c.env, path, cacheKey, 600); // 10 min cache for profiles
  } catch (error) {
    console.error('User profile error:', error);
    return errorResponse('Internal server error', 500);
  }
});

export default publicRouter;
