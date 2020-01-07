import mock from 'mock-fs';

import * as git from '../src/containers/git';
import parsePath from 'parse-path';
import { Repository } from '../src/types';

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

describe('git.extractFromURL', () => {
  it('extractFromURL resolves git://*', () => {
    const parsedURL = git.extractFromURL('git://github.com/octo-org/octo-repo');
    expect(parsedURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...parsedURL[0], protocol: 'git' }, 'github']);
  });

  it('extractFromURL resolves git://*.git', () => {
    const githubURL = git.extractFromURL('git://github.com/octo-org/octo-repo.git');
    expect(githubURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...githubURL[0], protocol: 'git' }, 'github']);
  });

  it('extractFromURL resolves https://*', () => {
    const githubURL = git.extractFromURL('https://github.com/octo-org/octo-repo');
    expect(githubURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...githubURL[0], protocol: 'https' }, 'github']);
  });

  it('extractFromURL resolves https://*.git', () => {
    const parsedURL = git.extractFromURL('https://github.com/octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...parsedURL[0], protocol: 'https' }, 'github']);
  });

  it('extractFromURL resolves ssh://*.git', () => {
    const url = 'ssh://git@github.com:octo-org/octo-repo.git';
    const parsedURL = git.extractFromURL(url);
    expect(parsedURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...parsedURL[0], protocol: 'ssh' }, 'github']);
  });

  it('extractFromURL resolves git@github.com:octo-org/octo-repo.git', () => {
    const parsedURL = git.extractFromURL('git@github.com:octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...parsedURL[0], protocol: 'ssh' }, 'github']);
  });

  it('extractFromURL resolves git@github.com:/octo-org/octo-repo.git', () => {
    const parsedURL = git.extractFromURL('git@github.com:/octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...parsedURL[0], protocol: 'ssh' }, 'github']);
  });

  it('extractFromURL resolves git@github.com:octo-org/octo-repo.git#2.7.0', () => {
    const parsedURL = git.extractFromURL('git@github.com:octo-org/octo-repo.git#2.7.0');
    expect(parsedURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...parsedURL[0], protocol: 'ssh' }, 'github']);
  });

  it('extractFromURL resolves git+https://github.com/octo-org/octo-repo.git', () => {
    const parsedURL = git.extractFromURL('git+https://github.com/octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...parsedURL[0], protocol: 'git', protocols: ['git', 'https'] }, 'github']);
  });

  it('extractFromURL resolves git+ssh://github.com/octo-org/octo-repo.git', () => {
    const parsedURL = git.extractFromURL('git+ssh://github.com/octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...parsedURL[0], protocol: 'git', protocols: ['git', 'ssh'] }, 'github']);
  });

  it('extractFromURL resolves git@gist URLs', () => {
    const githubURL = git.extractFromURL('git@gist.github.com:3135914.git');
    expect(githubURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...githubURL[0], protocol: 'ssh' }, 'github']);
  });

  it('extractFromURL resolves https://gist URLs', () => {
    const bitbucketURL = git.extractFromURL('https://bitbucket.org/snippets/vmaric/oed9AM/hello-json-message');
    const gitlabURL = git.extractFromURL('https://gitlab.com/snippets/1927595');
    expect(bitbucketURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...bitbucketURL[0], protocol: 'https', protocols: ['https'] }, 'bitbucket']);
    expect(gitlabURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...gitlabURL[0], protocol: 'https', protocols: ['https'] }, 'gitlab']);
  });

  it('extractFromURL resolves GitHub Enterprise GHE URLs', () => {
    const githubURL = git.extractFromURL('git://github.example.com/treygriffith/cellar.git');
    expect(githubURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...githubURL[0], protocol: 'git' }, 'github']);
  });

  it('extractFromURL resolves BitBucket URLs', () => {
    const gitURL = git.extractFromURL('git://bitbucket.org/bucket-org/bit-repo');
    const gitFullURL = git.extractFromURL('git://bitbucket.org/bucket-org/bit-repo.git');
    const httpsURL = git.extractFromURL('https://treygriffith@bitbucket.org/bucket-org/cellar.git');
    const sshURL = git.extractFromURL('ssh://git@bitbucket.org/bucket-org/cellar.git');
    const mercurialURL = git.extractFromURL('ssh://hp@bitbucket.org/bucket-org/cellar.git');
    expect(gitURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...gitURL[0], protocol: 'git' }, 'bitbucket']);
    expect(gitFullURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...gitFullURL[0], protocol: 'git' }, 'bitbucket']);
    expect(httpsURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...httpsURL[0], protocol: 'https' }, 'bitbucket']);
    expect(sshURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...sshURL[0], protocol: 'ssh' }, 'bitbucket']);
    expect(mercurialURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...mercurialURL[0], protocol: 'ssh' }, 'bitbucket']);
  });

  it('extractFromURL resolves GitLab URLs', () => {
    const gitURL = git.extractFromURL('git://gitlab.example.com/gitlab-org/lab-repo');
    const gitFullURL = git.extractFromURL('git://gitlab.example.com/gitlab-org/lab-repo.git');
    const httpsURL = git.extractFromURL('https://gitlab.com/gitlab-org/omnibus-gitlab');
    const sshURL = git.extractFromURL('ssh://git@gitlab.com:labuser/lab-repo.git');
    expect(gitURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...gitURL[0], protocol: 'git' }, 'gitlab']);
    expect(gitFullURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...gitFullURL[0], protocol: 'git' }, 'gitlab']);
    expect(httpsURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...httpsURL[0], protocol: 'https' }, 'gitlab']);
    expect(sshURL).toMatchObject<[parsePath.ParsedPath, Repository['oauth']]>([{ ...sshURL[0], protocol: 'ssh' }, 'gitlab']);
  });

});

describe('git.isGitTracked', () => {
  it('isGitTracked resolves tracked file to true', async () => {
    return expect(git.isGitTracked('baz/qux/tracked-file.js')).resolves.toBe('absent');
  });
});