import request from 'supertest';
import app from '../server';

describe('Root API Endpoints', () => {
  it('should return 200 and status text on GET /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toBe('SprintSync backend is running');
  });
  it('should redirect to /api-docs for GET /api-docs', async () => {
    const res = await request(app).get('/api-docs');
    expect(res.statusCode).toEqual(301);
    expect(res.headers.location).toBe('/api-docs/');
  });
});
