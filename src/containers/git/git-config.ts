import { delete as deleteProperty, get as getProperty, has as hasProperty, set as setProperty } from 'dot-prop';
import { PathLike } from 'fs-extra';
import getGitConfigPath from 'git-config-path';
import * as ini from 'ini';
import parse from 'parse-git-config';
import { join, resolve } from 'path';
import { writeFileAsync } from '../io';
import { removeUndefinedProperties } from '../utils';
import { getWorktreePaths } from './git-path';

export type GitConfig = { scope: 'none' } | { scope: 'local' | 'global', value: string, origin?: string };

/**
 * Read an entry from git-config files; modeled after the *isomorphic-git/getConfig* function, but includes additional functionality to resolve global 
 * git-config files. The return object indicates the value for the git config entry and the scope (`local` or `global`) in which the value was located. 
 * If the `local` or `global` parameter are disabled, set to `false`, then the search will not attempt to locate git-config files in that scope. If both
 * parameters are enabled, then `local` scope is searched first and only if there were no matches will the `global` scope then be searched.
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The working tree directory path.
 * @param obj.gitdir - The git directory path.
 * @param obj.keyPath - The dot notation path of the desired git config entry (i.e. `user.name` or `user.email`).
 * @param obj.local - Allow search in the `local` git-config file (i.e. the `local` scope); defaults to true.
 * @param obj.global - Allow search in the `global` git-config file (i.e. the `global` scope); defaults to true.
 * @param obj.showOrigin - Show the origin path of the git-config file containing the matched entry.
 * @returns {Promise<GitConfig>} A Promise object containing the value and a scope indicating whether the entry was found in the `local` or `global` git-config
 * file, or only a scope of `none` if the value could not be found in any scope.
 */
export const getConfig = async ({
    dir, gitdir = join(dir.toString(), '.git'), keyPath, local = true, global = true, showOrigin = false
}: {
    dir: PathLike,
    gitdir?: PathLike,
    keyPath: string,
    local?: boolean,
    global?: boolean,
    showOrigin?: boolean
}): Promise<GitConfig> => {
    const worktree = await getWorktreePaths(gitdir);
    const localConfigPath = (local && worktree.gitdir) ? resolve(join(worktree.gitdir.toString(), 'config')) : null;
    const globalConfigPath = (global) ? getGitConfigPath('global') : null;

    const readConfigValue = async (configPath: string | null, key: string) => {
        if (!configPath) return null;
        const configFile = await parse({ path: configPath });
        if (!configFile) return null;
        const config = parse.expandKeys(configFile);
        return hasProperty(config, key) ? getProperty(config, key) as string : null;
    }
    const includeOrigin = (configPath: string | null) => showOrigin ? removeUndefinedProperties({ origin: configPath }) : {};

    const localValue = local ? await readConfigValue(localConfigPath, keyPath) : null;
    const globalValue = global ? await readConfigValue(globalConfigPath, keyPath) : null;

    if (localValue) return { scope: 'local', value: localValue, ...includeOrigin(localConfigPath) };
    if (globalValue) return { scope: 'global', value: globalValue, ...includeOrigin(globalConfigPath) };
    return { scope: 'none' };
};

/**
 * Update an entry in the git-config files; modeled after the *isomorphic-git/setConfig* function, but includes additional functionality
 * to resolve global git-config files. The scope is strictly respected (i.e. if the entry exists only in `global` scope but `local` scope 
 * is specified, then a new entry will be added to the git-config file in `local` scope). Entries can be removed by setting value to
 * `undefined`; attempting to remove a non-existing entry will result in a no-op.
 *
 * @param obj - A destructured object for named parameters.
 * @param obj.dir - The worktree root directory path.
 * @param obj.gitdir - The worktree git file or directory path.
 * @param obj.scope - The scope indicating whether the entry update should occur in the `local` or `global` git-config file. 
 * @param obj.keyPath - The dot notation path of the desired git config entry (i.e. `user.name` or `user.email`).
 * @param obj.value - The value to be added, updated, or removed (by setting `undefined`) from the git-config file.
 * @returns {Promise<string | null>} A Promise object containing a string in ini-format with the contents of the updated git-config file.
 */
export const setConfig = async ({ dir, gitdir = join(dir.toString(), '.git'), scope, keyPath, value }: {
    dir: PathLike,
    gitdir?: PathLike,
    scope: 'local' | 'global',
    keyPath: string,
    value: string | boolean | number | undefined
}): Promise<string | null> => {
    const worktree = await getWorktreePaths(gitdir);
    const configPath = (scope == 'local' && worktree.gitdir) ? resolve(join(worktree.gitdir.toString(), 'config')) : getGitConfigPath('global');
    if (!configPath) return null; // no git-config file exists for the requested scope

    const configFile = await parse({ path: configPath });
    if (!configFile) return null; // git-config file cannot be parsed; possible corrupted file?
    if (value === undefined) deleteProperty(configFile, keyPath);
    else setProperty(configFile, keyPath, value);

    const updatedConfig = ini.stringify(configFile, { section: '', whitespace: true });
    await writeFileAsync(configPath, updatedConfig);
    return updatedConfig;
}