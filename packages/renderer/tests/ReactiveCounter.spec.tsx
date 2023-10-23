import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import {expect, test} from 'vitest';
import ReactiveCounter from '../src/components/ReactiveCounter';

const setup = () => {
  const utils = render(<ReactiveCounter />);
  const counter = screen.getByLabelText('reactive-counter') as HTMLButtonElement;
  return {
    counter,
    ...utils,
  };
};

test('ReactiveHash component', async () => {
  // ARRANGE
  expect(ReactiveCounter).toBeTruthy();
  const {counter} = setup();

  expect(counter.textContent).toBe(' count is: 0');
  fireEvent.click(counter);
  expect(counter.textContent).toBe(' count is: 1');
});
