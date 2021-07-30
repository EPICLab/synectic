import { remote } from 'electron'; // imports the mocked dependency to allow access to the spies

import { mockStore } from './__mocks__/reduxStoreMock';
// import { basicMetafile } from './__fixtures__/Metafile';
import { testStore } from './__fixtures__/ReduxStore';
import { fileOpenDialog } from '../src/containers/dialogs';

const store = mockStore(testStore);

describe('fileOpenDialog', () => {

  it('fileOpenDialog allows users to pick a file for opening', async () => {
    await store.dispatch(fileOpenDialog('openFile'));
    return expect(remote.dialog.showOpenDialog).toHaveBeenCalled();
  });
});

// describe('FileSaveDialog', () => {

//   it('fileSaveDialog allows users to pick a directory and filename for saving', async () => {
//     await store.dispatch(fileSaveDialog(basicMetafile));
//     return expect((remote.dialog.showSaveDialog)).toHaveBeenCalled();
//   });
// })