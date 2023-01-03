import { mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { emptyStore } from '../../test-utils/empty-store';
import { subscribe } from './cache';
import { Cache, cacheAdded } from '../slices/cache';
import { FileMetafile, metafileAdded } from '../slices/metafiles';
import { DateTime } from 'luxon';
import { Card, cardAdded } from '../slices/cards';

const card: Card = {
    id: 'f6b3f2a3-9145-4b59-a4a1-bf414214f30b',
    name: 'example.ts',
    type: 'Editor',
    metafile: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
    created: DateTime.fromISO('2019-01-21T08:14:52.181-08:00').valueOf(),
    modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
    captured: undefined,
    expanded: false,
    left: 10,
    top: 10,
    zIndex: 1,
    classes: []
};

const metafile: FileMetafile = {
    id: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
    name: 'example.ts',
    modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'TypeScript',
    flags: [],
    path: 'foo/example.ts',
    state: 'unmodified',
    content: 'const rand = Math.floor(Math.random() * 6) + 1;'
};

describe('thunks/cards', () => {
    const store = mockStore(emptyStore, false);
    let mockedInstance: MockInstance;

    beforeAll(async () => {
        store.dispatch(metafileAdded(metafile));
        store.dispatch(cardAdded(card));
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

    afterEach(() => store.clearActions());

    it('subscribe resolves a Cache for a filepath and Card UUID', async () => {
        const cache = await store.dispatch(subscribe({ path: 'foo/example.ts', card: card.id })).unwrap();
        expect(cache).toStrictEqual(expect.objectContaining({
            path: metafile.path.toString(),
            reserved: expect.arrayContaining([card.id]),
            content: metafile.content
        }));
    });

    it('subscribe adds new card UUIDs to existing Cache reserved', async () => {
        const cache: Cache = {
            path: metafile.path.toString(),
            reserved: [card.id],
            content: metafile.content
        }
        store.dispatch(cacheAdded(cache));
        const updated = await store.dispatch(subscribe({ path: 'foo/example.ts', card: '3f9ea183-d648-4a30-ad76-bcbec3e60b55' })).unwrap();
        expect(updated.reserved).toHaveLength(2);
    });

});