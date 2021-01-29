import '@testing-library/jest-dom';
import React from 'react';
import { ReactWrapper, mount } from 'enzyme';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { TextField } from '@material-ui/core';

import type { Filetype } from '../src/types';
import { mockStore } from './__mocks__/reduxStoreMock';
import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { NewCardDialog } from '../src/components/NewCardDialog';

type EmptyObject = Record<string, unknown>;

const newFiletype: Filetype = {
  id: '55',
  filetype: 'JavaScript',
  handler: 'Editor',
  extensions: ['js', 'jsm']
}

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
  filetypes: {
    '55': newFiletype
  },
  metafiles: {},
  repos: {},
  errors: {}
});

afterEach(store.clearActions);

describe('NewCardDialog', () => {
  const NewCardContext = wrapInReduxContext(NewCardDialog, store);
  let wrapper: ReactWrapper<EmptyObject, Readonly<EmptyObject>, React.Component<EmptyObject, EmptyObject, EmptyObject>>;

  const onClose = jest.fn();

  beforeEach(() => wrapper = mount(<NewCardContext open={true} onClose={onClose} />, mountOptions));
  afterEach(() => wrapper.unmount());

  it('NewCardDialog closes when escape key is pressed', () => {
    render(<NewCardContext />);
    const dialog = screen.queryAllByRole('dialog')[0];

    expect(dialog).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27, which: 27 });
    expect(onClose).toHaveBeenCalled();
  });

  it('NewCardDialog closes when clicking outside of dialog', () => {
    render(<NewCardContext />);
    const dialog = screen.queryAllByRole('dialog')[0];

    expect(dialog).toBeInTheDocument();

    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('NewCardDialog starts with empty values for file name and filetype', () => {
    const newCardDialog = wrapper.find(NewCardDialog);
    expect(newCardDialog.prop('fileName')).toBeUndefined();
    expect(newCardDialog.prop('filetype')).toBeUndefined();
    expect(newCardDialog.html()).toContain('<input aria-hidden="true" tabindex="-1" class="MuiSelect-nativeInput" value="">');
    expect(wrapper.find(TextField).props().value).toEqual('');
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
    const inputBox = screen.getByRole('textbox') as HTMLInputElement;

    expect(inputBox).toHaveValue('');

    // Enter file name into text box
    if (inputBox) fireEvent.change(inputBox, { target: { value: 'foo' } });

    expect(inputBox).toHaveValue('foo');
  });

  it('NewCardDialog allows the user to pick a file type', () => {
    const { getAllByRole } = render(<NewCardContext />);

    const trigger = getAllByRole('button')[0];

    fireEvent.mouseDown(trigger);
    expect(getAllByRole('listbox')[0]).not.toBeNull();

    const options = getAllByRole('option');
    expect(options[0]).toHaveFocus();

    act(() => {
      options[0].click();
    });

    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent(new RegExp('JavaScript', 'i'));
  });

  it('NewCardDialog calls onClick when Create New Card button is clicked', () => {
    const onClick = jest.fn();
    const { getAllByRole } = render(<NewCardContext />);
    const createNewCardButton = getAllByRole('button')[1];

    createNewCardButton.addEventListener('click', onClick);
    fireEvent.click(createNewCardButton);

    expect(onClick).toHaveBeenCalled();
  });
});