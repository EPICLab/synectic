import { getMockStore } from './__mocks__/reduxStoreMock';
import { ReactWrapper, mount } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndReduxMock';
import { NewCardComponent } from '../src/components/NewCardDialog';
import React from 'react';
import { remote } from 'electron'; // imports the mocked dependency to allow access to the spies

const domElement = document.getElementById('app');
const mountOptions = {
    attachTo: domElement,
};
const store = getMockStore();

describe('NewCardDialog', () => {
    const NewCardContext = wrapInTestContext(NewCardComponent, store);
    let wrapper: ReactWrapper<unknown, Readonly<{}>, React.Component<{}, {}, unknown>>;

    beforeEach(() => wrapper = mount(<NewCardContext />, mountOptions));
    afterEach(() => wrapper.unmount());

    it('NewCardDialog does not render dialog on initial state', () => {
        expect(remote.dialog.showOpenDialog).not.toHaveBeenCalled();
    });

    it('NewCardDialog opens dialog on click', async () => {
        process.stdout.write("html:" + wrapper.html());
        wrapper.find('#newcard-button').first().simulate('click');
        return expect(remote.dialog.showOpenDialog).toHaveBeenCalled();
    });
});