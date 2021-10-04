import React from 'react';
import { Provider } from 'react-redux';
import { render, act, waitFor, screen } from '@testing-library/react';
import { wrapWithTestBackend } from 'react-dnd-test-utils';
import userEvent from '@testing-library/user-event';

import { mockStore } from './__mocks__/reduxStoreMock';
import CardComponent from '../src/components/CardComponent';
import { testStore } from './__fixtures__/ReduxStore';
import { browserCard, diffCard, explorerCard, firstEditorCard, reposTrackerCard } from './__fixtures__/Card';
import * as useDirectoryHook from '../src/containers/hooks/useDirectory';
import type { MockInstance } from './__mocks__/mock-fs-promise';
import { mock, file } from './__mocks__/mock-fs-promise';

const store = mockStore(testStore);

describe('CardComponent', () => {
  let mockedInstance: MockInstance;

  beforeAll(async () => {
    const instance = await mock({
      'foo/example.ts': file({ content: 'var rand = Math.floor(Math.random() * 6) + 1;', mtime: new Date(1) }),
      'test.js': file({ content: 'var rand: number = Math.floor(Math.random() * 6) + 1;', mtime: new Date(1) }),
      'example.ts': file({ content: 'const rand = Math.floor(Math.random() * 6) + 1;', mtime: new Date(1) })
    });
    return mockedInstance = instance;
  });
  afterAll(() => mockedInstance.reset());

  afterEach(() => {
    store.clearActions();
    jest.clearAllMocks();
  });

  it('Card removes from Redux store on close button', () => {
    const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    render(
      <Provider store={store}>
        <WrappedComponent {...firstEditorCard} />
      </Provider>
    );
    userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'cards/cardRemoved'
        })
      ])
    )
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
    jest.spyOn(useDirectoryHook, 'default').mockReturnValue({
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
        <WrappedComponent {...reposTrackerCard} />
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
    jest.spyOn(useDirectoryHook, 'default').mockReturnValue({
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

  it('RepoTracker Card renders a reverse side when the flip button is clicked', async () => {
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