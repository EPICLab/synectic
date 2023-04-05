import { emptyStore } from '../../test-utils/empty-store';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { Branch, branchAdded, branchUpdated } from '../slices/branches';
import { repoAdded, Repository } from '../slices/repos';
import branchSelectors from './branches';

const mockedRepository: Repository = {
    id: '94304818-ca39-4fb1-9499-86aa329597b9',
    name: 'foo/myRepo',
    root: 'foo/',
    corsProxy: 'http://www.oregonstate.edu',
    url: 'https://github.com/foo/myRepo',
    default: 'main',
    local: ['7351312c-b7bf-4f9c-af65-d9fdfb7847e7', 'd498b041-5ebf-421c-a397-1d34f9d9c240', '68ea21e3-33da-4977-845d-01e9ee1b2208'],
    remote: ['6832864f-e51e-46e6-898e-321fd0608cb4'],
    oauth: 'github',
    username: 'sampleUser',
    password: '12345',
    token: '584n29dkj1683a67f302x009q164'
};

const mockedBranch1: Branch = {
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

const mockedBranch2: Branch = {
    id: 'd498b041-5ebf-421c-a397-1d34f9d9c240',
    ref: 'sample',
    linked: false,
    bare: false,
    root: 'foo/',
    gitdir: 'foo/.git',
    scope: 'local',
    remote: 'origin',
    status: 'clean',
    commits: [],
    head: '552193812'
};

const mockedBranch3: Branch = {
    id: '68ea21e3-33da-4977-845d-01e9ee1b2208',
    ref: 'test',
    linked: false,
    bare: false,
    root: 'bar/',
    gitdir: 'bar/.git',
    scope: 'local',
    remote: 'origin',
    status: 'clean',
    commits: [],
    head: '40513776'
};

const mockedBranch4: Branch = {
    id: '6832864f-e51e-46e6-898e-321fd0608cb4',
    ref: 'test',
    linked: false,
    bare: false,
    root: 'bar/',
    gitdir: 'bar/.git',
    scope: 'remote',
    remote: 'origin',
    status: 'clean',
    commits: [],
    head: '40513776'
};

describe('branchSelectors', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeEach(async () => {
        store.dispatch(repoAdded(mockedRepository));
        store.dispatch(branchAdded(mockedBranch1));
        store.dispatch(branchAdded(mockedBranch2));
        store.dispatch(branchAdded(mockedBranch3));
        store.dispatch(branchAdded(mockedBranch4));
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
                '.git': {
                    config: '',
                    HEAD: 'refs/heads/test',
                    refs: {
                        'remotes/origin/HEAD': 'ref: refs/remotes/origin/test'
                    }
                },
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

    it('selectById caches on id and recomputes when Branch entities change', async () => {
        branchSelectors.selectById.resetRecomputations();

        branchSelectors.selectById(store.getState(), mockedBranch1.id);
        store.dispatch(branchUpdated({ ...mockedBranch1, status: 'uncommitted' }));
        branchSelectors.selectById(store.getState(), mockedBranch1.id);
        branchSelectors.selectById(store.getState(), '');
        branchSelectors.selectById(store.getState(), mockedBranch1.id); // cached
        return expect(branchSelectors.selectById.recomputations()).toBe(3);
    });

    it('selectByIds caches on ids and recomputes when Branch entities change', async () => {
        branchSelectors.selectByIds.resetRecomputations();

        branchSelectors.selectByIds(store.getState(), [mockedBranch1.id]);
        store.dispatch(branchUpdated({ ...mockedBranch1, status: 'uncommitted' }));
        branchSelectors.selectByIds(store.getState(), [mockedBranch1.id]);
        branchSelectors.selectByIds(store.getState(), []);
        branchSelectors.selectByIds(store.getState(), [mockedBranch1.id]); // cached
        return expect(branchSelectors.selectByIds.recomputations()).toBe(3);
    });

    it('selectByRef caches on root, ref, and scope and recomputes when selectAll results change', async () => {
        branchSelectors.selectByRef.resetRecomputations();

        branchSelectors.selectByRef(store.getState(), mockedBranch1.root, mockedBranch1.ref, mockedBranch1.scope);
        store.dispatch(branchUpdated({ ...mockedBranch1, status: 'uncommitted' }));
        branchSelectors.selectByRef(store.getState(), mockedBranch1.root, mockedBranch1.ref, mockedBranch1.scope);
        branchSelectors.selectByRef(store.getState(), '', '', 'local');
        branchSelectors.selectByRef(store.getState(), mockedBranch1.root, mockedBranch1.ref, mockedBranch1.scope); // cached
        return expect(branchSelectors.selectByRef.recomputations()).toBe(3);
    });

    it('selectByRoot caches on root and recomputes when selectAll results change', async () => {
        branchSelectors.selectByRoot.resetRecomputations();

        branchSelectors.selectByRoot(store.getState(), mockedBranch1.root);
        store.dispatch(branchUpdated({ ...mockedBranch1, status: 'uncommitted' }));
        branchSelectors.selectByRoot(store.getState(), mockedBranch1.root);
        branchSelectors.selectByRoot(store.getState(), '');
        branchSelectors.selectByRoot(store.getState(), mockedBranch1.root); // cached
        return expect(branchSelectors.selectByRoot.recomputations()).toBe(3);
    });

    it('selectByGitdir caches on gitdir and recomputes when selectAll results change', async () => {
        branchSelectors.selectByGitdir.resetRecomputations();

        branchSelectors.selectByGitdir(store.getState(), mockedBranch1.gitdir);
        store.dispatch(branchUpdated({ ...mockedBranch1, status: 'uncommitted' }));
        branchSelectors.selectByGitdir(store.getState(), mockedBranch1.gitdir);
        branchSelectors.selectByGitdir(store.getState(), mockedBranch1.root);
        branchSelectors.selectByGitdir(store.getState(), mockedBranch1.gitdir); // cached
        return expect(branchSelectors.selectByGitdir.recomputations()).toBe(3);
    });

    it('selectByRepo caches on repo id and dedup and recomputes when selectAll or repoSelector.selectById results change', async () => {
        branchSelectors.selectByRepo.resetRecomputations();

        branchSelectors.selectByRepo(store.getState(), mockedRepository.id);
        store.dispatch(branchUpdated({ ...mockedBranch1, status: 'uncommitted' }));
        branchSelectors.selectByRepo(store.getState(), mockedRepository.id);
        const branches = branchSelectors.selectByRepo(store.getState(), mockedRepository.id, true);
        branchSelectors.selectByRepo(store.getState(), mockedRepository.id); // cached
        expect(branches).toStrictEqual(expect.arrayContaining([
            expect.objectContaining({ id: mockedBranch1.id }),
            expect.objectContaining({ id: mockedBranch2.id }),
            expect.objectContaining({ id: mockedBranch3.id })
        ]));
        return expect(branchSelectors.selectByRepo.recomputations()).toBe(3);
    });
});