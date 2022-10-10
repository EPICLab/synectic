import { DateTime } from 'luxon';
import isUUID from 'validator/lib/isUUID';
import { mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { emptyStore } from '../../test-utils/empty-store';
import * as gitBranch from '../../containers/git/git-branch';
import { buildRepo, fetchRepo } from './repos';
import { isDefined } from '../../containers/utils';
import { DirectoryMetafile, FilebasedMetafile, metafileAdded } from '../slices/metafiles';
import { repoAdded, Repository } from '../slices/repos';

const mockedMetafile1: FilebasedMetafile = {
    id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
    name: 'example.ts',
    modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Typescript',
    loading: [],
    path: 'example.ts',
    state: 'unmodified',
    content: 'const rand = Math.floor(Math.random() * 6) + 1;',
    repo: '23',
    branch: 'master',
    status: 'unmodified',
    conflicts: []
};

const mockedMetafile2: FilebasedMetafile = {
    id: '821c9159-292b-4639-b90e-e84fc12740ee',
    name: 'test.js',
    modified: DateTime.fromISO('2019-11-19T19:19:47.572-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'Javascript',
    loading: [],
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
    loading: [],
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
    loading: [],
    path: 'foo',
    state: 'unmodified',
    contains: ['46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71'],
    repo: '23',
    branch: 'master',
    status: 'unmodified',
    conflicts: []
};

const mockedRepository: Repository = {
    id: '23',
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

describe('thunks/repos', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeAll(async () => {
        store.dispatch(metafileAdded(mockedMetafile1));
        store.dispatch(metafileAdded(mockedMetafile2));
        store.dispatch(metafileAdded(mockedMetafile3));
        store.dispatch(metafileAdded(mockedDirectoryMetafile));
        store.dispatch(repoAdded(mockedRepository));
        const instance = await mock({
            foo: {
                'bar.js': 'content',
                'example.ts': 'const rand = Math.floor(Math.random() * 6) + 1;',
                '.git': {
                    config: '',
                    HEAD: 'refs/heads/main',
                    refs: {
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

    afterAll(() => mockedInstance.reset());

    afterEach(() => jest.clearAllMocks());

    it('fetchRepo resolves existing repository via repo UUID in metafile', async () => {
        const repo = await store.dispatch(fetchRepo({ metafile: mockedMetafile1 })).unwrap();
        expect(repo).toStrictEqual(mockedRepository);
    });

    it('fetchRepo resolves existing repository via repo UUID in parent metafile', async () => {
        const repo = await store.dispatch(fetchRepo({ metafile: mockedMetafile2 })).unwrap();
        expect(repo).toStrictEqual(mockedRepository);
    });

    it('fetchRepo resolves existing repository via root path', async () => {
        const repo = await store.dispatch(fetchRepo({ filepath: 'foo/bar.js' })).unwrap();
        expect(repo).toStrictEqual(mockedRepository);
    });

    it('fetchRepo resolves new repository via root path', async () => {
        jest.spyOn(gitBranch, 'listBranch').mockResolvedValue([{ ref: 'main' }]); // mock for current branch name
        expect.assertions(2);
        const repo = await store.dispatch(fetchRepo({ filepath: 'baz/qux.ts' })).unwrap();
        expect(isDefined(repo) && isUUID(repo.id)).toBeTruthy();
        expect(repo).toStrictEqual(expect.objectContaining({
            root: 'baz'
        }));
    });

    it('buildRepo resolves a supported repository', async () => {
        jest.spyOn(gitBranch, 'listBranch').mockResolvedValue([{ ref: 'main' }]); // mock for current branch name
        expect.assertions(2);
        const repo = await store.dispatch(buildRepo('foo')).unwrap();
        expect(isDefined(repo) && isUUID(repo.id)).toBeTruthy();
        expect(repo).toStrictEqual(expect.objectContaining({
            name: 'foo',
            root: 'foo',
            corsProxy: 'https://cors-anywhere.herokuapp.com',
            url: '',
            default: 'main',
            local: [],
            remote: [],
            oauth: 'github',
            token: ''
        }));
    });

});