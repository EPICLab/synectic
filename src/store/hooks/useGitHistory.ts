import { useCallback, useState } from 'react';
import { ReadCommitResult } from 'isomorphic-git';

import type { Repository } from '../../types';
import { getConfig, log } from '../../containers/git';

export type CommitInfo = ReadCommitResult & {
  branch: string,
  scope: 'local' | 'remote'
}

type useGitHistoryHook = {
  commits: Map<string, CommitInfo>,
  heads: Map<string, string>,
  update: () => Promise<void>
}

const resolveRemote = async (branch: string) => {
  const defaultBranch = await getConfig('init.defaultBranch');
  let remote = await getConfig(`branch.${branch}.remote`);
  if (remote.scope === 'none' && defaultBranch.scope !== 'none') remote = await getConfig(`branch.${defaultBranch.value}.remote`);
  if (remote.scope === 'none') remote = await getConfig('branch.master.remote');
  if (remote.scope === 'none') remote = await getConfig('branch.main.remote');
  return (remote.scope === 'none') ? 'origin' : remote.value;
}

/**
 * Custom React Hook for managing commit histories for all known branches (local and remote) within a git repository. Resolves a list of 
 * unique commits that exist across all branches, and mappings from branch names (encoded in the form `[scope]/[branch]`, 
 * i.e. `local/master`) to the SHA-1 hash of the commit referenced by the head of that branch. The initial state of the hook is empty, and 
 * will only be populated upon an update. The update method is optimized to collect caches of the commits and head refs for each branch 
 * before updating the observable maps of commits and head refs. Therefore, a React rerender will only occur after all branches have been 
 * evaluated.
 * @param repo The Repository that contains local and remote branches that should be tracked.
 * @return The states of `commits`, `heads`, and the `update` function. Both `commits` and `heads` are maps, where `commits` maps SHA-1 
 * commit hashes to commits and `heads` maps scoped branch names to the SHA-1 hash of the commit pointed to by HEAD on that branch.
 */
export const useGitHistory = (repo: Repository): useGitHistoryHook => {
  const [commits, setCommits] = useState(new Map<string, CommitInfo>());
  const [heads, setHeads] = useState(new Map<string, string>());

  const update = useCallback(async () => {
    const commitsCache = new Map<string, CommitInfo>();
    const headsCache = new Map<string, string>();

    const processCommits = async (branch: string, scope: 'local' | 'remote'): Promise<void> => {
      const remote = await resolveRemote(branch);

      const branchCommits = (scope === 'remote')
        ? await log({ dir: repo.root.toString(), ref: `remotes/${remote}/${branch}` })
        : await log({ dir: repo.root.toString(), ref: branch });
      // append to the caches only if no entries exist for the new commit or branch
      branchCommits.map(commit =>
        (!commitsCache.has(commit.oid))
          ? commitsCache.set(commit.oid, { ...commit, branch: branch, scope: scope })
          : null);
      if (!headsCache.has(`${scope}/${branch}`)) {
        headsCache.set(`${scope}/${branch}`, branchCommits[0].oid);
      }
    }

    await Promise.all(repo.local.map(async branch => processCommits(branch, 'local')));
    await Promise.all(repo.remote.map(async branch => processCommits(branch, 'remote')));
    // replace the `commits` and `heads` states every time, since deep comparisons for all commits is computationally expensive
    setCommits(commitsCache);
    setHeads(headsCache);
  }, [repo.local, repo.remote, repo.root]);

  return { commits, heads, update };
}