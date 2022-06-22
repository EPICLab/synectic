import { useCallback, useState } from 'react';
import { ReadCommitResult } from 'isomorphic-git';
import { log } from '../git-porcelain';
import { useAppSelector } from '../../store/hooks';
import { RootState } from '../../store/store';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
import { UUID } from '../../store/types';
import { Branch } from '../../store/slices/branches';

export type CommitInfo = ReadCommitResult & {
  branch: string,
  scope: 'local' | 'remote'
}

type useGitHistoryHook = {
  commits: Map<string, CommitInfo>,
  heads: Map<string, string>,
  update: () => Promise<void>
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
export const useGitHistory = (repoId: UUID): useGitHistoryHook => {
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, repoId));
  const branches = useAppSelector((state: RootState) => repo ? branchSelectors.selectByRepo(state, repo) : []);
  const [commits, setCommits] = useState(new Map<string, CommitInfo>());
  const [heads, setHeads] = useState(new Map<string, string>());

  const update = useCallback(async () => {
    if (!repo) return;
    const commitsCache = new Map<string, CommitInfo>();
    const headsCache = new Map<string, string>();

    const processCommits = async (branch: Branch): Promise<void> => {
      const branchCommits = (branch.scope === 'remote')
        ? await log({ dir: repo.root.toString(), ref: `remotes/${branch.remote}/${branch.ref}` })
        : await log({ dir: repo.root.toString(), ref: branch.ref });
      // append to the caches only if no entries exist for the new commit or branch
      branchCommits.map(commit =>
        (!commitsCache.has(commit.oid))
          ? commitsCache.set(commit.oid, { ...commit, branch: branch.ref, scope: branch.scope })
          : null);
      if (!headsCache.has(`${branch.scope}/${branch.ref}`) && branchCommits[0]) {
        headsCache.set(`${branch.scope}/${branch.ref}`, branchCommits[0].oid);
      }
    }

    await Promise.all(branches.map(async branch => processCommits(branch)));
    // replace the `commits` and `heads` states every time, since deep comparisons for all commits is computationally expensive
    setCommits(commitsCache);
    setHeads(headsCache);
  }, [branches, repo]);

  return { commits, heads, update };
}