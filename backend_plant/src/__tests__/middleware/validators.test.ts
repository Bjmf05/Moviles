import express from 'express';
import request from 'supertest';

jest.mock('../../services/auth.js', () => ({
  authenticateRequest: jest.fn(),
}));

const {
  validateCreateUser,
  validateLogin,
  validateCreatePlant,
  validateUploadBase64,
  validateGoogleLogin,
  handleValidationErrors,
} = jest.requireActual('../../middleware/validators.js');

function createValidationApp(
  validators: unknown[],
  handler: express.RequestHandler = (_req, res) => res.json({ ok: true }),
): express.Express {
  const app = express();
  app.use(express.json());
  app.post('/test', ...(validators as express.RequestHandler[]), handleValidationErrors, handler);
  return app;
}

describe('Validators', () => {
  describe('validateCreateUser', () => {
    const app = createValidationApp(validateCreateUser);

    test('passes with valid data', async () => {
      const res = await request(app).post('/test').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'secret123',
      });
      expect(res.status).toBe(200);
    });

    test('rejects empty name', async () => {
      const res = await request(app).post('/test').send({
        name: '',
        email: 'john@example.com',
        password: 'secret123',
      });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details[0].field).toBe('name');
    });

    test('rejects invalid email', async () => {
      const res = await request(app).post('/test').send({
        name: 'John Doe',
        email: 'not-an-email',
        password: 'secret123',
      });
      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe('email');
    });

    test('rejects short password (< 6 chars)', async () => {
      const res = await request(app).post('/test').send({
        name: 'John Doe',
        email: 'john@example.com',
        password: '12345',
      });
      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe('password');
    });
  });

  describe('validateLogin', () => {
    const app = createValidationApp(validateLogin);

    test('passes with valid email and password', async () => {
      const res = await request(app).post('/test').send({
        email: 'john@example.com',
        password: 'secret123',
      });
      expect(res.status).toBe(200);
    });

    test('rejects empty password', async () => {
      const res = await request(app).post('/test').send({
        email: 'john@example.com',
        password: '',
      });
      expect(res.status).toBe(400);
    });

    test('rejects missing fields', async () => {
      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(400);
      expect(res.body.details.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('validateCreatePlant', () => {
    const app = createValidationApp(validateCreatePlant);

    test('passes with valid data', async () => {
      const res = await request(app).post('/test').send({
        nombreComun: 'Rosa',
        nombreCientifico: 'Rosa gallica',
      });
      expect(res.status).toBe(200);
    });

    test('rejects empty nombreComun', async () => {
      const res = await request(app).post('/test').send({
        nombreComun: '',
      });
      expect(res.status).toBe(400);
      expect(res.body.details[0].field).toBe('nombreComun');
    });

    test('rejects nombreComun shorter than 2 chars', async () => {
      const res = await request(app).post('/test').send({
        nombreComun: 'R',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('validateUploadBase64', () => {
    const app = createValidationApp(validateUploadBase64);

    test('passes with valid base64 image', async () => {
      const res = await request(app).post('/test').send({
        image: 'SGVsbG8gV29ybGQ=',
      });
      expect(res.status).toBe(200);
    });

    test('rejects empty image field', async () => {
      const res = await request(app).post('/test').send({ image: '' });
      expect(res.status).toBe(400);
    });

    test('rejects non-base64 value', async () => {
      const res = await request(app).post('/test').send({
        image: 'not-base64!!!',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('validateGoogleLogin', () => {
    const app = createValidationApp(validateGoogleLogin);

    test('passes with valid idToken', async () => {
      const res = await request(app).post('/test').send({ idToken: 'firebase-id-token' });
      expect(res.status).toBe(200);
    });

    test('rejects missing idToken', async () => {
      const res = await request(app).post('/test').send({});
      expect(res.status).toBe(400);
    });
  });
});
