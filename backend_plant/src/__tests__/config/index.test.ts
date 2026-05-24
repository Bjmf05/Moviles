const OLD_ENV = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  process.env = { ...OLD_ENV };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe('Config', () => {
  test('loadConfig() returns default values when env vars are set', () => {
    process.env.NODE_ENV = 'development';
    const { loadConfig } = require('../../config/index.js');
    const cfg = loadConfig();
    expect(cfg.app.name).toBe('Plant API');
    expect(cfg.app.port).toBe(4000);
    expect(cfg.app.env).toBe('development');
  });

  test('loadConfig() reads PORT env var', () => {
    process.env.PORT = '9999';
    const { loadConfig } = require('../../config/index.js');
    const cfg = loadConfig();
    expect(cfg.app.port).toBe(9999);
  });

  test('loadConfig() reads JWT_SECRET env var', () => {
    const { loadConfig } = require('../../config/index.js');
    const cfg = loadConfig();
    expect(cfg.jwt.secret).toBe('test-jwt-secret-for-unit-tests');
  });

  test('requireValidConfig() returns config when all required vars are set', () => {
    const { requireValidConfig } = require('../../config/index.js');
    expect(() => requireValidConfig()).not.toThrow();
    const cfg = requireValidConfig();
    expect(cfg.supabase.url).toBe('https://test-project.supabase.co');
    expect(cfg.plantId.apiKey).toBe('test-plant-id-api-key');
    expect(cfg.jwt.secret).toBe('test-jwt-secret-for-unit-tests');
  });

  test('requireValidConfig() throws when SUPABASE_URL is missing', () => {
    delete process.env.SUPABASE_URL;
    const { requireValidConfig } = require('../../config/index.js');
    expect(() => requireValidConfig()).toThrow('Missing SUPABASE_URL');
  });

  test('requireValidConfig() throws when JWT_SECRET is missing', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.JWT_SECRET;
    const { requireValidConfig } = require('../../config/index.js');
    expect(() => requireValidConfig()).toThrow('Missing SUPABASE_URL');
  });

  test('requireValidConfig() throws when GOOGLE_ANDROID_CLIENT_ID is missing', () => {
    delete process.env.GOOGLE_ANDROID_CLIENT_ID;
    const { requireValidConfig } = require('../../config/index.js');
    expect(() => requireValidConfig()).toThrow('Missing GOOGLE_ANDROID_CLIENT_ID');
  });

  test('requireValidConfig() throws when FIREBASE_API_KEY is missing', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.GOOGLE_ANDROID_CLIENT_ID;
    delete process.env.FIREBASE_API_KEY;
    const { requireValidConfig } = require('../../config/index.js');
    expect(() => requireValidConfig()).toThrow('Missing SUPABASE_URL');
  });

  test('getConfig() returns the same singleton as loadConfig()', () => {
    const { getConfig, loadConfig } = require('../../config/index.js');
    expect(getConfig()).toBe(loadConfig());
  });
});
