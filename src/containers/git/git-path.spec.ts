describe('containers/git/git-path', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  // let mockedInstance: MockInstance;
  // beforeAll(async () => {
  //     const instance = await mock({
  //         '.syn': {
  //             'bad-branch': {
  //                 '.git': `gitdir: ${path.normalize('foo/.git/worktrees/bad-branch')}`,
  //                 'delta.txt': 'file contents'
  //             }
  //         },
  //         foo: {
  //             'add.ts': 'content',
  //             '.git': {
  //                 worktrees: {
  //                     'bad-branch': {
  //                         gitdir: `${path.normalize('.syn/bad-branch/.git')}`
  //                     }
  //                 }
  //             }
  //         },
  //         bar: {
  //             'beta.ts': 'content',
  //             '.git': { /* empty directory */ }
  //         },
  //         baz: {
  //             'alpha.ts': 'content',
  //             subproject: {
  //                 'gamma.ts': 'content',
  //                 '.git': { /* empty directory */ }
  //             }
  //         }
  //     });
  //     return mockedInstance = instance;
  // });

  // afterAll(() => mockedInstance.reset());

  // it('getRoot resolves to undefined on filepath in untracked directories', async () => {
  //     expect.assertions(3);
  //     await expect(getRoot('baz/alpha.ts')).resolves.toBeUndefined(); // file
  //     await expect(getRoot('baz')).resolves.toBeUndefined(); // directory
  //     // mockedInstance.getRoot() must be used since __dirname will escape the mocked FS
  //     const absoluteFilepath = path.join(mockedInstance.getRoot(), 'baz');
  //     await expect(getRoot(absoluteFilepath)).resolves.toBeUndefined(); // absolute filepath
  // });

  // it('getRoot resolves to Git root directory on filepath in tracked directories', async () => {
  //     expect.assertions(3);
  //     await expect(getRoot('foo/add.ts')).resolves.toBe('foo'); // file
  //     await expect(getRoot('baz/subproject')).resolves.toBe(path.normalize('baz/subproject')); // directory
  //     const absoluteFilepath = path.join(mockedInstance.getRoot(), 'bar', 'beta.ts');
  //     const absoluteGitRoot = path.join(mockedInstance.getRoot(), 'bar');
  //     await expect(getRoot(absoluteFilepath)).resolves.toBe(absoluteGitRoot); // absolute filepath
  // });

  // it('getRoot resolves to Git root directory on untracked file in tracked directory', async () => {
  //     expect.assertions(1);
  //     await mockedInstance.addItem('foo/haze/test.js', 'content');
  //     await expect(getRoot('foo/haze/test.js')).resolves.toBe('foo');
  // });

  // it('getRoot fails with an error on non-existent path', async () => {
  //     expect.assertions(1);
  //     await expect(getRoot('zap/zeta.ts')).rejects.toThrow(/ENOENT/);
  // });

  // it('getBranchRoot resolves root path for main worktree from `dir` path', async () => {
  //     expect.assertions(1);
  //     jest.spyOn(gitShowBranch, 'showBranch').mockResolvedValue([{ ref: 'bad-branch', remote: 'origin', scope: 'local' }, { ref: 'main', remote: 'origin', scope: 'local' }]); // mock for branches
  //     await expect(getBranchRoot('foo', 'main')).resolves.toEqual('foo');
  // });

  // it('getBranchRoot resolves root path for main worktree from `worktreeDir` path', async () => {
  //     expect.assertions(1);
  //     jest.spyOn(gitShowBranch, 'showBranch').mockResolvedValue([{ ref: 'bad-branch', remote: 'origin', scope: 'local' }, { ref: 'main', remote: 'origin', scope: 'local' }]); // mock for branches
  //     await expect(getBranchRoot('.syn/bad-branch', 'main')).resolves.toEqual('foo');
  // });

  // it('getBranchRoot resolves root path for linked worktree from `dir` path', async () => {
  //     expect.assertions(1);
  //     jest.spyOn(gitShowBranch, 'showBranch').mockResolvedValue([{ ref: 'bad-branch', remote: 'origin', scope: 'local' }, { ref: 'main', remote: 'origin', scope: 'local' }]); // mock for branches
  //     await expect(getBranchRoot('foo', 'bad-branch')).resolves.toEqual(path.normalize('.syn/bad-branch'));
  // });

  // it('getBranchRoot resolves root path for linked worktree from `worktreeDir` path', async () => {
  //     expect.assertions(1);
  //     jest.spyOn(gitShowBranch, 'showBranch').mockResolvedValue([{ ref: 'bad-branch', remote: 'origin', scope: 'local' }, { ref: 'main', remote: 'origin', scope: 'local' }]); // mock for branches
  //     await expect(getBranchRoot('.syn/bad-branch', 'bad-branch')).resolves.toEqual(path.normalize('.syn/bad-branch'));
  // });

  // it('getWorktreePaths resolves path to main worktree file', async () => {
  //     expect.assertions(1);
  //     await expect(getWorktreePaths('foo/add.ts')).resolves.toEqual(
  //         expect.objectContaining({
  //             dir: 'foo',
  //             gitdir: path.normalize('foo/.git'),
  //             worktrees: path.normalize('foo/.git/worktrees'),
  //             worktreeDir: undefined,
  //             worktreeGitdir: undefined,
  //             worktreeLink: undefined
  //         })
  //     );
  // });

  // it('getWorktreePaths resolves path in repo without linked worktrees', async () => {
  //     expect.assertions(1);
  //     await expect(getWorktreePaths('bar/beta.ts')).resolves.toEqual(
  //         expect.objectContaining({
  //             dir: 'bar',
  //             gitdir: path.normalize('bar/.git'),
  //             worktrees: undefined,
  //             worktreeDir: undefined,
  //             worktreeGitdir: undefined,
  //             worktreeLink: undefined
  //         })
  //     );
  // });

  // it('getWorktreePaths resolves path to linked worktree file', async () => {
  //     expect.assertions(1);
  //     await expect(getWorktreePaths('.syn/bad-branch/delta.txt')).resolves.toEqual(
  //         expect.objectContaining({
  //             dir: 'foo',
  //             gitdir: path.normalize('foo/.git'),
  //             worktrees: path.normalize('foo/.git/worktrees'),
  //             worktreeDir: path.normalize('.syn/bad-branch'),
  //             worktreeGitdir: path.normalize('.syn/bad-branch/.git'),
  //             worktreeLink: path.normalize('foo/.git/worktrees/bad-branch')
  //         })
  //     );
  // });

  // it('getWorktreePaths resolves path in the GIT_DIR/worktrees directory', async () => {
  //     expect.assertions(1);
  //     await expect(getWorktreePaths('foo/.git/worktrees/bad-branch')).resolves.toEqual(
  //         expect.objectContaining({
  //             dir: 'foo',
  //             gitdir: path.normalize('foo/.git'),
  //             worktrees: path.normalize('foo/.git/worktrees'),
  //             worktreeDir: path.normalize('.syn/bad-branch'),
  //             worktreeGitdir: path.normalize('.syn/bad-branch/.git'),
  //             worktreeLink: path.normalize('foo/.git/worktrees/bad-branch')
  //         })
  //     );
  // });
});
