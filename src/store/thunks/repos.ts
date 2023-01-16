import { PathLike } from 'fs-extra';
import parsePath from 'parse-path';
import { v4 } from 'uuid';
import { extractFromURL, extractRepoName, getConfig, getWorktreePaths, GitConfig, listBranch, worktreePrune } from '../../containers/git';
import { extractFilename } from '../../containers/io';
import { ExactlyOne } from '../../containers/utils';
import { createAppAsyncThunk } from '../hooks';
import repoSelectors from '../selectors/repos';
import { FilebasedMetafile, isFilebasedMetafile, isVersionedMetafile } from '../slices/metafiles';
import { repoAdded, Repository } from '../slices/repos';
import { fetchBranches } from './branches';
import { fetchMetafile, fetchParentMetafile } from './metafiles';

export const fetchRepo = createAppAsyncThunk<Repository | undefined, ExactlyOne<{ filepath: PathLike, metafile: FilebasedMetafile }>>(
    'repos/fetchRepo',
    async (input, thunkAPI) => {
        const state = thunkAPI.getState();

        if (input.metafile) {
            // if metafile already has a repo UUID, check for matching repository
            let repo = input.metafile.repo ? repoSelectors.selectById(state, input.metafile.repo) : undefined;
            const parent = !repo ? await thunkAPI.dispatch(fetchParentMetafile(input.metafile)).unwrap() : undefined;
            // otherwise if parent metafile already has a repo UUID, check for matching repository
            repo = (parent && isVersionedMetafile(parent)) ? repoSelectors.selectById(state, parent.repo) : repo;
            if (repo) return repo;
        }
        // unless filepath has a root path, there is no repository
        const filepath: PathLike = input.metafile ? input.metafile.path : input.filepath;
        const { dir, worktreeDir } = await getWorktreePaths(filepath);
        if (!dir) return undefined;

        // check root metafile for an existing repository
        const rootMetafile = await thunkAPI.dispatch(fetchMetafile({ path: dir })).unwrap();
        if (isVersionedMetafile(rootMetafile)) {
            const repo = repoSelectors.selectById(state, rootMetafile.repo);
            if (repo) return repo;
        }

        // no existing repo in parent or root metafiles, check by path and build a new repo if needed
        if (isFilebasedMetafile(rootMetafile)) {
            const existingRepo = repoSelectors.selectByRoot(state, rootMetafile.path);
            const root = worktreeDir ? worktreeDir : dir;
            const repo = existingRepo ? existingRepo : await thunkAPI.dispatch(buildRepo(root)).unwrap();
            return repo;
        }
        return undefined;
    }
)

export const buildRepo = createAppAsyncThunk<Repository, PathLike>(
    'repos/buildRepo',
    async (filepath, thunkAPI) => {
        const { dir } = await getWorktreePaths(filepath);
        const { url, oauth } = await getRemoteConfig(dir);
        if (dir) await worktreePrune({ dir: dir, verbose: true }); // Prune worktree information to remove stale linked branches
        const current = dir ? await listBranch({ dir: dir, showCurrent: true }) : [];
        const branches = dir ? await thunkAPI.dispatch(fetchBranches(dir)).unwrap() : { local: [], remote: [] };
        const { local, remote } = { local: branches.local.map(branch => branch.id), remote: branches.remote.map(branch => branch.id) };
        const { username, password } = await getCredentials(dir);
        return thunkAPI.dispatch(repoAdded({
            id: v4(),
            name: url ? extractRepoName(url.href) : (dir ? extractFilename(dir) : ''),
            root: dir ? dir : '',
            /**
             * TODO: The corsProxy is just a stubbed URL for now, but eventually we need to support Cross-Origin 
             * Resource Sharing (CORS) since isomorphic-git requires it
             */
            corsProxy: 'https://cors-anywhere.herokuapp.com',
            url: url ? url.href : '',
            default: current[0] ? current[0].ref : '',
            local: local,
            remote: remote,
            oauth: oauth ? oauth : 'github',
            username: username,
            password: password,
            token: ''

        })).payload;
    }
)

const getRemoteConfig = async (dir: PathLike | undefined)
    : Promise<{ url: parsePath.ParsedPath | undefined; oauth: Repository['oauth'] | undefined }> => {
    const remoteConfig: GitConfig = dir ? await getConfig({ dir: dir, keyPath: 'remote.origin.url' }) : { scope: 'none' };
    return (remoteConfig.scope !== 'none') ? extractFromURL(remoteConfig.value) : { url: undefined, oauth: undefined };
};

const getCredentials = async (dir: PathLike | undefined): Promise<{ username: string; password: string }> => {
    const usernameConfig: GitConfig = dir ? await getConfig({ dir: dir, keyPath: 'user.name' }) : { scope: 'none' };
    const passwordConfig: GitConfig = dir ? await getConfig({ dir: dir, keyPath: 'credential.helper' }) : { scope: 'none' };
    return {
        username: usernameConfig.scope === 'none' ? '' : usernameConfig.value,
        password: passwordConfig.scope === 'none' ? '' : passwordConfig.value
    };
};