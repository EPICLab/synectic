import React from 'react';
import mock from 'mock-fs';
import { Provider } from 'react-redux';
import { cleanup, render, act } from '@testing-library/react';
import { wrapWithTestBackend } from 'react-dnd-test-utils';
import * as path from 'path';
import { homedir } from 'os';

import CanvasComponent from '../src/components/CanvasComponent';
import { mockStore, extractFieldArray } from './__mocks__/reduxStoreMock';
import { testStore } from './__fixtures__/ReduxStore';
import { fullCanvas } from './__fixtures__/Canvas';
import { flattenArray } from '../src/containers/flatten';

const store = mockStore(testStore);

describe('CanvasComponent', () => {

  // mocks for git config are required; ReduxStore fixture contains MergeDialog components which check for config values
  beforeEach(() => {
    mock({
      'foo': {},
      [path.join(homedir(), '.gitconfig')]: mock.file({
        content: `[user]
  name = Sandy Updates
  email = supdate@oregonstate.edu
[core]
  editor = vim
  whitespace = fix,-indent-with-non-tab,trailing-space,cr-at-eol`,
      }),
      '.git/config': mock.file({
        content: `[user]
  name = Bobby Tables
  email = bdrop@oregonstate.edu
[credential]
  helper = osxkeychain
[pull]
  rebase = true
[alias]
  last = log -1 HEAD`,
      }),
    }, { createCwd: false });
  });

  afterEach(() => {
    cleanup;
    jest.clearAllMocks();
    mock.restore();
  });

  it('Canvas renders correctly', async () => {
    await act(async () => {
      const [WrappedComponent] = wrapWithTestBackend(CanvasComponent);
      const { getByTestId } = render(
        <Provider store={store}>
          <WrappedComponent {...fullCanvas} />
        </Provider>
      );
      expect(getByTestId('canvas-component')).toBeInTheDocument();
    })
  });

  it('Canvas resolves props to render Cards', async () => {
    await act(async () => {
      const [WrappedComponent] = wrapWithTestBackend(CanvasComponent);
      const { getAllByTestId } = render(
        <Provider store={store}>
          <WrappedComponent {...fullCanvas} />
        </Provider>
      );
      const cardsInStacks = flattenArray(extractFieldArray(store.getState().stacks).map(s => s.cards));
      expect(getAllByTestId('card-component')).toHaveLength(fullCanvas.cards.length + cardsInStacks.length);
    });
  });

  it('Canvas resolves props to render Stacks', async () => {
    await act(async () => {
      const [WrappedComponent] = wrapWithTestBackend(CanvasComponent);
      const { getAllByTestId } = render(
        <Provider store={store}>
          <WrappedComponent {...fullCanvas} />
        </Provider>
      );
      expect(getAllByTestId('stack-component')).toHaveLength(fullCanvas.stacks.length);
    });
  });

});