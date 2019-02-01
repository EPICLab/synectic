import * as fs from 'fs-extra';
import * as path from 'path';
// import * as util from 'util';
import * as git from 'isomorphic-git';
git.plugins.set('fs', fs);

export function getRepoRoot(p: fs.PathLike): Promise<string> {
  return git.findRoot({ filepath: p.toString() });
}

/**
 * Synchronous check for presence of .git within directory to validate Git version control.
 * @param directory A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @return Boolean indicating directory under Git version control.
 */
export function isGitRepo(directory: fs.PathLike): boolean {
  const p: string = path.resolve(path.join(directory.toString(), '/.git'));
  // TODO: Handle cases where directory includes a filename which needs to be removed.
  let result: boolean;
  try {
    fs.statSync(p);
    result = true;
  } catch (error) {
    result = false;
  }
  return result;
}

/**
 * Asynchronous check for presence of .git within directory to validate Git version control.
 * @param directory A path to a file. If a URL is provided, it must use the `file:` protocol.
 * @return Boolean indicating directory under Git version control.
 */
export function isGitRepoAsync(directory: fs.PathLike): Promise<boolean> {
  const p: string = path.resolve(path.join(directory.toString(), '/.git'));
  return new Promise((resolve, _) => {
    fs.stat(p)
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
  });
  // return fs.stat(p)
  //   .then(() => true)
  //   .catch(() => false);
}
