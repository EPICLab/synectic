import React from 'react';
import mock from 'mock-fs';
import parsePath from 'parse-path';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { mockStore } from './__mocks__/reduxStoreMock';
import { useBranchStatus } from '../src/store/hooks/useBranchStatus';
import * as git from '../src/containers/git';

describe('useBranchStatus', () => {

  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: ['23'],
      cards: ['36'],
      stacks: []
    },
    stacks: {},
    cards: {
      36: {
        id: '36',
        name: 'bar.js',
        created: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        left: 10,
        top: 25,
        type: 'Editor',
        metafile: '3'
      }
    },
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
        modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        repo: '23',
        branch: 'sample'
      },
      21: {
        id: '14',
        name: 'virtual.js',
        modified: DateTime.fromISO('2020-06-25T04:19:55.309-08:00')
      }
    },
    repos: {
      23: {
        id: '23',
        name: 'sampleUser/myRepo',
        root: 'sampleUser/',
        corsProxy: new URL('http://www.oregonstate.edu'),
        url: parsePath('https://github.com/sampleUser/myRepo'),
        local: ['master', 'sample', 'test'],
        remote: [],
        oauth: 'github',
        username: 'sampleUser',
        password: '12345',
        token: '584n29dkj1683a67f302x009q164'
      }
    },
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

  it('useBranchStatus hook maintains list of cards associated with the specific repo and branch', async () => {
    jest.spyOn(git, 'getStatus').mockResolvedValue('*modified');
    const { result } = renderHook(() => useBranchStatus('23', 'sample'), { wrapper });
    expect(result.current.cards).toHaveLength(1);
  });

  it('useBranchStatus hook updates list of modified cards on status call', async () => {
    const spy = jest.spyOn(git, 'getStatus').mockResolvedValue('*modified');
    const { result, waitForNextUpdate } = renderHook(() => useBranchStatus('23', 'sample'), { wrapper });

    expect(result.current.cards).toHaveLength(1);
    result.current.status(result.current.cards[0]);
    await waitForNextUpdate();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.current.modified).toHaveLength(1);
  });

});