import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { remote } from 'electron'; // imports the mocked dependency to allow access to the spies
import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { mockStore } from './__mocks__/reduxStoreMock';
import FilePickerButton from '../src/components/FilePickerDialog';

type EmptyObject = Record<string, unknown>;

const domElement = document.getElementById('app');
const mountOptions = {
  attachTo: domElement,
};

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

afterEach(store.clearActions);

describe('FilePicker', () => {
  const FilePickerContext = wrapInReduxContext(FilePickerButton, store);
  let wrapper: ReactWrapper<unknown, Readonly<EmptyObject>, React.Component<EmptyObject, EmptyObject, unknown>>;

  beforeEach(() => wrapper = mount(<FilePickerContext />, mountOptions));
  afterEach(() => wrapper.unmount());

  it('FilePicker does not render dialog on initial state', () => {
    expect(remote.dialog.showOpenDialog).not.toHaveBeenCalled();
  });

  it('FilePicker allows users to pick a file for opening', async () => {
    wrapper.find('#filepicker-button').first().simulate('click');
    return expect(remote.dialog.showOpenDialog).toHaveBeenCalled();
  });
});