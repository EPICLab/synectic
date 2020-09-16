import React from 'react';
import { ReactWrapper, mount } from 'enzyme';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { mockStore } from './__mocks__/reduxStoreMock';
import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { NewCardDialog } from '../src/components/NewCardDialog';
import { validateFileName } from '../src/containers/io';
import { TextField } from '@material-ui/core';
import { fireEvent, render, screen, within } from '@testing-library/react';

type EmptyObject = Record<string, unknown>;

const domElement = document.getElementById('app');
const mountOptions = {
  attachTo: domElement,
};

const store = mockStore({
  canvas: {
    id: v4(),
    created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
    repos: [],
    cards: [],
    stacks: []
  },
  stacks: {},
  cards: {},
  filetypes: {},
  metafiles: {},
  repos: {},
  errors: {}
});

afterEach(store.clearActions);

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
    render(<NewCardContext />);
    const before = JSON.stringify(store.getState());
    expect(wrapper.find(NewCardDialog).prop('isFileNameValid')).toBeFalsy();
    const button = screen.queryByText(/create-card-button/i);
    if (button) fireEvent.click(button);
    const after = JSON.stringify(store.getState());
    expect(before).toEqual(after);
  });

  it('NewCardDialog allows the user to enter/edit the file name', () => {
    render(<NewCardContext />);
    const inputBox = screen.getByRole('textbox');

    // Type guard so we can access .value from inputBox (.value doesn't exist in HTMLElement, but does in HTMLInputElement)
    if ((inputBox instanceof HTMLInputElement)) {
      expect(inputBox.value).toBe("");

      // Enter file name into text box
      if (inputBox) fireEvent.change(inputBox, { target: { value: 'foo' } });

      expect(inputBox.value).toBe("foo");
    }
  });

  // TODO: Add test to check that you can change the file type
  it('NewCardDialog allows the user to pick a file type', () => {
    render(<NewCardContext />);
    const selector = screen.getAllByRole('button')[0];

    fireEvent.mouseDown(selector);
    const listBox = within(screen.getByRole('listbox'));

    fireEvent.click(listBox.getByText(/TypeScript/i));

    expect(screen.getByRole('heading')).toHaveTextContent(/TypeScript/i);
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