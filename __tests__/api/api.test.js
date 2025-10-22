const request = require('supertest');
const app = require('../../server');

describe('API endpoints', () => {
  test('health check works', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('search endpoint returns array', async () => {
    const res = await request(app).get('/api/search?q=tola');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});


