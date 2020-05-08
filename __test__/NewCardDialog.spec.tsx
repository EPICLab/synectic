import React from 'react';
import { ReactWrapper, mount } from 'enzyme';

import { getMockStore } from './__mocks__/reduxStoreMock';
import { wrapInTestContext } from './__mocks__/dndReduxMock';
import { NewCardDialog } from '../src/components/NewCardDialog';

const domElement = document.getElementById('app');
const mountOptions = {
    attachTo: domElement,
};
const store = getMockStore();

describe('NewCardDialog', () => {
    const NewCardContext = wrapInTestContext(NewCardDialog, store);
    let wrapper: ReactWrapper<unknown, Readonly<{}>, React.Component<{}, {}, unknown>>;

    beforeEach(() => wrapper = mount(<NewCardContext open={true} />, mountOptions));
    afterEach(() => wrapper.unmount());

    it('NewCardDialog does not change Redux state when invalid information is entered', () => {
        const before = JSON.stringify(store.getState());
        wrapper.find('#create-card-button').first().simulate('click');
        const after = JSON.stringify(store.getState());
        expect(before).toEqual(after);
    });
});