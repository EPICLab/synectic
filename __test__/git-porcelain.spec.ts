import * as path from 'path';
// import { homedir } from 'os';

import * as git from '../src/containers/git-porcelain';
import type { MockInstance } from './__mocks__/mock-fs-promise';
import type { MockInstanceEnhanced } from './__mocks__/mock-git-promise';
import { mock, file } from './__mocks__/mock-fs-promise';

describe('containers/git-porcelain', () => {
  let mockedInstance: MockInstance | MockInstanceEnhanced;

  beforeAll(async () => {
    const instance = await mock({
      foo: {
        bar: file({
          content: 'file contents',
          mtime: new Date(1)
        }),
        yez: {
          tam: {
            'som.js': file({ content: 'other information' })
          }
        }
      },
      qux: {
        'tracked-file.js': 'directory is tracked by git',
        'another-file.ts': 'directory is tracked by git, but the git repo is currently in a detached HEAD state'
      },
      baz: {
        'sample.txt': 'non-tracked file and directory'
      }
    }, {
      config: {
        'user.name': 'john.doe',
        'user.email': 'john.doe@example.com'
      },
      url: 'https://github.com/exampleUser/exampleProj',
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

  afterAll(() => mockedInstance.reset());

  it('currentBranch resolves to Git branch name on a tracked worktree', async () => {
    await expect(git.currentBranch({ dir: '.' })).resolves.toBe('main');
  });

  // TODO: figure out how to setup a linked worktree using `mock-fs-promise` and `mock-git-promise`
  // it('currentBranch resolves to Git branch name on a linked woktree', async () => {
  //   await expect(git.currentBranch({ dir: 'foo/' })).resolves.toBe('foo');
  // });

  // TODO: figure out how to create sub-repositories attached to specific directories in mockedInstance
  // it('currentBranch resolves to undefined on a tracked directory with detached HEAD', async () => {
  //   await mockedInstance.addItem('qexot/sample.ts', 'content');
  //   await expect(git.currentBranch({ dir: 'qexot/' })).resolves.toBeUndefined();
  // });

  // TODO: figure out how to specify a mockedGit directory for the base repository, so that other directories can be untracked
  //   it('currentBranch fails with an error on an untracked directory', async () => {
  //     jest.spyOn(io, 'isDirectory').mockResolvedValue(false); // mock-fs struggles to mock async IO calls, like io.isDirectory()
  //     await expect(git.currentBranch({ dir: 'baz/' })).rejects.toThrow(/ENOENT/);
  //   });

  // describe('git.getConfig', () => {
  //   let mockedInstance: MockInstance;

  //   beforeAll(async () => {
  //     const instance = await mock({
  //       [path.join(homedir(), '.gitconfig')]: file({
  //         content: `[user]
  //   name = Sandy Updates
  //   email = supdate@oregonstate.edu
  // [core]
  //   editor = vim
  //   whitespace = fix,-indent-with-non-tab,trailing-space,cr-at-eol`,
  //       }),
  //       '.git/config': file({
  //         content: `[user]
  //   name = Bobby Tables
  //   email = bdrop@oregonstate.edu
  // [credential]
  //   helper = osxkeychain
  // [pull]
  //   rebase = true
  // [alias]
  //   last = log -1 HEAD`,
  //       }),
  //     });
  //     return mockedInstance = instance;
  //   });

  //   afterAll(() => mockedInstance.reset());

  //   it('getConfig resolves global git-config value', async () => {
  //     return expect(git.getConfig('user.name', true)).resolves.toStrictEqual({ scope: 'global', value: 'Sandy Updates' });
  //   });

  //   it('getConfig resolves local git-config value', async () => {
  //     return expect(git.getConfig('user.name')).resolves.toStrictEqual({ scope: 'local', value: 'Bobby Tables' });
  //   });

  //   it('getConfig checks both scopes for git-config value', async () => {
  //     return expect(git.getConfig('core.editor')).resolves.toStrictEqual({ scope: 'global', value: 'vim' });
  //   });

  //   it('getConfig resolves none when no git-config value is found', async () => {
  //     return expect(git.getConfig('commenter.name')).resolves.toStrictEqual({ scope: 'none' });
  //   });
  // });

  //   it('setConfig adds value to global git-config', async () => {
  //     const updated = await git.setConfig('global', 'user.username', 'supdate');
  //     // mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
  //     expect(updated).toMatchSnapshot();
  //   });

  it('setConfig updates values to local git-config', async () => {
    const updated = await git.setConfig({ dir: process.cwd(), scope: 'local', keyPath: 'user.name', value: 'John Smith' });
    expect(updated).toMatchSnapshot();
  });

  it('setConfig deletes values from local git-config', async () => {
    const updated = await git.setConfig({ dir: process.cwd(), scope: 'local', keyPath: 'user.name', value: undefined });
    expect(updated).toMatchSnapshot();
  });

  it('getStatus resolves Git status on tracked file', async () => {
    await expect(git.getStatus('foo/bar')).resolves.toBe('unmodified');
  });

  it('getStatus resolves Git status on tracked directory', async () => {
    await expect(git.getStatus(path.resolve('foo/yez/tam/som.js'))).resolves.toBe('unmodified');
  });

  it('getStatus resolves Git status on untracked file', async () => {
    await mockedInstance.addItem('baz/untracked.txt', 'content');
    await expect(git.getStatus('baz/untracked.txt')).resolves.toBe('*added');
  });

  it('getStatus resolves Git status on untracked directory', async () => {
    await mockedInstance.addItem('bezo/', {});
    // differs from native git, which focuses on files and ignores empty directories
    await expect(git.getStatus('bezo/')).resolves.toBe('modified');
  });
});