// import parsePath from 'parse-path';
// import { v4 } from 'uuid';
// import { DateTime } from 'luxon';
import * as isogit from 'isomorphic-git';

import { mockStore } from './__mocks__/reduxStoreMock';
import * as repos from '../src/containers/repos';
import * as git from '../src/containers/git-porcelain';
import * as worktree from '../src/containers/git-worktree';
// import * as metafiles from '../src/containers/metafiles';
import * as io from '../src/containers/io';
import { testStore } from './__fixtures__/ReduxStore';
import { file, mock, MockInstance } from './__mocks__/mock-fs-promise';

describe('containers/repos', () => {
    let mockedInstance: MockInstance;

    const store = mockStore(testStore);

    beforeAll(async () => {
        const instance = await mock({
            'sampleUser/myRepo': {
                '.git': {
                    'config': {}
                },
                'foo/bar.js': file({ content: 'file contents', mtime: new Date(1) }),
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset);
    afterEach(() => {
        store.clearActions();
        jest.clearAllMocks();
    });

    it('updateBranches resolves updates to local and remote branches for existing repo', async () => {
        const { local, remote } = { local: ['sample', 'master'], remote: ['sample', 'master', 'dev', 'bugfix'] };
        jest.spyOn(isogit, 'listBranches')
            .mockResolvedValue([])
            .mockResolvedValueOnce(local)
            .mockResolvedValueOnce(remote);

        await store.dispatch(repos.updateBranches('23'));
        return expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'repos/repoUpdated',
                    payload: expect.objectContaining({
                        id: '23',
                        local: expect.arrayContaining<string>(local),
                        remote: expect.arrayContaining<string>(remote)
                    })
                })
            ])
        );
    });

    it('updateBranches rejects on UUID with no match in the Redux store', async () => {
        await store.dispatch(repos.updateBranches('9'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'repos/updateBranches/rejected'
                })
            ])
        );
    });

    it('checkoutBranch resolves a new branch metafile and updates the existing card', async () => {
        jest.spyOn(isogit, 'checkout').mockResolvedValue();
        jest.spyOn(io, 'isDirectory').mockResolvedValue(true);
        jest.spyOn(git, 'currentBranch').mockResolvedValue('sample');
        jest.spyOn(worktree, 'resolveWorktree').mockResolvedValue({
            id: '293',
            path: 'foo',
            bare: false,
            detached: false,
            main: true,
            ref: 'master',
            rev: '23492g98239023fs324'
        });

        await store.dispatch(repos.checkoutBranch({
            cardId: 'f6b3f2a3-9145-4b59-a4a1-bf414214f30b',
            metafileId: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
            branch: 'sample'
        }));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'repos/checkoutBranch/fulfilled',
                    payload: expect.objectContaining({ id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71' }),
                    meta: expect.objectContaining({
                        arg: expect.objectContaining({
                            cardId: 'f6b3f2a3-9145-4b59-a4a1-bf414214f30b',
                            metafileId: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
                            branch: 'sample'
                        })
                    })
                })
            ])
        );
    });

    it('checkoutBranch rejects on card UUID with no match in the Redux store', async () => {
        await store.dispatch(repos.checkoutBranch({
            cardId: '41',
            metafileId: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
            branch: 'sample'
        }));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'repos/checkoutBranch/rejected'
                })
            ])
        );
    });

    it('checkoutBranch rejects on metafile UUID with no match in the Redux store', async () => {
        await store.dispatch(repos.checkoutBranch({
            cardId: 'f6b3f2a3-9145-4b59-a4a1-bf414214f30b',
            metafileId: '9',
            branch: 'sample'
        }));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'repos/checkoutBranch/rejected'
                })
            ])
        );
    });

    it('getRepository resolves to adding a repository when no repository exists', async () => {
        jest.spyOn(git, 'getRepoRoot').mockResolvedValue('foo/');
        jest.spyOn(isogit, 'getConfigAll').mockResolvedValue(['https://github.com/sampleUser/SecondRepo']);
        jest.spyOn(isogit, 'getConfig')
            .mockResolvedValue([])
            .mockResolvedValueOnce(['sampleUser'])
            .mockResolvedValueOnce(['12345']);

        await store.dispatch(repos.getRepository('foo/bar.js'));
        return expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'repos/repoAdded' })
            ])
        );
    });

    it('getRepository resolves to update branches on existing repository', async () => {
        jest.spyOn(git, 'getRepoRoot').mockResolvedValue('foo/');
        jest.spyOn(isogit, 'getConfigAll').mockResolvedValue(['https://github.com/sampleUser/myRepo']);
        jest.spyOn(io, 'isDirectory').mockResolvedValue(true);

        await store.dispatch(repos.getRepository('foo/bar.js'));
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'repos/repoUpdated',
                    payload: expect.objectContaining({
                        id: '23',
                        name: 'sampleUser/myRepo',
                        url: 'https://github.com/sampleUser/myRepo'
                    })
                })
            ])
        );
    });

    it('getRepository resolves to undefined on paths not under version control', async () => {
        jest.spyOn(git, 'getRepoRoot').mockResolvedValue(undefined);
        return expect(store.dispatch(repos.getRepository('foo/bar.js')).unwrap()).resolves.toBeUndefined();
    });
});
