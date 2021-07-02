import React from 'react';
import mock from 'mock-fs';
import { Provider } from 'react-redux';
import { cleanup, render, act, waitFor, screen } from '@testing-library/react';
import { wrapWithTestBackend } from 'react-dnd-test-utils';
import userEvent from '@testing-library/user-event';

import { mockStore } from './__mocks__/reduxStoreMock';
import CardComponent from '../src/components/CardComponent';
import { testStore } from './__fixtures__/ReduxStore';
import { browserCard, diffCard, explorerCard, firstEditorCard, trackerCard } from './__fixtures__/Card';
import * as useDirectoryHook from '../src/store/hooks/useDirectory';

const store = mockStore(testStore);

describe('CardComponent', () => {

  beforeAll(() => {
    mock({
      'foo/example.ts': mock.file({ content: 'var rand = Math.floor(Math.random() * 6) + 1;', ctime: new Date(1), mtime: new Date(1) }),
      'test.js': mock.file({ content: 'var rand: number = Math.floor(Math.random() * 6) + 1;', ctime: new Date(1), mtime: new Date(1) }),
      'example.ts': mock.file({ content: 'const rand = Math.floor(Math.random() * 6) + 1;', ctime: new Date(1), mtime: new Date(1) })
    });
  });
  afterAll(mock.restore);

  afterEach(() => {
    cleanup;
    store.clearActions();
    jest.clearAllMocks();
  });

  it('Card resolves props into React Component for Editor handler', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    render(
      <Provider store={store}>
        <WrappedComponent {...firstEditorCard} />
      </Provider>
    );
    expect(screen.getByTestId('card-component')).toBeInTheDocument();
  });

  it('Card resolves props into React Component for Diff handler', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    render(
      <Provider store={store}>
        <WrappedComponent {...diffCard} />
      </Provider>
    );
    expect(screen.getByTestId('card-component')).toBeInTheDocument();
  });

  it('Card resolves props into React Component for Explorer handler', async () => {
    // Explorer component automatically loads files and directories through async calls to the useDirectory hook
    jest.spyOn(useDirectoryHook, 'useDirectory').mockReturnValue({
      root: 'foo',
      directories: [],
      files: [],
      update: () => { return new Promise<void>(resolve => resolve()) }
    });
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    await act(async () => {
      render(
        <Provider store={store}>
          <WrappedComponent {...explorerCard} />
        </Provider>
      );
      expect(screen.getByTestId('card-component')).toBeInTheDocument();
    });
  });

  it('Card resolves props into React Component for Browser handler', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    render(
      <Provider store={store}>
        <WrappedComponent {...browserCard} />
      </Provider>
    );
    expect(screen.getByTestId('card-component')).toBeInTheDocument();
  });

  it('Card resolves props into React Component for Tracker handler', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    render(
      <Provider store={store}>
        <WrappedComponent {...trackerCard} />
      </Provider>
    );
    expect(screen.getByTestId('card-component')).toBeInTheDocument();
  });

  it('Editor Card renders a reverse side when the flip button is clicked', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    render(
      <Provider store={store}>
        <WrappedComponent {...firstEditorCard} />
      </Provider>
    );

    userEvent.click(screen.getByRole('button', { name: /flip/i }));

    expect(screen.getByText(/ID:/)).toBeInTheDocument();
  });

  it('Explorer Card renders a reverse side when the flip button is clicked', async () => {
    // Explorer component automatically loads files and directories through async calls to the useDirectory hook
    jest.spyOn(useDirectoryHook, 'useDirectory').mockReturnValue({
      root: 'foo',
      directories: [],
      files: [],
      update: () => { return new Promise<void>(resolve => resolve()) }
    });
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    await act(async () => {
      render(
        <Provider store={store}>
          <WrappedComponent {...explorerCard} />
        </Provider>
      );

      userEvent.click(screen.getByRole('button', { name: /flip/i }));
      await waitFor(() => {
        expect(screen.getByText(/Name:/)).toBeInTheDocument();
      });
    });
  });

  it('Diff Card renders a reverse side when the flip button is clicked', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    render(
      <Provider store={store}>
        <WrappedComponent {...diffCard} />
      </Provider>
    );

    userEvent.click(screen.getByRole('button', { name: /flip/i }));

    expect(screen.getByText(/Name:/)).toBeInTheDocument();
  });

  it('Browser Card renders a reverse side when the flip button is clicked', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    render(
      <Provider store={store}>
        <WrappedComponent {...browserCard} />
      </Provider>
    );

    userEvent.click(screen.getByRole('button', { name: /flip/i }));

    expect(screen.getByText(/ID:/)).toBeInTheDocument();
  });

  it('Tracker Card renders a reverse side when the flip button is clicked', async () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    render(
      <Provider store={store}>
        <WrappedComponent {...browserCard} />
      </Provider>
    );

    userEvent.click(screen.getByRole('button', { name: /flip/i }));

    expect(screen.getByText(/ID:/)).toBeInTheDocument();
  });
});