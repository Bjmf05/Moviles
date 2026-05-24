import express from 'express';
import request from 'supertest';

describe('Health Check Route', () => {
  test('GET /health returns 200 with status ok', async () => {
    const app = express();
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
  });

  test('GET /health returns a valid ISO timestamp', async () => {
    const app = express();
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    const res = await request(app).get('/health');
    const parsed = new Date(res.body.timestamp);
    expect(parsed.toISOString()).toBe(res.body.timestamp);
  });
});
