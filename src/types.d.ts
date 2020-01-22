import { DateTime } from 'luxon';
import { PathLike } from 'fs-extra';
import parsePath from 'parse-path';

export type UUID = string;

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

export type Card = {
  readonly id: UUID;
  readonly name: string;
  readonly metafile: UUID;
  readonly created: DateTime;
  readonly modified: DateTime;
  readonly isCaptured: boolean;
  readonly left: number;
  readonly top: number;
}

export type Filetype = {
  readonly id: UUID;
  readonly filetype: string;
  readonly handler: string;
  readonly extensions: string[];
}

export type Metafile = {
  readonly id: UUID;
  readonly name: string;
  readonly filetype: string;
  readonly handler: string;
  readonly modified: DateTime;
  readonly path: PathLike | null;
  readonly repo: UUID | null;
  readonly ref: string | null;
  readonly content: string | null;
}

export type Repository = {
  readonly id: UUID;
  readonly name: string;
  readonly corsProxy: URL;
  readonly url: parsePath.ParsedPath;
  readonly refs: string[];
  readonly oauth: 'github' | 'bitbucket' | 'gitlab';
  readonly username: string;
  readonly password: string;
  readonly token: string;
}