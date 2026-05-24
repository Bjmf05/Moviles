import jwt from 'jsonwebtoken';

jest.mock('../../services/firebase.js', () => ({
  getFirebaseAuth: jest.fn(),
  getFirestore: jest.fn(),
}));

const { generateToken, verifyToken, authenticateRequest, TokenPayload } =
  jest.requireActual('../../services/auth.js');

const TEST_SECRET = 'test-jwt-secret-for-unit-tests';

describe('Auth Service', () => {
  const validPayload = { uid: 'user-123', email: 'test@example.com', name: 'Test User' };

  describe('generateToken', () => {
    test('creates a valid JWT with correct payload', () => {
      const token = generateToken(validPayload);
      const decoded = jwt.verify(token, TEST_SECRET) as typeof validPayload;
      expect(decoded.uid).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.name).toBe('Test User');
    });

    test('token has 7-day expiry', () => {
      const token = generateToken(validPayload);
      const decoded = jwt.decode(token) as { exp: number; iat: number };
      const expiresIn = decoded.exp - decoded.iat;
      expect(expiresIn).toBe(7 * 24 * 60 * 60);
    });

    test('throws when JWT_SECRET is not set', () => {
      const secretBackup = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      jest.isolateModules(() => {
        const { generateToken: gen } = require('../../services/auth.js');
        expect(() => gen(validPayload)).toThrow('JWT_SECRET is not defined');
      });
      process.env.JWT_SECRET = secretBackup;
    });
  });

  describe('verifyToken', () => {
    test('decodes a valid token correctly', async () => {
      const token = generateToken(validPayload);
      const decoded = await verifyToken(token);
      expect(decoded.uid).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
    });

    test('throws on an invalid token', async () => {
      await expect(verifyToken('invalid-token')).rejects.toThrow('Invalid JWT token');
    });

    test('throws on a token signed with different secret', async () => {
      const fakeToken = jwt.sign({ uid: 'hacker' }, 'wrong-secret');
      await expect(verifyToken(fakeToken)).rejects.toThrow('Invalid JWT token');
    });
  });

  describe('authenticateRequest', () => {
    test('extracts and verifies Bearer token', async () => {
      const token = generateToken(validPayload);
      const result = await authenticateRequest(`Bearer ${token}`);
      expect(result.uid).toBe('user-123');
    });

    test('throws when auth header is missing', async () => {
      await expect(authenticateRequest(undefined)).rejects.toThrow(
        'Authorization header missing',
      );
    });

    test('throws when auth type is not Bearer', async () => {
      const token = generateToken(validPayload);
      await expect(authenticateRequest(`Basic ${token}`)).rejects.toThrow(
        'Invalid authorization type',
      );
    });

    test('throws when token is missing after Bearer', async () => {
      await expect(authenticateRequest('Bearer ')).rejects.toThrow(
        'Token missing',
      );
    });
  });
});
