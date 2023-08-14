import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { PathLike, UUID } from '../types';

/** A version control repository associated with content loaded into Synectic. */
export type Repository = {
  /** The UUID for Repository object. */
  readonly id: UUID;
  /**
   * The name of repository. Either a qualified name for remote-tracking repositories (e.g. `EPICLab/synectic`), or the root
   * directory name for local-only repositories (e.g. `synectic`).
   */
  readonly name: string;
  /** The relative or absolute path to the main worktree root directory (e.g. *'/{project}'*). */
  readonly root: PathLike;
  /**
   * The URL for a CORS proxy service that enables User-Agent Header requests that meet same-origin policies on web services
   * (including GitHub).
   */
  readonly corsProxy: string;
  /** The URL associated with any remote-hosted instances of this repository; contains empty string if local-only repository. */
  readonly url: string;
  /** The branch name corresponding to the default branch within this repository. */
  readonly default: string;
  /** An array with all Branch object UUIDs for local branch refs associated with this repository. */
  readonly local: UUID[];
  /** An array with all Branch object UUIDs for remote branch refs associated with this repository. */
  readonly remote: UUID[];
  /** The type of OAuth authentication required based on the remote-hosting service for this repository. */
  readonly oauth: 'github' | 'bitbucket' | 'gitlab';
  /**
   * The authentication username associated with an account on the remote-hosting service indicated in `oauth`. Not all services require
   * a username, see https://isomorphic-git.org/docs/en/authentication for service-specific authentication requirements.
   */
  readonly username: string;
  /** The authentication password associated with an account on the remote-hosting service indicated in `oauth`. */
  readonly password: string;
  /**
   * The authentication token associated with an account on the remote-hosting service indicated in `oauth`. Not all services require
   * a token, see https://isomorphic-git.org/docs/en/authentication for service-specific authentication requirements.
   */
  readonly token: string;
};

export const repoAdapter = createEntityAdapter<Repository>();
repoAdapter.addOne;

export const repoSlice = createSlice({
  name: 'repos',
  initialState: repoAdapter.getInitialState(),
  reducers: {
    repoAdded: repoAdapter.addOne,
    repoRemoved: repoAdapter.removeOne,
    repoUpdated: repoAdapter.upsertOne
  }
});

export const { repoAdded, repoRemoved, repoUpdated } = repoSlice.actions;

export default repoSlice.reducer;
