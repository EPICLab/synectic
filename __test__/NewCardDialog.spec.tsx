import React from 'react';
import userEvent from '@testing-library/user-event';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';

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
    const { getByTestId } = render(
      <Provider store={store}>
        <NewCardDialog {...newCardModal} />
      </Provider>
    );
    expect(getByTestId('new-card-dialog')).toBeInTheDocument();
  });

  it('NewCardDialog generates REMOVAL_MODAL action when escape key is pressed', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <NewCardDialog {...newCardModal} />
      </Provider>
    );

    fireEvent.keyDown(getByTestId('new-card-dialog'), {
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
    const { getByTestId, getByLabelText, getByText } = render(
      <Provider store={store}>
        <NewCardDialog {...newCardModal} />
      </Provider>
    )

    // open the editor portion of dialog
    userEvent.click(getByTestId('editor-button'));
    // enter a filename with an invalid filetype
    fireEvent.change(getByLabelText('Filename'), {
      target: { value: 'test.jsxw' }
    });
    expect(getByText('Invalid Filename')).toBeInTheDocument();

    // click to attempt to create a card
    userEvent.click(getByText('Create Card'));
    await waitFor(() => {
      expect(store.getActions()).not.toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: ActionKeys.ADD_METAFILE | ActionKeys.ADD_CARD
          })
        ])
      )
    });
  });

  it('NewCardDialog populates filetype on valid filename entry', async () => {
    const { getByTestId, getByLabelText, getByText } = render(
      <Provider store={store}>
        <NewCardDialog {...newCardModal} />
      </Provider>
    )

    // open the editor portion of dialog
    userEvent.click(getByTestId('editor-button'));
    // enter a filename with a valid filetype
    fireEvent.change(getByLabelText('Filename'), {
      target: { value: 'test.js' }
    });
    expect(getByTestId('new-card-filetype-selector')).toHaveValue('JavaScript');

    // click to attempt to create a card
    userEvent.click(getByText('Create Card'));
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