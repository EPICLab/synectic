import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';
import { testStore } from '../../../__test__/__fixtures__/ReduxStore';
import { mockStore } from '../../test-utils/mock-store';
import NewCardDialog from './NewCardDialog';
import { RootState } from '../../store/store';
import { DateTime } from 'luxon';
import { Modal } from '../../store/slices/modals';
import userEvent from '@testing-library/user-event';

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
        ids: ['97fa02bc-596c-46d6-b025-2968f0d32b91'],
        entities: {
            '97fa02bc-596c-46d6-b025-2968f0d32b91': {
                id: '97fa02bc-596c-46d6-b025-2968f0d32b91',
                type: 'NewCardDialog'
            }
        }
    }
}

const mockedModal = mockedStore.modals.entities['97fa02bc-596c-46d6-b025-2968f0d32b91'] as Modal;

describe('NewCardDialog modal component', () => {
    const store = mockStore(testStore);

    const produceComponent = () => {
        return {
            user: userEvent.setup(),
            ...render(
                <Provider store={store}>
                    <DndProvider backend={HTML5Backend}>
                        <NewCardDialog {...mockedModal} />
                    </DndProvider>
                </Provider>
            )
        }
    };

    it('renders the NewCardDialog modal component', () => {
        produceComponent();
        expect(screen.getByTestId('new-card-dialog')).toBeInTheDocument();
    });

    it('generates modalRemoved action when escape key is pressed', async () => {
        produceComponent();
        fireEvent.keyDown(screen.getByTestId('new-card-dialog'), {
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

    it('generates modalRemoved action when clicking outside of dialog', async () => {
        const { user } = produceComponent();

        // using DOM selector method instead of RTL
        const backdrop = document.querySelector('.MuiBackdrop-root');
        if (backdrop) await user.click(backdrop);

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

    it('validates filename and filetype', async () => {
        const { user } = produceComponent();

        // open the editor portion of dialog
        await user.click(screen.getByTestId('editor-button'));
        // enter a filename with an invalid filetype
        fireEvent.change(screen.getByLabelText('Filename'), {
            target: { value: 'test.jsxw' }
        });
        expect(screen.getByText('Invalid Filename')).toBeInTheDocument();
        expect(screen.getByText('Create Card').closest('button')).toBeDisabled();
    });

    it('populates filetype on valid filename entry', async () => {
        const { user } = produceComponent();

        // open the editor portion of dialog
        await user.click(screen.getByTestId('editor-button'));
        // enter a filename with a valid filetype
        fireEvent.change(screen.getByLabelText('Filename'), {
            target: { value: 'test.js' }
        });
        expect(screen.getByTestId('new-card-filetype-selector')).toHaveValue('JavaScript');
        expect(screen.getByText('Create Card').closest('button')).toBeEnabled();

        // click to attempt to create a card
        await user.click(screen.getByText('Create Card'));
        await waitFor(() => {
            expect(store.getActions()).toStrictEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: 'metafiles/metafileAdded'
                    })
                ])
            )
        });
    });
});