import React from 'react';
import { mount } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndMock';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/root';
import { Provider } from 'react-redux';
// import configureStore from 'redux-mock-store';
// import { remote } from 'electron';

import FilePicker from '../src/components/FilePicker';

describe('FilePicker', () => {
  // const mockStore = configureStore([]);

  // it('handleOpenFilePaths', async () => {
  //   const x = await handleOpenFilePaths(['../examples/sample.php', '../examples/.config.jswt']);
  //   expect(x).toHaveLength(2);
  // });

  it('FilePicker allows users to pick a file for opening', () => {
    const store = createStore(rootReducer);
    const FilePickerContext = wrapInTestContext(FilePicker);
    const ref = React.createRef();
    const enzymeWrapper = mount(<Provider store={store}><FilePickerContext ref={ref} /></Provider>);
    expect(enzymeWrapper.find(FilePicker)).toHaveLength(1);


    // const initialState: unknown = [];
    // const store = mockStore(initialState);
    // const wrapper = mount(<Provider store={store}><FilePicker /></Provider>);
    // wrapper.find('#filepicker-button').first().simulate('click');
    // // expect().toMatchSnapshot();
    // expect(remote.dialog.showOpenDialog).toHaveBeenCalledTimes(1);
  });
});