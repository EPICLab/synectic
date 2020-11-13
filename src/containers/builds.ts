import { exec } from 'child_process';
import util from 'util';
import rimraf from 'rimraf';
import { clone, statusMatrix, commit, GitProgressEvent, checkout } from 'isomorphic-git';
import * as fs from 'fs-extra';
import * as http from 'isomorphic-git/http/node';
import { join } from 'path';

import { getRepoRoot } from '../containers/git';
import { Repository } from '../types';
import { readDirAsync } from './io';

const promiseExec = util.promisify(exec);

// Helper function that copies a file and moves it to a new directory
const copyFile = (src: string, filePath: string, dest: string) => {
  const sPath = join(src, filePath);
  const dPath = join(dest, filePath);
  fs.copyFile(sPath, dPath);
}

export const build = async (repo: Repository, branch: string): Promise<{ stdout: string; stderr: string; }> => {
  // Clone the remote repo into a temporary .syn sub-directory 
  const cloneRoot = join(repo.root.toString(), `.syn`);
  console.log(`cloneRoot: ${cloneRoot}, branch: ${branch}`);
  await clone({
    fs: fs,
    http: http,
    dir: cloneRoot,
    corsProxy: 'https://cors.isomorphic-git.org',
    url: repo.url.href,
    // ref: branch,
    // singleBranch: true,
    depth: 1,
    onProgress: (progress: GitProgressEvent) => console.log(`cloning objects: ${progress.loaded}/${progress.total}`)
  });

  await fs.copy(join(repo.root.toString(), '.git'), join(cloneRoot, '.git'));
  await checkout({
    fs: fs,
    dir: cloneRoot,
    ref: branch
  });

  // Get the staged files in the local repo
  const FILE = 0, WORKDIR = 2, STAGE = 3
  const stagedFiles = (await statusMatrix({ fs: fs, dir: repo.root.toString() }))
    .filter(row => row[WORKDIR] === 2 && row[STAGE] === 2)
    .map(row => row[FILE]);
  console.log(`\nStaged files: ${stagedFiles}\n`);

  // Copy the local staged files to the cloned repo
  stagedFiles.map((file) => copyFile(repo.root.toString(), file, cloneRoot));

  // Create a commit with these staged changes
  const com = await commit({
    fs: fs,
    dir: cloneRoot,
    author: {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
    },
    message: stagedFiles.length > 2 ? `Changes made to ${stagedFiles.length} files` : `Changes files: ${stagedFiles}`,
  });
  console.log(`\nCommit: ${com}\n`);

  const rootFiles = await readDirAsync(cloneRoot);
  const packageManager = rootFiles.find(file => file === 'yarn.lock') ? 'yarn' : 'npm';
  console.log({ packageManager });

  const installResults = await promiseExec(`${packageManager} install`, { cwd: cloneRoot });
  console.log({ installResults });

  const buildResults = await promiseExec(`${packageManager} ${packageManager === 'yarn' ? 'run' : 'run-script'} rebuild`, { cwd: cloneRoot });
  console.log({ buildResults });

  rimraf(cloneRoot, (error) => console.log(error));

  return promiseExec('echo "Build succeeded: exit code 0"');
}

const runBuild = async (remoteRepoURL: string, localRepo: fs.PathLike, copiedRepo: fs.PathLike): Promise<number | null> => {
  // Clone the remote repo to .syn directory within the copied repo's root dir
  const copiedRepoRoot = `${await getRepoRoot(copiedRepo)}\\.syn`;
  await clone({
    fs,
    http,
    dir: copiedRepoRoot,
    corsProxy: 'https://cors.isomorphic-git.org',
    url: remoteRepoURL,
    singleBranch: true,
    depth: 1,
  });
  console.log("\nFinished cloning!\n");

  // Get the staged files in the local repo
  const FILE = 0, WORKDIR = 2, STAGE = 3

  const stagedFiles = (await statusMatrix({ fs, dir: localRepo.toString() }))
    .filter(row => row[WORKDIR] === 2 && row[STAGE] === 2)
    .map(row => row[FILE]);
  console.log(`\nStaged files: ${stagedFiles}\n`);

  // Copy the local staged files to the cloned repo
  stagedFiles.map((file) => {
    copyFile(localRepo.toString(), file, copiedRepoRoot);
  });

  // Create a commit with these staged changes
  const com = await commit({
    fs,
    dir: copiedRepoRoot,
    author: {
      name: 'Mr. Test',
      email: 'mrtest@example.com',
    },
    message: `Made changes to files ${stagedFiles}`,
  });
  console.log(`\nCommit: ${com}\n`);

  // Run npm install
  const install = exec('npm install', { cwd: copiedRepoRoot }, (error, stdout, stderr) => {
    if (error) {
      console.log(`\n(install) Error stack:\n${error.stack}\n`);
      console.log(`\n(install) Error code: ${error.code}\n`);
      console.log(`\n(install) Signal received: ${error.signal}\n`);
    }
    console.log(`\n(install) Child Process STDOUT: ${stdout}\n`);
    console.log(`\n(install) Child Process STDERR: ${stderr}\n`);
  });

  let exitCode = null;

  // Run the build
  install.on('exit', (code) => {
    console.log(`\n(run-script build) Child process exited with exit code: ${code}\n`);

    const portfolio = exec('npm run-script build', { cwd: copiedRepoRoot }, (error, stdout, stderr) => {
      if (error) {
        console.log(`\n(run-script build) Error stack:\n${error.stack}\n`);
        console.log(`\n(run-script build) Error code: ${error.code}\n`);
        console.log(`\n(run-script build) Signal received: ${error.signal}\n`);
      }
      console.log(`\n(run-script build) Child Process STDOUT: ${stdout}\n`);
      console.log(`\n(run-script build) Child Process STDERR: ${stderr}\n`);
    });

    portfolio.on('exit', (code) => {
      console.log(`\n(run-script build) Child process exited with exit code: ${code}\n`);
      exitCode = code;
    });
  });

  return exitCode;
}

export default runBuild;