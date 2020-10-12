import '@testing-library/jest-dom';
import React from 'react';
import { ReactWrapper, mount } from 'enzyme';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { fireEvent, render, screen } from '@testing-library/react';

import { mockStore } from './__mocks__/reduxStoreMock';
import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import NewCardButton, { NewCardDialog } from '../src/components/NewCardDialog';

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

describe('NewCardButton', () => {
  const NewCardContext = wrapInReduxContext(NewCardButton, store);
  let wrapper: ReactWrapper<EmptyObject, Readonly<EmptyObject>, React.Component<EmptyObject, EmptyObject, EmptyObject>>;

  beforeEach(() => wrapper = mount(<NewCardContext />, mountOptions));
  afterEach(() => wrapper.unmount());

  it('NewCardButton does not render dialog on initial state', () => {
    render(<NewCardContext />);
    expect(screen.queryByText(/Create New Card/i)).toBeNull();
    expect(wrapper.find(NewCardDialog).props().open).toBe(false);
  });

  it('NewCardButton renders dialog when clicked', () => {
    render(<NewCardContext />);
    const button = screen.queryByText(/New\.\.\./i);
    if (button) fireEvent.click(button);
    expect(screen.getAllByText(/Create New Card/i)[0]).toBeInTheDocument();
  });

  it('NewCardButton does not update Redux store when cancelled', () => {
    render(<NewCardContext />);
    const before = JSON.stringify(store.getState());
    const button = screen.queryByText(/New\.\.\./i);
    const backdrop = document.querySelector('.MuiBackdrop-root');

    if (button) fireEvent.click(button);
    if (backdrop) fireEvent.click(backdrop);

    const after = JSON.stringify(store.getState());
    expect(before).toBe(after);
  });
});