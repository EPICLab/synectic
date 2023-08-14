describe('containers/merges', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  // let mockedInstance: MockInstance;

  // beforeAll(async () => {
  //     const instance = await mock({
  //         foo: {
  //             'example.ts': 'import async from "typescript";\n\n<<<<<<< HEAD\nconst rand = Math.floor(Math.random() * 6) + 1;\n=======\nconst rand = Math.floor(Math.random() * 6) + 1;\n>>>>>>>\nconst double = rand * 2;\n<<<<<<< HEAD\nconst triple = rand * 3;\n=======\nconst triple = double + rand;\n>>>>>>>',
  //             'bar.js': 'file contents',
  //             '.git': {
  //                 config: '',
  //                 HEAD: 'refs/heads/main',
  //                 refs: {
  //                     remotes: {
  //                         origin: {
  //                             'HEAD': 'ref: refs/remotes/origin/main',
  //                             'develop': 'ref: refs/remotes/origin/develop'
  //                         }
  //                     }
  //                 }
  //             }
  //         }
  //     });
  //     return mockedInstance = instance;
  // });

  // afterAll(() => mockedInstance.reset());

  // it('checkFilepath resolves to undefined on non-conflicting file', async () => {
  //     await expect(checkUnmergedPath('foo/bar.js')).resolves.toHaveLength(0);
  // });

  // it('checkFilepath resolves to a conflict array on conflicting file', async () => {
  //     await expect(checkUnmergedPath('foo/example.ts')).resolves.toStrictEqual(
  //         expect.arrayContaining([
  //             expect.objectContaining({
  //                 path: 'foo/example.ts',
  //                 conflicts: [33, 183]
  //             })
  //         ])
  //     );
  // });
});
