import { DateTime, Settings } from 'luxon';
import isUUID from 'validator/lib/isUUID';
import * as gitBranch from '../../containers/git/git-branch';
import * as gitStatus from '../../containers/git/git-status';
import { emptyStore } from '../../test-utils/empty-store';
import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { Branch, branchAdded } from '../slices/branches';
import { Filetype, filetypeAdded } from '../slices/filetypes';
import { DirectoryMetafile, FilebasedMetafile, FileMetafile, metafileAdded, MetafileTemplate } from '../slices/metafiles';
import { repoAdded, Repository } from '../slices/repos';
import { createMetafile, fetchMetafile, fetchParentMetafile, hasFilebasedUpdates, updateFilebasedMetafile, updateVersionedMetafile } from './metafiles';

const mockedFiletype1: Filetype = {
    id: 'eb5d332e-61a1-422d-aeba-48186d9f79f3',
    filetype: 'JavaScript',
    handler: 'Editor',
    extensions: ['js', 'jsm']
}

const mockedFiletype2: Filetype = {
    id: '78aa4b01-ce6e-3161-4671-b0019de5c375',
    filetype: 'Directory',
    handler: 'Explorer',
    extensions: []
}

const mockedFiletype3: Filetype = {
    id: '0b743dd5-2559-4f03-8c02-0f67676e906a',
    filetype: 'Text',
    handler: 'Editor',
    extensions: ['txt']
}

const mockedMetafile: FileMetafile = {
    id: '8ac62438-0069-4208-9231-f03b61fdd8e6',
    name: 'zap.ts',
    modified: DateTime.fromISO('2021-04-05T14:21:32.783-08:00').valueOf(),
    handler: 'Editor',
    filetype: 'TypeScript',
    flags: [],
    path: 'foo/zap.ts',
    state: 'unmodified',
    content: 'file contents',
    mtime: DateTime.fromISO('2021-04-05T14:21:32.783-08:00').valueOf()

}

describe('thunks/metafiles', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeEach(async () => {
        store.dispatch(filetypeAdded(mockedFiletype1));
        store.dispatch(filetypeAdded(mockedFiletype2));
        store.dispatch(filetypeAdded(mockedFiletype3));
        const instance = await mock({
            foo: {
                'bar.js': file({ content: 'file contents', mtime: new Date('2020-01-01T07:13:04.276-08:00') }),
                'zap.ts': file({ content: 'file contents', mtime: new Date('2021-04-05T14:21:32.783-08:00') }),
                'example.js': 'var rand = Math.floor(Math.random() * 6) + 1;',
                '.git': {}
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

    it('hasFilebasedUpdates returns filesystem timestamp when metafile has not previously been populated', async () => {
        const unpopulatedMetafile: FilebasedMetafile = {
            id: 'a58e4a5b-c8ec-42ba-86d2-82fa4d47638b',
            name: 'bar.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'foo/bar.js',
            state: 'unmodified'
        };
        const filesystemTimestamp = DateTime.fromISO('2020-01-01T07:13:04.276-08:00').valueOf();
        await expect(hasFilebasedUpdates(unpopulatedMetafile)).resolves.toBe(filesystemTimestamp);
    });

    it('hasFilebasedUpdates returns filesystem timestamp when metafile timestamp is behind filesystem timestamp (stale)', async () => {
        const staleMetafile: FileMetafile = {
            id: 'b5ee58cf-fe0b-41ce-8f42-a70f0f9d776e',
            name: 'zap.ts',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'foo/zap.ts',
            state: 'unmodified',
            content: 'file content',
            mtime: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf()
        };
        const filesystemTimestamp = DateTime.fromISO('2021-04-05T14:21:32.783-08:00').valueOf();
        await expect(hasFilebasedUpdates(staleMetafile)).resolves.toBe(filesystemTimestamp);
    });

    it('hasFilebasedUpdates returns undefined when filesystem and metafile timestamps match', async () => {
        const matchedMetafile: FilebasedMetafile = {
            id: 'a58e4a5b-c8ec-42ba-86d2-82fa4d47638b',
            name: 'bar.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'foo/bar.js',
            state: 'unmodified',
            content: 'file content',
            mtime: DateTime.fromISO('2020-01-01T07:13:04.276-08:00').valueOf()
        };
        await expect(hasFilebasedUpdates(matchedMetafile)).resolves.toBeUndefined();
    });

    it('hasFilebasedUpdates returns undefined when metafile timestamp is ahead of filesystem timestamp (updated)', async () => {
        const aheadMetafile: FileMetafile = {
            id: 'b5ee58cf-fe0b-41ce-8f42-a70f0f9d776e',
            name: 'zap.ts',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'foo/zap.ts',
            state: 'unmodified',
            content: 'file content has been locally updated',
            mtime: DateTime.fromISO('2021-04-27T22:21:20.443-08:00').valueOf()
        };
        await expect(hasFilebasedUpdates(aheadMetafile)).resolves.toBeUndefined();
    });

    it('hasFilebasedUpdates returns undefined when underlying filesystem object no longer exists', async () => {
        const deletedFile: FilebasedMetafile = {
            id: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
            name: 'quz.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'foo/quz.js',
            state: 'unmodified'
        };
        await expect(hasFilebasedUpdates(deletedFile)).resolves.toBeUndefined();
    });

    it('fetchMetafile resolves a metafile via existing filepath', async () => {
        store.dispatch(metafileAdded(mockedMetafile));
        const metafile = await store.dispatch(fetchMetafile({ path: mockedMetafile.path })).unwrap();
        expect(metafile).toStrictEqual(mockedMetafile);
    });

    it('fetchMetafile resolves a metafile via existing filepath and handlers', async () => {
        store.dispatch(metafileAdded(mockedMetafile));
        const metafile = await store.dispatch(fetchMetafile({ path: mockedMetafile.path, handlers: [mockedMetafile.handler] })).unwrap();
        expect(metafile).toStrictEqual(mockedMetafile);
    });

    it('fetchMetafile resolves a new metafile when no matching filepath exists', async () => {
        const metafile = await store.dispatch(fetchMetafile({ path: mockedMetafile.path })).unwrap();
        expect(metafile).not.toStrictEqual(mockedMetafile);
    });

    it('fetchMetafile resolves a new metafile when no matching filepath and handlers exist', async () => {
        store.dispatch(metafileAdded(mockedMetafile));
        const metafile = await store.dispatch(fetchMetafile({ path: mockedMetafile.path, handlers: ['Browser'] })).unwrap();
        expect(metafile).not.toStrictEqual(mockedMetafile);
    });

    it('createMetafile resolves a supported metafile via filepath', async () => {
        const metafile = await store.dispatch(createMetafile({ path: 'foo/example.js' })).unwrap();
        expect(metafile).toStrictEqual(expect.objectContaining({
            name: 'example.js',
            handler: 'Editor',
            filetype: 'JavaScript',
            path: 'foo/example.js'
        }));
    });

    it('createMetafile resolves a supported metafile via metafile template', async () => {
        const template: MetafileTemplate = {
            name: 'test.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            content: 'var rand = Math.floor(Math.random() * 3) * 2;'
        };
        const metafile = await store.dispatch(createMetafile({ metafile: template })).unwrap();
        expect(isUUID(metafile.id)).toBe(true);
        expect(metafile).toStrictEqual(expect.objectContaining({
            ...template
        }));
    });

    it('updateFilebasedMetafile updates list of contained metafiles for Directory filetypes', async () => {
        const file1: FilebasedMetafile = {
            id: 'a58e4a5b-c8ec-42ba-86d2-82fa4d47638b',
            name: 'sample.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'bar/sample.js',
            state: 'unmodified'
        };
        const file2: FilebasedMetafile = {
            id: '7d2a0568-ad1b-4402-839b-593db00c445a',
            name: 'second.js',
            modified: DateTime.fromISO('2022-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'bar/second.js',
            state: 'unmodified',
            content: 'var multi = 3 * 2;'
        };
        const directory: FilebasedMetafile = {
            id: '91509174-9ccb-441f-a5c9-ff0b848cbc7b',
            name: 'bar',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Explorer',
            filetype: 'Directory',
            flags: [],
            path: 'bar/',
            state: 'unmodified'
        };
        store.dispatch(metafileAdded(file1));
        const update1 = await store.dispatch(updateFilebasedMetafile(directory)).unwrap();
        expect(update1).toStrictEqual(expect.objectContaining({ contains: [file1.id] }));

        // setup for examining the addition of a new file
        await mockedInstance.addItem('bar/second.js', file({ content: 'var multi = 3 * 2;' }));
        store.dispatch(metafileAdded(file2));
        const expected = DateTime.fromISO('2021-10-10T14:52:55.118-08:00');
        Settings.now = () => expected.toMillis();

        const update2 = await store.dispatch(updateFilebasedMetafile(directory)).unwrap();
        expect(update2).toStrictEqual(expect.objectContaining({ contains: [file1.id, file2.id] }));
        expect(update2.modified).toEqual(expected.valueOf());
        expect(update1.modified).not.toStrictEqual(update2.modified);
    });

    it('updateFilebasedMetafile updates file content for non-Directory filetypes', async () => {
        const file: FilebasedMetafile = {
            id: 'a58e4a5b-c8ec-42ba-86d2-82fa4d47638b',
            name: 'sample.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'bar/sample.js',
            state: 'unmodified',
            content: 'var rand = Math.floor(Math.random() * 8) + 5;'
        };
        store.dispatch(metafileAdded(file));
        const updated = await store.dispatch(updateFilebasedMetafile(file)).unwrap();
        expect(updated).toStrictEqual(
            expect.objectContaining({ content: 'var rand = Math.floor(Math.random() * 8) + 2;' })
        );
    });

    it('updateVersionedMetafile updates version information to filebased metafile', async () => {
        jest.spyOn(gitStatus, 'fileStatus').mockResolvedValue('unmodified');
        jest.spyOn(gitBranch, 'listBranch').mockResolvedValue([{ ref: 'test' }]); // mock for current branch name
        jest.spyOn(gitStatus, 'worktreeStatus').mockResolvedValueOnce({ // mock for git-status of current branch
            ref: 'test',
            root: 'foo/',
            status: 'clean',
            bare: false,
            entries: []
        });
        const repo: Repository = {
            id: 'c5739e69-9979-41fe-8605-5bb5ff341027',
            name: 'foo/myRepo',
            root: 'foo/',
            corsProxy: 'http://www.oregonstate.edu',
            url: 'https://github.com/foo/myRepo',
            default: 'master',
            local: ['9ae32e4a-10f2-4f7b-93d6-39ccb466c504'],
            remote: [],
            oauth: 'github',
            username: 'sampleUser',
            password: '12345',
            token: '584n29dkj1683a67f302x009q164'
        };
        const branch: Branch = {
            id: '9ae32e4a-10f2-4f7b-93d6-39ccb466c504',
            ref: 'test',
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
        const metafile: FilebasedMetafile = {
            id: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
            name: 'example.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'foo/example.js',
            state: 'modified',
            content: 'var id = 300 * Math.floor(Math.random() * 10) - 5;',
            repo: 'c5739e69-9979-41fe-8605-5bb5ff341027',
            branch: '9ae32e4a-10f2-4f7b-93d6-39ccb466c504',
            status: 'modified',
            conflicts: []
        };
        store.dispatch(metafileAdded(metafile));
        store.dispatch(repoAdded(repo));
        store.dispatch(branchAdded(branch));
        const updated = await store.dispatch(updateVersionedMetafile(metafile)).unwrap();
        expect(updated).toStrictEqual(
            expect.objectContaining({
                repo: 'c5739e69-9979-41fe-8605-5bb5ff341027',
                branch: '9ae32e4a-10f2-4f7b-93d6-39ccb466c504',
                status: 'unmodified',
                conflicts: []
            })
        );
    });

    it('updateVersionedMetafile adds version information to filebased metafile', async () => {
        jest.spyOn(gitStatus, 'fileStatus').mockResolvedValue('unmodified');
        jest.spyOn(gitStatus, 'worktreeStatus').mockResolvedValueOnce({ // mock for git-status of current branch
            ref: 'test',
            root: 'foo/',
            status: 'clean',
            bare: false,
            entries: []
        });
        jest.spyOn(gitBranch, 'listBranch').mockResolvedValue([{ ref: 'test' }]); // mock for current branch name
        const repo: Repository = {
            id: 'c5739e69-9979-41fe-8605-5bb5ff341027',
            name: 'foo/myRepo',
            root: 'foo/',
            corsProxy: 'http://www.oregonstate.edu',
            url: 'https://github.com/foo/myRepo',
            default: 'master',
            local: ['9ae32e4a-10f2-4f7b-93d6-39ccb466c504'],
            remote: [],
            oauth: 'github',
            username: 'sampleUser',
            password: '12345',
            token: '584n29dkj1683a67f302x009q164'
        };
        const branch: Branch = {
            id: '9ae32e4a-10f2-4f7b-93d6-39ccb466c504',
            ref: 'test',
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
        const metafile: FilebasedMetafile = {
            id: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
            name: 'example.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'foo/example.js',
            state: 'unmodified',
            content: 'var id = 300 * Math.floor(Math.random() * 10) - 15;'
        };
        store.dispatch(metafileAdded(metafile));
        store.dispatch(repoAdded(repo));
        store.dispatch(branchAdded(branch));
        const updated = await store.dispatch(updateVersionedMetafile(metafile)).unwrap();
        expect(updated).toStrictEqual(
            expect.objectContaining({
                repo: 'c5739e69-9979-41fe-8605-5bb5ff341027',
                branch: '9ae32e4a-10f2-4f7b-93d6-39ccb466c504',
                status: 'unmodified',
                conflicts: []
            })
        );
    });

    it('fetchParentMetafile resolves existing DirectoryMetafile for parent directory', async () => {
        const directory: DirectoryMetafile = {
            id: 'b5ee58cf-fe0b-41ce-8f42-a70f0f9d776e',
            name: 'foo',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Explorer',
            filetype: 'Directory',
            flags: [],
            path: 'foo/',
            state: 'unmodified',
            mtime: DateTime.fromISO('2021-01-01T07:13:04.276-08:00').valueOf(),
            contains: ['a5d4d43d-9bbd-4d08-ac7e-bcde32428c94']
        };
        const metafile: FilebasedMetafile = {
            id: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
            name: 'example.js',
            modified: DateTime.fromISO('2020-01-29T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            flags: [],
            path: 'foo/example.js',
            state: 'unmodified',
            content: 'var id = 300 * Math.floor(Math.random() * 10) - 15;'
        };
        store.dispatch(metafileAdded(metafile));
        store.dispatch(metafileAdded(directory));
        const parent = await store.dispatch(fetchParentMetafile(metafile)).unwrap();
        expect(parent).toBe(directory);
    });

});