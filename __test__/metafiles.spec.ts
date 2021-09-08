import * as isogit from 'isomorphic-git';
import type { MockInstance } from './__mocks__/mock-fs-promise';
import { mockStore } from './__mocks__/reduxStoreMock';
import { mock, file } from './__mocks__/mock-fs-promise';
import { testStore } from './__fixtures__/ReduxStore';
import { importFiletypes } from '../src/containers/handlers';
import * as git from '../src/containers/git-porcelain';
import * as metafiles from '../src/containers/metafiles';

describe('containers/metafiles', () => {
    let mockedInstance: MockInstance;
    const store = mockStore(testStore);

    beforeAll(async () => {
        const instance = await mock({
            'foo': {
                'bar.js': file({ content: 'file contents', mtime: new Date(1) }),
                'example.ts': file({ content: 'file contents', mtime: new Date(1) })
            }
        }, {
            config: {
                'user.name': 'john.doe',
                'user.email': 'john.doe@example.com'
            },
            url: 'https://github.com/EPICLab/synectic',
            default: 'main',
            branches: [{
                name: 'main',
                base: 'main',
                ahead: [{
                    oid: '584n29dkj1683a67f302x009q164',
                    message: 'first commit',
                    author: {
                        name: 'John Doe',
                        email: 'jdoe@example.com'
                    },
                    committer: {
                        name: 'John Doe',
                        email: 'jdoe@example.com'
                    },
                    files: 'all'
                }],
                behind: 0
            }]
        });
        return mockedInstance = instance;
    });

    afterEach(() => {
        store.clearActions();
        jest.clearAllMocks();
    });

    afterAll(() => mockedInstance.reset);

    it('updateFileStats resolves filetype and handler on existing file', async () => {
        await store.dispatch(importFiletypes());
        await store.dispatch(metafiles.updateFileStats('46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        filetype: 'Typescript',
                        handler: 'Editor'
                    })
                })
            ]));
    });

    it('updateFileStats resolves filetype and handler on existing directory', async () => {
        await store.dispatch(importFiletypes());
        return store.dispatch(metafiles.updateFileStats('28'))
            .then(() => expect(store.getActions()).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        type: 'metafiles/metafileUpdated',
                        payload: expect.objectContaining({
                            filetype: 'Directory',
                            handler: 'Explorer'
                        })
                    })
                ])
            ));
    });

    it('updateFileStats rejects on UUID with no match in the Redux store', async () => {
        await store.dispatch(metafiles.updateFileStats('9'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/updateFileStats/rejected'
                })
            ])
        );
    });

    it('updateFileStats rejects on virtual metafile', async () => {
        await store.dispatch(metafiles.updateFileStats('21'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/updateFileStats/rejected'
                })
            ])
        );
    });

    it('updateGitInfo resolves repo, branch, and status on existing file', async () => {
        jest.spyOn(isogit, 'getConfigAll').mockResolvedValue(new Promise((resolve) => resolve(['git@github.com:sampleUser/myRepo.git'])));
        await store.dispatch(metafiles.updateGitInfo('46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
                        name: 'example.ts',
                        path: 'foo/example.ts',
                        repo: '23',
                        branch: 'main',
                        status: 'unmodified'
                    })
                })
            ])
        );
    });

    it('updateGitInfo rejects on UUID with no match in the Redux store', async () => {
        await store.dispatch(metafiles.updateGitInfo('9'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/updateGitInfo/rejected'
                })
            ])
        );
    });

    it('updateGitInfo rejects on virtual metafile', async () => {
        await store.dispatch(metafiles.updateGitInfo('21'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/updateGitInfo/rejected'
                })
            ])
        );
    });

    it('updateContents resolves UTF-8 content for existing file', async () => {
        await store.dispatch(metafiles.updateContents('88e2gd50-3a5q-6401-b5b3-203c6710e35c'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
                        name: 'bar.js',
                        path: 'foo/bar.js',
                        content: 'file contents'
                    })
                })
            ])
        );
    });

    it('updateContents resolves contains list for existing directory', async () => {
        await store.dispatch(metafiles.updateContents('28'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        id: '28',
                        name: 'foo',
                        path: 'foo',
                        filetype: 'Directory',
                        contains: expect.arrayContaining(['foo/bar.js', 'foo/example.ts'])
                    })
                })
            ])
        );
    });

    it('updateContents rejects on UUID with no match in the Redux store', async () => {
        await store.dispatch(metafiles.updateContents('9'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/updateContents/rejected'
                })
            ])
        );
    });

    it('updateContents rejects on virtual metafile', async () => {
        await store.dispatch(metafiles.updateContents('h8114d71-b100-fg9a-0c1d3516d991'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/updateContents/rejected'
                })
            ])
        );
    });

    it('getMetafile by UUID resolves to updated metafile for existing file', async () => {
        await store.dispatch(metafiles.getMetafile({ id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c' }));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
                        name: 'bar.js',
                        path: 'foo/bar.js',
                        filetype: 'JavaScript',
                        handler: 'Editor'
                    })
                }),
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
                        name: 'bar.js',
                        path: 'foo/bar.js',
                        repo: '23',
                        branch: 'main',
                        status: 'unmodified'
                    })
                }),
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
                        name: 'bar.js',
                        path: 'foo/bar.js',
                        content: 'file contents',
                        state: 'unmodified'
                    })
                })
            ])
        );
    });

    it('getMetafile by filepath resolves to updated metafile for existing file', async () => {
        jest.spyOn(git, 'currentBranch').mockResolvedValueOnce(undefined);
        await store.dispatch(metafiles.getMetafile({ filepath: 'foo/bar.js' }));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
                        name: 'bar.js',
                        path: 'foo/bar.js',
                        filetype: 'JavaScript',
                        handler: 'Editor'
                    })
                }),
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
                        name: 'bar.js',
                        path: 'foo/bar.js',
                        repo: '23',
                        branch: 'main',
                        status: 'unmodified'
                    })
                }),
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
                        name: 'bar.js',
                        path: 'foo/bar.js',
                        content: 'file contents'
                    })
                })
            ])
        );
    });

    it('getMetafile by virtual resolves to metafile for existing name and handler', async () => {
        const metafile = await store.dispatch(metafiles.getMetafile({ virtual: { name: 'virtual.js', handler: 'Editor' } })).unwrap();
        expect(store.getActions()).toHaveLength(4);
        expect(metafile).toBeDefined();
    });

    it('getMetafile by virtual adds a metafile for non-existing name and handler', async () => {
        await store.dispatch(metafiles.getMetafile({ virtual: { name: 'virtual.js', handler: 'Browser' } }));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/metafileAdded',
                    payload: expect.objectContaining({
                        name: 'virtual.js',
                        handler: 'Browser'
                    })
                })
            ])
        );
    });

    it('getMetafile rejects on UUID with no match in the Redux store', async () => {
        await expect(store.dispatch(metafiles.getMetafile({ id: '9' })).unwrap()).resolves.toBeUndefined();
    });
});