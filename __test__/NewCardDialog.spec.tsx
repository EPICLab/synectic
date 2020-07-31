import React from 'react';
import { ReactWrapper, mount } from 'enzyme';

import { getMockStore } from './__mocks__/reduxStoreMock';
import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { NewCardDialog } from '../src/components/NewCardDialog';
import { validateFileName } from '../src/containers/io';
import { TextField } from '@material-ui/core';

type EmptyObject = Record<string, unknown>;

const domElement = document.getElementById('app');
const mountOptions = {
  attachTo: domElement,
};
const store = getMockStore();

describe('NewCardDialog', () => {
  const NewCardContext = wrapInReduxContext(NewCardDialog, store);
  let wrapper: ReactWrapper<EmptyObject, Readonly<EmptyObject>, React.Component<EmptyObject, EmptyObject, EmptyObject>>;

  beforeEach(() => wrapper = mount(<NewCardContext open={true} />, mountOptions));
  afterEach(() => wrapper.unmount());

  const exts = ["ts", "html"];
  const configExts = [".gitignore", ".htaccess"];

  it('NewCardDialog starts with empty values for file name and filetype', () => {
    const newCardDialog = wrapper.find(NewCardDialog);
    expect(newCardDialog.prop('fileName')).toBeUndefined();
    expect(newCardDialog.prop('filetype')).toBeUndefined();
    expect(newCardDialog.html()).toContain('<input aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput" value="">');
    expect(wrapper.find(TextField).props().value).toEqual("");
  });

  it('NewCardDialog does not change Redux state when invalid information is entered', () => {
    const before = JSON.stringify(store.getState());
    expect(wrapper.find(NewCardDialog).prop('isFileNameValid')).toBeFalsy();
    wrapper.find('#create-card-button').first().simulate('click');
    const after = JSON.stringify(store.getState());
    expect(before).toEqual(after);
  });

  it('validateFileName returns false for an invalid file name and true for a valid file name', () => {
    expect(validateFileName('<.ts', configExts, exts)).toEqual(false);
    expect(validateFileName('>.ts', configExts, exts)).toEqual(false);
    expect(validateFileName(':.ts', configExts, exts)).toEqual(false);
    expect(validateFileName('".ts', configExts, exts)).toEqual(false);
    expect(validateFileName('/.ts', configExts, exts)).toEqual(false);
    expect(validateFileName('\\.ts', configExts, exts)).toEqual(false);
    expect(validateFileName('|.ts', configExts, exts)).toEqual(false);
    expect(validateFileName('?.ts', configExts, exts)).toEqual(false);
    expect(validateFileName('*.ts', configExts, exts)).toEqual(false);
    expect(validateFileName(' .ts', configExts, exts)).toEqual(false);
    expect(validateFileName('..ts', configExts, exts)).toEqual(false);
    expect(validateFileName('foo .ts', configExts, exts)).toEqual(false);
    expect(validateFileName('bar..ts', configExts, exts)).toEqual(false);

    expect(validateFileName('foo.ts', configExts, exts)).toEqual(true);
    expect(validateFileName('bar.html', configExts, exts)).toEqual(true);
  });
});