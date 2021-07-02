import React from 'react';
import userEvent from '@testing-library/user-event';
import { cleanup, fireEvent, render, waitFor, screen } from '@testing-library/react';

import NewCardDialog from '../src/components/NewCardDialog';
import { mockStore } from './__mocks__/reduxStoreMock';
import { Provider } from 'react-redux';
import { newCardModal } from './__fixtures__/Modal';
import { testStore } from './__fixtures__/ReduxStore';
import { ActionKeys } from '../src/store/actions';

const store = mockStore(testStore);

describe('NewCardDialog', () => {

  afterEach(() => {
    cleanup;
    jest.resetAllMocks();
  });

  it('NewCardDialog renders correctly', () => {
    render(
      <Provider store={store}>
        <NewCardDialog {...newCardModal} />
      </Provider>
    );
    expect(screen.getByTestId('new-card-dialog')).toBeInTheDocument();
  });

  it('NewCardDialog generates REMOVAL_MODAL action when escape key is pressed', async () => {
    render(
      <Provider store={store}>
        <NewCardDialog {...newCardModal} />
      </Provider>
    );

    fireEvent.keyDown(screen.getByTestId('new-card-dialog'), {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      charCode: 27
    });

    await waitFor(() => {
      expect(store.getActions()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: ActionKeys.REMOVE_MODAL,
            id: newCardModal.id
          })
        ])
      )
    });
  });

  it('NewCardDialog generates REMOVE_MODAL action when clicking outside of dialog', async () => {
    render(
      <Provider store={store}>
        <NewCardDialog {...newCardModal} />
      </Provider>
    );

    // using DOM selector method instead of RTL
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) userEvent.click(backdrop);

    await waitFor(() => {
      expect(store.getActions()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: ActionKeys.REMOVE_MODAL,
            id: newCardModal.id
          })
        ])
      )
    });
  });

  it('NewCardDialog validates filename and filetype', async () => {
    render(
      <Provider store={store}>
        <NewCardDialog {...newCardModal} />
      </Provider>
    )

    // open the editor portion of dialog
    userEvent.click(screen.getByTestId('editor-button'));
    // enter a filename with an invalid filetype
    fireEvent.change(screen.getByLabelText('Filename'), {
      target: { value: 'test.jsxw' }
    });
    expect(screen.getByText('Invalid Filename')).toBeInTheDocument();
    expect(screen.getByText('Create Card').closest('button')).toBeDisabled();
  });

  it('NewCardDialog populates filetype on valid filename entry', async () => {
    render(
      <Provider store={store}>
        <NewCardDialog {...newCardModal} />
      </Provider>
    )

    // open the editor portion of dialog
    userEvent.click(screen.getByTestId('editor-button'));
    // enter a filename with a valid filetype
    userEvent.type(screen.getByLabelText('Filename'), 'test.js');
    expect(screen.getByTestId('new-card-filetype-selector')).toHaveValue('JavaScript');
    expect(screen.getByText('Create Card').closest('button')).toBeEnabled();

    // click to attempt to create a card
    userEvent.click(screen.getByText('Create Card'));
    await waitFor(() => {
      expect(store.getActions()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: ActionKeys.ADD_METAFILE
          })
        ])
      )
    });
  });

});