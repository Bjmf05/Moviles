import express from 'express';
import request from 'supertest';

const mockAuthenticateRequest = jest.fn();

jest.mock('../../services/auth.js', () => ({
  authenticateRequest: (...args: unknown[]) => mockAuthenticateRequest(...args),
  TokenPayload: {} as never,
}));

const { authMiddleware, optionalAuthMiddleware } = jest.requireActual('../../middleware/auth.js');

function createAppWithAuth(): express.Express {
  const app = express();
  app.get('/protected', authMiddleware, (_req, res) => {
    res.json({ user: (_req as express.Request & { user?: unknown }).user });
  });
  app.get('/optional', optionalAuthMiddleware, (_req, res) => {
    res.json({ user: (_req as express.Request & { user?: unknown }).user });
  });
  return app;
}

const VALID_USER = { uid: 'user-123', email: 'test@test.com', name: 'Test User' };

describe('Auth Middleware', () => {
  beforeEach(() => {
    mockAuthenticateRequest.mockReset();
  });

  describe('authMiddleware', () => {
    test('calls next() and sets req.user with valid token', async () => {
      mockAuthenticateRequest.mockResolvedValue(VALID_USER);
      const app = createAppWithAuth();
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual(VALID_USER);
      expect(mockAuthenticateRequest).toHaveBeenCalledWith('Bearer valid-token');
    });

    test('returns 401 without authorization header', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('Authorization header missing'));
      const app = createAppWithAuth();
      const res = await request(app).get('/protected');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    test('returns 401 with invalid token', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('Invalid JWT token'));
      const app = createAppWithAuth();
      const res = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer bad-token');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('optionalAuthMiddleware', () => {
    test('continues without header (user is undefined)', async () => {
      const app = createAppWithAuth();
      const res = await request(app).get('/optional');

      expect(res.status).toBe(200);
      expect(res.body.user).toBeUndefined();
    });

    test('continues with valid token and sets req.user', async () => {
      mockAuthenticateRequest.mockResolvedValue(VALID_USER);
      const app = createAppWithAuth();
      const res = await request(app)
        .get('/optional')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.user).toEqual(VALID_USER);
    });

    test('continues without setting user on invalid token', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('bad token'));
      const app = createAppWithAuth();
      const res = await request(app)
        .get('/optional')
        .set('Authorization', 'Bearer bad-token');

      expect(res.status).toBe(200);
      expect(res.body.user).toBeUndefined();
    });
  });
});
