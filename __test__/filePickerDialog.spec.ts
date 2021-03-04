import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { remote } from 'electron'; // imports the mocked dependency to allow access to the spies
import { mockStore } from './__mocks__/reduxStoreMock';
import { filePickerDialog } from '../src/containers/filepicker';

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
  filetypes: {},
  metafiles: {},
  repos: {},
  modals: {}
});

describe('FilePickerDialog', () => {

  it('FilePicker allows users to pick a file for opening', async () => {
    await store.dispatch(filePickerDialog('openFile'));
    return expect(remote.dialog.showOpenDialog).toHaveBeenCalled();
  });
});