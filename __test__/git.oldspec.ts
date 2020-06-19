import mock from 'mock-fs';

import * as git from '../src/containers/git';
import parsePath from 'parse-path';
import { Repository } from '../src/types';
import { ActionKeys } from '../src/store/actions';

beforeEach(() => {
  mock({
    'foo/bar': {
      'no-tracked-file.js': 'file contents',
    },
    baz: {
      '.git': {
        'COMMIT_EDITMSG': 'additional file',
        'HEAD': 'ref: refs/heads/feature/test',
        branches: {},
        'config': '[core]\nrepositoryformatversion = 0\nfilemode = true\nbare = false\nlogallrefupdates = true\nignorecase = true\nprecomposeunicode = true\n[remote "origin"]\nurl = git@github.com:test/test.git\nfetch = +refs / heads/*:refs/remotes/origin/*\n[branch "master"]\nremote = origin\nmerge = refs/heads/master',
        'description': 'Unnamed repository; edit this file \'description\' to name the repository.',
        hooks: {},
        'index': '',
        info: {
          'exclude': ''
        },
        logs: {
          'HEAD': '0000000000000000000000000000000000000000 64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb Anonymous Editor <anon@github.com> 1587704299 -0700	commit (initial): initial commit\n64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb 64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb Anonymous Editor<anon@github.com> 1587704337 - 0700	checkout: moving from master to remote - only\n64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb 64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb Anonymous Editor < anon@github.com> 1587704348 - 0700	checkout: moving from remote - only to master\n64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb 64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb Anonymous Editor < anon@github.com> 1587704474 - 0700	checkout: moving from master to feature / test\n64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb 64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb Anonymous Editor < anon@github.com> 1587704493 - 0700	checkout: moving from feature / test to master\n64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb edd823f67f37886d7fccb8c6c80e602e152ab737 Anonymous Editor < anon@github.com> 1587704517 - 0700	commit: second commit\nedd823f67f37886d7fccb8c6c80e602e152ab737 edd823f67f37886d7fccb8c6c80e602e152ab737 Anonymous Editor < anon@github.com> 1587704539 - 0700	checkout: moving from master to feature / test',
          refs: {
            heads: {
              feature: {
                'test': '0000000000000000000000000000000000000000 edd823f67f37886d7fccb8c6c80e602e152ab737 Anonymous Editor <anon@github.com> 1587704539 -0700	branch: Created from HEAD'
              },
              'master': '0000000000000000000000000000000000000000 64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb Anonymous Editor <anon@github.com> 1587704299 -0700	commit (initial): initial commit\n64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb edd823f67f37886d7fccb8c6c80e602e152ab737 Anonymous Editor<anon@github.com> 1587704517 - 0700	commit: second commit',
              'remote-only': '0000000000000000000000000000000000000000 64bf55ed3fd4813e4f3fa53d34c6982bd9a5ebdb Anonymous Editor <anon@github.com> 1587704337 -0700	branch: Created from HEAD'
            }
          }
        },
        objects: {
          'f4': {
            'ef1ec2ca088438c2b8fd7a0666d90ee856d278': `b'x\x01+)JMU01f040031Q()JL\xceNM\xd1M\xcb\xccI\xd5\xcb*fP=\x10\xf79y\xae\xae:_\xfd\xf3\xd4ee\x19\x1ffpj\x1f\x05\x00\xa8\xdb\x12\xa5'`
          },
          '4c': {
            '40253aace4ffa46c943311d77232cb5d4ffe93': 'xK??OR04a?/?H-RH??+I?+?S?l%'
          },
          '6b': {
            'ac42b3ad094791e5643b984c67d61f2511e342': 'x+)JMU01f040031Q()JL?NM?M??I??*f?d???:\'p?#??? a ??\'???@?%'
          },
          'a8': {
            '1c46a181052b4bbb0037b7ab192540c4234054': '?0??\n@ў3?h ?@Rl	U ?? L0 % RH$b ?? DG ??? ޏuߓ ?# ?? !?????# ?????? ԡ_ ???? n ??? [=`Jq???[-0??%??!?Z???C??.?0X???֚x?U?SL*Ig?q?\nl?C%'
          },
          'c4': {
            '830bff55bf16460493a4a39c6cc0de18413971': 'xK??OR04e(J?K??UH??+I?+?[y?%'
          },
          'cb': {
            'e4abc7f0083cecb444954d6a1c944b0ef210c9': 'x+)JMU07`01???\n? /????h?8??o[?M?a?*\n? LL ?? sSu ? 2sR????? 8m^??>? i ??\n?? k򪂏??? [%'
          },
          '25': {
            'c05ef3639d2d270e7fe765a67668f098092bc5': '?0??\n??^??? KB ?	? C ? 8P	Ԧ?? `???t:???2`"w0ԹVks5?????Fv̺?	d0z?^i?6?Q??R?\n?*? d ? ?? a ?%& +? d ?? q ? +?\n??˶\\?*?޶????? 06x?? G ?? V ?} ? _Em½??? P ?%'
          },
          'info': {},
          'pack': {}
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
      'some-file.js': 'random content',
      'qux/tracked-file.js': 'other content',
    },
    zap: {
      '.git': {
        'HEAD': '5862ad5c2f677a657b09fe5651693df60fb64227',
        'config': '[core]\nrepositoryformatversion = 0\nfilemode = true\nbare = false\nlogallrefupdates = true\nignorecase = true\nprecomposeunicode = true\n[remote "origin"]\nurl = git@github.com:test/test.git\nfetch = +refs / heads/*:refs/remotes/origin/*\n[branch "master"]\nremote = origin\nmerge = refs/heads/master',
        objects: {
          'e2': {
            '7bb34b0807ebf1b91bb66a4c147430cde4f08f': Buffer.from([98, 108, 111, 98, 32, 50, 53, 0, 77, 121, 32, 100, 97, 116, 97, 32, 102, 105, 116, 115, 32, 111, 110, 32, 111, 110, 101, 32, 108, 105, 110, 101, 10]),
          },
          '42': {
            '2a8a27eebd3798c661f2c0788dc8d6dfe597a1': `blob 26\x00My data fits on line line\n`
          }
        }
      },
      'another-file.ts': 'directory is tracked by git, but the git repo is currently in a detached HEAD state'
    }
  });
});

afterEach(mock.restore);

describe('git.extractGitCompressed', () => {
  it('extractGitCompressed resolves git object file to string', async () => {
    return expect(git.extractGitCompressed('zap/.git/objects/e2/7bb34b0807ebf1b91bb66a4c147430cde4f08f')).resolves.toStrictEqual('blob 25\u0000My data fits on one line\n');
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

// process.stdout.write(`directory: ${directory}\n`);

describe('git.extractFromURL', () => {
  it('extractFromURL resolves git://*', () => {
    const parsedURL = git.extractFromURL('git://github.com/octo-org/octo-repo');
    expect(parsedURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...parsedURL.url, protocol: 'git' }, oauth: 'github' });
  });

  it('extractFromURL resolves git://*.git', () => {
    const githubURL = git.extractFromURL('git://github.com/octo-org/octo-repo.git');
    expect(githubURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...githubURL.url, protocol: 'git' }, oauth: 'github' });
  });

  it('extractFromURL resolves https://*', () => {
    const githubURL = git.extractFromURL('https://github.com/octo-org/octo-repo');
    expect(githubURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...githubURL.url, protocol: 'https' }, oauth: 'github' });
  });

  it('extractFromURL resolves https://*.git', () => {
    const parsedURL = git.extractFromURL('https://github.com/octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...parsedURL.url, protocol: 'https' }, oauth: 'github' });
  });

  it('extractFromURL resolves ssh://*.git', () => {
    const parsedURL = git.extractFromURL('ssh://git@github.com:octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...parsedURL.url, protocol: 'ssh' }, oauth: 'github' });
  });

  it('extractFromURL resolves git@github.com:octo-org/octo-repo.git', () => {
    const parsedURL = git.extractFromURL('git@github.com:octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...parsedURL.url, protocol: 'ssh' }, oauth: 'github' });
  });

  it('extractFromURL resolves git@github.com:/octo-org/octo-repo.git', () => {
    const parsedURL = git.extractFromURL('git@github.com:/octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...parsedURL.url, protocol: 'ssh' }, oauth: 'github' });
  });

  it('extractFromURL resolves git@github.com:octo-org/octo-repo.git#2.7.0', () => {
    const parsedURL = git.extractFromURL('git@github.com:octo-org/octo-repo.git#2.7.0');
    expect(parsedURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...parsedURL.url, protocol: 'ssh' }, oauth: 'github' });
  });

  it('extractFromURL resolves git+https://github.com/octo-org/octo-repo.git', () => {
    const parsedURL = git.extractFromURL('git+https://github.com/octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...parsedURL.url, protocol: 'git', protocols: ['git', 'https'] }, oauth: 'github' });
  });

  it('extractFromURL resolves git+ssh://github.com/octo-org/octo-repo.git', () => {
    const parsedURL = git.extractFromURL('git+ssh://github.com/octo-org/octo-repo.git');
    expect(parsedURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...parsedURL.url, protocol: 'git', protocols: ['git', 'ssh'] }, oauth: 'github' });
  });

  it('extractFromURL resolves git@gist URLs', () => {
    const githubURL = git.extractFromURL('git@gist.github.com:3135914.git');
    expect(githubURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...githubURL.url, protocol: 'ssh' }, oauth: 'github' });
  });

  it('extractFromURL resolves https://gist URLs', () => {
    const bitbucketURL = git.extractFromURL('https://bitbucket.org/snippets/vmaric/oed9AM/hello-json-message');
    const gitlabURL = git.extractFromURL('https://gitlab.com/snippets/1927595');
    expect(bitbucketURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...bitbucketURL.url, protocol: 'https', protocols: ['https'] }, oauth: 'bitbucket' });
    expect(gitlabURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...gitlabURL.url, protocol: 'https', protocols: ['https'] }, oauth: 'gitlab' });
  });

  it('extractFromURL resolves GitHub Enterprise GHE URLs', () => {
    const githubURL = git.extractFromURL('git://github.example.com/treygriffith/cellar.git');
    expect(githubURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...githubURL.url, protocol: 'git' }, oauth: 'github' });
  });

  it('extractFromURL resolves BitBucket URLs', () => {
    const gitURL = git.extractFromURL('git://bitbucket.org/bucket-org/bit-repo');
    const gitFullURL = git.extractFromURL('git://bitbucket.org/bucket-org/bit-repo.git');
    const httpsURL = git.extractFromURL('https://treygriffith@bitbucket.org/bucket-org/cellar.git');
    const sshURL = git.extractFromURL('ssh://git@bitbucket.org/bucket-org/cellar.git');
    const mercurialURL = git.extractFromURL('ssh://hp@bitbucket.org/bucket-org/cellar.git');
    expect(gitURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...gitURL.url, protocol: 'git' }, oauth: 'bitbucket' });
    expect(gitFullURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...gitFullURL.url, protocol: 'git' }, oauth: 'bitbucket' });
    expect(httpsURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...httpsURL.url, protocol: 'https' }, oauth: 'bitbucket' });
    expect(sshURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...sshURL.url, protocol: 'ssh' }, oauth: 'bitbucket' });
    expect(mercurialURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...mercurialURL.url, protocol: 'ssh' }, oauth: 'bitbucket' });
  });

  it('extractFromURL resolves GitLab URLs', () => {
    const gitURL = git.extractFromURL('git://gitlab.example.com/gitlab-org/lab-repo');
    const gitFullURL = git.extractFromURL('git://gitlab.example.com/gitlab-org/lab-repo.git');
    const httpsURL = git.extractFromURL('https://gitlab.com/gitlab-org/omnibus-gitlab');
    const sshURL = git.extractFromURL('ssh://git@gitlab.com:labuser/lab-repo.git');
    expect(gitURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...gitURL.url, protocol: 'git' }, oauth: 'gitlab' });
    expect(gitFullURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...gitFullURL.url, protocol: 'git' }, oauth: 'gitlab' });
    expect(httpsURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...httpsURL.url, protocol: 'https' }, oauth: 'gitlab' });
    expect(sshURL).toMatchObject<{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }>({ url: { ...sshURL.url, protocol: 'ssh' }, oauth: 'gitlab' });
  });
});

describe('git.getStatus', () => {
  it('isGitTracked resolves tracked file to true', async () => {
    return expect(git.getStatus('baz/qux/tracked-file.js')).resolves.toBe('absent');
  });
});

describe('git.extractRepo', () => {
  const existingRepo: Repository = {
    id: '34',
    name: 'test/test',
    root: 'foo/',
    corsProxy: new URL('https://cors.github.com/example'),
    url: parsePath('git@github.com:test/test.git'),
    refs: ['sampleBranch'],
    oauth: 'github',
    username: '',
    password: '',
    token: ''
  };

  it('extractRepo resolves untracked Git directory to { undefined repo, undefined action }', async () => {
    return expect(git.extractRepo('foo/bar/', [])).resolves.toStrictEqual({ repo: undefined, action: undefined, branchRef: undefined });
  });

  it('extractRepo resolves a new Git repository to { new repo, AddRepoAction action }', async () => {
    const { repo, action } = await git.extractRepo('baz/', []);
    expect(action?.type).toBe(ActionKeys.ADD_REPO);
    mock.restore(); // required to prevent snapshot rewriting because of file watcher race conditions in Jest
    expect({ ...repo, id: undefined }).toMatchSnapshot();
    expect({ type: action?.type, id: undefined, repo: { ...action?.repo, id: undefined } }).toMatchSnapshot();
  });

  it('extractRepo resolves an existing Git repository to { existing repo, UpdateRepoAction action }', async () => {
    const { repo, action } = await git.extractRepo('baz/', [existingRepo]);
    const updatedRepo = { ...existingRepo, refs: [...existingRepo.refs, 'feature/test'] };
    expect(repo).toMatchObject(updatedRepo);
    expect(action?.type).toBe(ActionKeys.UPDATE_REPO);
    expect(action?.repo).toMatchObject(updatedRepo);
  });

});