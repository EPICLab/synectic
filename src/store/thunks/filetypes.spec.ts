import { mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { emptyStore } from '../../test-utils/empty-store';
import { Filetype, filetypeAdded } from '../slices/filetypes';
import { fetchFiletype, importFiletypes } from './filetypes';

const mockedFiletype1: Filetype = {
    id: 'eb5d332e-61a1-422d-aeba-48186d9f79f3',
    filetype: 'JavaScript',
    handler: 'Editor',
    extensions: ['js', 'jsm']
}

const mockedFiletype2: Filetype = {
    id: '78aa4b01-ce6e-3161-4671-b0019de5c375',
    filetype: 'Directory',
    handler: 'Explorer',
    extensions: []
}

const mockedFiletype3: Filetype = {
    id: '0b743dd5-2559-4f03-8c02-0f67676e906a',
    filetype: 'Text',
    handler: 'Editor',
    extensions: ['txt']
}

describe('thunks/filetypes', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeAll(async () => {
        store.dispatch(filetypeAdded(mockedFiletype1));
        store.dispatch(filetypeAdded(mockedFiletype2));
        store.dispatch(filetypeAdded(mockedFiletype3));
        const instance = await mock({
            foo: {
                'example.js': 'var rand = Math.floor(Math.random() * 6) + 1;'
            },
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('fetchFiletype resolves new existing filetype for file', async () => {
        const filetype = await store.dispatch(fetchFiletype('foo/example.js')).unwrap();
        expect(filetype).toStrictEqual(expect.objectContaining(mockedFiletype1));
    });

    it('fetchFiletype resolves new existing filetype for directory', async () => {
        const filetype = await store.dispatch(fetchFiletype('foo/')).unwrap();
        expect(filetype).toStrictEqual(expect.objectContaining(mockedFiletype2));
    });

    it('fetchFiletype defaults to text filetype when no match found', async () => {
        const filetype = await store.dispatch(fetchFiletype('foo/test.ts')).unwrap();
        expect(filetype).toStrictEqual(expect.objectContaining(mockedFiletype3));
    });

    it('importFiletypes resolves supported filetypes', async () => {
        await store.dispatch(importFiletypes([{
            "filetype": "Typescript",
            "handler": "Editor",
            "extensions": [
                "ts",
                "typescript",
                "str"
            ]
        }]));
        expect(store.getActions()).toEqual(expect.arrayContaining([
            expect.objectContaining({
                type: 'filetypes/filetypeAdded',
                payload: expect.objectContaining({
                    filetype: 'Typescript',
                    handler: 'Editor',
                    extensions: ['ts', 'typescript', 'str']
                })
            })
        ]));
    });

});