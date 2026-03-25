'use strict';

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'reading-tracker-test-'));
const testDataFile = path.join(tmpDir, 'books.json');

describe('Books API', () => {
  let freshApp;

  beforeEach(() => {
    fs.writeFileSync(testDataFile, JSON.stringify([], null, 2), 'utf8');
    jest.resetModules();
    process.env.TEST_DATA_FILE = testDataFile;
    freshApp = require('../src/app');
  });

  afterAll(() => {
    delete process.env.TEST_DATA_FILE;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('GET /api/books returns empty array initially', async () => {
    const res = await request(freshApp).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/books creates a book', async () => {
    const res = await request(freshApp)
      .post('/api/books')
      .send({ title: 'Clean Code', author: 'Robert Martin', status: 'to-read' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Clean Code');
    expect(res.body.author).toBe('Robert Martin');
    expect(res.body.status).toBe('to-read');
    expect(res.body.id).toBeDefined();
  });

  test('POST /api/books returns 400 when title is missing', async () => {
    const res = await request(freshApp)
      .post('/api/books')
      .send({ author: 'Someone' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test('GET /api/books returns created books', async () => {
    await request(freshApp).post('/api/books').send({ title: 'Book A', author: 'Author A' });
    await request(freshApp).post('/api/books').send({ title: 'Book B', author: 'Author B' });
    const res = await request(freshApp).get('/api/books');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  test('GET /api/books/:id returns a specific book', async () => {
    const created = await request(freshApp)
      .post('/api/books')
      .send({ title: 'Specific', author: 'Someone' });
    const id = created.body.id;

    const res = await request(freshApp).get(`/api/books/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect(res.body.title).toBe('Specific');
  });

  test('GET /api/books/:id returns 404 for unknown id', async () => {
    const res = await request(freshApp).get('/api/books/non-existent-id');
    expect(res.status).toBe(404);
  });

  test('PUT /api/books/:id updates a book', async () => {
    const created = await request(freshApp)
      .post('/api/books')
      .send({ title: 'Old Title', author: 'Author', status: 'to-read' });
    const id = created.body.id;

    const res = await request(freshApp)
      .put(`/api/books/${id}`)
      .send({ title: 'New Title', status: 'reading', pagesRead: 50 });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');
    expect(res.body.status).toBe('reading');
    expect(res.body.pagesRead).toBe(50);
  });

  test('PUT /api/books/:id returns 404 for unknown id', async () => {
    const res = await request(freshApp)
      .put('/api/books/non-existent-id')
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  test('DELETE /api/books/:id deletes a book', async () => {
    const created = await request(freshApp)
      .post('/api/books')
      .send({ title: 'To Delete', author: 'Author' });
    const id = created.body.id;

    const del = await request(freshApp).delete(`/api/books/${id}`);
    expect(del.status).toBe(204);

    const get = await request(freshApp).get(`/api/books/${id}`);
    expect(get.status).toBe(404);
  });

  test('DELETE /api/books/:id returns 404 for unknown id', async () => {
    const res = await request(freshApp).delete('/api/books/non-existent-id');
    expect(res.status).toBe(404);
  });

  test('GET /api/stats returns correct statistics', async () => {
    await request(freshApp).post('/api/books').send({ title: 'A', author: 'X', status: 'completed', totalPages: 100, pagesRead: 100 });
    await request(freshApp).post('/api/books').send({ title: 'B', author: 'Y', status: 'reading', totalPages: 200, pagesRead: 50 });
    await request(freshApp).post('/api/books').send({ title: 'C', author: 'Z', status: 'to-read' });

    const res = await request(freshApp).get('/api/stats');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.completed).toBe(1);
    expect(res.body.reading).toBe(1);
    expect(res.body.toRead).toBe(1);
    expect(res.body.pagesRead).toBe(150);
  });
});
