describe('Rate Limiters', () => {
  test('all 5 limiters are exported as middleware functions', () => {
    const limiters = jest.requireActual('../../middleware/rateLimiter.js');
    const names = ['genericLimiter', 'identifyLimiter', 'authLimiter', 'translateLimiter', 'uploadLimiter'] as const;
    for (const name of names) {
      expect(limiters[name]).toBeDefined();
      expect(typeof limiters[name]).toBe('function');
      expect(typeof limiters[name].resetKey).toBe('function');
    }
  });
});
