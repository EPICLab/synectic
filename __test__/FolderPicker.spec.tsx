import FolderPicker from '../src/components/FolderPicker';
import { createStore } from 'redux';
import { rootReducer } from '../src/store/root';
import { wrapInTestContext } from './__mocks__/dndMock';
import React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';

describe('FolderPicker', () => {
    it('FolderPicker allows users to pick a directory for opening', () => {
        const store = createStore(rootReducer);
        const FolderPickerContext = wrapInTestContext(FolderPicker);
        const ref = React.createRef();
        const enzymeWrapper = mount(<Provider store={store}><FolderPickerContext ref={ref} /></Provider>);
        expect(enzymeWrapper.find(FolderPicker)).toHaveLength(1);
    });
});