import test from 'node:test';
import assert from 'node:assert/strict';
import { demoRequest, resetDemo } from './demo.ts';

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
};

test('demo can search, edit, favorite and reset sample snippets', async () => {
  resetDemo();
  assert.equal((await demoRequest('/overview')).total, 5);
  const found = await demoRequest('/snippets?search=controller');
  assert.equal(found.items.length, 1);
  assert.equal(found.items[0].title, 'Fetch with timeout');
  const created = await demoRequest('/snippets', { method: 'POST', body: JSON.stringify({ title: 'Sample helper', code: 'return 42;', description: 'A demo addition', languageId: 'javascript', categoryId: null, groupIds: [] }) });
  assert.equal((await demoRequest('/overview')).total, 6);
  await demoRequest(`/snippets/${created.id}/favorite`, { method: 'PUT', body: JSON.stringify({ isFavorite: true }) });
  assert.equal((await demoRequest('/snippets?favorite=true')).total, 3);
  await demoRequest(`/snippets/${created.id}`, { method: 'PUT', body: JSON.stringify({ title: 'Updated helper', code: 'return 43;', languageId: 'javascript', description: '', categoryId: null, groupIds: [] }) });
  assert.equal((await demoRequest(`/snippets/${created.id}`)).title, 'Updated helper');
  await demoRequest(`/snippets/${created.id}`, { method: 'DELETE' });
  assert.equal((await demoRequest('/overview')).total, 5);
  resetDemo();
  assert.equal((await demoRequest('/overview')).total, 5);
});

test('demo sharing exposes only explicitly published snippets', async () => {
  resetDemo();
  const updated = await demoRequest('/snippets/s1/share', { method: 'PUT', body: JSON.stringify({ isPublic: true }) });
  const slug = updated.publicSlug;
  assert.equal((await demoRequest(`/public/${slug}`)).title, updated.title);
  await demoRequest('/snippets/s1/share', { method: 'PUT', body: JSON.stringify({ isPublic: false }) });
  await assert.rejects(() => demoRequest(`/public/${slug}`));
});
