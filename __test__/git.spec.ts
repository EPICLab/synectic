import mock from 'mock-fs';

import * as git from '../src/containers/git';

beforeAll(() => {
  mock({
    'foo/bar': {
      'no-tracked-file.js': 'file contents',
    },
    baz: {
      '.git': {
        'HEAD': 'ref: refs/heads/feature/test',
        'config': '[core]\nrepositoryformatversion = 0\nfilemode = true\nbare = false\nlogallrefupdates = true\nignorecase = true\nprecomposeunicode = true\n[remote "origin"]\nurl = git@github.com:test/test.git\nfetch = +refs / heads/*:refs/remotes/origin/*\n[branch "master"]\nremote = origin\nmerge = refs/heads/master'
      },
      'some-file.js': 'random content',
      'qux/tracked-file.js': 'other content',
    }
  });
});

afterAll(mock.restore);

describe('git.getRepoRoot', () => {
  it('getRepoRoot resolves to Git root directory on file in tracked directory', async () => {
    return expect(git.getRepoRoot('baz/qux/tracked-file.js')).resolves.toBe('baz');
  });

  it('getRepoRoot resolves to undefined on file in untracked directory', async () => {
    return expect(git.getRepoRoot('foo/bar/no-tracked-file.js')).resolves.toBeUndefined();
  });
});

describe('git.isGitRepo', () => {
  it('isGitRepo resolves direct parent directory of .git directory to true', async () => {
    return expect(git.isGitRepo('baz/')).resolves.toBe(true);
  });

  it('isGitRepo resolves directory path ending in .git directory to true', async () => {
    return expect(git.isGitRepo('baz/.git')).resolves.toBe(true);
  });

  it('isGitRepo resolves file path containing an adjacent .git directory to true', async () => {
    return expect(git.isGitRepo('baz/some-file.js')).resolves.toBe(true);
  });

  it('isGitRepo resolves directory path without a .git directory to false', async () => {
    return expect(git.isGitRepo('foo/bar')).resolves.toBe(false);
  });

  it('isGitRepo resolves nonexistent path ending in .git directory to false', async () => {
    return expect(git.isGitRepo('foo/bar/.git')).resolves.toBe(false);
  });
});

// process.stdout.write(`directory: ${directory}` + '\n');

describe('git.isGitTracked', () => {
  it('isGitTracked resolves tracked file to true', async () => {
    return expect(git.isGitTracked('baz/qux/tracked-file.js')).resolves.toBe('absent');
  });
});