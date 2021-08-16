/* eslint-disable jest/no-commented-out-tests */
import * as path from 'path';
import { homedir } from 'os';

import * as git from '../src/containers/git-porcelain';
import * as io from '../src/containers/io';
import type { MockInstance } from './__mocks__/mock-fs-promise';
import { mock, file } from './__mocks__/mock-fs-promise';

describe('git.currentBranch', () => {
  let mockedInstance: MockInstance;

  beforeAll(async () => {
    const instance = await mock({
      baseRepo: {
        '.git': {
          HEAD: 'ref: refs/heads/master\n',
          branches: {},
          config: `[core]
	repositoryformatversion = 0
	filemode = true
	bare = false
	logallrefupdates = true
	ignorecase = true
	precomposeunicode = true`,
          description: 'Unnamed repository; edit this file \'description\' to name the repository.',
          hooks: {},
          info: {
            exclude: `# git ls-files --others --exclude-from=.git/info/exclude
# Lines that start with '#' are comments.
# For a project mostly in C, the following would be a good set of
# exclude patterns (uncomment them if you want to use them):
# *.[oa]
# *~
.DS_Store`
          },
          objects: {
            info: {},
            pack: {}
          },
          refs: {
            heads: {
              master: 'f204b02baf1322ee079fe9768e9593509d683412\n',
              foo: 'f204b02baf1322ee079fe9768e9593509d683412\n',
            },
            tags: {}
          },
          worktrees: {
            foo: {
              HEAD: 'ref: refs/heads/foo\n',
              ORIG_HEAD: 'f204b02baf1322ee079fe9768e9593509d683412\n',
              commondir: '../..\n',
              gitdir: `${process.cwd()}/foo/.git` // gitdir is an absolute path, and mock-fs uses process.cwd() as the path base
            }
          }
        }
      },
      foo: {
        '.git': 'gitdir: baseRepo/.git/worktrees/foo\n',
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
        '.git': {
          HEAD: 'f204b02baf1322ee079fe9768e9593509d683412\n',
          objects: {},
          refs: {
            heads: {
              master: 'f204b02baf1322ee079fe9768e9593509d683412\n',
            }
          }
        }
      },
      baz: {
        'sample.txt': 'non-tracked file and directory'
      }
    });
    return mockedInstance = instance;
  });

  afterAll(() => mockedInstance.reset());
  afterEach(jest.clearAllMocks);

  it('currentBranch resolves to Git branch name on a tracked worktree', async () => {
    jest.spyOn(io, 'isDirectory').mockResolvedValue(true); // mock-fs struggles to mock async IO calls, like io.isDirectory()
    return expect(git.currentBranch({ dir: 'baseRepo/' })).resolves.toBe('master');
  });

  it('currentBranch resolves to Git branch name on a linked woktree', async () => {
    jest.spyOn(io, 'isDirectory').mockResolvedValue(false); // mock-fs struggles to mock async IO calls, like io.isDirectory()
    return expect(git.currentBranch({ dir: 'foo/' })).resolves.toBe('foo');
  });

  it('currentBranch resolves to undefined on a tracked directory with detached HEAD', async () => {
    jest.spyOn(io, 'isDirectory').mockResolvedValue(true); // mock-fs struggles to mock async IO calls, like io.isDirectory()
    await expect(git.currentBranch({ dir: 'qux/' })).resolves.toBeUndefined();
  });

  it('currentBranch fails with an error on an untracked directory', async () => {
    jest.spyOn(io, 'isDirectory').mockResolvedValue(false); // mock-fs struggles to mock async IO calls, like io.isDirectory()
    await expect(git.currentBranch({ dir: 'baz/' })).rejects.toThrow(/ENOENT/);
  });
});

describe('git.getConfig', () => {
  let mockedInstance: MockInstance;

  beforeAll(async () => {
    const instance = await mock({
      [path.join(homedir(), '.gitconfig')]: file({
        content: `[user]
  name = Sandy Updates
  email = supdate@oregonstate.edu
[core]
  editor = vim
  whitespace = fix,-indent-with-non-tab,trailing-space,cr-at-eol`,
      }),
      '.git/config': file({
        content: `[user]
  name = Bobby Tables
  email = bdrop@oregonstate.edu
[credential]
  helper = osxkeychain
[pull]
  rebase = true
[alias]
  last = log -1 HEAD`,
      }),
    });
    return mockedInstance = instance;
  });

  afterAll(() => mockedInstance.reset());

  it('getConfig resolves global git-config value', async () => {
    return expect(git.getConfig('user.name', true)).resolves.toStrictEqual({ scope: 'global', value: 'Sandy Updates' });
  });

  it('getConfig resolves local git-config value', async () => {
    return expect(git.getConfig('user.name')).resolves.toStrictEqual({ scope: 'local', value: 'Bobby Tables' });
  });

  it('getConfig checks both scopes for git-config value', async () => {
    return expect(git.getConfig('core.editor')).resolves.toStrictEqual({ scope: 'global', value: 'vim' });
  });

  it('getConfig resolves none when no git-config value is found', async () => {
    return expect(git.getConfig('commenter.name')).resolves.toStrictEqual({ scope: 'none' });
  });
});

describe('git.setConfig', () => {
  let mockedInstance: MockInstance;

  beforeEach(async () => {
    const instance = await mock({
      [path.join(homedir(), '.gitconfig')]: file({
        content: `[user]
  name = Sandy Updates
  email = supdate@oregonstate.edu
[core]
  editor = vim`,
      }),
      '.git/config': file({
        content: `[user]
  name = Bobby Tables
  email = bdrop@oregonstate.edu
[credential]
  helper = osxkeychain`,
      }),
    });
    return mockedInstance = instance;
  });

  afterAll(() => mockedInstance.reset());

  it('setConfig adds value to global git-config', async () => {
    const updated = await git.setConfig('global', 'user.username', 'supdate');
    // mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(updated).toMatchSnapshot();
  });

  it('setConfig updates values to local git-config', async () => {
    const updated = await git.setConfig('local', 'user.name', 'John Smith');
    // mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(updated).toMatchSnapshot();
  });

  it('setConfig deletes values from local git-config', async () => {
    const updated = await git.setConfig('local', 'user.name', undefined);
    // mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect(updated).toMatchSnapshot();
  });
});

describe('git.getRepoRoot', () => {
  let mockedInstance: MockInstance;

  beforeAll(async () => {
    const instance = await mock({
      foo: {
        '.git': 'gitdir: baseRepo/.git/worktrees/foo\n',
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
        '.git': {
          HEAD: 'f204b02baf1322ee079fe9768e9593509d683412\n',
          objects: {},
          refs: {
            heads: {
              master: 'f204b02baf1322ee079fe9768e9593509d683412\n',
            }
          }
        }
      },
      baz: {
        'sample.txt': 'non-tracked file and directory'
      }
    });
    return mockedInstance = instance;
  });

  afterAll(() => mockedInstance.reset());

  it('getRepoRoot resolves to Git root directory on file in tracked directory', async () => {
    return expect(git.getRepoRoot('foo/yez/tam/som.js')).resolves.toBe('foo');
  });

  it('getRepoRoot resolves to undefined on file in untracked directory', async () => {
    await expect(git.getRepoRoot('baz/')).resolves.toBeUndefined();
  });
});

describe('git.getStatus', () => {
  let mockedInstance: MockInstance;

  beforeAll(async () => {
    const instance = await mock({
      foo: {
        '.git': 'gitdir: baseRepo/.git/worktrees/foo\n',
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
        '.git': {
          HEAD: 'f204b02baf1322ee079fe9768e9593509d683412\n',
          objects: {},
          refs: {
            heads: {
              master: 'f204b02baf1322ee079fe9768e9593509d683412\n',
            }
          }, 
          'tracked-file.js': 'directory is tracked by git',
          'another-file.ts': 'directory is tracked by git, but the git repo is currently in a detached HEAD state'
        }
      },
      baz: {
        'sample.txt': 'non-tracked file and directory'
      }
    });
    return mockedInstance = instance;
  });

  afterAll(() => mockedInstance.reset());

  // it('getStatus resolves Git status on tracked file', async () => {
  //   await expect(git.getStatus('foo/bar')).resolves.toBe('unmodified');
  // });

  // it('getStatus resolves Git status on tracked directory', async () => {
  //   await expect(git.getStatus(path.resolve('foo/yez/tam'))).resolves.toBe('unmodified');
  // });

  it('getStatus resolves to undefined on untracked file', async () => {
    await expect(git.getStatus('baz/sample.txt')).resolves.toBeUndefined();
  });

  it('getStatus resolves to undefined on untracked directory', async () => {
    await expect(git.getStatus('baz/')).resolves.toBeUndefined();
  });
});