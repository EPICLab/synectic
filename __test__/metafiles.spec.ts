// import { DateTime } from 'luxon';
// import { normalize } from 'path';
import { mockStore } from './__mocks__/reduxStoreMock';
import * as metafiles from '../src/containers/metafiles';
import type { MockInstance } from './__mocks__/mock-fs-promise';
import { mock, file } from './__mocks__/mock-fs-promise';
// import * as git from '../src/containers/git-porcelain';
// import * as isogit from 'isomorphic-git';
import { testStore } from './__fixtures__/ReduxStore';

describe('containers/metafiles', () => {
    let mockedInstance: MockInstance;
    const store = mockStore(testStore);

    // const store = mockStore({
    //     filetypes: {
    //         ids: ['91', '101'],
    //         entities: {
    //             91: {
    //                 id: '91',
    //                 filetype: 'JavaScript',
    //                 handler: 'Editor',
    //                 extensions: ['js', 'jsm']
    //             },
    //             101: {
    //                 id: '101',
    //                 filetype: 'Directory',
    //                 handler: 'Explorer',
    //                 extensions: []
    //             }
    //         }
    //     },
    //     metafiles: {
    //         ids: ['28', '3', '21', '33'],
    //         entities: {
    //             28: {
    //                 id: '28',
    //                 name: 'foo',
    //                 path: 'sampleUser/myRepo/foo',
    //                 modified: DateTime.fromISO('2019-04-14T20:05:14.543-08:00').valueOf()
    //             },
    //             3: {
    //                 id: '3',
    //                 name: 'bar.js',
    //                 path: 'sampleUser/myRepo/foo/bar.js',
    //                 modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00').valueOf()
    //             },
    //             21: {
    //                 id: '21',
    //                 name: 'virtual.js',
    //                 modified: DateTime.fromISO('2020-06-25T04:19:55.309-08:00').valueOf(),
    //                 handler: 'Editor'
    //             },
    //             33: {
    //                 id: '33',
    //                 name: '.git',
    //                 path: 'sampleUser/myRepo/.git',
    //                 modified: DateTime.fromISO('2019-04-14T20:05:14.543-08:00').valueOf(),
    //                 filetype: 'Directory',
    //                 handler: 'Explorer'
    //             }
    //         }
    //     },
    //     stacks: {
    //         ids: [],
    //         entities: {}
    //     },
    //     cards: {
    //         ids: [],
    //         entities: {}
    //     },
    //     repos: {
    //         ids: ['392d34w31'],
    //         entities: {
    //             '392d34w31': {
    //                 id: '392d34w31',
    //                 name: 'sampleUser/myRepo',
    //                 root: 'sampleUser/',
    //                 corsProxy: 'http://www.oregonstate.edu',
    //                 url: 'https://github.com/sampleUser/myRepo.git',
    //                 local: ['master', 'sample', 'test'],
    //                 remote: [],
    //                 oauth: 'github',
    //                 username: 'sampleUser',
    //                 password: '12345',
    //                 token: '584n29dkj1683a67f302x009q164'

    //             }
    //         }
    //     },
    //     modals: {
    //         ids: [],
    //         entities: {}
    //     }
    // });

    beforeAll(async () => {
        const instance = await mock({
            'sampleUser/myRepo': {
                '.git': {
                    'config': {}
                },
                'foo': {
                    'bar.js': file({ content: 'file contents', mtime: new Date(1) }),
                    'example.ts': file({ content: 'file contents', mtime: new Date(1) })
                }
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset);
    afterEach(() => {
        store.clearActions();
        jest.clearAllMocks();
    });

    it('updateFileStats resolves filetype and handler on existing file', async () => {
        await store.dispatch(metafiles.updateFileStats('46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71'));
        console.log(JSON.stringify(store.getActions(), undefined, 2));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'metafiles/metafileUpdated',
                    payload: expect.objectContaining({
                        filetype: 'TypeScript',
                        handler: 'Editor'
                    })
                })
            ]));
    });

    // it('updateFileStats resolves filetype and handler on existing directory', async () => {
    //     await store.dispatch(metafiles.updateFileStats('28'));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/metafileUpdated',
    //                 payload: expect.objectContaining({
    //                     filetype: 'Directory',
    //                     handler: 'Explorer'
    //                 })
    //             })
    //         ])
    //     );
    // });

    // it('updateFileStats rejects on UUID with no match in the Redux store', async () => {
    //     await store.dispatch(metafiles.updateFileStats('9'));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/updateFileStats/rejected'
    //             })
    //         ])
    //     );
    // });

    // it('updateFileStats rejects on virtual metafile', async () => {
    //     await store.dispatch(metafiles.updateFileStats('21'));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/updateFileStats/rejected'
    //             })
    //         ])
    //     );
    // });

    // it('updateGitInfo resolves repo, branch, and status on existing file', async () => {
    //     jest.spyOn(git, 'getStatus').mockResolvedValue('unmodified');
    //     jest.spyOn(git, 'currentBranch').mockResolvedValue('master');
    //     jest.spyOn(isogit, 'getConfigAll').mockResolvedValue(new Promise((resolve) => resolve(['git@github.com:sampleUser/myRepo.git'])));
    //     await store.dispatch(metafiles.updateGitInfo('3'));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/metafileUpdated',
    //                 payload: expect.objectContaining({
    //                     id: '3',
    //                     name: 'bar.js',
    //                     path: 'sampleUser/myRepo/foo/bar.js',
    //                     repo: '392d34w31',
    //                     branch: 'master',
    //                     status: 'unmodified'
    //                 })
    //             })
    //         ])
    //     );
    // });

    // it('updateGitInfo rejects on UUID with no match in the Redux store', async () => {
    //     await store.dispatch(metafiles.updateGitInfo('9'));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/updateGitInfo/rejected'
    //             })
    //         ])
    //     );
    // });

    // it('updateGitInfo rejects on virtual metafile', async () => {
    //     await store.dispatch(metafiles.updateGitInfo('21'));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/updateGitInfo/rejected'
    //             })
    //         ])
    //     );
    // });

    // it('updateContents resolves UTF-8 content for existing file', async () => {
    //     await store.dispatch(metafiles.updateContents('3'));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/metafileUpdated',
    //                 payload: expect.objectContaining({
    //                     id: '3',
    //                     name: 'bar.js',
    //                     path: 'sampleUser/myRepo/foo/bar.js',
    //                     content: 'file contents'
    //                 })
    //             })
    //         ])
    //     );
    // });

    // it('updateContents resolves contains list for existing directory', async () => {
    //     await store.dispatch(metafiles.updateContents('33'));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/metafileUpdated',
    //                 payload: expect.objectContaining({
    //                     id: '33',
    //                     name: '.git',
    //                     path: 'sampleUser/myRepo/.git',
    //                     filetype: 'Directory',
    //                     handler: 'Explorer',
    //                     contains: expect.arrayContaining([normalize('sampleUser/myRepo/.git/config')])
    //                 })
    //             })
    //         ])
    //     );
    // });

    // it('updateContents rejects on UUID with no match in the Redux store', async () => {
    //     await store.dispatch(metafiles.updateContents('9'));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/updateContents/rejected'
    //             })
    //         ])
    //     );
    // });

    // it('updateContents rejects on virtual metafile', async () => {
    //     await store.dispatch(metafiles.updateContents('21'));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/updateContents/rejected'
    //             })
    //         ])
    //     );
    // });

    // it('getMetafile by UUID resolves to updated metafile for existing file', async () => {
    //     await store.dispatch(metafiles.getMetafile({ id: '3' }));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/metafileUpdated',
    //                 payload: expect.objectContaining({
    //                     id: '3',
    //                     name: 'bar.js',
    //                     path: 'sampleUser/myRepo/foo/bar.js',
    //                     filetype: 'JavaScript',
    //                     handler: 'Editor'
    //                 })
    //             }),
    //             expect.objectContaining({
    //                 type: 'metafiles/metafileUpdated',
    //                 payload: expect.objectContaining({
    //                     id: '3',
    //                     name: 'bar.js',
    //                     path: 'sampleUser/myRepo/foo/bar.js',
    //                     repo: '392d34w31',
    //                     branch: 'master',
    //                     status: 'unmodified'
    //                 })
    //             }),
    //             expect.objectContaining({
    //                 type: 'metafiles/metafileUpdated',
    //                 payload: expect.objectContaining({
    //                     id: '3',
    //                     name: 'bar.js',
    //                     path: 'sampleUser/myRepo/foo/bar.js',
    //                     content: 'file contents',
    //                     state: 'unmodified'
    //                 })
    //             })
    //         ])
    //     );
    // });

    // it('getMetafile by filepath resolves to updated metafile for existing file', async () => {
    //     jest.spyOn(git, 'currentBranch').mockResolvedValueOnce(undefined);
    //     await store.dispatch(metafiles.getMetafile({ filepath: 'sampleUser/myRepo/foo/bar.js' }));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/metafileUpdated',
    //                 payload: expect.objectContaining({
    //                     id: '3',
    //                     name: 'bar.js',
    //                     path: 'sampleUser/myRepo/foo/bar.js',
    //                     filetype: 'JavaScript',
    //                     handler: 'Editor'
    //                 })
    //             }),
    //             expect.objectContaining({
    //                 type: 'metafiles/metafileUpdated',
    //                 payload: expect.objectContaining({
    //                     id: '3',
    //                     name: 'bar.js',
    //                     path: 'sampleUser/myRepo/foo/bar.js',
    //                     repo: '392d34w31',
    //                     branch: 'master',
    //                     status: 'unmodified'
    //                 })
    //             }),
    //             expect.objectContaining({
    //                 type: 'metafiles/metafileUpdated',
    //                 payload: expect.objectContaining({
    //                     id: '3',
    //                     name: 'bar.js',
    //                     path: 'sampleUser/myRepo/foo/bar.js',
    //                     content: 'file contents'
    //                 })
    //             })
    //         ])
    //     );
    // });

    // it('getMetafile by virtual resolves to metafile for existing name and handler', async () => {
    //     const metafile = await store.dispatch(metafiles.getMetafile({ virtual: { name: 'virtual.js', handler: 'Editor' } })).unwrap();
    //     expect(store.getActions()).toHaveLength(4);
    //     expect(metafile).toBeDefined();
    // });

    // it('getMetafile by virtual adds a metafile for non-existing name and handler', async () => {
    //     await store.dispatch(metafiles.getMetafile({ virtual: { name: 'virtual.js', handler: 'Browser' } }));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/getMetafile/rejected'
    //             })
    //         ])
    //     );
    // });

    // it('getMetafile rejects on UUID with no match in the Redux store', async () => {
    //     await store.dispatch(metafiles.getMetafile({ id: '9' }));
    //     expect(store.getActions()).toEqual(
    //         expect.arrayContaining([
    //             expect.objectContaining({
    //                 type: 'metafiles/getMetafile/rejected'
    //             })
    //         ])
    //     );
    // });
});