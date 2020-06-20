import React from 'react';
import { ReactWrapper, mount } from 'enzyme';

import { getMockStore } from './__mocks__/reduxStoreMock';
import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { NewCardDialog, checkFileName } from '../src/components/NewCardDialog';
import { TextField } from '@material-ui/core';

const domElement = document.getElementById('app');
const mountOptions = {
  attachTo: domElement,
};
const store = getMockStore();

describe('NewCardDialog', () => {
  const NewCardContext = wrapInReduxContext(NewCardDialog, store);
  let wrapper: ReactWrapper<{}, Readonly<{}>, React.Component<{}, {}, {}>>;

  beforeEach(() => wrapper = mount(<NewCardContext open={true} />, mountOptions));
  afterEach(() => wrapper.unmount());

  it('NewCardDialog starts with empty values for file name and filetype', () => {
    const newCardDialog = wrapper.find(NewCardDialog);
    expect(newCardDialog.prop('fileName')).toBeUndefined();
    expect(newCardDialog.prop('filetype')).toBeUndefined();
    expect(newCardDialog.html()).toContain('<input type="hidden" value="">');
    expect(wrapper.find(TextField).props().value).toEqual("");
  });

  it('NewCardDialog does not change Redux state when invalid information is entered', () => {
    const before = JSON.stringify(store.getState());
    expect(wrapper.find(NewCardDialog).prop('isFileNameValid')).toBeFalsy();
    wrapper.find('#create-card-button').first().simulate('click');
    const after = JSON.stringify(store.getState());
    expect(before).toEqual(after);
  });

  it('checkFileName returns false for an invalid file name and true for a valid file name', () => {
    expect(checkFileName('<.ts')).toEqual(false);
    expect(checkFileName('>.ts')).toEqual(false);
    expect(checkFileName(':.ts')).toEqual(false);
    expect(checkFileName('".ts')).toEqual(false);
    expect(checkFileName('/.ts')).toEqual(false);
    expect(checkFileName('\\.ts')).toEqual(false);
    expect(checkFileName('|.ts')).toEqual(false);
    expect(checkFileName('?.ts')).toEqual(false);
    expect(checkFileName('*.ts')).toEqual(false);
    expect(checkFileName(' .ts')).toEqual(false);
    expect(checkFileName('..ts')).toEqual(false);
    expect(checkFileName('foo .ts')).toEqual(false);
    expect(checkFileName('bar..ts')).toEqual(false);

    expect(checkFileName('foo.ts')).toEqual(true);
    expect(checkFileName('bar.html')).toEqual(true);
  });
});