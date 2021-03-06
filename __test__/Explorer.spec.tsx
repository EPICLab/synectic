import '@testing-library/jest-dom';
import React from 'react';
import { Provider } from 'react-redux';
import TreeView from '@material-ui/lab/TreeView';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { act } from '@testing-library/react/pure';

import { mockStore, extractFieldMap } from './__mocks__/reduxStoreMock';
import { DirectoryComponent } from '../src/components/Explorer';
import * as useDirectory from '../src/store/hooks/useDirectory';
import { testStore } from './__fixtures__/ReduxStore';

const store = mockStore(testStore);

describe('DirectoryComponent', () => {

  afterEach(() => {
    cleanup;
    jest.resetAllMocks();
  });

  it('DirectoryComponent initially renders without expanding to display children', () => {
    const { getByRole, queryByText } = render(
      <Provider store={store}>
        <TreeView><DirectoryComponent root={'foo'} /></TreeView>
      </Provider>
    );

    expect(getByRole('treeitem')).toBeInTheDocument();
    expect(queryByText('bar.js')).not.toBeInTheDocument();
  });

  it('DirectoryComponent expands to display child files and directories', () => {
    const root = extractFieldMap(store.getState().metafiles)[28];
    jest.spyOn(useDirectory, 'useDirectory').mockReturnValue({
      root: root,
      directories: [],
      files: ['foo/bar.js'],
      fetch: async () => { await new Promise(resolve => resolve(0)) }
    });
    const { queryByText } = render(
      <Provider store={store}>
        <TreeView><DirectoryComponent root={'foo'} /></TreeView>
      </Provider>
    );

    expect(queryByText('bar.js')).not.toBeInTheDocument();
    const component = queryByText('foo');
    act(() => {
      if (component) fireEvent.click(component);
    });
    expect(queryByText('bar.js')).toBeInTheDocument();
  });

});
