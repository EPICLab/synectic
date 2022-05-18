import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { DateTime } from 'luxon';
import { FileMetafile, metafileAdded, VirtualMetafile } from '../slices/metafiles';
import { mockStore } from '../../test-utils/mock-store';
import { DndProvider } from 'react-dnd';
import Canvas from '../../components/Canvas';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { emptyStore } from '../../test-utils/empty-store';

const metafile1: VirtualMetafile = {
    id: '821c9159-292b-4639-b90e-e84fc12740ee',
    name: 'test.js',
    modified: DateTime.fromISO('2019-11-19T19:19:47.572-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'JavaScript',
    loading: false,
    content: 'var rand: number = Math.floor(Math.random() * 6) + 1;'
};

const metafile2: FileMetafile = {
    id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
    name: 'example.ts',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Typescript',
    loading: false,
    path: 'foo/example.ts',
    state: 'unmodified',
    content: 'const rand = Math.floor(Math.random() * 6) + 1;',
    repo: 'c5739e69-9979-41fe-8605-5bb5ff341027',
    branch: 'master',
    status: 'unmodified',
    conflicts: []
};

const metafile3: FileMetafile = {
    id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
    name: 'bar.js',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'JavaScript',
    loading: false,
    path: 'foo/bar.js',
    state: 'unmodified',
    content: 'file contents',
};

// const metafile4: FileMetafile = {
//     id: 'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8',
//     name: 'turtle.asp',
//     modified: DateTime.fromISO('2017-01-05T19:09:22.744-08:00').valueOf(),
//     handler: 'Editor',
//     filetype: 'Razor',
//     path: 'test/turtle.asp',
//     state: 'unmodified',
//     content: 'example'
// };

// const metafile5: FileMetafile = {
//     id: 'h8114d71-b100-fg9a-0c1d3516d991',
//     name: 'turtle.asp',
//     modified: DateTime.fromISO('2017-01-05T19:09:22.744-08:00').valueOf(),
//     handler: 'Editor',
//     filetype: 'Razor',
//     path: 'test/turtle.asp',
//     state: 'unmodified',
//     content: 'example'
// };

describe('cache/FSCache', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeAll(async () => {
        store.dispatch(metafileAdded(metafile1));
        store.dispatch(metafileAdded(metafile2));
        store.dispatch(metafileAdded(metafile3));
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

    it('FSCache initially has no cached files', () => {
        produceComponent();
        expect(store.getState().cache.ids).toHaveLength(0);
    });

    // it('adding a metafile triggers the creation of a file cache', async () => {
    //     produceComponent();
    //     store.dispatch(metafileAdded(metafile4));
    //     console.log(store.getActions());
    //     expect(Object.values(store.getState().cache.entities)).toStrictEqual(
    //         expect.arrayContaining([expect.objectContaining({
    //             path: metafile4.path,
    //             reserve: 0
    //         })])
    //     );
    // });

    // it('fetching a new file triggers the creation of a file cache', async () => {
    //     produceComponent();
    //     await store.dispatch(createMetafile({ path: metafile4.path })).unwrap();
    //     expect(store.getActions()).toStrictEqual(
    //         expect.arrayContaining([expect.objectContaining({ type: 'cached/cachedAdded' })])
    //     );
    //     expect(removeUndefined(Object.values(store.getState().cache.entities))).toStrictEqual(
    //         expect.arrayContaining([expect.objectContaining({ path: metafile4.path })])
    //     );
    // });

    // it('fetching multiple metafiles for the same file increases reserves in the cached file', async () => {
    //     produceComponent();
    //     await store.dispatch(createMetafile({ path: metafile4.path })).unwrap();
    //     await store.dispatch(createMetafile({ path: metafile5.path })).unwrap();
    //     const cached = removeUndefined(Object.values(store.getState().cache.entities));
    //     expect(cached).toHaveLength(1);
    //     expect(cached).toStrictEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 path: metafile4.path,
    //                 reserves: 2
    //             })
    //         ])
    //     );
    // });

    // it('removing a metafile decreases reserves in the cached files', async () => {
    //     produceComponent();
    //     await store.dispatch(createMetafile({ path: metafile5.path })).unwrap();
    //     expect(removeUndefined(Object.values(store.getState().cache.entities))).toStrictEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 path: metafile4.path,
    //                 reserves: 2
    //             })
    //         ])
    //     );
    //     store.dispatch(metafileRemoved(metafile4.id));
    //     expect(removeUndefined(Object.values(store.getState().cache.entities))).toStrictEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 path: metafile4.path,
    //                 reserves: 1
    //             })
    //         ])
    //     );
    // });
});