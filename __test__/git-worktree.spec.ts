import mock from 'mock-fs';
import parsePath from 'parse-path';

import type { Repository } from '../src/types';
import { currentBranch, resolveRef } from '../src/containers/git';
import * as worktree from '../src/containers/git-worktree';
import { readFileAsync } from '../src/containers/io';

describe('git.resolveRef and git.currentBranch', () => {
  it('resolveRef resolves both main and linked worktree refs', async () => {
    const main = await resolveRef({ dir: '/Users/nelsonni/Workspace/simple-project', ref: 'master' });
    const linked = await resolveRef({ dir: '/Users/nelsonni/Workspace/foo_hotfix', ref: 'master' });
    expect(linked).toEqual(main);
  })

  it('currentBranch resolves both main and linked woktree refs', async () => {
    const main = await currentBranch({ dir: '/Users/nelsonni/Workspace/simple-project', print: false });
    expect(main).toBe('master');
    const linked = await currentBranch({ dir: '/Users/nelsonni/Workspace/foo_hotfix', print: false });
    expect(linked).toBe('foo_hotfix');
  })
});

describe('git-worktree.list', () => {
  it('list returns list of worktrees from the main worktree directory', () => {
    return expect(worktree.list('/Users/nelsonni/Workspace/simple-project')).resolves.toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/Users/nelsonni/Workspace/simple-project', ref: 'master' }),
        expect.objectContaining({ path: '/Users/nelsonni/Workspace/foo_hotfix', ref: 'foo_hotfix' })
      ])
    );
  })

  it('list returns list of worktrees from a linked worktree directory', () => {
    return expect(worktree.list('/Users/nelsonni/Workspace/foo_hotfix')).resolves.toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/Users/nelsonni/Workspace/simple-project', ref: 'master' }),
        expect.objectContaining({ path: '/Users/nelsonni/Workspace/foo_hotfix', ref: 'foo_hotfix' })
      ])
    );
  })

  it('list fails on a repository without a linked worktree directory', () => {
    return expect(worktree.list('/Users/nelsonni/Workspace/synectic')).resolves.toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/Users/nelsonni/Workspace/synectic', ref: 'feat/git-worktree' })
      ])
    );
  })

});

describe('git-worktree.add', () => {

  beforeAll(() => {
    mock({
      baseRepo: {
        '.git': {
          HEAD: 'ref: refs/heads/master',
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
              master: 'f204b02baf1322ee079fe9768e9593509d683412'
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

  afterAll(mock.restore);

  it('add resolves a linked worktree with new branch', async () => {
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
    await expect(readFileAsync('foo/.git', { encoding: 'utf-8' })).resolves.toBe('gitdir: baseRepo/.git/worktrees/hotfix');
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/HEAD', { encoding: 'utf-8' })).resolves.toBe('ref: refs/heads/hotfix');
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/ORIG_HEAD', { encoding: 'utf-8' }))
      .resolves.toBe('f204b02baf1322ee079fe9768e9593509d683412');
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/commondir', { encoding: 'utf-8' })).resolves.toBe('../..');
    await expect(readFileAsync('baseRepo/.git/worktrees/hotfix/gitdir', { encoding: 'utf-8' })).resolves.toMatch(/foo\/.git\n?$/);
  })
});