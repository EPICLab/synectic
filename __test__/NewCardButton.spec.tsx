import React from 'react';
import { ReactWrapper, mount } from 'enzyme';

import { getMockStore } from './__mocks__/reduxStoreMock';
import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import NewCardButton, { NewCardDialog } from '../src/components/NewCardDialog';
import { Backdrop } from '@material-ui/core';

type EmptyObject = Record<string, unknown>;

const domElement = document.getElementById('app');
const mountOptions = {
  attachTo: domElement,
};
const store = getMockStore();

describe('NewCardButton', () => {
  const NewCardContext = wrapInReduxContext(NewCardButton, store);
  let wrapper: ReactWrapper<EmptyObject, Readonly<EmptyObject>, React.Component<EmptyObject, EmptyObject, EmptyObject>>;

  beforeEach(() => wrapper = mount(<NewCardContext />, mountOptions));
  afterEach(() => wrapper.unmount());

  it('NewCardButton does not render dialog on initial state', () => {
    expect(wrapper.find(NewCardDialog).props().open).toBe(false);
  });

  it('NewCardButton renders dialog when clicked', () => {
    wrapper.find('#newcard-button').first().simulate('click');
    expect(wrapper.find(NewCardDialog).props().open).toBe(true);
  });

  it('NewCardButton closes dialog when backdrop is clicked', () => {
    wrapper.find('#newcard-button').first().simulate('click');
    wrapper.find(Backdrop).simulate('click');
    expect(wrapper.find(NewCardDialog).props().open).toBe(false);
  });

  it('NewCardButton closes dialog when escape key is pressed', () => {
    wrapper.find('#newcard-button').first().simulate('click');
    wrapper.find(Backdrop).simulate('keyDown', { key: 'Escape', keyCode: 27, which: 27 });
    expect(wrapper.find(NewCardDialog).props().open).toBe(false);
  });

  it('NewCardButton does not update Redux store when canceled', () => {
    const before = JSON.stringify(store.getState());
    wrapper.find('#newcard-button').first().simulate('click');
    wrapper.find(NewCardDialog).invoke('onClose');
    const after = JSON.stringify(store.getState());
    expect(before).toBe(after);
  });
});