/* eslint-disable jest/no-commented-out-tests */
import mock from 'mock-fs';

import * as git from '../src/containers/git-plumbing';
import * as io from '../src/containers/io';

describe('git.resolveRef', () => {

  beforeAll(() => {
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
        bar: 'file contents'
      },
      qux: {
        '.git': {
          HEAD: 'b204b02bac07x4419809fe9768e9593509d68341',
          objects: {},
          refs: {
            heads: {
              master: 'b204b02bac07x4419809fe9768e9593509d68341\n',
            }
          }
        }
      },
      baz: {
        'sample.txt': 'non-tracked file and directory'
      }
    });
  });

  afterAll(mock.restore);

  it('resolveRef resolves to SHA-1 hash on a main worktree ref', async () => {
    jest.spyOn(io, 'isDirectory').mockResolvedValue(true); // mock-fs struggles to mock async IO calls, like io.isDirectory()
    return expect(git.resolveRef({ dir: 'baseRepo/', ref: 'master' })).resolves.toBe('f204b02baf1322ee079fe9768e9593509d683412');
  })

  it('resolveRef resolves to SHA-1 hash on a linked worktree ref', async () => {
    jest.spyOn(io, 'isDirectory').mockResolvedValue(false); // mock-fs struggles to mock async IO calls, like io.isDirectory()
    return expect(git.resolveRef({ dir: 'foo/', ref: 'master' })).resolves.toBe('f204b02baf1322ee079fe9768e9593509d683412');
  })
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

// describe('git.isGitRepo', () => {
//   it('isGitRepo resolves direct parent directory of .git directory to true', async () => {
//     return expect(git.isGitRepo(`${mockGitPath}/foo/baz/`)).resolves.toBe(true);
//   });

//   it('isGitRepo resolves directory path ending in .git directory to true', async () => {
//     return expect(git.isGitRepo(`${mockGitPath}/foo/baz/.git`)).resolves.toBe(true);
//   });

//   it('isGitRepo resolves file path containing an adjacent .git directory to true', async () => {
//     return expect(git.isGitRepo(`${mockGitPath}/foo/baz/another-file.ts`)).resolves.toBe(true);
//   });

//   it('isGitRepo resolves directory path without a .git directory to false', async () => {
//     return expect(git.isGitRepo(`${mockGitPath}/foo/bar/`)).resolves.toBe(false);
//   });

//   it('isGitRepo resolves nonexistent path ending in .git directory to false', async () => {
//     return expect(git.isGitRepo(`${mockGitPath}/foo/bar/.git`)).resolves.toBe(false);
//   });
// });