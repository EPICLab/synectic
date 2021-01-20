import '@testing-library/jest-dom';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { wrapInReduxContext } from './__mocks__/dndReduxMock';
import { mockStore, extractFieldArray } from './__mocks__/reduxStoreMock';
import DiffPickerButton, { DiffPickerDialog } from '../src/components/DiffPickerDialog';

describe('DiffPickerDialog', () => {
  /**
   * For testing Material-UI components using React Testing Library (RTL), the query and selection
   * steps for finding elements are non-obvious from a user perspective (the methodology advocated in RTL).
   * However, the Material-UI project itself has begun to migrate to using RTL for testing. Therefore,
   * using their tests as inspiration might help, see:
   * https://github.com/mui-org/material-ui/tree/next/packages/material-ui/test
   * 
   * (For example, the Select component from Material-UI includes tests for making option selections:
   * https://github.com/mui-org/material-ui/blob/next/packages/material-ui/test/integration/Select.test.js)
   */

  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: [],
      cards: ['14', '33'],
      stacks: []
    },
    stacks: {},
    cards: {
      14: {
        id: '14',
        name: 'test.js',
        type: 'Editor',
        metafile: '243',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
        captured: false,
        left: 10,
        top: 10
      },
      33: {
        id: '33',
        name: 'turtle.asp',
        type: 'Editor',
        metafile: '459',
        created: DateTime.fromISO('1997-12-27T10:10:10.288-08:00'),
        modified: DateTime.fromISO('1998-01-01T20:20:20.144-08:00'),
        captured: false,
        left: 27,
        top: 105
      }
    },
    filetypes: {},
    metafiles: {},
    repos: {},
    errors: {}
  });

  it('DiffPickerDialog closes when escape key is pressed', () => {
    const onClose = jest.fn();
    const cards = extractFieldArray(store.getState().cards);
    render(<DiffPickerDialog open={true} options={cards} onClose={onClose} />);
    expect(screen.queryAllByRole('dialog')[0]).toBeInTheDocument();

    const dialog = screen.queryAllByRole('dialog')[0];
    fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27, which: 27 });
    expect(onClose).toHaveBeenCalled();
  });

  it('DiffPickerDialog closes when clicking outside of dialog', async () => {
    const onClose = jest.fn();
    const cards = extractFieldArray(store.getState().cards);
    render(<DiffPickerDialog open={true} options={cards} onClose={onClose} />);
    expect(screen.queryAllByRole('dialog')[0]).toBeInTheDocument();

    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('DiffPickerDialog changes selected items for cards', () => {
    const onClose = jest.fn();
    const cards = extractFieldArray(store.getState().cards);

    const { getAllByRole } = render(<DiffPickerDialog open={true} options={cards} onClose={onClose} />);
    const trigger = getAllByRole('button')[0];

    // open the select component
    fireEvent.mouseDown(trigger);
    const options = getAllByRole('option');
    expect(options[0]).toHaveFocus();

    // make a selection and close the select component
    act(() => {
      options[1].click();
    });

    expect(trigger).toHaveFocus();
    expect(trigger).toHaveTextContent(new RegExp(`${cards[1].name}`, 'i'));
  });

  it('DiffPickerDialog returns UUIDs for selected cards on run', () => {
    const onClose = jest.fn();
    const cards = extractFieldArray(store.getState().cards);

    const { getAllByRole } = render(<DiffPickerDialog open={true} options={cards} onClose={onClose} />);
    const leftSelector = getAllByRole('button')[0];
    const rightSelector = getAllByRole('button')[1];

    const runDiffButton = screen.queryByText(/Run Diff/i);

    // open the left select component
    fireEvent.mouseDown(leftSelector);
    const leftOptions = getAllByRole('option');
    expect(leftOptions[0]).toHaveFocus();

    // make selection for left card and close the component
    act(() => {
      leftOptions[1].click();
    });

    // open the right select component
    fireEvent.mouseDown(rightSelector);
    const rightOptions = getAllByRole('option');
    expect(rightOptions[0]).toHaveFocus();

    // make selection for right card and close
    act(() => {
      rightOptions[0].click();
    });

    // click the Run Diff... button
    if (runDiffButton) fireEvent.click(runDiffButton);

    // check the parameters of onClose fn to verify they match the card UUIDs
    expect(onClose).toHaveBeenCalledWith(false, ['33', '14']);
  });

  it('DiffPickerDialog returns cancelled if no cards are selected', () => {
    const onClose = jest.fn();
    const cards = extractFieldArray(store.getState().cards);

    render(<DiffPickerDialog open={true} options={cards} onClose={onClose} />);

    const dialog = screen.queryAllByRole('dialog')[0];

    // exit the dialog via escape key
    fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27, which: 27 });

    // check the parameters of onClose fn to verify that canceled parameter is true
    expect(onClose).toHaveBeenCalledWith(true, ['', '']);
  });

  it('DiffPickerDialog returns cancelled if only the left card is selected', () => {
    const onClose = jest.fn();
    const cards = extractFieldArray(store.getState().cards);

    const { getAllByRole } = render(<DiffPickerDialog open={true} options={cards} onClose={onClose} />);
    const leftSelector = getAllByRole('button')[0];

    const dialog = screen.queryAllByRole('dialog')[0];

    // open the left select component
    fireEvent.mouseDown(leftSelector);
    const leftOptions = getAllByRole('option');
    expect(leftOptions[0]).toHaveFocus();

    // make selection for only the left card and close
    act(() => {
      leftOptions[1].click();
    });

    // exit the dialog via escape key    
    fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27, which: 27 });

    // check the parameters of onClose fn to verify that canceled parameter is true
    expect(onClose).toHaveBeenCalledWith(true, ['', '']);
  });

  it('DiffPickerDialog returns cancelled if only the right card is selected', () => {
    const onClose = jest.fn();
    const cards = extractFieldArray(store.getState().cards);

    const { getAllByRole } = render(<DiffPickerDialog open={true} options={cards} onClose={onClose} />);
    const rightSelector = getAllByRole('button')[1];

    const dialog = screen.queryAllByRole('dialog')[0];

    // open the right select component
    fireEvent.mouseDown(rightSelector);
    const rightOptions = getAllByRole('option');
    expect(rightOptions[0]).toHaveFocus();

    // make selection for only the right card and close
    act(() => {
      rightOptions[1].click();
    });

    // exit the dialog via escape key
    fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27, which: 27 });

    // check the parameters of onClose fn to verify that canceled parameter is true
    expect(onClose).toHaveBeenCalledWith(true, ['', '']);
  });

});

describe('DiffPickerButton', () => {

  const store = mockStore({
    canvas: {
      id: v4(),
      created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
      repos: [],
      cards: ['14', '33'],
      stacks: []
    },
    stacks: {},
    cards: {
      14: {
        id: '14',
        name: 'test.js',
        type: 'Editor',
        metafile: '243',
        created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00'),
        modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
        captured: false,
        left: 10,
        top: 10
      },
      33: {
        id: '33',
        name: 'turtle.asp',
        type: 'Editor',
        metafile: '459',
        created: DateTime.fromISO('1997-12-27T10:10:10.288-08:00'),
        modified: DateTime.fromISO('1998-01-01T20:20:20.144-08:00'),
        captured: false,
        left: 27,
        top: 105
      }
    },
    filetypes: {},
    metafiles: {},
    repos: {},
    errors: {}
  });
  const DiffPickerContext = wrapInReduxContext(DiffPickerButton, store);

  it('DiffPickerButton displays DiffPickerDialog on button click', () => {
    render(<DiffPickerContext />);
    expect(screen.queryByText(/Run Diff/i)).not.toBeInTheDocument();

    const button = screen.queryByText(/Diff\.\.\./i);
    if (button) fireEvent.click(button);
    expect(screen.getByText(/Run Diff/i)).toBeInTheDocument();
  });

  it('DiffPickerButton resolves no Diff card on canceled run', () => {
    render(<DiffPickerContext />);

    // open dialog
    const button = screen.queryByText(/Diff\.\.\./i);
    if (button) fireEvent.click(button);

    const dialog = screen.queryAllByRole('dialog')[0];

    // exit dialog via escape key
    fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27, which: 27 });

    // there should be no actions in the store
    expect(store.getActions()).toEqual([]);
  });

});