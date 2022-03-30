import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';
import TreeView from '@material-ui/lab/TreeView';
import type { MockInstance } from '../../test-utils/mock-fs';
import { file, mock } from '../../test-utils/mock-fs';
import { mockStore } from '../../../__test__/__mocks__/reduxStoreMock';
import { testStore } from '../../../__test__/__fixtures__/ReduxStore';
import { directoryMetafile } from '../../../__test__/__fixtures__/Metafile';
import Directory from './Directory';

describe('Directory', () => {
  let mockedInstance: MockInstance;
  const store = mockStore(testStore);

  beforeAll(async () => {
    const instance = await mock({
      'foo/bar.js': file({ content: 'file contents', mtime: new Date(1) })
    });
    return mockedInstance = instance;
  });
  afterAll(() => mockedInstance.reset());

  afterEach(() => {
    cleanup;
    store.clearActions();
    jest.clearAllMocks();
  });

  it('Directory initially renders without expanding to display children', () => {
    render(
      <Provider store={store} >
        <TreeView><Directory {...directoryMetafile} /> </TreeView>
      </Provider>
    );

    expect(screen.getByRole('treeitem')).toBeInTheDocument();
    expect(screen.queryByText('bar.js')).not.toBeInTheDocument();
  });

  it('Directory expands to display child files and directories', async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <TreeView><Directory {...directoryMetafile} /></TreeView>
      </Provider>
    );
    expect(screen.queryByText('bar.js')).not.toBeInTheDocument();

    await user.click(screen.getByText('foo'));

    expect(screen.queryByText('bar.js')).toBeInTheDocument();
  });

});