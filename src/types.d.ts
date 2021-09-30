// Type definitions for synectic 1.0.0
// Project: https://github.com/EPICLab/synectic
// Definitions by: Nicholas Nelson <https://github.com/nelsonni>
// TypeScript Version: 4.3

import { DateTime } from 'luxon';
import { PathLike } from 'fs-extra';
import { v4 } from 'uuid';
import sha1 from 'sha1';

export type UUID = ReturnType<typeof v4>;
export type SHA1 = ReturnType<typeof sha1>;
export type Timestamp = ReturnType<DateTime['valueOf']>;

export type CardType = 'Editor' | 'Diff' | 'Explorer' | 'Browser' | 'ReposTracker' | 'Merge' | 'SourceControl' | 'ConflictManager';
export type ModalType = 'NewCardDialog' | 'DiffPicker' | 'SourcePicker' | 'BranchList' | 'MergeSelector' | 'Error' | 'GitGraph';
/**
 * | status                | description                                                                           |
 * | --------------------- | ------------------------------------------------------------------------------------- |
 * | `"ignored"`           | file ignored by a .gitignore rule                                                     |
 * | `"unmodified"`        | file unchanged from HEAD commit                                                       |
 * | `"*modified"`         | file has modifications, not yet staged                                                |
 * | `"*deleted"`          | file has been removed, but the removal is not yet staged                              |
 * | `"*added"`            | file is untracked, not yet staged                                                     |
 * | `"absent"`            | file not present in HEAD commit, staging area, or working dir                         |
 * | `"modified"`          | file has modifications, staged                                                        |
 * | `"deleted"`           | file has been removed, staged                                                         |
 * | `"added"`             | previously untracked file, staged                                                     |
 * | `"*unmodified"`       | working dir and HEAD commit match, but index differs                                  |
 * | `"*absent"`           | file not present in working dir or HEAD commit, but present in the index              |
 * | `"*undeleted"`        | file was deleted from the index, but is still in the working dir                      |
 * | `"*undeletemodified"` | file was deleted from the index, but is present with modifications in the working dir |
*/
export type GitStatus = 'modified' | 'ignored' | 'unmodified' | '*modified' | '*deleted' | '*added'
  | 'absent' | 'deleted' | 'added' | '*unmodified' | '*absent' | '*undeleted' | '*undeletemodified';
/**
 * | status                | description                                                                           |
 * | --------------------- | ------------------------------------------------------------------------------------- |
 * | `"unmodified"`        | file unchanged from metafile content                                                  |
 * | `"modified"`          | file has modifications, not yet saved                                                 |
 * | `"unlinked"`          | no file linked to metafile, virtual metafile                                          |
 */
export type FilesystemStatus = 'modified' | 'unmodified' | 'unlinked';

/** A canvas representing a base layer in which child objects can be explicitly positioned.  */
export type Canvas = {
  /** The UUID for Canvas object. */
  readonly id: UUID;
  /** The timestamp when canvas was created. */
  readonly created: Timestamp;
  /** An array with all Repository object UUIDs contained on canvas. */
  readonly repos: UUID[];
  /** An array with all Card object UUIDs contained on canvas. */
  readonly cards: UUID[];
  /** An array with all Stack object UUIDs contained on canvas. */
  readonly stacks: UUID[];
}

/** A card representation containing actionable content (e.g. editor, explorer, browser). */
export type Card = {
  /** The UUID for Card object. */
  readonly id: UUID;
  /** The name of card. */
  readonly name: string;
  /** The type of card. */
  readonly type: CardType;
  /** The UUID for related Metafile object. */
  readonly metafile: UUID;
  /** The timestamp when card was created. */
  readonly created: Timestamp;
  /** The timestamp for last update to card properties. */
  readonly modified: Timestamp;
  /** The UUID for capturing Stack object, or undefined if not captured. */
  readonly captured?: UUID;
  /** The horizontal position of card relative to parent object. */
  readonly left: number;
  /** The vertical position of card relative to parent object. */
  readonly top: number;
};

/** A stack representation containing cards grouped according to the user. */
export type Stack = {
  /** The UUID for Stack object. */
  readonly id: UUID;
  /** The name of stack. */
  readonly name: string;
  /** The timestamp when stack was created. */
  readonly created: Timestamp;
  /** The timestamp for last update to stack properties (including contained cards). */
  readonly modified: Timestamp;
  /** The notes displayed on the  */
  readonly note: string;
  /** An array with all Card object UUIDs contained in stack. */
  readonly cards: UUID[];
  /** The horizontal position of stack relative to parent object. */
  readonly left: number;
  /** The vertical position of stack relative to parent object. */
  readonly top: number;
}

/** A supported filetype with mapping to type of supporting card in Synectic. */
export type Filetype = {
  /** The UUID for Filetype object. */
  readonly id: UUID;
  /** The filetype format for encoding/decoding. */
  readonly filetype: string;
  /** The type of card that can load content for this filetype. */
  readonly handler: CardType;
  /** An array with all filetype extensions (e.g. `.py`, `.js`, `.gitignore`) associated with this filetype. */
  readonly extensions: string[];
}

/** A metafile representing specifications and state for files, directories, diffs, and virtual content loaded into Synectic. */
export type Metafile = {
  /** The UUID for Metafile object. */
  readonly id: UUID;
  /** The name of metafile (e.g. `data.php` for files, `tests/` for directories, `local/data.php<>remote/data.php` for diffs). */
  readonly name: string;
  /** The timestamp for last update to metafile properties (not directly associated with filesystem `mtime` or `ctime`). */
  readonly modified: Timestamp;
  /** The filetype format for encoding/decoding contents (same as `Filetype.filetype`, but this allows for virtual metafiles). */
  readonly filetype?: string;
  /** The type of card that can load the content of this metafile. */
  readonly handler?: CardType;
  /** The relative or absolute path to the file or directory of this metafile.  */
  readonly path?: PathLike;
  /** The UUID for related Repository object, when managed by a version control system. */
  readonly repo?: UUID;
  /** The branch name or ref, when managed by a version control system. */
  readonly branch?: string;
  /** The latest Git status code for this file relative to the associated repository and branch. */
  readonly status?: GitStatus;
  /** The latest Filesystem status code for this file relative to the associated content. */
  readonly state?: FilesystemStatus;
  /** The textual contents maintained for files; can differ from actual file content when unsaved changes are made in Synectic. */
  readonly content?: string;
  /** An array with all Metafile object UUIDs for direct sub-files and sub-directories (when this metafile has a `Directory` filetype). */
  readonly contains?: UUID[];
  /** An array with all Card object UUIDs included in the diff output (when this metafile has a `Diff` handler). */
  readonly targets?: UUID[];
}

/** A version control repository associated with content loaded into Synectic. */
export type Repository = {
  /** The UUID for Repository object. */
  readonly id: UUID;
  /** The name of repository. Either a qualified name for remote-tracking repositories (e.g. `EPICLab/synectic`), or the root
   * directory name for local-only repositories (e.g. `synectic`). */
  readonly name: string;
  /** The relative or absolute path to the git root directory. */
  readonly root: PathLike;
  /** The URL for a CORS proxy service that enables User-Agent Header requests that meet same-origin policies on web services
   * (including GitHub). */
  readonly corsProxy: string;
  /** The URL associated with any remote-hosted instances of this repository, or a local path URL in the case of local-only repositories. */
  readonly url: string;
  /** An array with all local branch refs associated with this repository. */
  readonly local: string[];
  /** An array with all remote branch refs associated with this repository. */
  readonly remote: string[];
  /** The type of OAuth authentication required based on the remote-hosting service for this repository. */
  readonly oauth: 'github' | 'bitbucket' | 'gitlab';
  /** The authentication username associated with an account on the remote-hosting service indicated in `oauth`. Not all services require
   * a username, see https://isomorphic-git.org/docs/en/authentication for service-specific authentication requirements. */
  readonly username: string;
  /** The authentication password associated with an account on the remote-hosting service indicated in `oauth`. */
  readonly password: string;
  /** The authentication token associated with an account on the remote-hosting service indicated in `oauth`. Not all services require
   * a token, see https://isomorphic-git.org/docs/en/authentication for service-specific authentication requirements. */
  readonly token: string;
}

/** A queued modal event (dialog or error) that requires a visible response from the system. */
export type Modal = {
  /** The UUID for Modal object. */
  readonly id: UUID;
  /** The type of modal (e.g. `NewCardDialog` or `Error`). */
  readonly type: ModalType;
  /** A specific type to delineate a class of modals (e.g. `LoadError`) */
  readonly subtype?: string;
  /** The UUID for related object that triggered the modal event. */
  readonly target?: UUID;
  /** Options targeting specific types of modals. */
  readonly options?: { [key: string]: string | number | boolean }
}