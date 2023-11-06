import type {UniqueIdentifier} from '@dnd-kit/core';
import type {DateTime} from 'luxon';
import type sha1 from 'sha1';

/**
 * Universal unique identifier based on RFC4122 version 4 for cryptographically-strong random
 * values.
 */
export type UUID = UniqueIdentifier;
/**
 * Valid types for path values in "node::fs" module; fs-extra allows for `string | Buffer | URL`
 * which is problematic when encoding for Redux.
 */
export type PathLike = string;
/** 160-bit hash value for identify revisions in Git and other VCS. */
export type SHA1 = ReturnType<typeof sha1>;
/** Epoch millisecond representation of a valid DateTime value. */
export type Timestamp = ReturnType<DateTime['valueOf']>;
type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
/** Color type representing CSS colors in hexidecimal, RGB, or RGBA format. */
export type Color = RGB | RGBA | HEX;
/**
 * Detailed commit representation for Git. @deprecated Use `Commit` type, slice, selector, and
 * thunks instead.
 */
export type CommitObject = {
  oid: string;
  message: string;
  parents: string[];
  author: {
    name: string;
    email: string;
    timestamp: Timestamp | undefined;
  };
  committer?: {
    name: string;
    email: string;
    timestamp: Timestamp | undefined;
  };
};
/** Status code for various step-based actions on the filesystem and VCS. */
export type Status = 'Unchecked' | 'Running' | 'Passing' | 'Failing';
/** Detailed merge results representation for Git. */
export type MergeOutput = {
  status: Status;
  alreadyMerged: boolean;
  fastForward: boolean;
  mergeCommit?: SHA1;
  output?: string;
  conflicts?: string[];
};
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
 * | `"unmerged"`          | file has unmerged changes from an incomplete merge                                    |
 */
export type GitStatus =
  | 'modified'
  | 'ignored'
  | 'unmodified'
  | '*modified'
  | '*deleted'
  | '*added'
  | 'absent'
  | 'deleted'
  | 'added'
  | '*unmodified'
  | '*absent'
  | '*undeleted'
  | '*undeletemodified'
  | 'unmerged';
/**
 * | status          | description                                                                         |
 * | --------------- | ----------------------------------------------------------------------------------- |
 * | `"clean"`       | no untracked files and no modifications in tracked files                            |
 * | `"unstaged"`    | untracked files or uncommitted changes in tracked files exist, none are staged      |
 * | `"uncommitted"` | untracked files or uncommitted changes in tracked files exist, some are staged      |
 * | `"unmerged"`    | unmerged paths possibly exist in the worktree directory, indicates incomplete merge |
 */
export type BranchStatus = 'clean' | 'unstaged' | 'uncommitted' | 'unmerged';
/**
 * | status         | description                                  |
 * | -------------- | -------------------------------------------- |
 * | `"unmodified"` | file unchanged from metafile content         |
 * | `"modified"`   | file has modifications, not yet saved        |
 * | `"unlinked"`   | no file linked to metafile, virtual metafile |
 */
export type FilesystemStatus = 'modified' | 'unmodified' | 'unlinked';
export type CardType =
  | 'Loading'
  | 'Editor'
  | 'Diff'
  | 'Explorer'
  | 'Browser'
  | 'Branches'
  | 'Merge'
  | 'SourceControl';
export type ModalType =
  | 'BranchList'
  | 'CloneSelector'
  | 'DeleteBranchDialog'
  | 'DeleteFileDialog'
  | 'GitGraph'
  | 'MergeDialog'
  | 'MergeSelector'
  | 'NewBranchDialog'
  | 'NewCardDialog'
  | 'CommitDialog'
  | 'Notification'
  | 'RevertCommitDialog';
export type Flag = 'checkout' | 'updating';
export type Conflict = {
  readonly path: string;
  readonly conflicts: (string | number)[];
};
export type MergeAction = 'continue' | 'abort' | 'quit';
