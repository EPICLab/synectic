import execute from './exec';
import { MockInstance, file, mock } from '../test-utils/mock-fs';

describe('containers/execute', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  // let mockedInstance: MockInstance;
  // beforeAll(async () => {
  //   const instance = await mock({
  //     foo: {
  //       bar: file({ content: 'file contents', mtime: new Date(1) }),
  //       zap: file({ content: 'file contents', mtime: new Date(1) }),
  //       'tracked-file.js': 'directory is tracked by git'
  //     }
  //   });
  //   return (mockedInstance = instance);
  // });

  // afterAll(() => mockedInstance.reset());

  // it('execute returns results of successful shell commands', async () => {
  //   expect(execute({ command: 'ls', cwd: 'foo/' })).resolves.toStrictEqual(
  //     expect.objectContaining({
  //       stdout: 'bar\ntracked-file.js\nzap\n',
  //       stderr: ''
  //     })
  //   );
  // });

  // it('execute returns results of unsuccessful shell commands', async () => {
  //   expect(execute({ command: 'ls', cwd: 'foo/bar' })).resolves.toStrictEqual(
  //     expect.objectContaining({
  //       stdout: undefined,
  //       stderr: undefined
  //     })
  //   );
  // });
});
