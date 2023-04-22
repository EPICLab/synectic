import { exec } from 'child_process';
import util from 'util';
import { readDirAsync } from './io';
import { getBranchRoot, getWorktreePaths } from './git';
import { Repository } from '../store/slices/repos';

const promiseExec = util.promisify(exec);

export const build = async (
  repo: Repository,
  base: string
): Promise<{ installCode: number; buildCode: number }> => {
  const branchRoot = await getBranchRoot(repo.root, base);
  if (!branchRoot) return { installCode: -1, buildCode: -1 };
  const worktree = await getWorktreePaths(branchRoot);
  if (!worktree.dir) return { installCode: -1, buildCode: -1 };

  const rootFiles = await readDirAsync(worktree.dir);
  const packageManager = rootFiles.find(file => file === 'yarn.lock') ? 'yarn' : 'npm';

  let [installCode, buildCode] = [-1, -1];
  try {
    const installResults = promiseExec(`${packageManager} install`, {
      cwd: worktree.dir.toString()
    });
    installResults.child.stdout?.on('data', data => console.log('INSTALL: ' + data));
    installResults.child.stderr?.on('data', data => console.log('INSTALL error: ' + data));
    installResults.child.on('close', code => {
      console.log(`INSTALL 'close' listener found code: ${code}`);
      installCode = Number(code);
    });
    installResults.child.on('exit', code => {
      console.log(`INSTALL 'exit' listener found code: ${code}`);
      installCode = Number(code);
    });
    installResults.child.on('error', error => {
      console.log("INSTALL 'error' listener found error:");
      console.log({ error });
    });
    await installResults;
  } catch (e) {
    console.log('INSTALL ERROR');
    console.log(e);
  }
  console.log(`BUILD intermediate`, { installCode, buildCode });

  if (installCode === 0) {
    const packageManagerBuildScript = packageManager === 'yarn' ? 'run' : 'run-script';
    try {
      const buildResults = promiseExec(`${packageManager} ${packageManagerBuildScript} build`, {
        cwd: worktree.dir.toString()
      });
      buildResults.child.stdout?.on('data', data => console.log('BUILD: ' + data));
      buildResults.child.stderr?.on('data', data => console.log('BUILD error: ' + data));
      buildResults.child.on('close', code => {
        console.log(`BUILD 'close' listener found code: ${code}`);
        buildCode = Number(code);
      });
      buildResults.child.on('exit', code => {
        console.log(`BUILD 'exit' listener found code: ${code}`);
        buildCode = Number(code);
      });
      buildResults.child.on('error', error => {
        console.log("BUILD 'error' listener found error:");
        console.log({ error });
      });
      await buildResults;
    } catch (e) {
      console.log('BUILD ERROR');
      console.error(e);
    }
  }

  console.log(`BUILD final`, { installCode, buildCode });

  return { installCode, buildCode };
};
