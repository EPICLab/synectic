import { v4 } from 'uuid';
import { PathLike } from 'fs-extra';
import { DateTime } from 'luxon';
import * as path from 'path';

import * as io from './io';
import * as git from './git';
import { Metafile, Filetype, Repository, RemoveType } from '../types';
import { Actions, ActionKeys } from '../store/actions';
import { flatten } from './flatten';

type IdentifiableActions = RemoveType<Actions, ActionKeys.INITIALIZE_CANVAS>;
type MetafilePayload = { metafile: Metafile; actions: Actions[] };

/**
 * Decorator for injecting fs.stat information into the metafile, and propogating any existing Redux actions into 
 * subsequent decorators or returns. Supported filetypes are matched to the metafile using the path and filetype 
 * extensions (if a file), or manual filetype search (if a directory). 
 * @param metafilePayload JavaScript object containing a root metafile, and queued Redux actions for updating state.
 * @param filetypes Array of supported filetype information; preferrably derived from Redux store.
 * @return A Promise object for the updated Metafile that includes populated `modified`, `filetype`, and `handler` 
 * fields, and any Redux actions previously enqueued for updating the Redux store.
 */
const statsDecorator = async (metafilePayload: MetafilePayload, filetypes: Filetype[]): Promise<MetafilePayload> => {
  if (!metafilePayload.metafile.path) return metafilePayload;
  const stats = await io.extractStats(metafilePayload.metafile.path);
  if (!stats) return metafilePayload;
  if (stats.isDirectory()) {
    const handler = filetypes.find(filetype => filetype.filetype === 'Directory');
    return {
      metafile: {
        ...metafilePayload.metafile,
        modified: DateTime.fromJSDate(stats.mtime),
        filetype: handler?.filetype,
        handler: handler?.handler
      },
      actions: metafilePayload.actions
    };
  }
  const extension = io.extractExtension(metafilePayload.metafile.path);
  const handler = filetypes.find(filetype => filetype.extensions.some(ext => ext === extension));
  return {
    metafile: {
      ...metafilePayload.metafile,
      modified: DateTime.fromJSDate(stats.mtime),
      filetype: handler?.filetype,
      handler: handler?.handler
    },
    actions: metafilePayload.actions
  };
};

/**
 * Decorator for handling the root metafile when it is a file; by injecting fs.readFile results into the metafile,
 * and propogating any existing Redux actions into subsequent decorators or returns.
 * @param metafilePayload JavaScript object containing a root metafile, and queued Redux actions for updating state.
 * @return A Promise object for the updated Metafile that includes a populated `content` field, and any Redux actions
 * previously enqueued for updating the Redux store.
 */
const contentDecorator = async (metafilePayload: MetafilePayload): Promise<MetafilePayload> => {
  if (!metafilePayload.metafile.path || metafilePayload.metafile.filetype === 'Directory') return metafilePayload;
  const content = await io.readFileAsync(metafilePayload.metafile.path);
  return { metafile: { ...metafilePayload.metafile, content: content }, actions: metafilePayload.actions };
};

/**
 * Decorator for injecting Git repository information (using `isomorphic-git`) into the metafile, and appending new 
 * Redux actions as needed for properly adding and updating repositories tracked in the Redux store. Includes updated
 * version of list of `Repository` objects, originally from Redux state, to include intermediate `Repository` objects
 * that will eventually be updated into the Redux store as part of the queued Redux actions.
 * @param metafilePayload JavaScript object containing a root metafile, and queued Redux actions for updating state.
 * @param repos Array of existing Git repositories; preferrably derived from Redux store.
 * @return A Promise object for a tuple containing a paylod of the updated Metafile that includes populated `repo` 
 * and `ref` fields, and updated queue of Redux actions for updating the store with those repositories. If the root 
 * metafile is not part of a Git repository file tree (either tracked or untracked), then the `repo` and `ref` 
 * fields are undefined. The second field of the tuple contains an updated version of repositories in the Redux store
 * combined with any intermediate repositories resolved during iterations of the extractMetafile function.
 */
const gitDecorator = async (metafilePayload: MetafilePayload, repos: Repository[]): Promise<{ payload: MetafilePayload; updatedRepos: Repository[] }> => {
  if (!metafilePayload.metafile.path) return { payload: metafilePayload, updatedRepos: repos };
  const root = await git.getRepoRoot(metafilePayload.metafile.path.toString());
  if (!root) return { payload: metafilePayload, updatedRepos: repos };
  const branchRef = await git.currentBranch({ dir: root, fullname: false });
  const repoPayload = branchRef ? await git.extractRepo(metafilePayload.metafile.path, repos, branchRef) :
    await git.extractRepo(metafilePayload.metafile.path, repos);
  const actions = repoPayload.action ? [...metafilePayload.actions, repoPayload.action] : metafilePayload.actions;
  return {
    payload: {
      metafile: { ...metafilePayload.metafile, repo: repoPayload.repo?.id, ref: branchRef ? branchRef : undefined },
      actions: actions
    },
    updatedRepos: (repoPayload.repo ? [...repos, repoPayload.repo] : repos)
  };
}

/**
 * Decorator for handling the root metafile when it is a directory; by injecting metafile UUIDs for sub-child and 
 * sub-directories into the metafile, and appending new Redux actions as needed for properly adding and updating 
 * those sub-child and sub-directory metafiles.
 * @param metafilePayload JavaScript object containing a root metafile, and queued Redux actions for updating state.
 * @param filetypes Array of supported filetype information; preferrably derived from Redux store.
 * @param repos Array of existing Git repositories; preferrably derived from Redux store.
 * @return A Promise object for the updated Metafile that includes all child file/directory UUIDs in `contains` field, 
 * and updated queue of Redux actions for updating the store with those child file/directory metafiles.
 */
const containsDecorator = async (metafilePayload: MetafilePayload, filetypes: Filetype[], repos: Repository[]): Promise<MetafilePayload> => {
  if (!metafilePayload.metafile.path || metafilePayload.metafile.filetype !== 'Directory') return metafilePayload;

  const parentPath = metafilePayload.metafile.path;
  const childPaths = (await io.readDirAsync(metafilePayload.metafile.path)).map(childPath => path.join(parentPath.toString(), childPath));

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const childPayloads = await Promise.all(childPaths.map(childPath => extractMetafile(childPath, filetypes, repos)));
  const childActions: IdentifiableActions[] = flatten(childPayloads.map(childPayload => childPayload.actions));
  const childMetafileIds = childActions.map(childAction => childAction.id);

  return {
    metafile: { ...metafilePayload.metafile, contains: childMetafileIds },
    actions: [...metafilePayload.actions, ...childActions]
  };
};

/**
 * Extract all necessary file/directory information, including sub-file and sub-directory children, Git version
 * control information, and file content in order to create a `Metafile` object. This information is required
 * in order to load resources into a `Card`.
 * @param filepath The relative or absolute path to evaluate.
 * @param filetypes Array of supported filetype information; preferrably derived from Redux store.
 * @param repos Array of existing Git repositories; preferrably derived from Redux store.
 * @return A Promise object for series of subsequent asynchronous calls to decorator functions that iteratively
 * append additional information into a `MetafilePayload` object containing the root metafile and all Redux
 * actions required in order to update the Redux store to hold the latest version of state.
 */
export const extractMetafile = async (filepath: PathLike, filetypes: Filetype[], repos: Repository[]): Promise<MetafilePayload> => {
  const name = io.extractFilename(filepath);
  const metafile: Metafile = {
    id: v4(),
    name: name.length === 0 ? io.extractDirname(filepath) : name,
    path: filepath,
    modified: DateTime.local()
  };

  return statsDecorator({ metafile: metafile, actions: [] }, filetypes)
    .then(payload => contentDecorator(payload))
    .then(payload => gitDecorator(payload, repos))
    .then(payloadAndRepos => containsDecorator(payloadAndRepos.payload, filetypes, payloadAndRepos.updatedRepos))
    .then(payload => {
      const addRootMetafile: Actions = {
        type: ActionKeys.ADD_METAFILE,
        id: payload.metafile.id,
        metafile: payload.metafile
      };
      return { metafile: payload.metafile, actions: [...payload.actions, addRootMetafile] };
    })
    .catch(error => { throw new Error(error.message) });
}
