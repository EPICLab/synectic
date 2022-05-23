import { file, mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { emptyStore } from '../../test-utils/empty-store';
import { Filetype, filetypeAdded } from '../slices/filetypes';
import { createMetafile, fetchParentMetafile, isHydrated, updatedVersionedMetafile, updateFilebasedMetafile } from './metafiles';
import { DirectoryMetafile, FilebasedMetafile, FileMetafile, metafileAdded, MetafileTemplate } from '../slices/metafiles';
import { DateTime, Settings } from 'luxon';
import isUUID from 'validator/lib/isUUID';
import * as gitPorcelain from '../../containers/git-porcelain';
import { repoAdded, Repository } from '../slices/repos';
import { Branch, branchAdded } from '../slices/branches';

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

describe('thunks/metafiles', () => {
    const store = mockStore(emptyStore);
    let mockedInstance: MockInstance;

    beforeEach(async () => {
        store.dispatch(filetypeAdded(mockedFiletype1));
        store.dispatch(filetypeAdded(mockedFiletype2));
        store.dispatch(filetypeAdded(mockedFiletype3));
        const instance = await mock({
            foo: {
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

    it('isHydrated returns true on hydrated DirectoryMetafile', () => {
        const hydratedDirectory: DirectoryMetafile = {
            id: 'b5ee58cf-fe0b-41ce-8f42-a70f0f9d776e',
            name: 'foo',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Explorer',
            filetype: 'Directory',
            loading: [],
            path: 'foo/',
            state: 'unmodified',
            contains: ['6e55a704-99dc-4768-add0-063f0b51609f']
        };
        expect(isHydrated(hydratedDirectory)).toBeTruthy();
    });

    it('isHydrated returns true on hydrated FileMetafile', () => {
        const hydratedFile: FileMetafile = {
            id: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
            name: 'example.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            loading: [],
            path: 'foo/example.js',
            state: 'unmodified',
            content: 'var id = 300 * Math.floor(Math.random() * 10) - 15;'
        };
        expect(isHydrated(hydratedFile)).toBeTruthy();
    });

    it('isHydrated returns false on unhydrated DirectoryMetafile', () => {
        const unhydratedDirectory: FilebasedMetafile = {
            id: 'b5ee58cf-fe0b-41ce-8f42-a70f0f9d776e',
            name: 'foo',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Explorer',
            loading: [],
            filetype: 'Directory',
            path: 'foo/',
            state: 'unmodified'
        };
        expect(isHydrated(unhydratedDirectory)).toBeFalsy();
    });

    it('isHydrated returns false on unhydrated FileMetafile', () => {
        const unhydratedFile: FilebasedMetafile = {
            id: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
            name: 'example.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            loading: [],
            path: 'foo/example.js',
            state: 'unmodified'
        };
        expect(isHydrated(unhydratedFile)).toBeFalsy();
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

    it('createMetafile resolves a supported metafile via metafile', async () => {
        const template: MetafileTemplate = {
            name: 'test.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            loading: [],
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
            loading: [],
            path: 'bar/sample.js',
            state: 'unmodified'
        };
        const file2: FilebasedMetafile = {
            id: '7d2a0568-ad1b-4402-839b-593db00c445a',
            name: 'second.js',
            modified: DateTime.fromISO('2022-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            loading: [],
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
            loading: [],
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
            loading: [],
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
        jest.spyOn(gitPorcelain, 'getStatus').mockResolvedValue('unmodified');
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
            root: 'foo/',
            gitdir: 'foo/.git',
            scope: 'local',
            remote: 'origin',
            commits: [],
            head: '987654321'
        };
        const metafile: FilebasedMetafile = {
            id: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
            name: 'example.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            loading: [],
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
        const updated = await store.dispatch(updatedVersionedMetafile(metafile)).unwrap();
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
        jest.spyOn(gitPorcelain, 'getStatus').mockResolvedValue('unmodified');
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
            root: 'foo/',
            gitdir: 'foo/.git',
            scope: 'local',
            remote: 'origin',
            commits: [],
            head: '987654321'
        };
        const metafile: FilebasedMetafile = {
            id: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
            name: 'example.js',
            modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            loading: [],
            path: 'foo/example.js',
            state: 'unmodified',
            content: 'var id = 300 * Math.floor(Math.random() * 10) - 15;'
        };
        store.dispatch(metafileAdded(metafile));
        store.dispatch(repoAdded(repo));
        store.dispatch(branchAdded(branch));
        const updated = await store.dispatch(updatedVersionedMetafile(metafile)).unwrap();
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
            loading: [],
            path: 'foo/',
            state: 'unmodified',
            contains: ['a5d4d43d-9bbd-4d08-ac7e-bcde32428c94']
        };
        const metafile: FilebasedMetafile = {
            id: 'a5d4d43d-9bbd-4d08-ac7e-bcde32428c94',
            name: 'example.js',
            modified: DateTime.fromISO('2020-01-29T07:44:15.276-08:00').valueOf(),
            handler: 'Editor',
            filetype: 'JavaScript',
            loading: [],
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