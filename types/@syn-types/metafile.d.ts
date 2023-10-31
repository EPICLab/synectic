import type {CardType, FilesystemStatus, Flag, GitStatus, PathLike, Timestamp, UUID} from './app';
import type {Override} from './util';

/**
 * A metafile representing specifications and state for files, directories, diffs, and virtual
 * content loaded into Synectic.
 */
export type Metafile = {
  /** The UUID for Metafile object. */
  readonly id: UUID;
  /**
   * The name of metafile (e.g. `data.php` for files, `tests/` for directories,
   * `local/data.php<>remote/data.php` for diffs).
   */
  readonly name: string;
  /**
   * The timestamp for last update to metafile properties (not directly associated with filesystem
   * `mtime` or `ctime`).
   */
  readonly modified: Timestamp;
  /** The type of card that can load the content of this metafile. */
  readonly handler: CardType;
  /** The filetype format for encoding/decoding contents, as well as determining syntax highlighting. */
  readonly filetype: string;
  /** Flags indicating in-progress actions that might affect values in this metafile. */
  readonly flags: Flag[];
} & Partial<FilebasedProps> &
  Partial<FileProps> &
  Partial<DirectoryProps> &
  Partial<VersionedProps> &
  Partial<DiffProps>;

/**
 * A metafile without the requisite ID field (and with certain fields made optional), which can be
 * used for composing valid Metafiles prior to them being assigned an ID.
 */
export type MetafileTemplate = Expand<
  Override<Omit<Metafile, 'id'>, Partial<Pick<Metafile, 'modified' | 'flags'>>>
>;
/** A metafile without an associated filesystem object. */
export type VirtualMetafile = Omit<Metafile, keyof FilebasedProps>;

/**
 * A metafile with an associated filesystem object (e.g. file or directory). Does not guarantee that
 * type-specific fields have been added.
 */
export type FilebasedMetafile = Override<Metafile, FilebasedProps>;
export type FilebasedProps = {
  /** The relative or absolute path to the file or directory of this metafile. */
  readonly path: PathLike;
  /** The latest Filesystem status code for this file relative to the associated content. */
  readonly state: FilesystemStatus;
  /**
   * The timestamp for last observed update to the associated filesystem object (represented by the
   * `mtime` filesystem value).
   */
  readonly mtime: Timestamp;
};

/** A metafile that contains file information related to a similar type of filesystem object. */
export type FileMetafile = Override<FilebasedMetafile, FileProps>;
export type FileProps = {
  /**
   * The textual contents maintained for files; can differ from actual file content when unsaved
   * changes have been made.
   */
  readonly content: string;
};

/** A metafile that contains directory information related to a similar type of filesystem object. */
export type DirectoryMetafile = Override<FilebasedMetafile, DirectoryProps>;
export type DescendantMetafiles = {directories: FilebasedMetafile[]; files: FilebasedMetafile[]};
export type DirectoryProps = {
  /** An array with all Metafile object UUIDs for direct sub-files and sub-directories. */
  readonly contains: UUID[];
};

/**
 * A metafile that is associated with a filesystem object that is tracked by a version control
 * system.
 */
export type VersionedMetafile = Override<FilebasedMetafile, VersionedProps>;
export type VersionedProps = {
  /** The UUID for associated Repository object. */
  readonly repo: UUID;
  /** The UUID for associated Branch object. */
  readonly branch: UUID;
  /** The latest Git status code for this metafile relative to the associated repository and branch. */
  readonly status: GitStatus;
  /**
   * An array indicating paths to conflicting sub-files (in the case of a DirectoryMetafile), or an
   * array indicating the starting index for each Git conflict chunk in the content of this metafile
   * (in the case of a FileMetafile).
   */
  readonly conflicts: (number | PathLike)[];
};

export type DiffMetafile = Override<Metafile, DiffProps>;
export type DiffProps = {
  /** An array with all Card object UUIDs included in the diff output. */
  readonly targets: UUID[];
};
