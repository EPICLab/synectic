import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import TreeView from '@material-ui/lab/TreeView';
import type { MockInstance } from '../../test-utils/mock-fs';
import { file, mock } from '../../test-utils/mock-fs';
import { emptyStore } from '../../test-utils/empty-store';
import { mockStore } from '../../test-utils/mock-store';
import Directory from './Directory';
import { DirectoryMetafile, FilebasedMetafile, FileMetafile, metafileAdded } from '../../store/slices/metafiles';
import { DateTime } from 'luxon';

const mockedMetafile1: FileMetafile = {
  id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
  name: 'bar.js',
  modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
  handler: 'Editor',
  filetype: 'Javascript',
  path: 'foo/bar.js',
  state: 'unmodified',
  content: 'file contents'
};

const mockedMetafile2: FileMetafile = {
  id: 'a5a6806b-f7e1-4f13-bca1-b1440ecd4431',
  name: 'tap.js',
  modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
  handler: 'Editor',
  filetype: 'Javascript',
  path: 'zap/tap.js',
  state: 'unmodified',
  content: 'new content'
};

const unhydratedDirectory: FilebasedMetafile = {
  id: 'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8',
  name: 'foo',
  modified: DateTime.fromISO('2021-01-31T11:24:54.527-08:00').valueOf(),
  handler: 'Explorer',
  filetype: 'Directory',
  path: 'foo',
  state: 'unmodified'
};

const hydratedDirectory: DirectoryMetafile = {
  id: '764bc7ac-deb1-48b4-ac24-a026e70f53ec',
  name: 'zap',
  modified: DateTime.fromISO('2021-01-31T11:24:54.527-08:00').valueOf(),
  handler: 'Explorer',
  filetype: 'Directory',
  path: 'zap',
  state: 'unmodified',
  contains: ['a5a6806b-f7e1-4f13-bca1-b1440ecd4431']
};

describe('Directory', () => {
  const store = mockStore(emptyStore);
  let mockedInstance: MockInstance;

  beforeAll(async () => {
    store.dispatch(metafileAdded(mockedMetafile1));
    store.dispatch(metafileAdded(mockedMetafile2));
    store.dispatch(metafileAdded(unhydratedDirectory));
    store.dispatch(metafileAdded(hydratedDirectory));
    const instance = await mock({
      'foo/bar.js': file({ content: 'file contents', mtime: new Date(1) }),
      'zap/tap.js': file({ content: 'new content', mtime: new Date(1) })
    });
    return mockedInstance = instance;
  });

  afterAll(() => mockedInstance.reset());

  afterEach(() => {
    cleanup;
    store.clearActions();
    jest.clearAllMocks();
  });

  // it('Directory initially renders with loading indicator', () => {
  //   render(
  //     <Provider store={store} >
  //       <TreeView><Directory metafile={unhydratedDirectory.id} /> </TreeView>
  //     </Provider>
  //   );
  //   expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  //   expect(screen.queryByText('foo')).not.toBeInTheDocument();
  // });

  // it('Directory eventually renders without expanding to display children', async () => {
  //   render(
  //     <Provider store={store} >
  //       <TreeView><Directory metafile={unhydratedDirectory.id} /> </TreeView>
  //     </Provider>
  //   );
  //   expect(screen.queryByText('foo')).not.toBeInTheDocument();
  //   await waitForElementToBeRemoved(() => screen.getByLabelText(/loading/i));
  //   expect(screen.getByRole('treeitem')).toBeInTheDocument();
  //   expect(screen.queryByText('foo')).toBeInTheDocument();
  // });

  it('Directory expands to display child files and directories', async () => {
    // const user = userEvent.setup();
    render(
      <Provider store={store}>
        <TreeView><Directory metafile={hydratedDirectory.id} /></TreeView>
      </Provider>
    );
    expect(screen.getByRole('treeitem')).toBeInTheDocument();
    expect(screen.getByText('zap')).toBeInTheDocument();
    expect(screen.queryByText('tap.js')).not.toBeInTheDocument();

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      const directory = screen.getByText('zap');
      fireEvent.click(directory);
    });

    // await user.click(screen.getByText('zap'));
    expect(screen.getByText('tap.js')).toBeInTheDocument();
  });

});