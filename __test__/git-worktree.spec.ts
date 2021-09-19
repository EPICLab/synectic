// import mock from 'mock-fs';
import parsePath from 'parse-path';
import * as path from 'path';

import type { Repository } from '../src/types';
import * as git from '../src/containers/git-porcelain';
import * as worktree from '../src/containers/git-worktree';
import { extractStats, readFileAsync, writeFileAsync } from '../src/containers/io';
import type { MockInstance } from './__mocks__/mock-fs-promise';
import { mock, file } from './__mocks__/mock-fs-promise';

describe('git-worktree.list', () => {
  let mockedInstance: MockInstance;

  beforeEach(async () => {
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
    return mockedInstance = instance;
  });

  afterEach(() => mockedInstance.reset());

  // it('list returns list of worktrees from the main worktree directory', () => {
  //   return expect(worktree.list('baseRepo/')).resolves.toStrictEqual(
  //     expect.arrayContaining([
  //       expect.objectContaining({ path: path.join(process.cwd(), 'baseRepo'), ref: 'master' }),
  //       expect.objectContaining({ path: path.join(process.cwd(), 'foo'), ref: 'foo' })
  //     ])
  //   );
  // })

  // it('list returns list of worktrees from a linked worktree directory', () => {
  //   return expect(worktree.list('foo/')).resolves.toStrictEqual(
  //     expect.arrayContaining([
  //       expect.objectContaining({ path: path.join(process.cwd(), 'baseRepo'), ref: 'master' }),
  //       expect.objectContaining({ path: path.join(process.cwd(), 'foo'), ref: 'foo' })
  //     ])
  //   );
  // })

  it('list returns list containing only main worktree on repository without linked worktrees', () => {
    return expect(worktree.list('bazRepo/')).resolves.toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: path.join(process.cwd(), 'bazRepo'), ref: 'master' })
      ])
    );
  })

  it('list returns undefined on non-repository directory', () => {
    return expect(worktree.list('bar/')).resolves.toBeUndefined();
  })

});

describe('git-worktree.add', () => {
  let mockedInstance: MockInstance;

  beforeEach(async () => {
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
              master: 'f39895c492e97f23d9ce252afefca347a656a4b2\n',
              hotfix: '6b35cb455b16b0d0247c9cfdcb4982a4de599b23\n'
            },
            tags: {}
          }
        }
      },
      foo: {
        bar: file({
          content: 'file contents',
          mtime: new Date(1)
        })
      }
    });
    return mockedInstance = instance;
  });
  afterAll(() => mockedInstance.reset());

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('add resolves a linked worktree on new branch', async () => {
    jest.spyOn(git, 'checkout').mockImplementation(async () => {
      await writeFileAsync(path.resolve('foo/.git/index'), '2349024234');
      await writeFileAsync(path.resolve('foo/.git/HEAD'), 'ref: refs/heads/hotfix\n');
    });
    const repo: Repository = {
      id: '23',
      name: 'sampleUser/baseRepo',
      root: 'baseRepo/',
      corsProxy: new URL('http://www.oregonstate.edu').toString(),
      url: parsePath('https://github.com/sampleUser/baseRepo').toString(),
      local: ['master', 'hotfix'],
      remote: [],
      oauth: 'github',
      username: 'sampleUser',
      password: '12345',
      token: '584n29dkj1683a67f302x009q164'
    };
    await worktree.add(repo, 'foo/', 'hotfix');
    await expect(readFileAsync('foo/.git', { encoding: 'utf-8' }))
      .resolves.toBe(`gitdir: ${path.join('baseRepo', '.git', 'worktrees', 'hotfix')}\n`);
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/HEAD', { encoding: 'utf-8' })).resolves.toBe('ref: refs/heads/hotfix\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/ORIG_HEAD', { encoding: 'utf-8' }))
      .resolves.toBe('6b35cb455b16b0d0247c9cfdcb4982a4de599b23\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/commondir', { encoding: 'utf-8' }))
      .resolves.toBe(`${path.normalize('../..')}\n`);
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/gitdir', { encoding: 'utf-8' }))
      .resolves.toMatch(/((\\|\/){1,2})foo((\\|\/){1,2})\.git\n?$/); // ends in foo/.git with file path separators for Windows or Unix
  })

  it('add resolves a linked worktree on SHA-1 commit hash', async () => {
    const repo: Repository = {
      id: '23',
      name: 'sampleUser/baseRepo',
      root: 'baseRepo/',
      corsProxy: new URL('http://www.oregonstate.edu').toString(),
      url: parsePath('https://github.com/sampleUser/baseRepo').toString(),
      local: ['master', 'hotfix'],
      remote: [],
      oauth: 'github',
      username: 'sampleUser',
      password: '12345',
      token: '584n29dkj1683a67f302x009q164'
    };
    await worktree.add(repo, 'foo/', 'f204b02baf1322ee079fe9768e9593509d683412');
    await expect(readFileAsync('foo/.git', { encoding: 'utf-8' }))
      .resolves.toBe(`gitdir: ${path.join('baseRepo', '.git', 'worktrees', 'foo')}\n`);
    await expect(readFileAsync('baseRepo/.git/worktrees/foo/HEAD', { encoding: 'utf-8' }))
      .resolves.toBe('f204b02baf1322ee079fe9768e9593509d683412\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/foo/ORIG_HEAD', { encoding: 'utf-8' }))
      .resolves.toBe('f204b02baf1322ee079fe9768e9593509d683412\n');
    await expect(readFileAsync('baseRepo/.git/worktrees/foo/commondir', { encoding: 'utf-8' }))
      .resolves.toBe(`${path.normalize('../..')}\n`);
    await expect(readFileAsync('baseRepo/.git/worktrees/foo/gitdir', { encoding: 'utf-8' }))
      .resolves.toMatch(/((\\|\/){1,2})foo((\\|\/){1,2})\.git\n?$/); // ends in foo/.git with file path separators for Windows or Unix
  })

});

describe('git-worktree.remove', () => {
  let mockedInstance: MockInstance;

  beforeEach(async () => {
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
        })
      }
    });
    return mockedInstance = instance;
  });
  afterAll(() => mockedInstance.reset);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('remove without force resolves to delete clean linked worktree', async () => {
    const linkedWorktree: worktree.Worktree = {
      id: '19',
      path: 'foo/',
      bare: false,
      detached: false,
      main: false,
      ref: 'foo',
      rev: 'f204b02baf1322ee079fe9768e9593509d683412'
    }
    jest.spyOn(git, 'getStatus').mockResolvedValue('unmodified'); // git.statusCheck() requires a valid `index` file, which is a difficult file to mock
    await worktree.remove(linkedWorktree);
    await expect(extractStats('foo/')).resolves.toBeUndefined();
    await expect(extractStats('baseRepo/.git/worktrees/foo')).resolves.toBeUndefined();
    await expect(extractStats('baseRepo/.git/refs/heads/foo')).resolves.toBeDefined();
  })

  it('remove without force resolves to no action on dirty linked worktree', async () => {
    const linkedWorktree: worktree.Worktree = {
      id: '19',
      path: 'foo/',
      bare: false,
      detached: false,
      main: false,
      ref: 'foo',
      rev: 'f204b02baf1322ee079fe9768e9593509d683412'
    }
    jest.spyOn(git, 'getStatus').mockResolvedValue('modified'); // git.statusCheck() requires a valid `index` file, which is a difficult file to mock
    await worktree.remove(linkedWorktree);
    await expect(extractStats('foo/')).resolves.toBeDefined();
    await expect(extractStats('baseRepo/.git/worktrees/foo')).resolves.toBeDefined();
    await expect(extractStats('baseRepo/.git/refs/heads/foo')).resolves.toBeDefined();
  })

  it('remove with force enabled resolves to delete clean linked worktree and related branch', async () => {
    const linkedWorktree: worktree.Worktree = {
      id: '19',
      path: 'foo/',
      bare: false,
      detached: false,
      main: false,
      ref: 'foo',
      rev: 'f204b02baf1322ee079fe9768e9593509d683412'
    }
    jest.spyOn(git, 'getStatus').mockResolvedValue('unmodified'); // git.statusCheck() requires a valid `index` file, which is a difficult file to mock
    await worktree.remove(linkedWorktree, true);
    await expect(extractStats('foo/')).resolves.toBeUndefined();
    await expect(extractStats('baseRepo/.git/worktrees/foo')).resolves.toBeUndefined();
    await expect(extractStats('baseRepo/.git/refs/heads/foo')).resolves.toBeUndefined();
  })

  it('remove with force enabled resolves to delete dirty linked worktree and related branch', async () => {
    const linkedWorktree: worktree.Worktree = {
      id: '19',
      path: 'foo/',
      bare: false,
      detached: false,
      main: false,
      ref: 'foo',
      rev: 'f204b02baf1322ee079fe9768e9593509d683412'
    }
    jest.spyOn(git, 'getStatus').mockResolvedValue('modified'); // git.statusCheck() requires a valid `index` file, which is a difficult file to mock
    await worktree.remove(linkedWorktree, true);
    await expect(extractStats('foo/')).resolves.toBeUndefined();
    await expect(extractStats('baseRepo/.git/worktrees/foo')).resolves.toBeUndefined();
    await expect(extractStats('baseRepo/.git/refs/heads/foo')).resolves.toBeUndefined();
  })

  it('remove resolves to no action on main worktree', async () => {
    const linkedWorktree: worktree.Worktree = {
      id: '19',
      path: 'foo/',
      bare: false,
      detached: false,
      main: false,
      ref: 'foo',
      rev: 'f204b02baf1322ee079fe9768e9593509d683412'
    }
    jest.spyOn(git, 'getStatus').mockResolvedValue('unmodified'); // git.statusCheck() requires a valid `index` file, which is a difficult file to mock
    await worktree.remove(linkedWorktree);
    await expect(extractStats('baseRepo/')).resolves.toBeDefined();
  })
});