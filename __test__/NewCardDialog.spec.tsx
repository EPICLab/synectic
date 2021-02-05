import '@testing-library/jest-dom';
import React from 'react';
import { mount } from 'enzyme';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { fireEvent, render, screen, within } from '@testing-library/react';

import type { Filetype } from '../src/types';
import { mockStore } from './__mocks__/reduxStoreMock';
import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { NewCardDialog } from '../src/components/NewCardDialog';

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
  const onClose = jest.fn();

  it('NewCardDialog closes when escape key is pressed', () => {
    render(<NewCardContext open={true} onClose={onClose} />);
    const dialog = screen.queryAllByRole('dialog')[0];

    expect(dialog).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27, which: 27 });
    expect(onClose).toHaveBeenCalled();
  });

  it('NewCardDialog closes when clicking outside of dialog', () => {
    render(<NewCardContext open={true} onClose={onClose} />);
    const dialog = screen.queryAllByRole('dialog')[0];

    expect(dialog).toBeInTheDocument();

    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('NewCardDialog starts with empty values for filename and filetype', () => {
    render(<NewCardContext open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Editor')); // click Editor button to load dialog
    expect(screen.getByLabelText('Filename')).toHaveValue('');
    // Material-UI's Select component does not include a <select> HTML element, so .toHaveFormValues() will not work
    expect(screen.getByTestId('new-card-filetype-selector').outerHTML).toContain('value=""');
  });

  it('NewCardDialog does not change Redux state when invalid information is entered', () => {
    const wrapper = mount(<NewCardContext open={true} onClose={onClose} />, mountOptions);
    const before = JSON.stringify(store.getState());
    expect(wrapper.find(NewCardDialog).prop('isFileNameValid')).toBeFalsy();
    const button = screen.queryByText(/create-card-button/i);

    if (button) fireEvent.click(button);
    const after = JSON.stringify(store.getState());

    expect(before).toEqual(after);
    wrapper.unmount();
  });

  it('NewCardDialog allows the user to enter/edit the filename', () => {
    render(<NewCardContext open={true} onClose={onClose} />);
    fireEvent.click(screen.getByText('Editor')); // click Editor button to load dialog
    const inputBox = screen.getByLabelText('Filename');
    expect(inputBox).toHaveValue('');

    // Enter file name into text box
    if (inputBox) fireEvent.change(inputBox, { target: { value: 'foo' } });
    expect(inputBox).toHaveValue('foo');
  });

  it('NewCardDialog handles filetype selections', () => {
    const { getByRole, getAllByRole, getByText } = render(<NewCardContext open={true} onClose={onClose} />);
    fireEvent.click(getByText('Editor')); // click Editor button to load dialog
    const selectPopoverTrigger = getAllByRole('button')[2];

    fireEvent.mouseDown(selectPopoverTrigger);
    const listbox = within(getByRole('listbox'));
    fireEvent.click(listbox.getByText(/JavaScript/i));
    expect(screen.getByTestId('new-card-filetype-selector').outerHTML).toContain('value="JavaScript"');
  });

  it('NewCardDialog calls onClick when Create New Card button is clicked', () => {
    const onClick = jest.fn();
    const { getAllByRole } = render(<NewCardContext open={true} onClose={onClose} />);
    const createNewCardButton = getAllByRole('button')[1];

    createNewCardButton.addEventListener('click', onClick);
    fireEvent.click(createNewCardButton);

    expect(onClick).toHaveBeenCalled();
  });
});