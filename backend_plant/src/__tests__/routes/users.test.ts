import express from 'express';
import request from 'supertest';

const mockCreateUser = jest.fn();
const mockLoginUser = jest.fn();
const mockGoogleLogin = jest.fn();
const mockGetUserProfile = jest.fn();
const mockUpdateUserProfile = jest.fn();
const mockDeleteUser = jest.fn();

jest.mock('../../controllers/users.js', () => ({
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  loginUser: (...args: unknown[]) => mockLoginUser(...args),
  googleLogin: (...args: unknown[]) => mockGoogleLogin(...args),
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
  updateUserProfile: (...args: unknown[]) => mockUpdateUserProfile(...args),
  deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
}));

jest.mock('../../middleware/auth.js', () => ({
  authMiddleware: jest.fn((_req: express.Request, _res: express.Response, next: express.NextFunction) => next()),
  optionalAuthMiddleware: jest.fn((_req: express.Request, _res: express.Response, next: express.NextFunction) => next()),
}));

import usersRouter from '../../routes/users.js';

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', usersRouter);
  return app;
}

const VALID_REGISTER = { name: 'Test User', email: 'test@test.com', password: 'secret123' };
const VALID_LOGIN = { email: 'test@test.com', password: 'secret123' };

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateUser.mockImplementation((_req: express.Request, res: express.Response) =>
      res.status(201).json({ token: 'jwt-token', user: { uid: 'u1', email: 'test@test.com' } })
    );
    mockLoginUser.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ token: 'jwt-token', user: { uid: 'u1', email: 'test@test.com' } })
    );
    mockGoogleLogin.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ token: 'jwt-token', user: { uid: 'google-u1' } })
    );
    mockGetUserProfile.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ uid: 'u1', email: 'test@test.com', name: 'Test User' })
    );
    mockUpdateUserProfile.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ uid: 'u1', name: 'Updated' })
    );
    mockDeleteUser.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ message: 'User deleted successfully' })
    );
  });

  describe('POST /api/auth/register', () => {
    test('calls createUser controller with valid body', async () => {
      const app = createApp();
      const res = await request(app).post('/api/auth/register').send(VALID_REGISTER);
      expect(res.status).toBe(201);
      expect(mockCreateUser).toHaveBeenCalled();
    });

    test('returns 400 with missing name', async () => {
      const app = createApp();
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'secret123',
      });
      expect(res.status).toBe(400);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    test('returns 400 with invalid email', async () => {
      const app = createApp();
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test',
        email: 'not-email',
        password: 'secret123',
      });
      expect(res.status).toBe(400);
      expect(mockCreateUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    test('calls loginUser controller with valid body', async () => {
      const app = createApp();
      const res = await request(app).post('/api/auth/login').send(VALID_LOGIN);
      expect(res.status).toBe(200);
      expect(mockLoginUser).toHaveBeenCalled();
    });

    test('returns 400 with empty password', async () => {
      const app = createApp();
      const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: '' });
      expect(res.status).toBe(400);
      expect(mockLoginUser).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/google', () => {
    test('calls googleLogin controller with valid idToken', async () => {
      const app = createApp();
      const res = await request(app).post('/api/auth/google').send({ idToken: 'firebase-token' });
      expect(res.status).toBe(200);
      expect(mockGoogleLogin).toHaveBeenCalled();
    });

    test('returns 400 without idToken', async () => {
      const app = createApp();
      const res = await request(app).post('/api/auth/google').send({});
      expect(res.status).toBe(400);
      expect(mockGoogleLogin).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/auth/profile', () => {
    test('calls getUserProfile controller', async () => {
      const app = createApp();
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(200);
      expect(mockGetUserProfile).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/auth/account', () => {
    test('calls deleteUser controller', async () => {
      const app = createApp();
      const res = await request(app).delete('/api/auth/account');
      expect(res.status).toBe(200);
      expect(mockDeleteUser).toHaveBeenCalled();
    });
  });
});
