import * as fs from 'fs-extra';
import * as path from 'path';
import * as git from 'isomorphic-git';
import * as casual from 'casual';
import sha1 from 'sha1';
import { MockInstance } from './mock-fs-promise';
import { readDirAsyncDepth, readFileAsync, writeFileAsync } from '../../src/containers/io';

/**
 * Accept some meta-information about the repository, and then a path to an existing .git directory
 * in order to create a consolidated packfile version of the git repository, which can be unpacked
 * for use as a mocked git repository inside of a mock-fs-promise instance.
 * 
 * Design principles for this Git repository mocking library (extending from `mock-fs-promise`):
 *   (1) Create fully functional local Git repositories
 *   (2) Deterministic repositories for simplified testing
 *   (3) Quick clean-up process for removing all filesystem entries
 *   (4) Support for advanced structures (i.e. linked worktrees)
 *   (5) Mocked Git server for responding to Git requests (i.e. clone, fetch, etc.)
 */

type SHA1 = ReturnType<typeof sha1>;

// Descriminated union type for emulating a `mutually exclusive or` (XOR) operation between parameter types
// Ref: https://github.com/microsoft/TypeScript/issues/14094#issuecomment-344768076
type IncludeOrExcludeList = { include: fs.PathLike[], exclude?: never } | { include?: never, exclude: fs.PathLike[] };

export type MockInstanceEnhanced = MockInstance & {
    getRepoRoot(): string;
    getCommits(): SHA1[];
    stage(filepath: fs.PathLike): Promise<void>;
    commit(commit: MockedCommit): Promise<string>;
}

type MockedCommit = {
    oid: SHA1,
    message: string,
    author: Partial<{
        name: string,
        email: string,
        timestamp: number,
        timezoneOffset: number
    }>,
    committer: Partial<{
        name: string,
        email: string,
        timestamp: number,
        timezoneOffset: number
    }>,
    files: 'all' | IncludeOrExcludeList
}

type MockedBranch = {
    name: string,
    base: string,
    ahead: MockedCommit[],
    behind?: number
}

export type MockedRepository = {
    config?: Partial<{
        'user.name': string,
        'user.email': string
    }>,
    url?: string,
    default: string,
    branches: MockedBranch[]
}

export const mockGit = async (instance: MockInstance, repo: MockedRepository): Promise<MockInstanceEnhanced> => {
    const dir = instance.getRoot();
    const gitdir = path.resolve(dir, '.git');
    const commits: SHA1[] = [];

    // check if a git repository already exists
    if (!(await fs.pathExists(gitdir))) {
        await git.init({ fs, dir, defaultBranch: repo.default });
        await git.setConfig({
            fs,
            dir,
            path: 'user.name',
            value: repo.config['user.name'] ? repo.config['user.name'] : casual.full_name
        });
        await git.setConfig({
            fs,
            dir,
            path: 'user.email',
            value: repo.config['user.email'] ? repo.config['user.email'] : casual.email
        });
        if (repo.url) {
            await git.addRemote({
                fs,
                dir,
                remote: 'origin',
                url: repo.url
            })
        }
        for (const branch of repo.branches) {
            const newCommits = await writeBranch(dir, branch);
            newCommits.map(commit => commits.push(commit));
        }
    }

    const stage = (filepath: fs.PathLike): Promise<void> => {
        return git.add({
            fs,
            dir: dir,
            filepath: filepath.toString()
        });
    }

    const commit = (commit: MockedCommit): Promise<string> => {
        return git.commit({
            fs,
            dir,
            message: commit.message,
            author: commit.author,
            committer: commit.author
        });
    }

    return {
        ...instance,
        getRepoRoot: () => gitdir,
        getCommits: () => commits,
        stage,
        commit
    };
}

const gitAddMany = async (dir: fs.PathLike, files: fs.PathLike[]) =>
    Promise.all(files.map(file => git.add({
        fs,
        dir: dir.toString(),
        filepath: file.toString()
    })));

const writeBranch = async (dir: string, branch: MockedBranch): Promise<SHA1[]> => {
    const commits: SHA1[] = [];

    // checkout the base branch into the working tree, if needed
    if ((await git.listBranches({ fs, dir })).length > 0) await git.checkout({
        fs,
        dir,
        ref: branch.base,
    });
    // branch off to the new branch
    await git.branch({
        fs,
        dir,
        ref: branch.name
    });
    // reset HEAD to point to previous commits, if needed
    if (branch.behind) {
        await gitReset(dir, `HEAD~${branch.behind}`, branch.name, true);
    }

    // add all branch-specific commits
    for (const [index, commit] of branch.ahead.entries()) {
        const allFiles = (await readDirAsyncDepth(dir)).map(file => path.relative(dir, file)).filter(filepath => filepath.length > 0);

        if (commit.files === 'all') {
            if (index > 0) await randomFileUpdate(allFiles);
            await gitAddMany(dir, allFiles);
        } else if (commit.files.include) {
            if (index > 0) await randomFileUpdate(commit.files.include);
            await gitAddMany(dir, commit.files.include);
        } else if (commit.files.exclude) {
            const stringifiedExcludes = commit.files.exclude.map(file => file.toString());
            const includedFiles = allFiles.filter(file => !stringifiedExcludes.includes(file));
            if (index > 0) await randomFileUpdate(includedFiles);
            await gitAddMany(dir, includedFiles);
        }

        commits.push(await git.commit({
            fs,
            dir,
            message: commit.message,
            author: commit.author,
            committer: commit.committer
        }));
    }
    return commits;
}

// Copied from `jcubic`: https://github.com/jcubic/git/blob/gh-pages/js/main.js#L1915
// Same as `git reset --soft` or `git reset --hard` for moving back the current HEAD pointer
// on a git branch.
const gitReset = async (dir: string, ref: string, branch: string, hard = false) => {
    const re = /^HEAD~([0-9]+)$/;
    const match = ref.match(re);
    if (match) {
        const count = +match[1];
        const commits = await git.log({ dir, fs, depth: count + 1 });
        return new Promise<void>((resolve, reject) => {
            if (commits.length < count + 1) {
                return reject('Not enough commits');
            }
            const commit = commits.pop().oid;
            fs.writeFile(`${dir}/.git/refs/heads/${branch}`, commit + '\n', (err) => {
                if (err) {
                    return reject(err);
                }
                if (!hard) {
                    resolve();
                } else {
                    // clear the index (if any)
                    fs.unlink(`${dir}/.git/index`, (err) => {
                        if (err) {
                            return reject(err);
                        }
                        // checkout the branch into the working tree
                        git.checkout({ fs, dir, ref: branch }).then(resolve);
                    })
                }
            })
        })
    }
    return Promise.reject(`Wrong ref ${ref}`);
}

// given a set of filepaths, either targeted or randomly select file and update with additional content
const randomFileUpdate = async (filepaths: fs.PathLike[], index = getRandomInt(filepaths.length)) => {
    const filepath = path.resolve(filepaths[index].toString());
    const fileContent = await readFileAsync(filepath, { encoding: 'utf-8' });
    await writeFileAsync(filepath, fileContent + casual.text);
}

const getRandomInt = (max: number, min = 1) => Math.max(
    Math.floor(Math.random() * Math.floor(max)), min
);