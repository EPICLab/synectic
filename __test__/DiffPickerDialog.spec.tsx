import '@testing-library/jest-dom';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
// import { act } from 'react-dom/test-utils';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { mockStore, extractFieldArray } from './__mocks__/reduxStoreMock';
import DiffPickerDialog from '../src/components/DiffPickerDialog';
import { wrapInReduxContext } from './__mocks__/dndReduxMock';

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
        left: 27,
        top: 105
      }
    },
    filetypes: {},
    metafiles: {},
    repos: {},
    modals: {
      18: {
        id: '18',
        type: 'DiffPicker'
      }
    }
  });
  const DiffPickerContext = wrapInReduxContext(DiffPickerDialog, store);

  it('DiffPickerDialog closes when escape key is pressed', async () => {
    const modals = extractFieldArray(store.getState().modals);
    render(<DiffPickerContext {...modals[0]} />);

    const dialog = await screen.findByText(/Select cards to diff/i);
    expect(dialog).toBeInTheDocument();
    screen.debug();

    fireEvent.keyDown(dialog, {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      charCode: 27
    });

    expect(await screen.findByText(/Select cards to diff/i)).not.toBeInTheDocument();
    screen.debug();
  });

  // it('DiffPickerDialog closes when clicking outside of dialog', async () => {
  //   const modals = extractFieldArray(store.getState().modals);
  //   render(<DiffPickerContext {...modals[0]} />);
  //   expect(screen.queryAllByRole('dialog')[0]).toBeInTheDocument();

  //   const dialog = screen.queryAllByRole('dialog')[0];
  //   const backdrop = document.querySelector('.MuiBackdrop-root');
  //   if (backdrop) fireEvent.click(backdrop);
  //   expect(dialog).not.toBeInTheDocument();
  // });

  // it('DiffPickerDialog changes selected items for cards', () => {
  //   const modals = extractFieldArray(store.getState().modals);
  //   const cards = extractFieldArray(store.getState().cards);

  //   const { getAllByRole } = render(<DiffPickerContext {...modals[0]} />);
  //   const trigger = getAllByRole('button')[0];

  //   // open the select component
  //   fireEvent.mouseDown(trigger);
  //   const options = getAllByRole('option');
  //   expect(options[0]).toHaveFocus();

  //   // make a selection and close the select component
  //   act(() => {
  //     options[1].click();
  //   });

  //   expect(trigger).toHaveFocus();
  //   expect(trigger).toHaveTextContent(new RegExp(`${cards[1].name}`, 'i'));
  // });

  // it('DiffPickerDialog returns UUIDs for selected cards on run', () => {
  //   const modals = extractFieldArray(store.getState().modals);

  //   const { getAllByRole } = render(<DiffPickerContext {...modals[0]} />);
  //   const leftSelector = getAllByRole('button')[0];
  //   const rightSelector = getAllByRole('button')[1];

  //   const runDiffButton = screen.queryByText(/Run Diff/i);

  //   // open the left select component
  //   fireEvent.mouseDown(leftSelector);
  //   const leftOptions = getAllByRole('option');
  //   expect(leftOptions[0]).toHaveFocus();

  //   // make selection for left card and close the component
  //   act(() => {
  //     leftOptions[1].click();
  //   });

  //   // open the right select component
  //   fireEvent.mouseDown(rightSelector);
  //   const rightOptions = getAllByRole('option');
  //   expect(rightOptions[0]).toHaveFocus();

  //   // make selection for right card and close
  //   act(() => {
  //     rightOptions[0].click();
  //   });

  //   // click the Run Diff... button
  //   if (runDiffButton) fireEvent.click(runDiffButton);

  //   // check that cards now contain a Diff card with the associated filenames
  //   const cards = extractFieldArray(store.getState().cards);
  //   expect(cards.find(c => c.name === 'DIFF <turtle.asp on unknown, test.js on unknown>')).toHaveLength(1);
  // });

  // it('DiffPickerDialog returns cancelled if no cards are selected', () => {
  //   const modals = extractFieldArray(store.getState().modals);

  //   render(<DiffPickerContext {...modals[0]} />);

  //   const dialog = screen.queryAllByRole('dialog')[0];

  //   // exit the dialog via escape key
  //   fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27, which: 27 });

  //   // check that the dialog no longer exists in the document
  //   expect(dialog).not.toBeInTheDocument();
  // });

  // it('DiffPickerDialog returns cancelled if only the left card is selected', () => {
  //   const modals = extractFieldArray(store.getState().modals);

  //   const { getAllByRole } = render(<DiffPickerContext {...modals[0]} />);
  //   const leftSelector = getAllByRole('button')[0];

  //   let dialog = screen.queryAllByRole('dialog')[0];

  //   // open the left select component
  //   fireEvent.mouseDown(leftSelector);
  //   const leftOptions = getAllByRole('option');
  //   expect(leftOptions[0]).toHaveFocus();

  //   // make selection for only the left card and close
  //   act(() => {
  //     leftOptions[1].click();
  //   });

  //   // exit the dialog via escape key    
  //   fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27, which: 27 });

  //   dialog = screen.queryAllByRole('dialog')[0];

  //   // check whether dialog is still displayed
  //   expect(dialog).not.toBeInTheDocument();
  // });

  // it('DiffPickerDialog returns cancelled if only the right card is selected', () => {
  //   const modals = extractFieldArray(store.getState().modals);

  //   const { getAllByRole } = render(<DiffPickerContext {...modals[0]} />);
  //   const rightSelector = getAllByRole('button')[1];

  //   let dialog = screen.queryAllByRole('dialog')[0];

  //   // open the right select component
  //   fireEvent.mouseDown(rightSelector);
  //   const rightOptions = getAllByRole('option');
  //   expect(rightOptions[0]).toHaveFocus();

  //   // make selection for only the right card and close
  //   act(() => {
  //     rightOptions[1].click();
  //   });

  //   // exit the dialog via escape key
  //   fireEvent.keyDown(dialog, { key: 'Escape', keyCode: 27, which: 27 });

  //   dialog = screen.queryAllByRole('dialog')[0];

  //   // check whether dialog is still displayed
  //   expect(dialog).not.toBeInTheDocument();
  // });

});