import * as merge from './git-merge';
import * as gitLog from './git-log';
import { mock, MockInstance } from '../../test-utils/mock-fs';
import { join, normalize } from 'path';

describe('containers/git-merge', () => {
    let mockedInstance: MockInstance;
    beforeAll(async () => {
        jest.spyOn(gitLog, 'log').mockResolvedValue([
            {
                oid: '2a57bfcebde7479fd10578ae7da65c93fbb41514',
                message: 'example commit',
                parents: [],
                author: {
                    name: 'John Doe',
                    email: 'jdoe@company.com',
                    timestamp: undefined
                }
            }
        ]);
        const instance = await mock({
            '.syn': {
                'bad-branch': {
                    '.git': `gitdir: ${normalize('foo/.git/worktrees/bad-branch')}`,
                    'delta.txt': 'file contents'
                }
            },
            foo: {
                'add.ts': 'content',
                '.git': {
                    worktrees: {
                        'bad-branch': {
                            gitdir: `${normalize('.syn/bad-branch/.git')}`
                        }
                    }
                }
            }
        });
        return mockedInstance = instance;
    });

    afterAll(() => {
        mockedInstance.reset();
        jest.clearAllMocks();
    });

    it('processMergeOutput handles already merged branches', async () => {
        const output = {
            stdout: `Already up to date.`,
            stderr: ''
        };
        return expect(merge.processMergeOutput(output, 'foo/')).resolves.toStrictEqual({
            status: 'Passing',
            alreadyMerged: true,
            fastForward: false,
            output: output.stdout
        });
    });

    it('processMergeOutput handles successful fast-forward merges', async () => {
        const output = {
            stdout: `Updating d044183..57dc89e
Fast-forward
 test-1.txt | 0
 test-2     | 0
 2 files changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 test-1.txt
 create mode 100644 test-2
 `,
            stderr: ''
        };
        return expect(merge.processMergeOutput(output, 'foo/')).resolves.toStrictEqual({
            status: 'Passing',
            alreadyMerged: false,
            fastForward: true,
            output: output.stdout
        });
    });

    it('processMergeOutput handles successful merges using merge strategies', async () => {
        const output = {
            stdout: `Merge made by the 'recursive' strategy.
 file1_merge.txt | 0
 file2_merge_.text | 0
 2 files changed, 0 insertions(+), 0 deletions(-)
 create mode 100644 file1_merge.txt
 create 100644 file 2_merge.txt
 `,
            stderr: ''
        };
        return expect(merge.processMergeOutput(output, 'foo/')).resolves.toStrictEqual({
            status: 'Passing',
            alreadyMerged: false,
            fastForward: false,
            mergeStrategy: 'recursive',
            mergeCommit: '2a57bfcebde7479fd10578ae7da65c93fbb41514',
            output: output.stdout
        });
    });

    it('processMergeOutput handles successful rebase merges', async () => {
        const output = {
            stdout: `Successfully rebased and updated refs/heads/feat_branch.\n`,
            stderr: ''
        };
        return expect(merge.processMergeOutput(output, 'foo/')).resolves.toStrictEqual({
            status: 'Passing',
            alreadyMerged: false,
            fastForward: false,
            mergeStrategy: 'rebase',
            output: output.stdout
        });
    });

    it('processMergeOutput handles failed fast-forward merges', async () => {
        const output = {
            stdout: '',
            stderr: `fatal: Not possible to fast-forward, aborting.\n`
        };
        return expect(merge.processMergeOutput(output, 'foo/')).resolves.toStrictEqual({
            status: 'Failing',
            alreadyMerged: false,
            fastForward: false,
            output: output.stderr
        });
    });

    it('processMergeOutput handles halted merges with unmerged files', async () => {
        const output = {
            stdout: 'Updating 4796a15..75b2762',
            stderr: `error: Your local changes to the following files would be overwritten by merge:
    add.ts
Please commit your changes or stash them before you merge.
Aborting`
        };
        return expect(merge.processMergeOutput(output, 'foo/')).resolves.toStrictEqual({
            status: 'Failing',
            alreadyMerged: false,
            fastForward: false,
            output: output.stderr
        });
    });

    it('processMergeOutput handles failed merges with merge conflicts', async () => {
        const output = {
            stdout: `Auto-merging merge.txt
CONFLICT (content): Merge conflict in merge.txt
Automatic merge failed; fix conflicts and then commit the result.`,
            stderr: ''
        };
        // mockedInstance.getRoot() must be used since __dirname will escape the mocked FS
        const absoluteFilepath = join('/private', mockedInstance.getRoot(), 'foo', 'merge.txt');
        return expect(merge.processMergeOutput(output, 'foo/')).resolves.toStrictEqual({
            status: 'Failing',
            alreadyMerged: false,
            fastForward: false,
            output: output.stdout,
            conflicts: [absoluteFilepath]
        });
    });

    it('processMergeOutput handles failed rebase merges', async () => {
        const output = {
            stdout: `Auto-merging git_rebase/script2.sh
            CONFLICT (content): Merge conflict in git_rebase/script2.sh
            error: could not apply 7bb4ce4... Updated script2.sh
            Resolve all conflicts manually, mark them as resolved with
            "git add/rm <conflicted_files>", then run "git rebase --continue".
            You can instead skip this commit: run "git rebase --skip".
            To abort and get back to the state before "git rebase", run "git rebase --abort".
            Could not apply 7bb4ce4... Updated script2.sh`,
            stderr: ''
        };
        // mockedInstance.getRoot() must be used since __dirname will escape the mocked FS
        const absoluteFilepath = join('/private', mockedInstance.getRoot(), 'foo', 'git_rebase', 'script2.sh');
        return expect(merge.processMergeOutput(output, 'foo/')).resolves.toStrictEqual({
            status: 'Failing',
            alreadyMerged: false,
            fastForward: false,
            output: output.stdout,
            conflicts: [absoluteFilepath]
        });
    });
});