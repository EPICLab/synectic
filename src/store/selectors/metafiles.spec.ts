import { DateTime } from 'luxon';
import { delay } from '../../containers/utils';
import { emptyStore } from '../../test-utils/empty-store';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { Branch, branchAdded } from '../slices/branches';
import { Filetype, filetypeAdded } from '../slices/filetypes';
import { VersionedMetafile, VirtualMetafile, metafileAdded, metafileUpdated, metafilesUpdated } from '../slices/metafiles';
import { repoAdded, Repository } from '../slices/repos';
import { fetchMetafile } from '../thunks/metafiles';
import metafileSelectors from './metafiles';
import { Card, cardAdded } from '../slices/cards';

const mockedFiletype1: Filetype = {
    id: 'eb5d332e-61a1-422d-aeba-48186d9f79f3',
    filetype: 'JavaScript',
    handler: 'Editor',
    extensions: ['js', 'jsm']
};

const mockedFiletype2: Filetype = {
    id: '78aa4b01-ce6e-3161-4671-b0019de5c375',
    filetype: 'Directory',
    handler: 'Explorer',
    extensions: []
};

const mockedFiletype3: Filetype = {
    id: '0b743dd5-2559-4f03-8c02-0f67676e906a',
    filetype: 'Text',
    handler: 'Editor',
    extensions: ['txt']
};

const mockedRepository: Repository = {
    id: '94304818-ca39-4fb1-9499-86aa329597b9',
    name: 'foo/myRepo',
    root: 'foo/',
    corsProxy: 'http://www.oregonstate.edu',
    url: 'https://github.com/foo/myRepo',
    default: 'master',
    local: ['master', 'sample', 'test'],
    remote: [],
    oauth: 'github',
    username: 'sampleUser',
    password: '12345',
    token: '584n29dkj1683a67f302x009q164'
};

const mockedBranch: Branch = {
    id: '7351312c-b7bf-4f9c-af65-d9fdfb7847e7',
    ref: 'main',
    linked: false,
    bare: false,
    root: 'foo/',
    gitdir: 'foo/.git',
    scope: 'local',
    remote: 'origin',
    status: 'clean',
    commits: [],
    head: '987654321'
};

const mockedMetafile: VersionedMetafile = {
    id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
    name: 'example.js',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'JavaScript',
    flags: [],
    path: 'foo/example.js',
    state: 'unmodified',
    content: 'var rand = Math.floor(Math.random() * 6) + 1;',
    mtime: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
    repo: mockedRepository.id,
    branch: mockedBranch.id,
    status: 'unmodified',
    conflicts: []
};

const virtualMetafile: VirtualMetafile = {
    id: 'a5a6806b-f7e1-4f13-bca1-b1440ecd4431',
    name: 'tap.js',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Javascript',
    flags: [],
    content: 'new content'
};

const mockedCard: Card = {
    id: 'b741f857-870c-4756-b38b-b375823a08f6',
    name: 'sample.js',
    type: 'Editor',
    metafile: mockedMetafile.id,
    created: DateTime.fromISO('2019-01-10T10:08:30.114-08:00').valueOf(),
    modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
    captured: undefined,
    expanded: false,
    zIndex: 1,
    left: 30,
    top: 50,
    classes: []
};

describe('metafileSelectors', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeEach(async () => {
        store.dispatch(filetypeAdded(mockedFiletype1));
        store.dispatch(filetypeAdded(mockedFiletype2));
        store.dispatch(filetypeAdded(mockedFiletype3));
        store.dispatch(repoAdded(mockedRepository));
        store.dispatch(branchAdded(mockedBranch));
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

    it('selectById caches on id and recomputes when Metafile entities change', async () => {
        const metafile = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
        await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
        metafileSelectors.selectById.clearCache();
        metafileSelectors.selectById.resetRecomputations();

        metafileSelectors.selectById(store.getState(), metafile.id);
        store.dispatch(metafileUpdated(metafile)); // `modified` timestamp will be updated
        metafileSelectors.selectById(store.getState(), metafile.id);
        metafileSelectors.selectById(store.getState(), metafile.id); // cached
        return expect(metafileSelectors.selectById.recomputations()).toBe(2);
    });

    it('selectByIds caches on ids and recomputes when Metafile entities change', async () => {
        const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
        const metafile2 = await store.dispatch(fetchMetafile({ path: 'foo/zap.ts' })).unwrap();
        await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
        metafileSelectors.selectByIds.clearCache();

        metafileSelectors.selectByIds(store.getState(), [metafile1.id, metafile2.id]);
        store.dispatch(metafilesUpdated([metafile1, metafile2])); // `modified` timestamp will be updated
        metafileSelectors.selectByIds(store.getState(), [metafile1.id, metafile2.id]);
        metafileSelectors.selectByIds(store.getState(), [metafile1.id]);
        metafileSelectors.selectByIds(store.getState(), [metafile1.id, metafile2.id]); // cached
        return expect(metafileSelectors.selectByIds.recomputations()).toBe(3);
    });

    it('select[subtype] selectors recompute when selectAll results change', async () => {
        expect.assertions(5);
        const metafile = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
        await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
        metafileSelectors.selectVirtual.resetRecomputations();
        metafileSelectors.selectFilebased.resetRecomputations();
        metafileSelectors.selectFiles.resetRecomputations();
        metafileSelectors.selectDirectories.resetRecomputations();
        metafileSelectors.selectVersioned.resetRecomputations();

        metafileSelectors.selectVirtual(store.getState());
        metafileSelectors.selectFilebased(store.getState());
        metafileSelectors.selectFiles(store.getState());
        metafileSelectors.selectDirectories(store.getState());
        metafileSelectors.selectVersioned(store.getState());
        metafileSelectors.selectVersioned(store.getState());

        store.dispatch(metafileUpdated(metafile)); // `modified` timestamp will be updated

        metafileSelectors.selectVirtual(store.getState());
        metafileSelectors.selectVirtual(store.getState()); // cached
        expect(metafileSelectors.selectVirtual.recomputations()).toBe(2)

        metafileSelectors.selectFilebased(store.getState());
        metafileSelectors.selectFilebased(store.getState()); //cached 
        expect(metafileSelectors.selectFilebased.recomputations()).toBe(2)

        metafileSelectors.selectFiles(store.getState());
        metafileSelectors.selectFiles(store.getState()); // cached
        expect(metafileSelectors.selectFiles.recomputations()).toBe(2);

        metafileSelectors.selectDirectories(store.getState());
        metafileSelectors.selectDirectories(store.getState()); // cached
        expect(metafileSelectors.selectDirectories.recomputations()).toBe(2);

        metafileSelectors.selectVersioned(store.getState());
        metafileSelectors.selectVersioned(store.getState()); // cached
        return expect(metafileSelectors.selectVersioned.recomputations()).toBe(2);
    });

    it('selectByFilepath caches on filepath and handlers and recomputes when selectFilebased results change', async () => {
        metafileSelectors.selectAll.clearCache();
        metafileSelectors.selectByFilepath.clearCache();
        metafileSelectors.selectByFilepaths.clearCache();
        const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
        const metafile2 = await store.dispatch(fetchMetafile({ path: 'foo/zap.ts' })).unwrap();
        await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
        metafileSelectors.selectByFilepath.resetRecomputations();

        metafileSelectors.selectByFilepath(store.getState(), 'foo/bar.js');
        metafileSelectors.selectByFilepath(store.getState(), 'foo/bar.js');
        store.dispatch(metafileUpdated(metafile1)); // `modified` timestamp will be updated
        store.dispatch(metafileUpdated(metafile2));
        metafileSelectors.selectByFilepath(store.getState(), 'foo/bar.js');
        metafileSelectors.selectByFilepath(store.getState(), 'foo/zap.ts');
        metafileSelectors.selectByFilepath(store.getState(), 'foo/bar.js'); // cached
        metafileSelectors.selectByFilepath(store.getState(), 'foo/zap.ts'); // cached
        return expect(metafileSelectors.selectByFilepath.recomputations()).toBe(3);
    });

    it('selectByFilepaths caches on ids and recomputes when selectFilepath results change', async () => {
        expect.assertions(2);
        metafileSelectors.selectAll.clearCache();
        metafileSelectors.selectByFilepath.clearCache();
        metafileSelectors.selectByFilepaths.clearCache();
        metafileSelectors.selectFilebased.clearCache();
        const metafile = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
        await store.dispatch(fetchMetafile({ path: 'foo/example.js' })).unwrap();
        await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
        metafileSelectors.selectAll.resetRecomputations();
        metafileSelectors.selectFilebased.resetRecomputations();
        metafileSelectors.selectByFilepath.resetRecomputations();

        metafileSelectors.selectByFilepaths(store.getState(), ['foo/bar.js', 'foo/example.js']);
        store.dispatch(metafileUpdated(metafile)); // `modified` timestamp will be updated
        metafileSelectors.selectByFilepaths(store.getState(), ['foo/bar.js', 'foo/example.js']);
        metafileSelectors.selectByFilepaths(store.getState(), ['foo/bar.js']);
        metafileSelectors.selectByFilepaths(store.getState(), ['foo/bar.js', 'foo/example.js']);
        metafileSelectors.selectByFilepaths(store.getState(), ['foo/bar.js', 'foo/example.js']);
        expect(metafileSelectors.selectByFilepath.recomputations()).toBe(4);
        return expect(metafileSelectors.selectByFilepaths.recomputations()).toBe(3);
    });

    it('selectByRoot caches on root and direct and recomputes when selectFilebased results change', async () => {
        metafileSelectors.selectByRoot.clearCache();
        const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
        const metafile2 = await store.dispatch(fetchMetafile({ path: 'foo/example.js' })).unwrap();
        metafileSelectors.selectByRoot.resetRecomputations();

        metafileSelectors.selectByRoot(store.getState(), 'foo', true);
        store.dispatch(metafileUpdated(metafile1)); // `modified` timestamp will be updated
        store.dispatch(metafileUpdated(metafile2));
        metafileSelectors.selectByRoot(store.getState(), 'foo', true);
        metafileSelectors.selectByRoot(store.getState(), 'foo', false);
        metafileSelectors.selectByRoot(store.getState(), 'foo', true); // cached
        metafileSelectors.selectByRoot(store.getState(), 'foo', false); // cached
        return expect(metafileSelectors.selectByRoot.recomputations()).toBe(3);
    });

    it('selectDescendantsByRoot caches on root and direct and recomputes when selectByRoot results change', async () => {
        metafileSelectors.selectDescendantsByRoot.clearCache();
        const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
        const metafile2 = await store.dispatch(fetchMetafile({ path: 'foo/example.js' })).unwrap();
        await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
        metafileSelectors.selectDescendantsByRoot.resetRecomputations();

        metafileSelectors.selectDescendantsByRoot(store.getState(), 'foo', true);
        store.dispatch(metafileUpdated(metafile1)); // `modified` timestamp will be updated
        store.dispatch(metafileUpdated(metafile2));
        metafileSelectors.selectDescendantsByRoot(store.getState(), 'foo', true);
        metafileSelectors.selectDescendantsByRoot(store.getState(), 'bar', true);
        metafileSelectors.selectDescendantsByRoot(store.getState(), 'foo', true); // cached
        metafileSelectors.selectDescendantsByRoot(store.getState(), 'bar', false);
        metafileSelectors.selectDescendantsByRoot(store.getState(), 'bar', true); // cached
        return expect(metafileSelectors.selectDescendantsByRoot.recomputations()).toBe(4);
    });

    it('selectByRepo caches on repo.id and recomputes when selectVersioned results change', async () => {
        expect.assertions(2);
        const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
        await delay(3); // prevent race condition where `modified` timestamp is updated to the same value
        store.dispatch(metafileAdded(mockedMetafile));
        metafileSelectors.selectByRepo.resetRecomputations();

        metafileSelectors.selectByRepo(store.getState(), mockedRepository.id);
        store.dispatch(metafileUpdated(metafile1)); // `modified` timestamp will be updated
        store.dispatch(metafileUpdated(mockedMetafile));
        metafileSelectors.selectByRepo(store.getState(), mockedRepository.id);
        metafileSelectors.selectByRepo(store.getState(), '13');
        const metafiles = metafileSelectors.selectByRepo(store.getState(), mockedRepository.id); // cached
        expect(metafiles).toStrictEqual(expect.arrayContaining([
            expect.objectContaining({
                id: mockedMetafile.id,
                repo: mockedRepository.id
            })
        ]));
        return expect(metafileSelectors.selectByRepo.recomputations()).toBe(3);
    });

    it('selectByBranch caches on branch.id and filepath and recomputes when selectVersioned results change', async () => {
        expect.assertions(2);
        const metafile1 = await store.dispatch(fetchMetafile({ path: 'foo/bar.js' })).unwrap();
        store.dispatch(metafileAdded(mockedMetafile));
        metafileSelectors.selectByBranch.resetRecomputations();

        metafileSelectors.selectByBranch(store.getState(), mockedBranch.id);
        store.dispatch(metafileUpdated(metafile1)); // `modified` timestamp will be updated
        metafileSelectors.selectByBranch(store.getState(), mockedBranch.id);
        store.dispatch(metafileUpdated(mockedMetafile));
        metafileSelectors.selectByBranch(store.getState(), mockedBranch.id); // cached
        metafileSelectors.selectByBranch(store.getState(), '3');
        metafileSelectors.selectByBranch(store.getState(), mockedBranch.id); // cached
        const metafiles = metafileSelectors.selectByBranch(store.getState(), mockedBranch.id); // cached
        expect(metafiles).toStrictEqual(expect.arrayContaining([
            expect.objectContaining({
                id: mockedMetafile.id,
                branch: mockedBranch.id
            })
        ]));
        return expect(metafileSelectors.selectByBranch.recomputations()).toBe(3);
    });

    it('selectByVirtual caches on name and handler and recomputes when selectVirtual results change', async () => {
        expect.assertions(2);
        store.dispatch(metafileAdded(virtualMetafile));
        metafileSelectors.selectByVirtual.resetRecomputations();

        metafileSelectors.selectByVirtual(store.getState(), virtualMetafile.name, virtualMetafile.handler);
        store.dispatch(metafileUpdated(virtualMetafile)); // `modified` timestamp will be updated
        metafileSelectors.selectByVirtual(store.getState(), virtualMetafile.name, virtualMetafile.handler);
        metafileSelectors.selectByVirtual(store.getState(), virtualMetafile.name, 'Browser');
        metafileSelectors.selectByVirtual(store.getState(), virtualMetafile.name, virtualMetafile.handler); // cached
        const metafiles = metafileSelectors.selectByVirtual(store.getState(), virtualMetafile.name, virtualMetafile.handler); // cached
        expect(metafiles).toStrictEqual(expect.arrayContaining([
            expect.objectContaining({ id: virtualMetafile.id })
        ]));
        return expect(metafileSelectors.selectByBranch.recomputations()).toBe(3);
    });

    it('selectByState caches on state and recomputes when selectFilebased results change', async () => {
        expect.assertions(2);
        store.dispatch(metafileAdded(mockedMetafile));
        metafileSelectors.selectByState.resetRecomputations();

        metafileSelectors.selectByState(store.getState(), 'unmodified');
        store.dispatch(metafileUpdated(mockedMetafile)); // `modified` timestamp will be updated
        metafileSelectors.selectByState(store.getState(), 'unmodified');
        metafileSelectors.selectByState(store.getState(), 'modified');
        metafileSelectors.selectByState(store.getState(), 'unmodified'); // cached
        const metafiles = metafileSelectors.selectByState(store.getState(), 'unmodified'); // cached
        expect(metafiles).toStrictEqual(expect.arrayContaining([
            expect.objectContaining({
                id: mockedMetafile.id,
                state: 'unmodified'
            })
        ]));
        return expect(metafileSelectors.selectByState.recomputations()).toBe(3);
    });

    it('selectByCards caches on cards and metafile and recomputes when selectEntities results change', async () => {
        expect.assertions(2);
        store.dispatch(metafileAdded(mockedMetafile));
        store.dispatch(cardAdded(mockedCard));
        metafileSelectors.selectByCards.resetRecomputations();

        metafileSelectors.selectByCards(store.getState(), [mockedCard]);
        store.dispatch(metafileUpdated(mockedMetafile)); // `modified` timestamp will be updated
        metafileSelectors.selectByCards(store.getState(), [mockedCard]);
        const metafiles = metafileSelectors.selectByCards(store.getState(), [mockedCard]); // cached
        expect(metafiles).toStrictEqual(expect.arrayContaining([
            expect.objectContaining({ id: mockedMetafile.id })
        ]));
        return expect(metafileSelectors.selectByCards.recomputations()).toBe(2);
    });

    it('selectConflictedByRepo caches on repo and branch and recomputes when selectVersioned results change', async () => {
        expect.assertions(3);
        store.dispatch(metafileAdded(mockedMetafile));
        store.dispatch(cardAdded(mockedCard));
        metafileSelectors.selectConflictedByRepo.resetRecomputations();

        const a = metafileSelectors.selectConflictedByRepo(store.getState(), mockedRepository.id, mockedBranch.id);
        expect(a).toHaveLength(0);
        store.dispatch(metafileUpdated({ ...mockedMetafile, status: 'unmerged', conflicts: ['1', '15'] }));
        metafileSelectors.selectConflictedByRepo(store.getState(), mockedRepository.id, mockedBranch.id);
        metafileSelectors.selectConflictedByRepo(store.getState(), mockedRepository.id, mockedBranch.id); // cached
        const b = metafileSelectors.selectConflictedByRepo(store.getState(), mockedRepository.id, mockedBranch.id); // cached
        expect(b).toStrictEqual(expect.arrayContaining([
            expect.objectContaining({ id: mockedMetafile.id })
        ]));
        return expect(metafileSelectors.selectConflictedByRepo.recomputations()).toBe(2);
    });

    it('selectStagedByRepo caches on repo and branch and recomputes when selectVersioned results change', async () => {
        expect.assertions(3);
        store.dispatch(metafileAdded(mockedMetafile));
        metafileSelectors.selectStagedByRepo.resetRecomputations();

        expect(metafileSelectors.selectStagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id)).toHaveLength(0);
        store.dispatch(metafileUpdated({ ...mockedMetafile, status: 'modified' }));
        metafileSelectors.selectStagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id);
        metafileSelectors.selectStagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id); // cached
        expect(metafileSelectors.selectStagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id)).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: mockedMetafile.id })
            ])
        );
        return expect(metafileSelectors.selectStagedByRepo.recomputations()).toBe(2);
    });

    it('selectUnstagedByRepo caches on repo and branch and recomputes when selectVersioned results change', async () => {
        expect.assertions(3);
        store.dispatch(metafileAdded({ ...mockedMetafile, status: 'modified' }));
        metafileSelectors.selectUnstagedByRepo.resetRecomputations();

        expect(metafileSelectors.selectUnstagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id)).toHaveLength(0);
        store.dispatch(metafileUpdated({ ...mockedMetafile, status: '*modified' }));
        metafileSelectors.selectUnstagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id);
        metafileSelectors.selectUnstagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id); // cached
        expect(metafileSelectors.selectUnstagedByRepo(store.getState(), mockedRepository.id, mockedBranch.id)).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: mockedMetafile.id })
            ])
        );
        return expect(metafileSelectors.selectUnstagedByRepo.recomputations()).toBe(2);
    });
});