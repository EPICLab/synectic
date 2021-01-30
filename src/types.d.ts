import { DateTime } from 'luxon';
import { PathLike } from 'fs-extra';
import parsePath from 'parse-path';

export type UUID = string;

export type CardType = 'Editor' | 'Diff' | 'Explorer' | 'Browser' | 'Tracker' | 'Merge';
export type GitStatus = 'modified' | 'ignored' | 'unmodified' | '*modified' | '*deleted' | '*added'
  | 'absent' | 'deleted' | 'added' | '*unmodified' | '*absent' | '*undeleted' | '*undeletemodified';

export type Card = {
  readonly id: UUID;
  readonly name: string;
  readonly type: CardType;
  readonly metafile: UUID;
  readonly created: DateTime;
  readonly modified: DateTime;
  readonly captured?: UUID;
  readonly left: number;
  readonly top: number;
};

export type Canvas = {
  readonly id: UUID;
  readonly created: DateTime;
  readonly repos: UUID[];
  readonly cards: UUID[];
  readonly stacks: UUID[];
}

export type Stack = {
  readonly id: UUID;
  readonly name: string;
  readonly created: DateTime;
  readonly modified: DateTime;
  readonly note: string;
  readonly cards: UUID[];
  readonly left: number;
  readonly top: number;
}

export type Filetype = {
  readonly id: UUID;
  readonly filetype: string;
  readonly handler: CardType;
  readonly extensions: string[];
}

export type Metafile = {
  readonly id: UUID;
  readonly name: string; // example: data.php
  readonly modified: DateTime;
  readonly filetype?: string; // example: PHP
  readonly handler?: CardType; // example: Editor
  readonly path?: PathLike; // relative or absolute path to the file/directory
  readonly repo?: UUID; // UUID to Repository object
  readonly branch?: string; // Git branch name or ref
  readonly status?: GitStatus; // Git version control status
  readonly content?: string; // for files, contents of the file
  readonly contains?: UUID[]; // for directories (Directory filetype), UUIDs to Metafile objects (sub-files/sub-directories)
  readonly targets?: UUID[]; // for diffs (Diff handler), UUIDs to Card objects 
}

export type Repository = {
  readonly id: UUID;
  readonly name: string; // either remote qualified repo name (e.g. EPICLab/synectic) or root directory (e.g. synectic)
  readonly root: PathLike; // relative or absolute path to the git root directory
  readonly corsProxy: URL;
  readonly url: parsePath.ParsedPath; // allows for local URLs
  readonly local: string[]; // local branch refs
  readonly remote: string[]; // remote branch refs
  readonly oauth: 'github' | 'bitbucket' | 'gitlab';
  readonly username: string;
  readonly password: string;
  readonly token: string;
}

export type Error = {
  readonly id: UUID; // instance ID
  readonly type: string; // example: LoadError
  readonly target: UUID; // related Redux object ID
  readonly message: string;
}