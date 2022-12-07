import { DateTime } from 'luxon';
import { mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { emptyStore } from '../../test-utils/empty-store';
import { FilebasedMetafile, metafileAdded } from '../slices/metafiles';
import { buildCard } from './cards';
import isUUID from 'validator/lib/isUUID';

const mockedMetafile1: FilebasedMetafile = {
    id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
    name: 'example.ts',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Typescript',
    flags: [],
    path: 'foo/example.ts',
    state: 'unmodified',
    content: 'const rand = Math.floor(Math.random() * 6) + 1;',
    repo: '23',
    branch: '503',
    status: 'unmodified',
    conflicts: []
};

describe('thunks/cards', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeAll(async () => {
        store.dispatch(metafileAdded(mockedMetafile1));
        const instance = await mock({
            foo: {
                'example.ts': 'const rand = Math.floor(Math.random() * 6) + 1;',
                '.git': {
                    config: '',
                    HEAD: 'refs/heads/main',
                    refs: {
                        'remotes/origin/HEAD': 'ref: refs/remotes/origin/main'
                    }
                }
            },
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('createCard resolves an Editor card via metafile', async () => {
        expect.assertions(2);
        const card = await store.dispatch(buildCard({ metafile: mockedMetafile1 })).unwrap();
        expect(isUUID(card.id)).toBe(true);
        expect(card).toStrictEqual(expect.objectContaining({
            name: 'example.ts',
            type: 'Editor',
            metafile: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71'
        }));
    });

    it('createCard resolves an Editor card via filepath', async () => {
        expect.assertions(3);
        const card = await store.dispatch(buildCard({ path: 'foo/example.ts' })).unwrap();
        expect(isUUID(card.id)).toBe(true);
        expect(isUUID(card.metafile)).toBe(true);
        expect(card).toStrictEqual(expect.objectContaining({
            name: 'example.ts',
            type: 'Editor'
        }));
    });

});