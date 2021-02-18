import mock from 'mock-fs';
import parsePath from 'parse-path';

import type { Repository, Worktree } from '../src/types';
import * as git from '../src/containers/git';
import * as worktree from '../src/containers/git-worktree';
import { extractStats, readFileAsync } from '../src/containers/io';

describe('git.resolveRef and git.currentBranch', () => {

  beforeEach(() => {
    mock({
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
        bar: mock.file({
          content: 'file contents',
          ctime: new Date(1),
          mtime: new Date(1)
        })
      }
    });
  });

  afterEach(mock.restore);

  it('resolveRef resolves both main and linked worktree refs', async () => {
    const main = await git.resolveRef({ dir: 'baseRepo/', ref: 'master' });
    const linked = await git.resolveRef({ dir: 'foo/', ref: 'master' });
    expect(linked).toEqual(main);
  })

  it('currentBranch resolves both main and linked woktree refs', async () => {
    const main = await git.currentBranch({ dir: 'baseRepo/' });
    expect(main).toBe('master');
    const linked = await git.currentBranch({ dir: 'foo/' });
    expect(linked).toBe('foo');
  })
});

describe('git-worktree.list', () => {

  beforeEach(() => {
    mock({
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
        bar: mock.file({
          content: 'file contents',
          ctime: new Date(1),
          mtime: new Date(1)
        })
      },
      bazRepo: {
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
            },
            tags: {}
          }
        }
      },
      bar: { /** empty non-worktree directory */ }
    });
  });

  afterEach(mock.restore);

  it('list returns list of worktrees from the main worktree directory', () => {
    return expect(worktree.list('baseRepo/')).resolves.toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: `${process.cwd()}/baseRepo`, ref: 'master' }),
        expect.objectContaining({ path: `${process.cwd()}/foo`, ref: 'foo' })
      ])
    );
  })

  it('list returns list of worktrees from a linked worktree directory', () => {
    return expect(worktree.list('foo/')).resolves.toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: `${process.cwd()}/baseRepo`, ref: 'master' }),
        expect.objectContaining({ path: `${process.cwd()}/foo`, ref: 'foo' })
      ])
    );
  })

  it('list returns list containing only main worktree on repository without linked worktrees', () => {
    return expect(worktree.list('bazRepo/')).resolves.toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: `${process.cwd()}/bazRepo`, ref: 'master' })
      ])
    );
  })

  it('list returns undefined on non-repository directory', () => {
    return expect(worktree.list('bar/')).resolves.toBeUndefined();
  })

});

describe('git-worktree.add', () => {

  beforeEach(() => {
    mock({
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
              master: 'f204b02baf1322ee079fe9768e9593509d683412\n'
            },
            tags: {}
          }
        }
      },
      foo: {
        bar: mock.file({
          content: 'file contents',
          ctime: new Date(1),
          mtime: new Date(1)
        })
      }
    });
  });

  afterEach(mock.restore);

  it('add resolves a linked worktree on new branch', async () => {
    const repo: Repository = {
      id: '23',
      name: 'sampleUser/baseRepo',
      root: 'baseRepo/',
      corsProxy: new URL('http://www.oregonstate.edu'),
      url: parsePath('https://github.com/sampleUser/baseRepo'),
      local: ['master'],
      remote: [],
      oauth: 'github',
      username: 'sampleUser',
      password: '12345',
      token: '584n29dkj1683a67f302x009q164'
    };
    await worktree.add(repo, 'foo/', 'hotfix');
    await expect(readFileAsync('foo/.git', { encoding: 'utf-8' })).resolves.toBe('gitdir: baseRepo/.git/worktrees/hotfix\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/HEAD', { encoding: 'utf-8' })).resolves.toBe('ref: refs/heads/hotfix\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/ORIG_HEAD', { encoding: 'utf-8' }))
      .resolves.toBe('f204b02baf1322ee079fe9768e9593509d683412\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/commondir', { encoding: 'utf-8' })).resolves.toBe('../..\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/gitdir', { encoding: 'utf-8' })).resolves.toMatch(/foo\/.git\n?$/);
  })

  it('add resolves a linked worktree on SHA-1 commit hash', async () => {
    const repo: Repository = {
      id: '23',
      name: 'sampleUser/baseRepo',
      root: 'baseRepo/',
      corsProxy: new URL('http://www.oregonstate.edu'),
      url: parsePath('https://github.com/sampleUser/baseRepo'),
      local: ['master'],
      remote: [],
      oauth: 'github',
      username: 'sampleUser',
      password: '12345',
      token: '584n29dkj1683a67f302x009q164'
    };
    await worktree.add(repo, 'foo/', 'f204b02baf1322ee079fe9768e9593509d683412');
    await expect(readFileAsync('foo/.git', { encoding: 'utf-8' })).resolves.toBe('gitdir: baseRepo/.git/worktrees/foo\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/foo/HEAD', { encoding: 'utf-8' })).resolves.toBe('ref: refs/heads/foo\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/foo/ORIG_HEAD', { encoding: 'utf-8' }))
      .resolves.toBe('f204b02baf1322ee079fe9768e9593509d683412\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/foo/commondir', { encoding: 'utf-8' })).resolves.toBe('../..\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/foo/gitdir', { encoding: 'utf-8' })).resolves.toMatch(/foo\/.git\n?$/);
  })

});

describe('git-worktree.remove', () => {

  beforeEach(() => {
    mock({
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
        bar: mock.file({
          content: 'file contents',
          ctime: new Date(1),
          mtime: new Date(1)
        })
      }
    });
  });

  afterEach(mock.restore);

  it('remove resolves a clean linked worktree for removal without force', async () => {
    const linkedWorktree: Worktree = {
      id: '19',
      path: 'foo/',
      bare: false,
      detached: false,
      ref: 'foo',
      rev: 'f204b02baf1322ee079fe9768e9593509d683412'
    }
    jest.spyOn(git, 'getStatus').mockResolvedValue('unmodified'); // git.statusCheck() requires a valid `index` file, which is a difficult file to mock
    await worktree.remove(linkedWorktree);
    await expect(extractStats('foo/')).resolves.toBeUndefined();
    await expect(extractStats('baseRepo/.git/worktrees/foo')).resolves.toBeUndefined();
    await expect(extractStats('baseRepo/.git/refs/heads/foo')).resolves.toBeDefined();
  })

  it('remove resolves a linked worktree (and branches) for removal with force', async () => {
    const linkedWorktree: Worktree = {
      id: '19',
      path: 'foo/',
      bare: false,
      detached: false,
      ref: 'foo',
      rev: 'f204b02baf1322ee079fe9768e9593509d683412'
    }
    await worktree.remove(linkedWorktree, true);
    await expect(extractStats('foo/')).resolves.toBeUndefined();
    await expect(extractStats('baseRepo/.git/worktrees/foo')).resolves.toBeUndefined();
    await expect(extractStats('baseRepo/.git/refs/heads/foo')).resolves.toBeUndefined();
  })
});