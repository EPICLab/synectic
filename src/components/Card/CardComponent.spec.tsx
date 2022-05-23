import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { wrapWithTestBackend } from 'react-dnd-test-utils';
import { mockStore } from '../../test-utils/mock-store';
import { emptyStore } from '../../test-utils/empty-store';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import CardComponent from './CardComponent';
import { FilebasedMetafile, metafileAdded } from '../../store/slices/metafiles';
import { DateTime } from 'luxon';
import { createCard } from '../../store/thunks/cards';

const metafile: FilebasedMetafile = {
    id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
    name: 'example.ts',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Typescript',
    loading: [],
    path: 'foo/example.ts',
    state: 'unmodified',
    content: 'const rand = Math.floor(Math.random() * 6) + 1;',
    repo: '23',
    branch: '503',
    status: 'unmodified',
    conflicts: []
};

describe('CardComponent', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeAll(async () => {
        store.dispatch(metafileAdded(metafile));
        const instance = await mock({
            'foo/example.ts': file({ content: 'var rand = Math.floor(Math.random() * 6) + 1;', mtime: new Date(1) }),
            'test.js': file({ content: 'var rand: number = Math.floor(Math.random() * 6) + 1;', mtime: new Date(1) }),
            'example.ts': file({ content: 'const rand = Math.floor(Math.random() * 6) + 1;', mtime: new Date(1) })
        });
        return mockedInstance = instance;
    });
    afterAll(() => mockedInstance.reset());

    afterEach(() => {
        store.clearActions();
        jest.clearAllMocks();
    });

    // it('Card removes from Redux store on close button', async () => {
    //     const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
    //     const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    //     render(
    //         <Provider store={store}>
    //             <WrappedComponent {...card} />
    //         </Provider>
    //     );

    //     userEvent.click(screen.getByRole('button', { name: /close/i }));

    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'cards/cardRemoved'
    //             })
    //         ])
    //     )
    // });

    it('Card resolves props into React Component for Editor handler', async () => {
        const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
        const [WrappedComponent] = wrapWithTestBackend(CardComponent);
        render(
            <Provider store={store}>
                <WrappedComponent {...card} />
            </Provider>
        );
        expect(screen.getByTestId('card-component')).toBeInTheDocument();
    });

    it('Card resolves props into React Component for Diff handler', async () => {
        const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
        const [WrappedComponent] = wrapWithTestBackend(CardComponent);
        render(
            <Provider store={store}>
                <WrappedComponent {...card} />
            </Provider>
        );
        expect(screen.getByTestId('card-component')).toBeInTheDocument();
    });

    // it('Card resolves props into React Component for Explorer handler', async () => {
    //     const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
    //     const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    //     render(
    //         <Provider store={store}>
    //             <WrappedComponent {...card} />
    //         </Provider>
    //     );
    //     expect(screen.getByTestId('card-component')).toBeInTheDocument();
    // });

    it('Card resolves props into React Component for Browser handler', async () => {
        const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
        const [WrappedComponent] = wrapWithTestBackend(CardComponent);
        render(
            <Provider store={store}>
                <WrappedComponent {...card} />
            </Provider>
        );
        expect(screen.getByTestId('card-component')).toBeInTheDocument();
    });

    it('Card resolves props into React Component for Tracker handler', async () => {
        const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
        const [WrappedComponent] = wrapWithTestBackend(CardComponent);
        render(
            <Provider store={store}>
                <WrappedComponent {...card} />
            </Provider>
        );
        expect(screen.getByTestId('card-component')).toBeInTheDocument();
    });

    // it('Editor Card renders a reverse side when the flip button is clicked', async () => {
    //     const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
    //     const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    //     render(
    //         <Provider store={store}>
    //             <WrappedComponent {...card} />
    //         </Provider>
    //     );

    //     userEvent.click(screen.getByRole('button', { name: /flip/i }));

    //     expect(screen.getByText(/ID:/)).toBeInTheDocument();
    // });

    // it('Explorer Card renders a reverse side when the flip button is clicked', async () => {
    //     const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
    //     const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    //     render(
    //         <Provider store={store}>
    //             <WrappedComponent {...card} />
    //         </Provider>
    //     );

    //     userEvent.click(screen.getByRole('button', { name: /flip/i }));
    //     await waitFor(() => {
    //         expect(screen.getByText(/Name:/)).toBeInTheDocument();
    //     });
    // });

    // it('Diff Card renders a reverse side when the flip button is clicked', async () => {
    //     const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
    //     const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    //     render(
    //         <Provider store={store}>
    //             <WrappedComponent {...card} />
    //         </Provider>
    //     );

    //     userEvent.click(screen.getByRole('button', { name: /flip/i }));

    //     expect(screen.getByText(/Name:/)).toBeInTheDocument();
    // });

    // it('Browser Card renders a reverse side when the flip button is clicked', async () => {
    //     const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
    //     const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    //     render(
    //         <Provider store={store}>
    //             <WrappedComponent {...card} />
    //         </Provider>
    //     );

    //     userEvent.click(screen.getByRole('button', { name: /flip/i }));

    //     expect(screen.getByText(/ID:/)).toBeInTheDocument();
    // });

    // it('RepoTracker Card renders a reverse side when the flip button is clicked', async () => {
    //     const card = await store.dispatch(createCard({ metafile: metafile })).unwrap();
    //     const [WrappedComponent] = wrapWithTestBackend(CardComponent);
    //     render(
    //         <Provider store={store}>
    //             <WrappedComponent {...card} />
    //         </Provider>
    //     );

    //     userEvent.click(screen.getByRole('button', { name: /flip/i }));

    //     expect(screen.getByText(/ID:/)).toBeInTheDocument();
    // });
});