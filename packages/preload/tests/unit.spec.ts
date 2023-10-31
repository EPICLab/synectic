import {createHash} from 'crypto';
import {expect, test} from 'vitest';
import {sha256sum, versions, uuid} from '../src';
import validate from 'uuid-validate';

test('versions', async () => {
  expect(versions).toBe(process.versions);
});

test('crypto', async () => {
  // Test hashing a random string.
  const testString = Math.random().toString(36).slice(2, 7);
  const expectedHash = createHash('sha256').update(testString).digest('hex');

  expect(sha256sum(testString)).toBe(expectedHash);
});

test('uuid', async () => {
  // Test that uuid returns a valid RFC 4122 version 4 UUID.
  expect(validate(uuid(), 4)).toBe(true);
});
