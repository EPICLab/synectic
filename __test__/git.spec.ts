import mock from 'mock-fs';

import * as git from '../src/containers/git';

beforeEach(() => {
  mock({
    foo: {
      bar: {
        'untracked-file.js': 'directory is untracked by git',
      },
      baz: {
        '.git': {
          'HEAD': 'ref: refs/heads/feature/test',
          'config': '[core]\nrepositoryformatversion = 0\nfilemode = true\nbare = false\nlogallrefupdates = true\nignorecase = true\nprecomposeunicode = true\n[remote "origin"]\nurl = git@github.com:test/test.git\nfetch = +refs / heads/*:refs/remotes/origin/*\n[branch "master"]\nremote = origin\nmerge = refs/heads/master',
          objects: {
            'e2': {
              '7bb34b0807ebf1b91bb66a4c147430cde4f08f': Buffer.from([98, 108, 111, 98, 32, 50, 53, 0, 77, 121, 32, 100, 97, 116, 97, 32, 102, 105, 116, 115, 32, 111, 110, 32, 111, 110, 101, 32, 108, 105, 110, 101, 10]),
            },
            '42': {
              '2a8a27eebd3798c661f2c0788dc8d6dfe597a1': `blob 26\x00My data fits on line line\n`
            }
          },
          refs: {
            heads: {
              feature: {
                'test': '4c40253aace4ffa46c943311d77232cb5d4ffe93'
              },
              'master': '4c40253aace4ffa46c943311d77232cb5d4ffe93',
              'remote-only': 'a81c46a181052b4bbb0037b7ab192540c4234054'
            },
          }
        },
        'tracked-file.js': 'directory is tracked by git',
        'another-file.ts': 'directory is tracked by git, but the git repo is currently in a detached HEAD state'
      },
      qux: {
        '.git': {
          'HEAD': '5862ad5c2f677a657b09fe5651693df60fb64227',
          'config': '[core]\nrepositoryformatversion = 0\nfilemode = true\nbare = false\nlogallrefupdates = true\nignorecase = true\nprecomposeunicode = true\n[remote "origin"]\nurl = git@github.com:test/test.git\nfetch = +refs / heads/*:refs/remotes/origin/*\n[branch "master"]\nremote = origin\nmerge = refs/heads/master',
          objects: {}
        }
      }
    }
  });
});

afterEach(mock.restore);

describe('git.currentBranch', () => {
  it('currentBranch resolves to Git branch name on a tracked directory', async () => {
    return expect(git.currentBranch({ dir: 'foo/baz/' })).resolves.toBe('feature/test');
  });

  it('currentBranch resolves to undefined on a tracked directory with detached HEAD', async () => {
    return expect(git.currentBranch({ dir: 'foo/qux/' })).resolves.toBeUndefined();
  });

  it('currentBranch fails with an error on an untracked directory', async () => {
    return expect(git.currentBranch({ dir: 'foo/bar/' })).rejects.toThrow(/Could not find HEAD/);
  });
});

describe('git.getRepoRoot', () => {
  it('getRepoRoot resolves to Git root directory on file in tracked directory', async () => {
    return expect(git.getRepoRoot('foo/baz/tracked-file.js')).resolves.toBe('foo/baz');
  });

  it('getRepoRoot resolves to undefined on file in untracked directory', async () => {
    return expect(git.getRepoRoot('foo/bar/untracked-file.js')).resolves.toBeUndefined();
  });
});

describe('git.isGitRepo', () => {
  it('isGitRepo resolves direct parent directory of .git directory to true', async () => {
    return expect(git.isGitRepo('foo/baz/')).resolves.toBe(true);
  });

  it('isGitRepo resolves directory path ending in .git directory to true', async () => {
    return expect(git.isGitRepo('foo/baz/.git')).resolves.toBe(true);
  });

  it('isGitRepo resolves file path containing an adjacent .git directory to true', async () => {
    return expect(git.isGitRepo('foo/baz/another-file.ts')).resolves.toBe(true);
  });

  it('isGitRepo resolves directory path without a .git directory to false', async () => {
    return expect(git.isGitRepo('foo/bar/')).resolves.toBe(false);
  });

  it('isGitRepo resolves nonexistent path ending in .git directory to false', async () => {
    return expect(git.isGitRepo('foo/bar/.git')).resolves.toBe(false);
  });
});

describe('git.extractRepoName', () => {
  it('extractRepoName resolves git://*', () => {
    expect(git.extractRepoName('git://github.com/octo-org/octo-repo')).toBe('octo-org/octo-repo');
  });

  it('extractRepoName resolves git://*.git', () => {
    expect(git.extractRepoName('git://github.com/octo-org/octo-repo.git')).toBe('octo-org/octo-repo');
  });

  it('extractRepoName resolves https://*', () => {
    expect(git.extractRepoName('https://treygriffith@bitbucket.org/bucket-org/cellar.git')).toBe('bucket-org/cellar');
  });

  it('extractRepoName resolves https://*.git', () => {
    expect(git.extractRepoName('https://gitlab.com/gitlab-org/omnibus-gitlab.git')).toBe('gitlab-org/omnibus-gitlab');
  });

  it('extractRepoName resolves ssh://*.git', () => {
    expect(git.extractRepoName('ssh://git@gitlab.com:labuser/lab-repo.git')).toBe('labuser/lab-repo');
  });

  it('extractRepoName resolves https://gist', () => {
    expect(git.extractRepoName('https://bitbucket.org/snippets/vmaric/oed9AM/hello-json-message')).toBe('vmaric/oed9AM/hello-json-message');
  });

  it('extractRepoName resolves git@gist', () => {
    expect(git.extractRepoName('git@gist.github.com:3135914.git')).toBe('3135914');
  });

  it('extractRepoName resolves git+https://*.git#tag', () => {
    expect(git.extractRepoName('git+https://github.com/octo-org/octo-repo.git#2.7.0')).toBe('octo-org/octo-repo');
  });
});