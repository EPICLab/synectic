import React from 'react';
import { mount } from 'enzyme';
import configureStore from 'redux-mock-store';
import { remote } from 'electron';
import { Provider } from 'react-redux';

import FilePicker from '../src/components/FilePicker';

describe('FilePicker', () => {
  const mockStore = configureStore([]);

  // it('handleOpenFilePaths', async () => {
  //   const x = await handleOpenFilePaths(['../examples/sample.php', '../examples/.config.jswt']);
  //   expect(x).toHaveLength(2);
  // });

  it('FilePicker allows users to pick a file for opening', () => {
    const initialState: unknown = [];
    const store = mockStore(initialState);
    const wrapper = mount(<Provider store={store}><FilePicker /></Provider>);
    wrapper.find('#filepicker-button').first().simulate('click');
    // expect().toMatchSnapshot();
    expect(remote.dialog.showOpenDialog).toHaveBeenCalledTimes(1);
  });
});