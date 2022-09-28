import * as worktree from './git-worktree';

describe('containers/git/git-worktree', () => {
    it('processWorktreeOutput handles bare worktree', () => {
        return expect(worktree.processWorktreeOutput('/path/to/bare-source            (bare)')).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: '', bare: true, scope: 'local', root: '/path/to/bare-source' })
            ])
        );
    })

    it('processWorktreeOutput handles bare worktree (porcelain)', () => {
        return expect(worktree.processWorktreeOutput(`worktree /path/to/bare-source\nbare`, true)).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: '', bare: true, scope: 'local', root: '/path/to/bare-source' })
            ])
        );
    })

    it('processWorktreeOutput handles linked worktree', () => {
        return expect(worktree.processWorktreeOutput('/path/to/linked-worktree              abcd1234 [master]')).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: 'master', scope: 'local', root: '/path/to/linked-worktree', head: 'abcd1234' })
            ])
        );
    })

    it('processWorktreeOutput handles linked worktree (porcelain)', () => {
        return expect(worktree.processWorktreeOutput(`worktree /path/to/linked-worktree\nHEAD abcd1234abcd1234abcd1234abcd1234abcd1234\nbranch refs/heads/master`, true)).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: 'master', bare: false, scope: 'local', root: '/path/to/linked-worktree', head: 'abcd1234abcd1234abcd1234abcd1234abcd1234' })
            ])
        );
    })

    it('processWorktreeOutput handles locked worktree with no reason', () => {
        return expect(worktree.processWorktreeOutput('/path/to/locked-worktree-no-reason    abcd5678 (detached HEAD) locked')).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: 'detached', bare: false, scope: 'local', root: '/path/to/locked-worktree-no-reason', head: 'abcd5678' })
            ])
        );
    })

    it('processWorktreeOutput handles prunable worktree with no reason', () => {
        return expect(worktree.processWorktreeOutput('/path/to/prunable-worktree-no-reason  98765dcb (detached HEAD) prunable')).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: 'detached', bare: false, scope: 'local', root: '/path/to/prunable-worktree-no-reason', head: '98765dcb' })
            ])
        );
    })

    it('processWorktreeOutput handles locked worktree with reason', () => {
        return expect(worktree.processWorktreeOutput(`/path/to/locked-worktree-with-reason  1234abcd (brancha)
        locked: worktree path is mounted on a portable device`)).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: 'brancha', scope: 'local', root: '/path/to/locked-worktree-with-reason', head: '1234abcd' })
            ])
        );
    })

    it('processWorktreeOutput handles prunable worktree with reason', () => {
        return expect(worktree.processWorktreeOutput(`/path/to/prunable-worktree            5678abc1 (detached HEAD)
        prunable: gitdir file points to non-existent location`)).toStrictEqual(
            expect.arrayContaining([
                expect.objectContaining({ ref: 'detached', bare: false, scope: 'local', root: '/path/to/prunable-worktree', head: '5678abc1' })
            ])
        );
    })
});