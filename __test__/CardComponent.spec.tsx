import React from 'react';
import { Provider } from 'react-redux';
import { cleanup, render, waitFor } from '@testing-library/react';
import { wrapWithTestBackend } from 'react-dnd-test-utils';
import { act } from '@testing-library/react/pure';
import userEvent from '@testing-library/user-event';

import { mockStore } from './__mocks__/reduxStoreMock';
import CardComponent from '../src/components/CardComponent';
import { testStore } from './__fixtures__/ReduxStore';
import { browserCard, diffCard, explorerCard, firstEditorCard, trackerCard } from './__fixtures__/Card';

const store = mockStore(testStore);

describe('CardComponent', () => {

  afterEach(() => {
    cleanup;
    jest.resetAllMocks();
  });

  it('Card resolves props into React Component for Editor handler', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    const { getByTestId } = render(
      <Provider store={store}>
        <WrappedComponent {...firstEditorCard} />
      </Provider>
    );
    expect(getByTestId('card-component')).toBeInTheDocument();
  });

  it('Card resolves props into React Component for Diff handler', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    const { getByTestId } = render(
      <Provider store={store}>
        <WrappedComponent {...diffCard} />
      </Provider>
    );
    expect(getByTestId('card-component')).toBeInTheDocument();
  });

  it('Card resolves props into React Component for Explorer handler', async () => {
    // Explorer component automatically loads files and directories through async calls to the useDirectory hook
    await act(async () => {
      const [WrappedComponent] = wrapWithTestBackend(CardComponent);
      const { getByTestId } = render(
        <Provider store={store}>
          <WrappedComponent {...explorerCard} />
        </Provider>
      );
      expect(getByTestId('card-component')).toBeInTheDocument();
    });
  });

  it('Card resolves props into React Component for Browser handler', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    const { getByTestId } = render(
      <Provider store={store}>
        <WrappedComponent {...browserCard} />
      </Provider>
    );
    expect(getByTestId('card-component')).toBeInTheDocument();
  });

  it('Card resolves props into React Component for Tracker handler', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    const { getByTestId } = render(
      <Provider store={store}>
        <WrappedComponent {...trackerCard} />
      </Provider>
    );
    expect(getByTestId('card-component')).toBeInTheDocument();
  });

  it('Editor Card renders a reverse side when the flip button is clicked', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    const { getByText, getByRole } = render(
      <Provider store={store}>
        <WrappedComponent {...firstEditorCard} />
      </Provider>
    );

    userEvent.click(getByRole('button', { name: /flip/i }));

    expect(getByText(/ID:/i)).toBeInTheDocument();
  });

  it('Explorer Card renders a reverse side when the flip button is clicked', async () => {
    // Explorer component automatically loads files and directories through async calls to the useDirectory hook
    await act(async () => {
      const [WrappedComponent] = wrapWithTestBackend(CardComponent);
      const { getByText, getByRole } = render(
        <Provider store={store}>
          <WrappedComponent {...explorerCard} />
        </Provider>
      );

      userEvent.click(getByRole('button', { name: /flip/i }));

      await waitFor(() => {
        expect(getByText(/Name:/i)).toBeInTheDocument();
      });
    });
  });

  it('Diff Card renders a reverse side when the flip button is clicked', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    const { getByText, getByRole } = render(
      <Provider store={store}>
        <WrappedComponent {...diffCard} />
      </Provider>
    );

    userEvent.click(getByRole('button', { name: /flip/i }));

    expect(getByText(/Name:/i)).toBeInTheDocument();
  });

  it('Browser Card renders a reverse side when the flip button is clicked', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    const { getByText, getByRole } = render(
      <Provider store={store}>
        <WrappedComponent {...browserCard} />
      </Provider>
    );

    userEvent.click(getByRole('button', { name: /flip/i }));

    expect(getByText(/ID:/i)).toBeInTheDocument();
  });

  it('Tracker Card renders a reverse side when the flip button is clicked', async () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    const { getByText, getByRole } = render(
      <Provider store={store}>
        <WrappedComponent {...browserCard} />
      </Provider>
    );

    userEvent.click(getByRole('button', { name: /flip/i }));

    expect(getByText(/ID:/i)).toBeInTheDocument();
  });
});