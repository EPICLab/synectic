import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import {expect, test, vi} from 'vitest';
import ReactiveHash from '../src/components/ReactiveHash';

vi.mock('#preload', () => {
  return {
    sha256sum: vi.fn((s: string) => `${s}:HASHED`),
  };
});

const setup = () => {
  const utils = render(<ReactiveHash />);
  const input = screen.getByLabelText('reactive-hash-raw-value') as HTMLInputElement;
  const output = screen.getByLabelText('reactive-hash-hashed-value') as HTMLInputElement;
  return {
    input,
    output,
    ...utils,
  };
};

test('ReactiveHash component', async () => {
  // ARRANGE
  expect(ReactiveHash).toBeTruthy();
  const {input, output} = setup();

  // ACT
  const dataToHashed = Math.random().toString(36).slice(2, 7);
  fireEvent.change(input, {target: {value: dataToHashed}});

  // ASSERT
  expect(output.value).toBe(`${dataToHashed}:HASHED`);
});
