import React from 'react';
import {render, screen} from '@testing-library/react';
import {within} from '@testing-library/dom';
import {expect, test, vi} from 'vitest';
import ElectronVersions from '../src/components/ElectronVersions';

vi.mock('#preload', () => {
  return {
    versions: {lib1: 1, lib2: 2},
  };
});

const setup = () => {
  const utils = render(<ElectronVersions />);
  const rows = screen.getAllByLabelText('versions-row') as HTMLTableRowElement[];
  return {
    rows,
    ...utils,
  };
};

test('ElectronVersions component', async () => {
  // ARRANGE
  expect(ElectronVersions).toBeTruthy();
  const {rows} = setup();

  // ASSERT
  expect(rows.length).toBe(2);

  const row1 = await within(rows[0]).findAllByRole('cell');
  const row2 = await within(rows[1]).findAllByRole('cell');

  expect(row1[0].textContent).toBe('lib1');
  expect(row1[1].textContent).toBe('v1');

  expect(row2[0].textContent).toBe('lib2');
  expect(row2[1].textContent).toBe('v2');
});
