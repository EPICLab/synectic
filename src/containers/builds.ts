import { exec } from 'child_process';
import util from 'util';
import { checkout } from 'isomorphic-git';
import * as fs from 'fs-extra';
import { join } from 'path';

import type { Repository } from '../types';
import { clone, merge } from '../containers/git-porcelain';
import { readDirAsync } from './io';
import { removeUndefinedProperties } from './format';

const promiseExec = util.promisify(exec);

export const tempClone = async (repo: Repository, branch: string): Promise<string> => {
  const cloneRoot = join(repo.root.toString(), '../', '.syn');
  await clone({ repo: repo, dir: cloneRoot, ref: branch });
  return cloneRoot;
}

export const build = async (repo: Repository, base: string, compare: string): Promise<{ installCode: number; buildCode: number; }> => {
  const cloneRoot = await tempClone(repo, base);
  await checkout({ fs: fs, dir: cloneRoot, ref: base });

  const mergeResult = await merge(cloneRoot, base, compare);
  const ref = removeUndefinedProperties({ ref: mergeResult.oid });
  // this next step seems unnecessary, but isomorphic-git.merge stages a reversal changeset that negates the results of the merge
  // reverting the target branch back to the merged commit (via checkout) allows these reversal changesets to be removed
  await checkout({ fs: fs, dir: cloneRoot, ...ref });

  const rootFiles = await readDirAsync(cloneRoot);
  const packageManager = rootFiles.find(file => file === 'yarn.lock') ? 'yarn' : 'npm';

  let [installCode, buildCode] = [-1, -1];
  try {
    const installResults = promiseExec(`${packageManager} install`, { cwd: cloneRoot });
    installResults.child.stdout?.on('data', data => console.log('INSTALL: ' + data));
    installResults.child.stderr?.on('data', data => console.log('INSTALL error: ' + data));
    installResults.child.on('close', code => {
      console.log(`INSTALL 'close' listener found code: ${code}`);
      (code ? (installCode = code) : null);
    });
    installResults.child.on('exit', code => {
      console.log(`INSTALL 'exit' listener found code: ${code}`);
      (code ? (installCode = code) : null);
    });
    installResults.child.on('error', error => {
      console.log('INSTALL \'error\' listener found error:');
      console.log({ error });
    });
    await installResults;
  } catch (e) {
    console.log('INSTALL ERROR');
    console.log(e);
  }

  if (installCode === 0) {
    const packageManagerBuildScript = packageManager === 'yarn' ? 'run' : 'run-script';
    try {
      const buildResults = promiseExec(`${packageManager} ${packageManagerBuildScript} build`, { cwd: cloneRoot });
      buildResults.child.stdout?.on('data', data => console.log('BUILD: ' + data));
      buildResults.child.stderr?.on('data', data => console.log('BUILD error: ' + data));
      buildResults.child.on('close', code => {
        console.log(`BUILD 'close' listener found code: ${code}`);
        (code ? (buildCode = code) : null);
      });
      buildResults.child.on('exit', code => {
        console.log(`BUILD 'exit' listener found code: ${code}`);
        (code ? (buildCode = code) : null);
      });
      buildResults.child.on('error', error => {
        console.log('BUILD \'error\' listener found error:');
        console.log({ error });
      });
      await buildResults;
    } catch (e) {
      console.log('BUILD ERROR');
      console.error(e);
    }
  }

  fs.remove(cloneRoot, (error) => console.log(error));

  return { installCode: installCode, buildCode: buildCode };
}