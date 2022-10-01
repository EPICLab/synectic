import { PathLike } from 'fs-extra';
import ignore, { Ignore } from 'ignore';
import { extractFilename, readDirAsyncDepth, readFileAsync } from '../io';

/**
 * Locate and parse ignore rules from all `.gitignore` files within a directory. Returns an Ignore class instance from the
 * [`ignore`](https://github.com/kaelzhang/node-ignore) library, where `.filter` and `.ignores` functions can then be used
 * to determine whether a git command should operate on a given filepath.
 *
 * @param dir The relative or absolute directory path to search.
 * @param useGitRules Include ignore rules common to git projects (i.e. excluding `.git` and `node_modules` directories).
 * @returns {Promise<Ignore>} A Promise object containing a Ignore object that can be interacted with according to the 
 * [`ignore`](https://github.com/kaelzhang/node-ignore) API documentation.
 */
export const getIgnore = async (dir: PathLike, useGitRules = false): Promise<Ignore> => {
    const ignoreFiles = (await readDirAsyncDepth(dir, 2)).filter(filename => extractFilename(filename) === '.gitignore');
    const ignoreManager = ignore();
    ignoreFiles.map(async ignoreFile => {
        const content = await readFileAsync(ignoreFile, { encoding: 'utf-8' });
        ignoreManager.add(content);
    });
    if (useGitRules) {
        // this rule is standard for git-based projects
        ignoreManager.add('.git');
        // .gitignore files often incldue 'node_modules/' as a rule, but node-ignore requires the trailing '/' for directories and node 
        // `path` mismatches that by returning only the directory name. See: https://github.com/kaelzhang/node-ignore#2-filenames-and-dirnames
        ignoreManager.add('node_modules');
        // A .DS_Store file is a Mac OS X folder information file that stores custom attributes of the containing folder.
        ignoreManager.add('.DS_Store');
    }
    return ignoreManager;
}