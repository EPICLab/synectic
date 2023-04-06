import { DateTime } from 'luxon';
import { normalize } from 'path';
import isUUID from 'validator/lib/isUUID';
import * as gitLog from '../../containers/git/git-log';
import * as gitRevParse from '../../containers/git/git-rev-parse';
import * as gitShowBranch from '../../containers/git/git-show-branch';
import * as gitStatus from '../../containers/git/git-status';
import { emptyStore } from '../../test-utils/empty-store';
import { mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { Branch, branchAdded } from '../slices/branches';
import { DirectoryMetafile, FilebasedMetafile, metafileAdded } from '../slices/metafiles';
import { repoAdded, Repository } from '../slices/repos';
import { buildBranch, fetchBranch, fetchBranches } from './branches';

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
    flags: [],
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
    flags: [],
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
    flags: [],
    path: 'foo',
    state: 'unmodified',
    contains: ['46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71'],
    mtime: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
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
    head: '2a57bfcebde7479fd10578ae7da65c93fbb41514'
};

const mockedBranch2: Branch = {
    id: '37a161a5-2e50-47b1-8cde-d4dba8d5286b',
    ref: 'test',
    linked: false,
    bare: false,
    root: 'foo/',
    gitdir: 'foo/.git',
    scope: 'local',
    remote: 'origin',
    status: 'clean',
    commits: [],
    head: '8d04e8c703f46ae79edbedc0cc4be8f686956e3f'
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
        store.dispatch(branchAdded(mockedBranch1));
        store.dispatch(branchAdded(mockedBranch2));
        const instance = await mock({
            foo: {
                'example.ts': 'const rand = Math.floor(Math.random() * 6) + 1;',
                'bar.js': 'file contents',
                'test.js': 'var rand: number = Math.floor(Math.random() * 6) + 1;',
                '.git': {
                    config: '',
                    HEAD: 'refs/heads/main',
                    refs: {
                        heads: {
                            'main': '2a57bfcebde7479fd10578ae7da65c93fbb41514',
                            'test': '8d04e8c703f46ae79edbedc0cc4be8f686956e3f',
                        },
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
        jest.spyOn(gitRevParse, 'revParse').mockResolvedValue('main'); // mock for git-rev-parse of curent branch name
        const branch = await store.dispatch(fetchBranch({ metafile: mockedMetafile1 })).unwrap();
        expect(branch).toStrictEqual(mockedBranch1);
    });

    it('fetchBranch resolves existing branch via branch UUID in parent metafile', async () => {
        const branch = await store.dispatch(fetchBranch({ metafile: mockedMetafile2 })).unwrap();
        expect(branch).toStrictEqual(mockedBranch1);
    });

    it('fetchBranch resolves existing branch via root path', async () => {
        const branch = await store.dispatch(fetchBranch({ branchIdentifiers: { root: 'foo/', ref: 'main', scope: 'local' } })).unwrap();
        expect(branch).toStrictEqual(mockedBranch1);
    });

    it('fetchBranches resolves existing branches via root path', async () => {
        jest.spyOn(gitShowBranch, 'showBranch').mockResolvedValue([{ ref: 'test', remote: 'origin', scope: 'local' }, { ref: 'main', remote: 'origin', scope: 'local' }]); // mock for branches

        const branches = await store.dispatch(fetchBranches('foo/')).unwrap();
        expect(branches).toStrictEqual({
            local: expect.arrayContaining([mockedBranch1, mockedBranch2]),
            remote: []
        });
    });

    it('buildBranch resolves a Branch object via root path', async () => {
        jest.spyOn(gitLog, 'log').mockResolvedValue([
            {
                oid: '2a57bfcebde7479fd10578ae7da65c93fbb41514',
                message: 'example commit',
                parents: [],
                author: {
                    name: 'John Doe',
                    email: 'jdoe@company.com',
                    timestamp: undefined
                }
            }
        ]);
        jest.spyOn(gitRevParse, 'revParse').mockResolvedValue('false'); // mock for git-rev-parse of bare repository check
        jest.spyOn(gitStatus, 'worktreeStatus').mockResolvedValueOnce({ // mock for git-status of current branch
            ref: 'main',
            root: 'foo/',
            status: 'clean',
            bare: false,
            entries: []
        });
        expect.assertions(2);
        const branch = await store.dispatch(buildBranch({ root: 'foo/', ref: 'main', scope: 'local' })).unwrap();
        expect(isUUID(branch.id)).toBe(true);
        expect(branch).toStrictEqual(expect.objectContaining({
            ref: 'main',
            root: 'foo',
            gitdir: normalize('foo/.git'),
            scope: 'local'
        }));
    });

});