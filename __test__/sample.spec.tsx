import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { act } from 'react-test-renderer';
import { Provider } from 'react-redux';

import DiffPickerDialog from '../src/components/DiffPickerDialog';
import { diffPickerModal } from './__fixtures__/Modal';
import { mockStore } from './__mocks__/reduxStoreMock';
import { basicStore } from './__fixtures__/ReduxStore';

const store = mockStore(basicStore);

afterEach(() => {
  cleanup;
  jest.resetAllMocks();
});

test('Renders DiffPickerDialog correctly', async () => {
  await act(async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <DiffPickerDialog {...diffPickerModal} />
      </Provider>
    );
    expect(getByTestId('diff-picker-dialog')).toBeInTheDocument();
  });
});

test('Renders a selection correctly', async () => {
  await act(async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <DiffPickerDialog {...diffPickerModal} />
      </Provider>
    );
    await waitFor(() => fireEvent.keyDown(getByTestId('diff-picker-dialog'), {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      charCode: 27
    }));
    expect(getByTestId('diff-picker-dialog')).not.toBeInTheDocument();
  });
});