import { DateTime } from 'luxon';
import { emptyStore } from '../../test-utils/empty-store';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { Cache, cacheAdded, cacheRemoved } from '../slices/cache';
import { FilebasedMetafile, metafileAdded } from '../slices/metafiles';
import cacheSelectors from './cache';
import { Filetype, filetypeAdded } from '../slices/filetypes';

const mockedFiletype: Filetype = {
    id: 'eb5d332e-61a1-422d-aeba-48186d9f79f3',
    filetype: 'JavaScript',
    handler: 'Editor',
    extensions: ['js', 'jsm']
};

const mockedMetafile: FilebasedMetafile = {
    id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
    name: 'example.js',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'JavaScript',
    flags: [],
    path: 'foo/example.js',
    state: 'unmodified',
    content: 'var rand = Math.floor(Math.random() * 6) + 1;',
    mtime: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf()
};

const mockedCache: Cache = {
    path: 'foo/example.js',
    reserved: [],
    content: 'var rand = Math.floor(Math.random() * 6) + 1;'
};

describe('cacheSelectors', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeEach(async () => {
        store.dispatch(filetypeAdded(mockedFiletype));
        store.dispatch(metafileAdded(mockedMetafile));
        store.dispatch(cacheAdded(mockedCache));
        const instance = await mock({
            foo: {
                'bar.js': file({ content: 'file contents', mtime: new Date('2020-01-01T07:13:04.276-08:00') }),
                'zap.ts': file({ content: 'file contents', mtime: new Date('2021-04-05T14:21:32.783-08:00') }),
                'example.js': 'var rand = Math.floor(Math.random() * 6) + 1;',
                '.git': {
                    config: '',
                    HEAD: 'refs/heads/main',
                    refs: {
                        'remotes/origin/HEAD': 'ref: refs/remotes/origin/main'
                    }
                }
            },
            bar: {
                'sample.js': 'var rand = Math.floor(Math.random() * 8) + 2;'
            }
        });
        return mockedInstance = instance;
    });

    afterEach(() => {
        mockedInstance.reset();
        store.clearActions();
        jest.clearAllMocks();
    });

    it('selectById caches on id and recomputes when Cache entities change', async () => {
        cacheSelectors.selectById.resetRecomputations();

        cacheSelectors.selectById(store.getState(), mockedCache.path);
        store.dispatch(cacheRemoved(mockedCache.path));
        cacheSelectors.selectById(store.getState(), mockedCache.path);
        cacheSelectors.selectById(store.getState(), '');
        cacheSelectors.selectById(store.getState(), mockedCache.path); // cached
        return expect(cacheSelectors.selectById.recomputations()).toBe(3);
    });

    it('selectByIds caches on ids and recomputes when Cache entities change', async () => {
        cacheSelectors.selectByIds.resetRecomputations();

        cacheSelectors.selectByIds(store.getState(), [mockedCache.path]);
        store.dispatch(cacheRemoved(mockedCache.path));
        cacheSelectors.selectByIds(store.getState(), [mockedCache.path]);
        cacheSelectors.selectByIds(store.getState(), ['']);
        cacheSelectors.selectByIds(store.getState(), [mockedCache.path]); // cached
        return expect(cacheSelectors.selectByIds.recomputations()).toBe(3);
    });

});