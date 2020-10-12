import React from 'react';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { remote } from 'electron'; // imports the mocked dependency to allow access to the spies
import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { mockStore } from './__mocks__/reduxStoreMock';
import FilePickerButton from '../src/components/FilePickerDialog';
import { render } from '@testing-library/react';
import { fireEvent, screen } from '@testing-library/dom';

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
  errors: {}
});

describe('FilePickerDialog', () => {
  const FilePickerContext = wrapInReduxContext(FilePickerButton, store);

  it('FilePicker does not render dialog on initial state', () => {
    render(<FilePickerContext />);
    expect(remote.dialog.showOpenDialog).not.toHaveBeenCalled();
  });

  it('FilePicker allows users to pick a file for opening', async () => {
    render(<FilePickerContext />);
    const button = screen.queryByRole('button');
    if (button) fireEvent.click(button);
    return expect(remote.dialog.showOpenDialog).toHaveBeenCalled();
  });
});