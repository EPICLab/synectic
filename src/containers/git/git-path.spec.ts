import path from 'path';
import * as isogit from 'isomorphic-git';
import { mock, MockInstance } from '../../test-utils/mock-fs';
import { getBranchRoot, getRoot, getWorktreePaths } from './git-path';

describe('containers/git-path', () => {
    let mockedInstance: MockInstance;
    beforeAll(async () => {
        const instance = await mock({
            '.syn': {
                'bad-branch': {
                    '.git': `gitdir: ${path.normalize('foo/.git/worktrees/bad-branch')}`,
                    'delta.txt': 'file contents'
                }
            },
            foo: {
                'add.ts': 'content',
                '.git': {
                    worktrees: {
                        'bad-branch': {
                            gitdir: `${path.normalize('.syn/bad-branch/.git')}`
                        }
                    }
                }
            },
            bar: {
                'beta.ts': 'content',
                '.git': { /* empty directory */ }
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => mockedInstance.reset());

    it('getRoot resolves to Git root directory on file in tracked directory', async () => {
        expect.assertions(1);
        await expect(getRoot('foo/add.ts')).resolves.toBe('foo');
    });

    it('getRoot resolves to Git root directory on untracked file in tracked directory', async () => {
        expect.assertions(1);
        await mockedInstance.addItem('foo/haze/test.js', 'content');
        await expect(getRoot('foo/haze/test.js')).resolves.toBe('foo');
    });

    it('getBranchRoot resolves root path for main worktree from `dir` path', async () => {
        expect.assertions(1);
        const mockedBranches = new Promise<string[]>(resolve => resolve(['bad-branch', 'main']));
        jest.spyOn(isogit, 'listBranches').mockReturnValue(mockedBranches);
        await expect(getBranchRoot('foo', 'main')).resolves.toEqual('foo');
    });

    it('getBranchRoot resolves root path for main worktree from `worktreeDir` path', async () => {
        expect.assertions(1);
        const mockedBranches = new Promise<string[]>(resolve => resolve(['bad-branch', 'main']));
        jest.spyOn(isogit, 'listBranches').mockReturnValue(mockedBranches);
        await expect(getBranchRoot('.syn/bad-branch', 'main')).resolves.toEqual('foo');
    });

    it('getBranchRoot resolves root path for linked worktree from `dir` path', async () => {
        expect.assertions(1);
        const mockedBranches = new Promise<string[]>(resolve => resolve(['bad-branch', 'main']));
        jest.spyOn(isogit, 'listBranches').mockReturnValue(mockedBranches);
        await expect(getBranchRoot('foo', 'bad-branch')).resolves.toEqual(path.normalize('.syn/bad-branch'));
    });

    it('getBranchRoot resolves root path for linked worktree from `worktreeDir` path', async () => {
        expect.assertions(1);
        const mockedBranches = new Promise<string[]>(resolve => resolve(['bad-branch', 'main']));
        jest.spyOn(isogit, 'listBranches').mockReturnValue(mockedBranches);
        await expect(getBranchRoot('.syn/bad-branch', 'bad-branch')).resolves.toEqual(path.normalize('.syn/bad-branch'));
    });

    it('getWorktreePaths resolves path to main worktree file', async () => {
        expect.assertions(1);
        await expect(getWorktreePaths('foo/add.ts')).resolves.toEqual(
            expect.objectContaining({
                dir: 'foo',
                gitdir: path.normalize('foo/.git'),
                worktrees: path.normalize('foo/.git/worktrees'),
                worktreeDir: undefined,
                worktreeGitdir: undefined,
                worktreeLink: undefined
            })
        );
    });

    it('getWorktreePaths resolves path in repo without linked worktrees', async () => {
        expect.assertions(1);
        await expect(getWorktreePaths('bar/beta.ts')).resolves.toEqual(
            expect.objectContaining({
                dir: 'bar',
                gitdir: path.normalize('bar/.git'),
                worktrees: undefined,
                worktreeDir: undefined,
                worktreeGitdir: undefined,
                worktreeLink: undefined
            })
        );
    });

    it('getWorktreePaths resolves path to linked worktree file', async () => {
        expect.assertions(1);
        await expect(getWorktreePaths('.syn/bad-branch/delta.txt')).resolves.toEqual(
            expect.objectContaining({
                dir: 'foo',
                gitdir: path.normalize('foo/.git'),
                worktrees: path.normalize('foo/.git/worktrees'),
                worktreeDir: path.normalize('.syn/bad-branch'),
                worktreeGitdir: path.normalize('.syn/bad-branch/.git'),
                worktreeLink: path.normalize('foo/.git/worktrees/bad-branch')
            })
        );
    });

    it('getWorktreePaths resolves path in the GIT_DIR/worktrees directory', async () => {
        expect.assertions(1);
        await expect(getWorktreePaths('foo/.git/worktrees/bad-branch')).resolves.toEqual(
            expect.objectContaining({
                dir: 'foo',
                gitdir: path.normalize('foo/.git'),
                worktrees: path.normalize('foo/.git/worktrees'),
                worktreeDir: path.normalize('.syn/bad-branch'),
                worktreeGitdir: path.normalize('.syn/bad-branch/.git'),
                worktreeLink: path.normalize('foo/.git/worktrees/bad-branch')
            })
        );
    });
})