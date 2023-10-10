import type { PathLike } from 'fs-extra';
import type { FilebasedMetafile } from 'types/metafile';
import type { Repository } from 'types/repo';
import type { ExactlyOne } from 'types/util';
import { createAppAsyncThunk } from '../hooks';
import repoSelectors from '../selectors/repos';
import { isVersionedMetafile } from '../slices/metafiles';
import { repoAdded } from '../slices/repos';
import { fetchBranches } from './branches';
import { fetchParentMetafile } from './metafiles';

export const fetchRepo = createAppAsyncThunk<
  Repository | undefined,
  ExactlyOne<{ filepath: PathLike; metafile: FilebasedMetafile }>
>('repos/fetchRepo', async (input, thunkAPI) => {
  const state = thunkAPI.getState();

  if (input.metafile) {
    // if metafile already has a repo UUID, check for matching repository
    let repo = input.metafile.repo
      ? repoSelectors.selectById(state, input.metafile.repo)
      : undefined;
    // otherwise if parent metafile already has a repo UUID, check for matching repository
    const parent = !repo
      ? await thunkAPI.dispatch(fetchParentMetafile(input.metafile)).unwrap()
      : undefined;
    repo =
      parent && isVersionedMetafile(parent) ? repoSelectors.selectById(state, parent.repo) : repo;
    if (repo) return repo;
  }

  // unless filepath has a root path, there is no repository
  const filepath = input.metafile ? input.metafile.path : input.filepath.toString();
  const { dir } = await window.api.git.getWorktreePaths(filepath);
  if (!dir) return undefined;

  // check root for existing repository
  const existingRepo = repoSelectors.selectByRoot(state, dir);
  const repo = existingRepo ? existingRepo : await thunkAPI.dispatch(buildRepo(dir)).unwrap();
  return repo;
});

export const buildRepo = createAppAsyncThunk<Repository, PathLike>(
  'repos/buildRepo',
  async (filepath, thunkAPI) => {
    const { dir } = await window.api.git.getWorktreePaths(filepath.toString());
    const { url, oauth } = await window.api.git.getRemoteConfig(dir);
    if (dir) await window.api.git.worktreePrune({ dir: dir, verbose: true }); // prune worktree information to remove stale linked branches
    const current = dir
      ? await window.api.git.revParse({ dir: dir, opts: ['abbrevRef'], args: ['HEAD'] })
      : undefined;
    const branches = dir
      ? await thunkAPI.dispatch(fetchBranches(dir)).unwrap()
      : { local: [], remote: [] };
    const { local, remote } = {
      local: branches.local.map(branch => branch.id),
      remote: branches.remote.map(branch => branch.id)
    };
    const { username, password } = await window.api.git.getCredentials(dir);

    return thunkAPI.dispatch(
      repoAdded({
        id: window.api.uuid(),
        name: url
          ? window.api.git.extractRepoName(url.href)
          : dir
          ? window.api.fs.extractFilename(dir)
          : '',
        root: dir ?? '',
        corsProxy: 'https://cors-anywhere.herokuapp.com',
        url: url?.href ?? '',
        default: current ?? '',
        local: local,
        remote: remote,
        oauth: oauth ?? 'github',
        username: username,
        password: password,
        token: ''
      })
    ).payload;
  }
);
