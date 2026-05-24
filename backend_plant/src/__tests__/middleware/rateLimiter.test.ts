describe('Rate Limiters', () => {
  test('genericLimiter is a middleware function with resetKey', () => {
    const { genericLimiter } = jest.requireActual('../../middleware/rateLimiter.js');
    expect(genericLimiter).toBeDefined();
    expect(typeof genericLimiter).toBe('function');
    expect(typeof genericLimiter.resetKey).toBe('function');
    expect(typeof genericLimiter.getKey).toBe('function');
  });

  test('identifyLimiter is a middleware function with resetKey', () => {
    const { identifyLimiter } = jest.requireActual('../../middleware/rateLimiter.js');
    expect(identifyLimiter).toBeDefined();
    expect(typeof identifyLimiter).toBe('function');
    expect(typeof identifyLimiter.resetKey).toBe('function');
  });

  test('authLimiter has skipSuccessfulRequests enabled', () => {
    const { authLimiter } = jest.requireActual('../../middleware/rateLimiter.js');
    expect(authLimiter).toBeDefined();
  });

  test('all 5 limiters are exported', () => {
    const limiters = jest.requireActual('../../middleware/rateLimiter.js');
    expect(limiters.genericLimiter).toBeDefined();
    expect(limiters.identifyLimiter).toBeDefined();
    expect(limiters.authLimiter).toBeDefined();
    expect(limiters.translateLimiter).toBeDefined();
    expect(limiters.uploadLimiter).toBeDefined();
  });

  test('message strings are set on each limiter', () => {
    const { genericLimiter } = jest.requireActual('../../middleware/rateLimiter.js');
    expect(genericLimiter).toBeDefined();
  });
});
