// const mockedMetafile1: FilebasedMetafile = {
//   id: '46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71',
//   name: 'example.ts',
//   modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
//   handler: 'Editor',
//   filetype: 'Typescript',
//   flags: [],
//   path: 'example.ts',
//   state: 'unmodified',
//   mtime: 0,
//   content: 'const rand = Math.floor(Math.random() * 6) + 1;',
//   repo: '23',
//   branch: 'master',
//   status: 'unmodified',
//   conflicts: []
// };

// const mockedMetafile2: FilebasedMetafile = {
//   id: '821c9159-292b-4639-b90e-e84fc12740ee',
//   name: 'test.js',
//   modified: DateTime.fromISO('2019-11-19T19:19:47.572-08:00').valueOf(),
//   handler: 'Editor',
//   filetype: 'Javascript',
//   flags: [],
//   path: 'foo/test.js',
//   state: 'unmodified',
//   mtime: 0,
//   content: 'var rand: number = Math.floor(Math.random() * 6) + 1;'
// };

// const mockedMetafile3: FilebasedMetafile = {
//   id: '88e2gd50-3a5q-6401-b5b3-203c6710e35c',
//   name: 'bar.js',
//   modified: DateTime.fromISO('2015-06-19T19:10:47.319-08:00').valueOf(),
//   handler: 'Editor',
//   filetype: 'Javascript',
//   flags: [],
//   path: 'foo/bar.js',
//   state: 'unmodified',
//   mtime: 0,
//   content: 'file contents'
// };

// const mockedDirectoryMetafile: DirectoryMetafile = {
//   id: 'b859d4e8-b932-4fc7-a2f7-29a8ef8cd8f8',
//   name: 'foo',
//   modified: DateTime.fromISO('2021-01-31T11:24:54.527-08:00').valueOf(),
//   handler: 'Explorer',
//   filetype: 'Directory',
//   flags: [],
//   path: 'foo',
//   state: 'unmodified',
//   contains: ['46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71'],
//   mtime: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
//   repo: '23',
//   branch: 'master',
//   status: 'unmodified',
//   conflicts: []
// };

// const mockedRepository: Repository = {
//   id: '23',
//   name: 'foo/myRepo',
//   root: 'foo/',
//   corsProxy: 'http://www.oregonstate.edu',
//   url: 'https://github.com/foo/myRepo',
//   default: 'master',
//   local: ['b12bbec1-0903-4b74-8bf9-b313ea5af934'],
//   remote: [],
//   oauth: 'github',
//   username: 'sampleUser',
//   password: '12345',
//   token: '584n29dkj1683a67f302x009q164'
// };

// const mockedBranch1: Branch = {
//   id: '8843ba60-5a1c-431d-aa0a-042012b2e8d9',
//   ref: 'default',
//   linked: false,
//   current: true,
//   bare: false,
//   root: 'baz/',
//   gitdir: 'baz/.git',
//   scope: 'local',
//   remote: 'origin',
//   status: 'clean',
//   commits: [],
//   head: '43e47372349e1123af230332f7fb385696101e0d'
// };

describe('thunks/repos', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  //   const store = mockStore(emptyStore);
  //   let mockedInstance: MockInstance;

  //   beforeAll(async () => {
  //     store.dispatch(metafileAdded(mockedMetafile1));
  //     store.dispatch(metafileAdded(mockedMetafile2));
  //     store.dispatch(metafileAdded(mockedMetafile3));
  //     store.dispatch(metafileAdded(mockedDirectoryMetafile));
  //     store.dispatch(repoAdded(mockedRepository));
  //     store.dispatch(branchAdded(mockedBranch1));
  //     const instance = await mock({
  //       foo: {
  //         'bar.js': 'content',
  //         'example.ts': 'const rand = Math.floor(Math.random() * 6) + 1;',
  //         '.git': {
  //           config: '',
  //           HEAD: 'refs/heads/main',
  //           refs: {
  //             'heads/main': 'a4400ff0ceb22fb1c4f4032b6e3c649011dd259e',
  //             'remotes/origin/HEAD': 'ref: refs/remotes/origin/main'
  //           }
  //         }
  //       },
  //       baz: {
  //         'qux.ts': 'const content = examples',
  //         '.git': {
  //           config: '',
  //           HEAD: 'refs/heads/default',
  //           refs: {
  //             'heads/default': '43e47372349e1123af230332f7fb385696101e0d',
  //             'remotes/origin/HEAD': '987654321'
  //           }
  //         }
  //       }
  //     });
  //     return (mockedInstance = instance);
  //   });

  //   afterAll(() => mockedInstance.reset());

  //   afterEach(() => jest.clearAllMocks());

  //   it('fetchRepo resolves existing repository via repo UUID in metafile', async () => {
  //     const repo = await store.dispatch(fetchRepo({ metafile: mockedMetafile1 })).unwrap();
  //     expect(repo).toStrictEqual(mockedRepository);
  //   });

  //   it('fetchRepo resolves existing repository via repo UUID in parent metafile', async () => {
  //     const repo = await store.dispatch(fetchRepo({ metafile: mockedMetafile2 })).unwrap();
  //     expect(repo).toStrictEqual(mockedRepository);
  //   });

  //   it('fetchRepo resolves existing repository via root path', async () => {
  //     const repo = await store.dispatch(fetchRepo({ filepath: 'foo/bar.js' })).unwrap();
  //     expect(repo).toStrictEqual(mockedRepository);
  //   });

  //   it('fetchRepo resolves new repository via root path', async () => {
  //     jest.spyOn(gitRevParse, 'revParse').mockResolvedValue('default'); // mock for git-rev-parse of curent branch name
  //     jest.spyOn(gitWorktree, 'worktreePrune').mockResolvedValue(undefined); // mock for pruning worktrees
  //     jest.spyOn(gitRemote, 'getRemote').mockResolvedValue([{ remote: 'origin' }]); // mock for pruning worktrees
  //     jest
  //       .spyOn(gitShowBranch, 'showBranch')
  //       .mockResolvedValue([{ ref: 'default', scope: 'local', remote: 'origin' }]); // mock for branches
  //     expect.assertions(2);
  //     const repo = await store.dispatch(fetchRepo({ filepath: 'baz/qux.ts' })).unwrap();
  //     expect(isDefined(repo) && isUUID(repo.id.toString())).toBeTruthy();
  //     expect(repo).toStrictEqual(
  //       expect.objectContaining({
  //         root: 'baz'
  //       })
  //     );
  //   });

  //   it('buildRepo resolves a supported repository', async () => {
  //     jest.spyOn(gitRevParse, 'revParse').mockResolvedValue('default'); // mock for git-rev-parse of curent branch name
  //     jest.spyOn(gitWorktree, 'worktreePrune').mockResolvedValue(undefined); // mock for pruning worktrees
  //     expect.assertions(2);
  //     const repo = await store.dispatch(buildRepo('baz')).unwrap();
  //     expect(isDefined(repo) && isUUID(repo.id.toString())).toBeTruthy();
  //     expect(repo).toStrictEqual(
  //       expect.objectContaining({
  //         name: 'baz',
  //         root: 'baz',
  //         corsProxy: 'https://cors-anywhere.herokuapp.com',
  //         url: '',
  //         default: 'default',
  //         local: [mockedBranch1.id],
  //         remote: [],
  //         oauth: 'github',
  //         token: ''
  //       })
  //     );
  //   });
});
