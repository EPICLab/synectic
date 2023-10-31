import type {MergeAction, ModalType, SHA1, UUID} from './app';
import type {Override, Prettify} from './util';

/** A queued modal event (dialog or error) that requires a visible response from the system. */
export type Modal = {
  /** The UUID for Modal object. */
  readonly id: UUID;
  /** The type of modal (e.g. `NewCardDialog`, `Error`, etc). */
  readonly type: ModalType;
  /** The UUID for related object that triggered the modal event. */
  readonly target?: UUID;
} & Partial<GitGraphProps> &
  Partial<CommitDialogProps> &
  Partial<MergeDialogProps> &
  Partial<NewBranchDialogProps> &
  Partial<DeleteBranchDialogProps> &
  Partial<NotificationProps> &
  Partial<RevertCommitDialogProps>;

/** A modal that is associated with initiating a GitGraph. */
export type GitGraph = Prettify<Override<Modal, GitGraphProps>>;
export type GitGraphProps = {
  /** The UUID for associated Repository object. */
  readonly repo: UUID;
};

/** A modal for composing and initiating a commit through version control. */
export type CommitDialog = Prettify<Override<Modal, CommitDialogProps>>;
export type CommitDialogProps = {
  /** The UUID for associated Repository object. */
  readonly repo: UUID;
  /** The UUID for associated Branch object. */
  readonly branch: UUID;
};

/** A modal for selecting and initiating a merge through version control. */
export type MergeDialog = Prettify<Override<Modal, MergeDialogProps>>;
export type MergeDialogProps = {
  /** The UUID for associated Repository object. */
  readonly repo: UUID;
  /** The UUID for associated base Branch object. */
  readonly base: UUID;
  /** Commands for interacting with a merge that is in progress. */
  readonly mode?: MergeAction;
};

/** A modal for creating a new branch within the filesystem and Redux store. */
export type NewBranchDialog = Prettify<Override<Modal, NewBranchDialogProps>>;
export type NewBranchDialogProps = {
  /** The UUID for associated Repository object. */
  readonly repo: UUID;
  /** The SHA1 hash that HEAD will point to for the new branch. */
  readonly head: SHA1;
};

/** A modal for deleting an existing branch within the filesystem and Redux store. */
export type DeleteBranchDialog = Prettify<Override<Modal, DeleteBranchDialogProps>>;
export type DeleteBranchDialogProps = {
  /** The UUID for associated Repository object. */
  readonly repo: UUID;
  /** The UUID for associated Branch object. */
  readonly branch: UUID;
};

/** A modal for notifying the user of system changes occurring within Synectic. */
export type Notification = Prettify<Override<Modal, NotificationProps>>;
export type NotificationProps = {
  /** The message to display within this notification. */
  readonly message: UUID;
};

/** A modal for reverting a commit through version control. */
export type RevertCommitDialog = Prettify<Override<Modal, RevertCommitDialogProps>>;
export type RevertCommitDialogProps = {
  /** The UUID for associated Repository object. */
  readonly repo: UUID;
  /** The UUID for associated Branch object. */
  readonly branch: UUID;
  /** THe UUID for associated Commit object that will be reverted. */
  readonly commit: UUID;
};
