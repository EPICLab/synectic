import '@testing-library/jest-dom';
import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import { render, fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { mockStore, extractFieldMap } from './__mocks__/reduxStoreMock';
import { DirectoryComponent } from '../src/components/Explorer';
import * as useDirectory from '../src/store/hooks/useDirectory';

describe('DirectoryComponent', () => {

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
        modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
        filetype: 'JavaScript'
      },
      21: {
        id: '14',
        name: 'virtual.js',
        modified: DateTime.fromISO('2020-06-25T04:19:55.309-08:00')
      }
    },
    repos: {},
    errors: {}
  });
  afterEach(store.clearActions);

  it('DirectoryComponent initially renders without expanding to display children', () => {
    const DirectoryContext = wrapInReduxContext(DirectoryComponent, store);
    render(<TreeView><DirectoryContext root={'foo'} /></TreeView>);

    expect(screen.getByRole('treeitem')).toBeInTheDocument();
    expect(screen.queryByText('bar.js')).not.toBeInTheDocument();
  });

  it('DirectoryComponent expands to display child files and directories', () => {
    const root = extractFieldMap(store.getState().metafiles)[28];
    jest.spyOn(useDirectory, 'useDirectory').mockReturnValue({
      root: root,
      directories: [],
      files: ['foo/bar.js'],
      fetch: async () => { await new Promise(resolve => resolve(0)) }
    });
    const DirectoryContext = wrapInReduxContext(DirectoryComponent, store);
    render(<TreeView><DirectoryContext root={'foo'} /></TreeView>);

    expect(screen.queryByText('bar.js')).not.toBeInTheDocument();
    const component = screen.queryByText('foo');
    act(() => {
      if (component) fireEvent.click(component);
    });
    expect(screen.queryByText('bar.js')).toBeInTheDocument();
  });

});
