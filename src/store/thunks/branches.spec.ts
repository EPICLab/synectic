import { DateTime } from 'luxon';
import { mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { emptyStore } from '../../test-utils/empty-store';
import { DirectoryMetafile, FilebasedMetafile, metafileAdded } from '../slices/metafiles';
import { repoAdded, Repository } from '../slices/repos';
import { Branch, branchAdded } from '../slices/branches';
import { createBranch, fetchBranch } from './branches';
import isUUID from 'validator/lib/isUUID';
import * as gitPorcelain from '../../containers/git-porcelain';
import { ReadCommitResult } from 'isomorphic-git';

const mockedMetafile1: FilebasedMetafile = {
    id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
    name: 'example.ts',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Typescript',
    path: 'foo/example.ts',
    state: 'unmodified',
    content: 'const rand = Math.floor(Math.random() * 6) + 1;',
    repo: '94304818-ca39-4fb1-9499-86aa329597b9',
    branch: '7351312c-b7bf-4f9c-af65-d9fdfb7847e7',
    status: 'unmodified',
    conflicts: []
};

const mockedMetafile2: FilebasedMetafile = {
    id: '821c9159-292b-4639-b90e-e84fc12740ee',
    name: 'test.js',
    modified: DateTime.fromISO('2019-11-19T19:19:47.572-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Javascript',
    path: 'foo/test.js',
    state: 'unmodified',
    content: 'var rand: number = Math.floor(Math.random() * 6) + 1;'
};

const mockedMetafile3: FilebasedMetafile = {
    id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
    name: 'bar.js',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Javascript',
    path: 'foo/bar.js',
    state: 'unmodified',
    content: 'file contents'
};

const mockedDirectoryMetafile: DirectoryMetafile = {
    id: 'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8',
    name: 'foo',
    modified: DateTime.fromISO('2021-01-31T11:24:54.527-08:00').valueOf(),
    handler: 'Explorer',
    filetype: 'Directory',
    path: 'foo',
    state: 'unmodified',
    contains: ['46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71'],
    repo: '94304818-ca39-4fb1-9499-86aa329597b9',
    branch: '7351312c-b7bf-4f9c-af65-d9fdfb7847e7',
    status: 'unmodified',
    conflicts: []
};

const mockedRepository: Repository = {
    id: '94304818-ca39-4fb1-9499-86aa329597b9',
    name: 'foo/myRepo',
    root: 'foo/',
    corsProxy: 'http://www.oregonstate.edu',
    url: 'https://github.com/foo/myRepo',
    default: 'master',
    local: ['7351312c-b7bf-4f9c-af65-d9fdfb7847e7'],
    remote: [],
    oauth: 'github',
    username: 'sampleUser',
    password: '12345',
    token: '584n29dkj1683a67f302x009q164'
};

const mockedBranch: Branch = {
    id: '7351312c-b7bf-4f9c-af65-d9fdfb7847e7',
    ref: 'main',
    root: 'foo/',
    gitdir: 'foo/.git',
    scope: 'local',
    remote: 'origin',
    commits: [],
    head: '987654321'
};

describe('thunks/branches', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeAll(async () => {
        store.dispatch(metafileAdded(mockedMetafile1));
        store.dispatch(metafileAdded(mockedMetafile2));
        store.dispatch(metafileAdded(mockedMetafile3));
        store.dispatch(metafileAdded(mockedDirectoryMetafile));
        store.dispatch(repoAdded(mockedRepository));
        store.dispatch(branchAdded(mockedBranch));
        const instance = await mock({
            foo: {
                'example.ts': 'const rand = Math.floor(Math.random() * 6) + 1;',
                'bar.js': 'file contents',
                '.git': {
                    config: '',
                    HEAD: 'refs/heads/main',
                    refs: {
                        'heads/main': '2a57bfcebde7479fd10578ae7da65c93fbb41514',
                        'remotes/origin/HEAD': 'ref: refs/remotes/origin/main'
                    }
                }
            },
            baz: {
                'qux.ts': 'const content = examples',
                '.git': {
                    config: '',
                    'refs/remotes/origin/HEAD': '987654321'
                }
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => {
        mockedInstance.reset();
        store.clearActions();
    });

    afterEach(() => jest.clearAllMocks());

    it('fetchBranch resolves existing branch via branch UUID in metafile', async () => {
        const branch = await store.dispatch(fetchBranch({ metafile: mockedMetafile1 })).unwrap();
        expect(branch).toStrictEqual(mockedBranch);
    });

    it('fetchBranch resolves existing branch via branch UUID in parent metafile', async () => {
        const branch = await store.dispatch(fetchBranch({ metafile: mockedMetafile2 })).unwrap();
        expect(branch).toStrictEqual(mockedBranch);
    });

    it('fetchBranch resolves existing branch via root path', async () => {
        const branch = await store.dispatch(fetchBranch({ branchIdentifiers: { root: 'foo/', branch: 'main', scope: 'local' } })).unwrap();
        expect(branch).toStrictEqual(mockedBranch);
    });

    it('createBranch resolves a Branch object via root path', async () => {
        jest.spyOn(gitPorcelain, 'log').mockImplementation(() => {
            const commit: ReadCommitResult = {
                oid: '2a57bfcebde7479fd10578ae7da65c93fbb41514',
                commit: {
                    message: '',
                    tree: '',
                    parent: [],
                    author: { name: '', email: '', timestamp: 3, timezoneOffset: 0 },
                    committer: { name: '', email: '', timestamp: 3, timezoneOffset: 0 }
                },
                payload: ''
            };
            return new Promise(resolve => resolve([commit]));
        });
        expect.assertions(2);
        const branch = await store.dispatch(createBranch({ root: 'foo/', branch: 'main', scope: 'local' })).unwrap();
        expect(isUUID(branch.id)).toBe(true);
        expect(branch).toStrictEqual(expect.objectContaining({
            ref: 'main',
            root: 'foo/',
            gitdir: 'foo/.git',
            scope: 'local'
        }));
    });

});