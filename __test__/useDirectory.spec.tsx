import React from 'react';
import mock from 'mock-fs';
import { renderHook, act } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { mockStore } from './__mocks__/reduxStoreMock';
import * as metafiles from '../src/containers/metafiles';
import { useDirectory } from '../src/store/hooks/useDirectory';

describe('useDirectory', () => {

  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: [],
      cards: [],
      stacks: []
    },
    stacks: {},
    cards: {},
    filetypes: {
      91: {
        id: '91',
        filetype: 'JavaScript',
        handler: 'Editor',
        extensions: ['js', 'jsm']
      },
      101: {
        id: '101',
        filetype: 'Directory',
        handler: 'Explorer',
        extensions: []
      }
    },
    metafiles: {
      28: {
        id: '28',
        name: 'foo',
        path: 'foo',
        modified: DateTime.fromISO('2019-04-14T20:05:14.543-08:00'),
        filetype: 'Directory',
        contains: ['3']
      },
      3: {
        id: '3',
        name: 'bar.js',
        path: 'foo/bar.js',
        modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00')
      },
      21: {
        id: '14',
        name: 'virtual.js',
        modified: DateTime.fromISO('2020-06-25T04:19:55.309-08:00')
      }
    },
    repos: {},
    modals: {}
  });
  const wrapper = ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>;

  beforeAll(() => {
    mock({
      'foo/bar.js': mock.file({ content: 'file contents', ctime: new Date(1), mtime: new Date(1) })
    });
  });
  afterEach(() => {
    store.clearActions();
    jest.clearAllMocks();
  });
  afterAll(mock.restore);

  it('useDirectory hook contains no directories or files before fetch', async () => {
    const { result } = renderHook(() => useDirectory('foo'), { wrapper });
    expect(result.current.directories).toHaveLength(0);
    expect(result.current.files).toHaveLength(0);
  });

  it('useDirectory hook sets root, directories, and files on fetch', async () => {
    jest.spyOn(metafiles, 'filterDirectoryContainsTypes').mockResolvedValue({ directories: [], files: ['foo/bar.js'] });
    const { result, waitForNextUpdate } = renderHook(() => useDirectory('foo'), { wrapper });

    result.current.fetch();
    await waitForNextUpdate();

    expect(result.current.root).toEqual(
      expect.objectContaining({ id: '28', name: 'foo' })
    );
    expect(result.current.directories).toHaveLength(0);
    expect(result.current.files).toEqual(['foo/bar.js']);
  });

  it('useDirectory hook does not reset root, directories, and files on multiple fetches', async () => {
    jest.spyOn(metafiles, 'filterDirectoryContainsTypes').mockResolvedValue({ directories: [], files: ['foo/bar.js'] });
    const getMetafileSpy = jest.spyOn(metafiles, 'getMetafile');
    const { result, waitForNextUpdate } = renderHook(() => useDirectory('foo'), { wrapper });

    await act(async () => {
      result.current.fetch();
      await waitForNextUpdate();
      result.current.fetch();
    });

    expect(getMetafileSpy).toHaveBeenCalledTimes(1);
  });

});