import React from 'react';
import { mount } from 'enzyme';
import { wrapInTestContext } from './__mocks__/dndReduxMock';
import { createStore } from 'redux';

import { rootReducer } from '../src/store/root';
import PickerDialog from '../src/components/DiffPickerDialog';



describe('DiffPicker', () => {
  it('DiffPicker component renders', () => {
    const store = createStore(rootReducer);
    const DiffPickerContext = wrapInTestContext(PickerDialog, store);
    const enzymeWrapper = mount(<DiffPickerContext />);
    expect(enzymeWrapper.exists()).toBe(true);
  });

  it('DiffDialog component is rendered when DiffPicker is clicked', () => {
    const store = createStore(rootReducer);
    const DiffPickerContext = wrapInTestContext(PickerDialog, store);
    const enzymeWrapper = mount(<DiffPickerContext />);
    enzymeWrapper.find('#diffpicker-button').first().simulate('click');
    // const diffPicker = enzymeWrapper.find(DiffPicker);
    // expect(diffPicker.state('open')).toBeTruthy();
    expect(enzymeWrapper.find('#diffpicker-dialog').exists()).toBe(true);
  });

  it('DiffPicker allows selecting different active cards', () => {
    const store = createStore(rootReducer);
    const DiffPickerContext = wrapInTestContext(PickerDialog, store);
    const ref = React.createRef();
    const enzymeWrapper = mount(<DiffPickerContext ref={ref} />);
    const picker = enzymeWrapper.find('#diffpicker-button').first();
    picker.simulate('click');
    expect(picker.props().onClick).toBeDefined();
    // TODO: Fix this test, it currently does nothing beyond testing that an onClick function exists for the Button.

    // expect(ref.current).toBe(true);
    // expect(ref).toHaveBeenCalledTimes(1);
    // expect(picker.state().open);
  });
});