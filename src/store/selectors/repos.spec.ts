import { emptyStore } from '../../test-utils/empty-store';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { Branch, branchAdded } from '../slices/branches';
import { Filetype, filetypeAdded } from '../slices/filetypes';
import { repoAdded, Repository, repoUpdated } from '../slices/repos';
import repoSelectors from './repos';

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

describe('repoSelectors', () => {
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

    it('selectById caches on id and recomputes when Repository entities change', async () => {
        repoSelectors.selectById.resetRecomputations();

        repoSelectors.selectById(store.getState(), mockedRepository.id);
        store.dispatch(repoUpdated({ ...mockedRepository, local: [...mockedRepository.local, 'debug'] }));
        repoSelectors.selectById(store.getState(), mockedRepository.id);
        repoSelectors.selectById(store.getState(), '');
        repoSelectors.selectById(store.getState(), mockedRepository.id); // cached
        return expect(repoSelectors.selectById.recomputations()).toBe(3);
    });

    it('selectBy* selectors recompute when selectAll results change', async () => {
        expect.assertions(3);
        repoSelectors.selectByName.resetRecomputations();
        repoSelectors.selectByRoot.resetRecomputations();
        repoSelectors.selectByUrl.resetRecomputations();

        repoSelectors.selectByName(store.getState(), mockedRepository.name);
        repoSelectors.selectByRoot(store.getState(), mockedRepository.root);
        repoSelectors.selectByUrl(store.getState(), mockedRepository.url);

        store.dispatch(repoUpdated({ ...mockedRepository, local: [...mockedRepository.local, 'debug'] }));

        repoSelectors.selectByName(store.getState(), mockedRepository.name);
        repoSelectors.selectByName(store.getState(), mockedRepository.name); // cached
        expect(repoSelectors.selectByName.recomputations()).toBe(2);

        repoSelectors.selectByRoot(store.getState(), mockedRepository.root);
        repoSelectors.selectByRoot(store.getState(), mockedRepository.root); // cached
        expect(repoSelectors.selectByRoot.recomputations()).toBe(2);

        repoSelectors.selectByUrl(store.getState(), mockedRepository.url);
        repoSelectors.selectByUrl(store.getState(), mockedRepository.url); // cached
        return expect(repoSelectors.selectByUrl.recomputations()).toBe(2);
    });

});