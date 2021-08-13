import React from 'react';
import { cleanup, fireEvent, render, waitFor, screen } from '@testing-library/react';
import { act } from '@testing-library/react/pure';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import DiffPickerDialog from '../src/components/DiffPickerDialog';
import { createMockStore } from './__mocks__/reduxStoreMock';
import { testStore } from './__fixtures__/ReduxStore';
import { diffPickerModal } from './__fixtures__/Modal';
import { firstEditorCard, secondEditorCard } from './__fixtures__/Card';

describe('DiffPickerDialog', () => {
  const store = createMockStore(testStore);

  afterEach(() => {
    cleanup;
    jest.resetAllMocks();
  });

  /**
   * For testing Material-UI components using React Testing Library (RTL), the query and selection
   * steps for finding elements are non-obvious from a user perspective (the methodology advocated in RTL).
   * However, the Material-UI project itself has begun to migrate to using RTL for testing. Therefore,
   * using their tests as inspiration might help, see:
   * https://github.com/mui-org/material-ui/tree/next/packages/material-ui/test
   * 
   * (For example, the Select component from Material-UI includes tests for making option selections:
   * https://github.com/mui-org/material-ui/blob/next/packages/material-ui/test/integration/Select.test.js)
   */
  it('DiffPickerDialog renders correctly', () => {
    render(
      <Provider store={store}>
        <DiffPickerDialog {...diffPickerModal} />
      </Provider>
    );
    expect(screen.getByTestId('diff-picker-dialog')).toBeInTheDocument();
  });

  it('DiffPickerDialog generates REMOVE_MODAL action when escape key is pressed', async () => {
    render(
      <Provider store={store}>
        <DiffPickerDialog {...diffPickerModal} />
      </Provider>
    );

    fireEvent.keyDown(screen.getByTestId('diff-picker-dialog'), {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      charCode: 27
    });

    await waitFor(() => {
      expect(store.getActions()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'modals/modalRemoved',
            payload: diffPickerModal.id
          })
        ])
      )
    });
  });

  it('DiffPickerDialog generates REMOVE_MODAL action when clicking outside of dialog', async () => {
    render(
      <Provider store={store}>
        <DiffPickerDialog {...diffPickerModal} />
      </Provider>
    );

    // using DOM selector method instead of RTL
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) userEvent.click(backdrop);

    await waitFor(() => {
      expect(store.getActions()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'modals/modalRemoved',
            payload: diffPickerModal.id
          })
        ])
      )
    });
  });

  it('DiffPickerDialog tracks selection updates', async () => {
    render(
      <Provider store={store}>
        <DiffPickerDialog {...diffPickerModal} />
      </Provider>
    );
    const trigger = screen.getAllByRole('button')[0];
    // open the select component
    fireEvent.mouseDown(trigger);

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveFocus();

    // // make a selection and close the select component
    act(() => {
      options[1].click();
    });

    await waitFor(() => {
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveTextContent(/turtle\.asp/i);
    });
  });

  it('DiffPickerDialog returns UUIDs for selected cards on run', async () => {
    render(
      <Provider store={store}>
        <DiffPickerDialog {...diffPickerModal} />
      </Provider>
    );
    const leftSelector = screen.getAllByRole('button')[0];
    const rightSelector = screen.getAllByRole('button')[1];
    const runButton = screen.queryByText(/Run Diff/i);

    // open the left select component
    fireEvent.mouseDown(leftSelector);
    const leftOptions = screen.getAllByRole('option');
    expect(leftOptions[0]).toHaveFocus();
    // make selection and close left component
    act(() => {
      leftOptions[1].click();
    });

    // open the right select component
    fireEvent.mouseDown(rightSelector);
    const rightOptions = screen.getAllByRole('option');
    expect(rightOptions[0]).toHaveFocus();
    // make selection and close right component
    act(() => {
      rightOptions[0].click();
    });

    if (runButton) fireEvent.click(runButton);

    await waitFor(() => {
      expect(store.getActions()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            meta: expect.objectContaining({
                arg: expect.objectContaining({
                        handler: 'Diff',
                        name: 'Δ undefined/turtle.asp -> master/test.js',
                        targets: [secondEditorCard.id, firstEditorCard.id]
                })
            })
          })
        ])
      )
    });
  });

});