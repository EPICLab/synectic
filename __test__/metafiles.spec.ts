// import parsePath from 'parse-path';
// import { normalize } from 'path';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
// import type { Repository } from '../src/types';
import { createMockStore } from './__mocks__/reduxStoreMock';
import * as metafiles from '../src/containers/metafiles';
// import * as repos from '../src/containers/repos';
import type { MockInstance } from './__mocks__/mock-fs-promise';
import { mock, file } from './__mocks__/mock-fs-promise';
// import * as git from '../src/containers/git-porcelain';

describe('containers/metafiles', () => {
    let mockedInstance: MockInstance;

    const store = createMockStore({
        canvas: {
            id: v4(),
            created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00').valueOf(),
            repos: [],
            cards: [],
            stacks: []
        },
        filetypes: {
            91: {
                id: '91',
                filetype: 'JavaScript',
                handler: 'Editor',
                extensions: ['js', 'jsm']
            },
            101: {
                id: '101',
                filetype: 'Directory',
                handler: 'Explorer',
                extensions: []
            }
        },
        metafiles: {
            28: {
                id: '28',
                name: 'foo',
                path: 'foo',
                modified: DateTime.fromISO('2019-04-14T20:05:14.543-08:00').valueOf()
            },
            3: {
                id: '3',
                name: 'bar.js',
                path: 'foo/bar.js',
                modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00').valueOf()
            },
            21: {
                id: '14',
                name: 'virtual.js',
                modified: DateTime.fromISO('2020-06-25T04:19:55.309-08:00').valueOf()
            }
        },
        stacks: {},
        cards: {},
        repos: {},
        modals: {}
    });

    beforeAll(async () => {
        const instance = await mock({
            'foo/bar.js': file({ content: 'file contents', mtime: new Date(1) })
        });
        return mockedInstance = instance;
    });
    afterEach(store.clearActions);
    afterAll(() => mockedInstance.reset);

    it('updateFileStats resolves filetype and handler on existing file', async () => {
        await store.dispatch(metafiles.updateFileStats('3'));
        expect(store.getActions()).toContainEqual(
            expect.objectContaining({
                type: 'metafiles/updateMetafile',
                metafile: expect.objectContaining({
                    filetype: 'JavaScript',
                    handler: 'Editor'
                })
            }));
    });

    // it('updateFileStats resolves filetype and handler on existing directory', async () => {
    //     await store.dispatch(metafiles.updateFileStats('28'));
    //     expect(store.getActions()).toEqual([
    //         expect.objectContaining({
    //             type: ActionKeys.UPDATE_METAFILE,
    //             metafile: expect.objectContaining({ filetype: 'Directory', handler: 'Explorer' })
    //         })
    //     ]);
    // });

    // it('updateFileStats resolves to error on UUID with no match in the Redux store', async () => {
    //     await store.dispatch(metafiles.updateFileStats('9'));
    //     expect(store.getActions()).toEqual([
    //         expect.objectContaining({
    //             type: ActionKeys.ADD_MODAL,
    //             modal: expect.objectContaining({ type: 'Error', subtype: 'MetafilesError' })
    //         })
    //     ]);
    // });

    // it('updateFileStats resolves to error on virtual metafile', async () => {
    //     await store.dispatch(metafiles.updateFileStats('21'));
    //     expect(store.getActions()).toEqual([
    //         expect.objectContaining({
    //             type: ActionKeys.ADD_MODAL,
    //             modal: expect.objectContaining({ type: 'Error', subtype: 'MetafilesError' })
    //         })
    //     ]);
    // });
});

// describe('metafiles.updateGitInfo', () => {
//     const store = mockStore({
//         canvas: {
//             id: v4(),
//             created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
//             repos: ['23'],
//             cards: [],
//             stacks: []
//         },
//         metafiles: {
//             3: {
//                 id: '3',
//                 name: 'bar.js',
//                 path: 'foo/bar.js',
//                 modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00'),
//                 branch: 'master'
//             },
//             21: {
//                 id: '21',
//                 name: 'virtual.js',
//                 modified: DateTime.fromISO('2020-06-25T04:19:55.309-08:00'),
//                 handler: 'Editor',
//                 content: ''
//             }
//         },
//         repos: {
//             23: {
//                 id: '23',
//                 name: 'sampleUser/myRepo',
//                 root: 'sampleUser/',
//                 corsProxy: new URL('http://www.oregonstate.edu'),
//                 url: parsePath('https://github.com/sampleUser/myRepo'),
//                 local: ['master', 'sample', 'test'],
//                 remote: [],
//                 oauth: 'github',
//                 username: 'sampleUser',
//                 password: '12345',
//                 token: '584n29dkj1683a67f302x009q164'
//             }
//         },
//         stacks: {},
//         cards: {},
//         filetypes: {},
//         modals: {}
//     });

//     afterEach(() => {
//         store.clearActions();
//         jest.clearAllMocks();
//     });
//     afterAll(mock.restore);

//     it('updateGitInfo resolves repo, branch, and status on existing file', async () => {
//         const repo: Repository = {
//             id: '23',
//             name: 'sampleUser/myRepo',
//             root: 'sampleUser/',
//             corsProxy: new URL('http://www.oregonstate.edu'),
//             url: parsePath('https://github.com/sampleUser/myRepo'),
//             local: ['master', 'sample', 'test'],
//             remote: [],
//             oauth: 'github',
//             username: 'sampleUser',
//             password: '12345',
//             token: '584n29dkj1683a67f302x009q164'
//         };
//         jest.spyOn(git, 'getStatus').mockResolvedValue('unmodified');
//         jest.spyOn(git, 'currentBranch').mockResolvedValue('master');
//         jest.spyOn(repos, 'getRepository').mockImplementation(() => () => { return new Promise((resolve) => resolve(repo)) });
//         await store.dispatch(metafiles.updateGitInfo('3'));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({
//                 type: ActionKeys.UPDATE_METAFILE,
//                 metafile: expect.objectContaining({
//                     id: '3',
//                     name: 'bar.js',
//                     path: 'foo/bar.js',
//                     repo: '23',
//                     branch: 'master',
//                     status: 'unmodified'
//                 })
//             })
//         ]);
//     });

//     it('updateGitInfo resolves to error on UUID with no match in the Redux store', async () => {
//         await store.dispatch(metafiles.updateGitInfo('9'));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({
//                 type: ActionKeys.ADD_MODAL,
//                 modal: expect.objectContaining({ type: 'Error', subtype: 'MetafilesError' })
//             })
//         ]);
//     });

//     it('updateGitInfo resolves to error on virtual metafile', async () => {
//         await store.dispatch(metafiles.updateGitInfo('21'));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({
//                 type: ActionKeys.ADD_MODAL,
//                 modal: expect.objectContaining({ type: 'Error', subtype: 'MetafilesError' })
//             })
//         ]);
//     });
// });

// describe('metafiles.updateContents', () => {
//     const store = mockStore({
//         canvas: {
//             id: v4(),
//             created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
//             repos: [],
//             cards: [],
//             stacks: []
//         },
//         filetypes: {
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
//         },
//         metafiles: {
//             28: {
//                 id: '28',
//                 name: 'foo',
//                 path: 'foo',
//                 modified: DateTime.fromISO('2019-04-14T20:05:14.543-08:00'),
//                 filetype: 'Directory'
//             },
//             3: {
//                 id: '3',
//                 name: 'bar.js',
//                 path: 'foo/bar.js',
//                 modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00')
//             },
//             21: {
//                 id: '14',
//                 name: 'virtual.js',
//                 modified: DateTime.fromISO('2020-06-25T04:19:55.309-08:00')
//             }
//         },
//         stacks: {},
//         cards: {},
//         repos: {},
//         modals: {}
//     });

//     beforeAll(() => {
//         mock({
//             'foo/bar.js': mock.file({ content: 'file contents', ctime: new Date(1), mtime: new Date(1) })
//         });
//     });
//     afterEach(store.clearActions);
//     afterAll(mock.restore);

//     it('updateContents resolves UTF-8 content for existing file', async () => {
//         await store.dispatch(metafiles.updateContents('3'));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({
//                 type: ActionKeys.UPDATE_METAFILE,
//                 metafile: expect.objectContaining({
//                     id: '3',
//                     name: 'bar.js',
//                     path: 'foo/bar.js',
//                     content: 'file contents'
//                 })
//             })
//         ]);
//     });

//     it('updateContents resolves contains list for existing directory', async () => {
//         await store.dispatch(metafiles.updateContents('28'));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({
//                 type: ActionKeys.UPDATE_METAFILE,
//                 metafile: expect.objectContaining({
//                     id: '28',
//                     name: 'foo',
//                     path: 'foo',
//                     contains: expect.arrayContaining([normalize('foo/bar.js')])
//                 })
//             })
//         ]);
//     });

//     it('updateContents resolves to error on UUID with no match in the Redux store', async () => {
//         await store.dispatch(metafiles.updateContents('9'));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({
//                 type: ActionKeys.ADD_MODAL,
//                 modal: expect.objectContaining({ type: 'Error', subtype: 'MetafilesError' })
//             })
//         ]);
//     });

//     it('updateContents rejects on virtual metafile', async () => {
//         await store.dispatch(metafiles.updateContents('21'));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({
//                 type: ActionKeys.ADD_MODAL,
//                 modal: expect.objectContaining({ type: 'Error', subtype: 'MetafilesError' })
//             })
//         ]);
//     });
// });

// describe('metafiles.getMetafile', () => {
//     const store = mockStore({
//         canvas: {
//             id: v4(),
//             created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
//             repos: [],
//             cards: [],
//             stacks: []
//         },
//         filetypes: {
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
//         },
//         metafiles: {
//             28: {
//                 id: '28',
//                 name: 'foo',
//                 path: 'foo',
//                 modified: DateTime.fromISO('2019-04-14T20:05:14.543-08:00')
//             },
//             3: {
//                 id: '3',
//                 name: 'bar.js',
//                 path: 'foo/bar.js',
//                 modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00')
//             },
//             21: {
//                 id: '21',
//                 name: 'virtual.js',
//                 handler: 'Editor',
//                 modified: DateTime.fromISO('2020-06-25T04:19:55.309-08:00')
//             }
//         },
//         repos: {
//             23: {
//                 id: '23',
//                 name: 'sampleUser/myRepo',
//                 root: 'sampleUser/',
//                 corsProxy: new URL('http://www.oregonstate.edu'),
//                 url: parsePath('https://github.com/sampleUser/myRepo'),
//                 local: ['master', 'sample', 'test'],
//                 remote: [],
//                 oauth: 'github',
//                 username: 'sampleUser',
//                 password: '12345',
//                 token: '584n29dkj1683a67f302x009q164'
//             }
//         },
//         stacks: {},
//         cards: {},
//         modals: {}
//     });

//     beforeAll(() => {
//         mock({
//             'foo/bar.js': mock.file({ content: 'file contents', ctime: new Date(1), mtime: new Date(1) })
//         });
//     });
//     afterEach(store.clearActions);
//     afterAll(mock.restore);

//     it('getMetafile by UUID resolves to updated metafile for existing file', async () => {
//         await store.dispatch(metafiles.getMetafile({ id: '3' }));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({
//                 type: ActionKeys.UPDATE_METAFILE,
//                 metafile: expect.objectContaining({
//                     id: '3',
//                     name: 'bar.js',
//                     path: 'foo/bar.js',
//                     filetype: 'JavaScript',
//                     handler: 'Editor'
//                 })
//             }),
//             expect.objectContaining({
//                 type: ActionKeys.UPDATE_METAFILE,
//                 metafile: expect.objectContaining({
//                     id: '3',
//                     name: 'bar.js',
//                     path: 'foo/bar.js',
//                     repo: '23',
//                     branch: 'master',
//                     status: 'unmodified'
//                 })
//             }),
//             expect.objectContaining({
//                 type: ActionKeys.UPDATE_METAFILE,
//                 metafile: expect.objectContaining({
//                     id: '3',
//                     name: 'bar.js',
//                     path: 'foo/bar.js',
//                     content: 'file contents'
//                 })
//             })
//         ]);
//     });

//     it('getMetafile by filepath resolves to updated metafile for existing file', async () => {
//         await store.dispatch(metafiles.getMetafile({ filepath: 'foo/bar.js' }));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({
//                 type: ActionKeys.UPDATE_METAFILE,
//                 metafile: expect.objectContaining({
//                     id: '3',
//                     name: 'bar.js',
//                     path: 'foo/bar.js',
//                     filetype: 'JavaScript',
//                     handler: 'Editor'
//                 })
//             }),
//             expect.objectContaining({
//                 type: ActionKeys.UPDATE_METAFILE,
//                 metafile: expect.objectContaining({
//                     id: '3',
//                     name: 'bar.js',
//                     path: 'foo/bar.js',
//                     repo: '23',
//                     branch: 'master',
//                     status: 'unmodified'
//                 })
//             }),
//             expect.objectContaining({
//                 type: ActionKeys.UPDATE_METAFILE,
//                 metafile: expect.objectContaining({
//                     id: '3',
//                     name: 'bar.js',
//                     path: 'foo/bar.js',
//                     content: 'file contents'
//                 })
//             })
//         ]);
//     });

//     it('getMetafile by virtual resolves to metafile for existing name and handler', async () => {
//         const metafile = await store.dispatch(metafiles.getMetafile({ virtual: { name: 'virtual.js', handler: 'Editor' } }));
//         expect(store.getActions()).toHaveLength(0);
//         expect(metafile).toBeDefined();
//     });

//     it('getMetafile by virtual adds a metafile for non-existing name and handler', async () => {
//         await store.dispatch(metafiles.getMetafile({ virtual: { name: 'virtual.js', handler: 'Browser' } }));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({ type: ActionKeys.ADD_METAFILE })
//         ]);
//     });

//     it('getMetafile resolves to MetafileMissingError on UUID with no match in the Redux store', async () => {
//         await store.dispatch(metafiles.getMetafile({ id: '9' }));
//         expect(store.getActions()).toEqual([
//             expect.objectContaining({
//                 type: ActionKeys.ADD_MODAL,
//                 modal: expect.objectContaining({ type: 'Error', subtype: 'MetafilesError' })
//             })
//         ]);
//     });

// });