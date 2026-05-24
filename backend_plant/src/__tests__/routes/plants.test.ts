import express from 'express';
import request from 'supertest';

const mockGetExplorePlants = jest.fn();
const mockGetExplorePlant = jest.fn();
const mockCreatePlant = jest.fn();
const mockGetPlants = jest.fn();
const mockGetPlant = jest.fn();
const mockUpdatePlant = jest.fn();
const mockDeletePlant = jest.fn();
const mockMarkWatered = jest.fn();
const mockEditSchedule = jest.fn();

jest.mock('../../controllers/plants.js', () => ({
  getExplorePlants: (...args: unknown[]) => mockGetExplorePlants(...args),
  getExplorePlant: (...args: unknown[]) => mockGetExplorePlant(...args),
  createPlant: (...args: unknown[]) => mockCreatePlant(...args),
  getPlants: (...args: unknown[]) => mockGetPlants(...args),
  getPlant: (...args: unknown[]) => mockGetPlant(...args),
  updatePlant: (...args: unknown[]) => mockUpdatePlant(...args),
  deletePlant: (...args: unknown[]) => mockDeletePlant(...args),
}));

jest.mock('../../controllers/waterings.js', () => ({
  markWatered: (...args: unknown[]) => mockMarkWatered(...args),
  editSchedule: (...args: unknown[]) => mockEditSchedule(...args),
}));

const mockAuthenticateRequest = jest.fn();
jest.mock('../../services/auth.js', () => ({
  authenticateRequest: (...args: unknown[]) => mockAuthenticateRequest(...args),
}));

import plantsRouter from '../../routes/plants.js';
import timelineRouter from '../../routes/timeline.js';

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/plants', plantsRouter);
  app.use('/api/plants', timelineRouter);
  return app;
}

const VALID_USER = { uid: 'user-123', email: 'test@test.com', name: 'Test User' };
const VALID_PLANT_BODY = {
  nombreComun: 'Rosa',
  nombreCientifico: 'Rosa gallica',
  cuidados: { riego: 'Cada 3 días', luz: 'Pleno sol', temperatura: '15-30°C' },
};

describe('Plants Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticateRequest.mockResolvedValue(VALID_USER);

    mockGetExplorePlants.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ plants: [], hasMore: false, nextCursor: null })
    );
    mockGetExplorePlant.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ id: 'p1', nombreComun: 'Rosa' })
    );
    mockCreatePlant.mockImplementation((_req: express.Request, res: express.Response) =>
      res.status(201).json({ id: 'new-plant', nombreComun: 'Rosa' })
    );
    mockGetPlants.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ plants: [{ id: 'p1', nombreComun: 'Rosa' }] })
    );
    mockGetPlant.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ id: 'p1', nombreComun: 'Rosa' })
    );
    mockUpdatePlant.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ success: true })
    );
    mockDeletePlant.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ success: true, message: 'Plant deleted' })
    );
    mockMarkWatered.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ success: true, nextWateringDate: '2026-06-01' })
    );
    mockEditSchedule.mockImplementation((_req: express.Request, res: express.Response) =>
      res.json({ success: true })
    );
  });

  describe('Public explore routes', () => {
    test('GET /api/plants/explore returns plants list', async () => {
      const app = createApp();
      const res = await request(app).get('/api/plants/explore');
      expect(res.status).toBe(200);
      expect(mockGetExplorePlants).toHaveBeenCalled();
    });

    test('GET /api/plants/explore/:id returns a plant', async () => {
      const app = createApp();
      const res = await request(app).get('/api/plants/explore/p1');
      expect(res.status).toBe(200);
      expect(mockGetExplorePlant).toHaveBeenCalled();
    });
  });

  describe('Protected plant routes', () => {
    test('POST /api/plants creates a plant with valid body and auth', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/plants')
        .set('Authorization', 'Bearer valid-token')
        .send(VALID_PLANT_BODY);
      expect(res.status).toBe(201);
      expect(mockCreatePlant).toHaveBeenCalled();
    });

    test('POST /api/plants returns 401 without auth', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('No auth'));
      const app = createApp();
      const res = await request(app).post('/api/plants').send(VALID_PLANT_BODY);
      expect(res.status).toBe(401);
      expect(mockCreatePlant).not.toHaveBeenCalled();
    });

    test('POST /api/plants returns 400 with empty nombreComun', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/plants')
        .set('Authorization', 'Bearer valid-token')
        .send({ nombreComun: '' });
      expect(res.status).toBe(400);
      expect(mockCreatePlant).not.toHaveBeenCalled();
    });

    test('GET /api/plants returns plant list with auth', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/api/plants')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
      expect(mockGetPlants).toHaveBeenCalled();
    });

    test('GET /api/plants returns 401 without auth', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('No auth'));
      const app = createApp();
      const res = await request(app).get('/api/plants');
      expect(res.status).toBe(401);
      expect(mockGetPlants).not.toHaveBeenCalled();
    });

    test('GET /api/plants/:id returns a plant with auth', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/api/plants/p1')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
      expect(mockGetPlant).toHaveBeenCalled();
    });

    test('PUT /api/plants/:id updates a plant with auth', async () => {
      const app = createApp();
      const res = await request(app)
        .put('/api/plants/p1')
        .set('Authorization', 'Bearer valid-token')
        .send({ nombreComun: 'Rosa Actualizada' });
      expect(res.status).toBe(200);
      expect(mockUpdatePlant).toHaveBeenCalled();
    });

    test('DELETE /api/plants/:id deletes a plant with auth', async () => {
      const app = createApp();
      const res = await request(app)
        .delete('/api/plants/p1')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
      expect(mockDeletePlant).toHaveBeenCalled();
    });
  });

  describe('Watering routes', () => {
    test('POST /api/plants/:id/water marks plant as watered', async () => {
      const app = createApp();
      const res = await request(app)
        .post('/api/plants/p1/water')
        .set('Authorization', 'Bearer valid-token');
      expect(res.status).toBe(200);
      expect(mockMarkWatered).toHaveBeenCalled();
    });

    test('PUT /api/plants/:id/schedule edits watering schedule', async () => {
      const app = createApp();
      const res = await request(app)
        .put('/api/plants/p1/schedule')
        .set('Authorization', 'Bearer valid-token')
        .send({ frequencyDays: 5 });
      expect(res.status).toBe(200);
      expect(mockEditSchedule).toHaveBeenCalled();
    });
  });
});
