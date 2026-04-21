import { describe, expect, it } from 'vitest';
import { createSQLiteAdapter } from './sqlite';

describe('createSQLiteAdapter', () => {
  it('stores and finds waitlist entries by email and id', async () => {
    const adapter = createSQLiteAdapter(':memory:');

    await adapter.create({
      id: 'entry_1',
      email: 'found@example.com',
      joined_at: 100,
    });

    await expect(adapter.findByEmail('found@example.com')).resolves.toMatchObject({
      id: 'entry_1',
      email: 'found@example.com',
      joined_at: 100,
    });
    await expect(adapter.findById('entry_1')).resolves.toMatchObject({
      email: 'found@example.com',
    });
  });

  it('calculates positions by join order', async () => {
    const adapter = createSQLiteAdapter(':memory:');

    await adapter.create({ id: 'entry_1', email: 'first@example.com', joined_at: 100 });
    await adapter.create({ id: 'entry_2', email: 'second@example.com', joined_at: 200 });

    await expect(adapter.getPosition('first@example.com')).resolves.toBe(1);
    await expect(adapter.getPosition('second@example.com')).resolves.toBe(2);
  });

  it('creates schema for each in-memory adapter instance', async () => {
    const first = createSQLiteAdapter(':memory:');
    const second = createSQLiteAdapter(':memory:');

    await first.create({ id: 'entry_1', email: 'first@example.com', joined_at: 100 });
    await second.create({ id: 'entry_2', email: 'second@example.com', joined_at: 100 });

    await expect(first.list()).resolves.toHaveLength(1);
    await expect(second.list()).resolves.toHaveLength(1);
  });
});
