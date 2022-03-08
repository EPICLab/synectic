import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Modal } from '../../store/slices/modals';
import { mockStore } from '../../test-utils/mock-store';
import DiffPickerDialog from './DiffPickerDialog';
import { DateTime } from 'luxon';
import { RootState } from '../../store/store';

const mockedStore: RootState = {
    stacks: {
        ids: [],
        entities: {}
    },
    cards: {
        ids: ['f6b3f2a3-9145-4b59-a4a1-bf414214f30b', '67406095-fd01-4441-8e52-b0fdbad3327a'],
        entities: {
            'f6b3f2a3-9145-4b59-a4a1-bf414214f30b': {
                id: 'f6b3f2a3-9145-4b59-a4a1-bf414214f30b',
                name: 'test.js',
                type: 'Editor',
                metafile: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
                created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00').valueOf(),
                modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00').valueOf(),
                left: 10,
                top: 10,
                zIndex: 0,
                classes: [],
            },
            '67406095-fd01-4441-8e52-b0fdbad3327a': {
                id: '67406095-fd01-4441-8e52-b0fdbad3327a',
                name: 'turtle.asp',
                type: 'Editor',
                metafile: 'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8',
                created: DateTime.fromISO('1997-12-27T10:10:10.288-08:00').valueOf(),
                modified: DateTime.fromISO('1998-01-01T20:20:20.144-08:00').valueOf(),
                left: 27,
                top: 105,
                zIndex: 0,
                classes: [],
            }
        }
    },
    filetypes: {
        ids: [],
        entities: {}
    },
    metafiles: {
        ids: [],
        entities: {}
    },
    cached: {
        ids: [],
        entities: {}
    },
    repos: {
        ids: [],
        entities: {}
    },
    branches: {
        ids: [],
        entities: {}
    },
    modals: {
        ids: ['2d52bbae-d396-44a5-a91d-ec4cf3ab8a9b'],
        entities: {
            '2d52bbae-d396-44a5-a91d-ec4cf3ab8a9b': {
                id: '2d52bbae-d396-44a5-a91d-ec4cf3ab8a9b',
                type: 'DiffPicker'
            }
        }
    }
}

const mockedModal = mockedStore.modals.entities['2d52bbae-d396-44a5-a91d-ec4cf3ab8a9b'] as Modal;

describe('DiffPickerDialog modal component', () => {
    const store = mockStore(mockedStore);

    afterEach(() => {
        cleanup;
        store.clearActions();
        jest.resetAllMocks();
    });

    const produceComponent = () =>
        render(
            <Provider store={store}>
                <DndProvider backend={HTML5Backend}>
                    <DiffPickerDialog {...mockedModal} />
                </DndProvider>
            </Provider>
        );

    it('renders the DiffPickerDialog modal component', () => {
        produceComponent();
        expect(screen.getByTestId('diff-picker-dialog')).toBeInTheDocument();
    });

    it('generates REMOVE_MODAL action when escape key is pressed', async () => {
        produceComponent();
        fireEvent.keyDown(screen.getByTestId('diff-picker-dialog'), {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            charCode: 27
        });

        await waitFor(() => {
            expect(store.getActions()).toStrictEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: 'modals/modalRemoved',
                        payload: mockedModal.id
                    })
                ])
            )
        });
    });

    it('DiffPickerDialog tracks selection updates', async () => {
        produceComponent();
        const trigger = screen.getAllByRole('button')[0];
        // open the select component
        fireEvent.mouseDown(trigger);

        const options = screen.getAllByRole('option');
        expect(options[0]).toHaveFocus();

        // // make a selection and close the select component
        act(() => {
            options[1].click();
        });

        await waitFor(() => {
            expect(trigger).toHaveFocus();
            expect(trigger).toHaveTextContent(/turtle\.asp/i);
        });
    });

    it('DiffPickerDialog returns UUIDs for selected cards on run', async () => {
        produceComponent();
        const leftSelector = screen.getAllByRole('button')[0];
        const rightSelector = screen.getAllByRole('button')[1];
        const runButton = screen.queryByText(/Run Diff/i);

        // open the left select component
        fireEvent.mouseDown(leftSelector);
        const leftOptions = screen.getAllByRole('option');
        expect(leftOptions[0]).toHaveFocus();
        // make selection and close left component
        act(() => {
            leftOptions[1].click();
        });

        // open the right select component
        fireEvent.mouseDown(rightSelector);
        const rightOptions = screen.getAllByRole('option');
        expect(rightOptions[0]).toHaveFocus();
        // make selection and close right component
        act(() => {
            rightOptions[0].click();
        });

        if (runButton) fireEvent.click(runButton);

        await waitFor(() => {
            expect(store.getActions()).toStrictEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: 'metafiles/fetchMetafile/fulfilled',
                        payload: expect.objectContaining({
                            handler: 'Diff',
                            name: 'Δ undefined/turtle.asp -> undefined/test.js',
                            targets: expect.arrayContaining([
                                'f6b3f2a3-9145-4b59-a4a1-bf414214f30b', '67406095-fd01-4441-8e52-b0fdbad3327a'
                            ])
                        })
                    })
                ])
            )
        });
    });
});