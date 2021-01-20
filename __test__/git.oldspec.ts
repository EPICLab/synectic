/* eslint-disable max-len */
import mock from 'mock-fs';

import * as git from '../src/containers/git-experimental';

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
            // eslint-disable-next-line quotes
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
            '2a8a27eebd3798c661f2c0788dc8d6dfe597a1': 'blob 26\x00My data fits on line line\n'
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

// process.stdout.write(`directory: ${directory}\n`);