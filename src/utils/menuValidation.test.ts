import test from 'node:test';
import assert from 'node:assert/strict';

import { validateMenuItem } from './menuValidation';

test('accepts a valid menu item', () => {
  const result = validateMenuItem({
    dishName: 'Charred Citrus Salmon',
    description: 'Seared Scottish salmon with herb butter and preserved lemon.',
    course: 'Main Course (Entrée)',
    price: '28.00',
  });

  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
});

test('rejects missing required fields', () => {
  const result = validateMenuItem({
    dishName: '',
    description: 'Test description',
    course: '',
    price: '',
  });

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [
    'Dish name is required.',
    'Course category is required.',
    'Price is required.',
  ]);
});
