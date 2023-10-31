import type {SHA1, Timestamp} from './app';

export type Commit = {
  /** The Oid hash value, which is also the UUID for Commit object. */
  readonly oid: SHA1;
  /** The commit message. */
  readonly message: string;
  /**
   * The list of the SHA1 commit hashes for logical predecessor(s) in the line of development (i.e.
   * parents); this may be empty in the case of orphan or root commits.
   */
  readonly parents: SHA1[];
  /** The information of the person who originally wrote the patch. */
  readonly author: {
    name: string;
    email: string;
    timestamp: Timestamp | undefined;
  };
  /** The information of the person who last applied the patch on behalf of the author. */
  readonly committer?: {
    name: string;
    email: string;
    timestamp: Timestamp | undefined;
  };
};
