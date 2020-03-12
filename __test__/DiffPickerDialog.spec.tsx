import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Dialog, FormControl, Backdrop } from '@material-ui/core';

import { wrapInTestContext } from './__mocks__/dndReduxMock';
import { getMockStore } from './__mocks__/reduxStoreMock';
import DiffPickerButton, { DiffPickerDialog } from '../src/components/DiffPickerDialog';

const domElement = document.getElementById('app');
const mountOptions = {
  attachTo: domElement,
};
const store = getMockStore();

describe('DiffPickerButton', () => {
  const DiffPickerContext = wrapInTestContext(DiffPickerButton, store);
  let wrapper: ReactWrapper<unknown, Readonly<{}>, React.Component<{}, {}, unknown>>;

  beforeEach(() => wrapper = mount(<DiffPickerContext />, mountOptions));
  afterEach(() => wrapper.unmount());

  it('DiffPickerButton does not render dialog components on initial state', () => {
    expect(wrapper.find(DiffPickerDialog).props().open).toBe(false);
    expect(wrapper.find(Dialog).props().open).toBe(false);
    expect(wrapper.find(FormControl)).toHaveLength(0);
  });

  it('DiffPickerButton renders dialog components when button is clicked', () => {
    wrapper.find('#diffpicker-button').first().simulate('click');
    expect(wrapper.find(DiffPickerDialog).props().open).toBe(true);
    expect(wrapper.find(Dialog).props().open).toBe(true);
    expect(wrapper.find(FormControl)).toHaveLength(2);
  });

  it('DiffPickerButton closes dialog when onClose event is triggered', async () => {
    wrapper.find('#diffpicker-button').first().simulate('click');
    wrapper.find(DiffPickerDialog).invoke('onClose')(true, ['', '']);
    expect(wrapper.find(DiffPickerDialog).props().open).toBe(false);
    expect(wrapper.find(Dialog).props().open).toBe(false);
  });

  it('DiffPickerButton closes dialog when backdrop is clicked', async () => {
    wrapper.find('#diffpicker-button').first().simulate('click');
    wrapper.find(Backdrop).simulate('click');
    expect(wrapper.find(DiffPickerDialog).props().open).toBe(false);
    expect(wrapper.find(Dialog).props().open).toBe(false);
  });

  it('DiffPickerButton closes dialog when escape key is pressed', async () => {
    wrapper.find('#diffpicker-button').first().simulate('click');
    wrapper.find(Backdrop).simulate('keyDown', { key: 'Escape', keyCode: 27, which: 27 });
    expect(wrapper.find(DiffPickerDialog).props().open).toBe(false);
    expect(wrapper.find(Dialog).props().open).toBe(false);
  });

});