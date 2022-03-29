import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { DateTime } from 'luxon';
import { RootState } from '../store';
import { metafileAdded, metafileRemoved } from '../slices/metafiles';
import { mockStore } from '../../test-utils/mock-store';
import { DndProvider } from 'react-dnd';
import Canvas from '../../components/Canvas';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { removeUndefined } from '../../containers/format';
import { fetchMetafile, fetchNewMetafile, FileMetafile } from '../thunks/metafiles';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';

const mockedStore: RootState = {
    stacks: {
        ids: [],
        entities: {}
    },
    cards: {
        ids: [],
        entities: {}
    },
    filetypes: {
        ids: [],
        entities: {}
    },
    metafiles: {
        ids: ['821c9159-292b-4639-b90e-e84fc12740ee', '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71', '88e2gd50-3a5q-6401-b5b3-203c6710e35c'],
        entities: {
            '821c9159-292b-4639-b90e-e84fc12740ee': {
                id: '821c9159-292b-4639-b90e-e84fc12740ee',
                name: 'test.js',
                modified: DateTime.fromISO('2019-11-19T19:19:47.572-08:00').valueOf(),
                content: 'var rand: number = Math.floor(Math.random() * 6) + 1;'
            },
            '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71': {
                id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
                name: 'example.ts',
                path: 'foo/example.ts',
                modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
                content: 'const rand = Math.floor(Math.random() * 6) + 1;',
                repo: '23',
                branch: 'master'
            },
            '88e2gd50-3a5q-6401-b5b3-203c6710e35c': {
                id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
                name: 'bar.js',
                path: 'foo/bar.js',
                modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
                content: 'file contents',
            }
        }
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
        ids: [],
        entities: {}
    }
}

const metafile1: FileMetafile = {
    id: 'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8',
    name: 'turtle.asp',
    modified: DateTime.fromISO('2017-01-05T19:09:22.744-08:00').valueOf(),
    path: 'test/turtle.asp',
    content: 'example'
}

const metafile2: FileMetafile = {
    id: 'h8114d71-b100-fg9a-0c1d3516d991',
    name: 'turtle.asp',
    modified: DateTime.fromISO('2017-01-05T19:09:22.744-08:00').valueOf(),
    path: 'test/turtle.asp',
    content: 'example'
}

describe('cacheMiddleware Redux middleware', () => {
    const store = mockStore(mockedStore);

    let mockedInstance: MockInstance;

    beforeAll(async () => {
        const instance = await mock({
            'test/turtle.asp': file({ content: 'example', mtime: new Date(1) })
        });
        return mockedInstance = instance;
    });
    afterAll(() => mockedInstance.reset());

    afterEach(() => {
        cleanup;
        store.clearActions();
        jest.resetAllMocks();
    });

    const produceComponent = () => {
        render(
            <Provider store={store} >
                <DndProvider backend={HTML5Backend}>
                    <Canvas />
                </DndProvider>
            </Provider>
        );
    };

    it('initial state has no cached files', () => {
        produceComponent();
        expect(store.getState().cached.ids).toHaveLength(0);
    });

    it('adding a metafile triggers the creation of a file cache', async () => {
        produceComponent();
        store.dispatch(metafileAdded(metafile1));
        expect(removeUndefined(Object.values(store.getState().cached.entities))).toStrictEqual(
            expect.arrayContaining([expect.objectContaining({
                path: metafile1.path,
                reserves: 0
            })])
        );
    });

    it('fetching a new file triggers the creation of a file cache', async () => {
        produceComponent();
        await store.dispatch(fetchNewMetafile({ filepath: metafile1.path })).unwrap();
        expect(store.getActions()).toStrictEqual(
            expect.arrayContaining([expect.objectContaining({ type: 'cached/cachedAdded' })])
        );
        expect(removeUndefined(Object.values(store.getState().cached.entities))).toStrictEqual(
            expect.arrayContaining([expect.objectContaining({ path: metafile1.path })])
        );
    });

    it('fetching multiple metafiles for the same file increases reserves in the cached file', async () => {
        produceComponent();
        await store.dispatch(fetchMetafile({ filepath: metafile1.path })).unwrap();
        await store.dispatch(fetchMetafile({ filepath: metafile2.path })).unwrap();
        const cached = removeUndefined(Object.values(store.getState().cached.entities));
        expect(cached).toHaveLength(1);
        expect(cached).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: metafile1.path,
                    reserves: 2
                })
            ])
        );
    });

    it('removing a metafile decreases reserves in the cached files', async () => {
        produceComponent();
        const metafile = await store.dispatch(fetchMetafile({ filepath: metafile1.path })).unwrap();
        await store.dispatch(fetchMetafile({ filepath: metafile2.path })).unwrap();
        expect(removeUndefined(Object.values(store.getState().cached.entities))).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: metafile.path,
                    reserves: 2
                })
            ])
        );
        store.dispatch(metafileRemoved(metafile.id));
        expect(removeUndefined(Object.values(store.getState().cached.entities))).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    path: metafile1.path,
                    reserves: 1
                })
            ])
        );
    });
});