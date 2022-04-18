import { mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { emptyStore } from '../../test-utils/empty-store';
import { fetchCache } from './cache';
import { Cache, cacheAdded } from '../slices/cache';

describe('thunks/cards', () => {
    const store = mockStore(emptyStore, true);
    let mockedInstance: MockInstance;

    beforeAll(async () => {
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

    it('fetchCache resolves a Cache for a filepath', async () => {
        // store.dispatch(metafileAdded(mockedMetafile1));
        const cache = await store.dispatch(fetchCache('foo/example.ts')).unwrap();
        expect(cache).toStrictEqual(expect.objectContaining({
            path: 'foo/example.ts',
            reserve: 1,
            content: 'const rand = Math.floor(Math.random() * 6) + 1;'
        }));
    });

    it('fetchCache increments reserve on existing Cache', async () => {
        const cache: Cache = {
            path: 'foo/example.ts',
            reserve: 1,
            content: 'const rand = Math.floor(Math.random() * 6) + 1;'
        }
        store.dispatch(cacheAdded(cache));
        const updated = await store.dispatch(fetchCache('foo/example.ts')).unwrap();
        expect(updated).toStrictEqual(expect.objectContaining({ reserve: 2 }));
    });

});