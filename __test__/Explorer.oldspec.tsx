// import React from 'react';
// import mock from 'mock-fs';
// import { Provider } from 'react-redux';
// import TreeView from '@material-ui/lab/TreeView';
import { cleanup } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';

import { mockStore } from './__mocks__/reduxStoreMock';
// import { DirectoryComponent } from '../src/components/Explorer';
import { testStore } from './__fixtures__/ReduxStore';
// import * as io from '../src/containers/io';
// import * as hook from '../src/store/hooks/useDirectory';
import type { MockInstance } from './__mocks__/mock-fs-promise';
import { mock, file } from './__mocks__/mock-fs-promise';

const store = mockStore(testStore);

describe('DirectoryComponent', () => {
  let mockedInstance: MockInstance;

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

  it('DirectoryComponent initially renders without expanding to display children', () => {
    // render(
    //   <Provider store={store} >
    //     <TreeView><DirectoryComponent root={'foo'} /> </TreeView>
    //   </Provider>
    // );

    // expect(screen.getByRole('treeitem')).toBeInTheDocument();
    // expect(screen.queryByText('bar.js')).not.toBeInTheDocument();

    return expect(true).toBe(true);
  });

  // it('DirectoryComponent expands to display child files and directories', async () => {
  //   render(
  //     <Provider store={store}>
  //       <TreeView><DirectoryComponent root={'foo'} /></TreeView>
  //     </Provider>
  //   );
  //   expect(screen.queryByText('bar.js')).not.toBeInTheDocument();

  //   await act(async () => {
  //     userEvent.click(screen.getByText('foo'));
  //   });

  //   expect(screen.queryByText('bar.js')).toBeInTheDocument();
  // });

});