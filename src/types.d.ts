import { DateTime } from 'luxon';
import { PathLike } from 'fs-extra';
import parsePath from 'parse-path';

// Utility type to allow the TypeScript compiler to narrow union types based on discriminated
// typing (e.g. NarrowType<Actions, ActionKeys.ADD_REPO> narrows to type AddRepoAction).
export type NarrowType<T, N> = T extends { type: N } ? T : never;

export type UUID = string;

export type CardType = 'Editor' | 'Diff' | 'Explorer';

export type Card = {
  readonly id: UUID;
  readonly name: string;
  readonly type: CardType;
  readonly related: UUID[];
  readonly created: DateTime;
  readonly modified: DateTime;
  readonly captured: boolean;
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

export type Metadir = {
  readonly id: UUID;
  readonly name: string;
  readonly path: PathLike;
  expanded: boolean;
  readonly containsDir: UUID[];
  readonly containsFile: UUID[];
}

export type Metafile = {
  readonly id: UUID;
  readonly name: string;
  readonly modified: DateTime;
  readonly filetype?: string;
  readonly handler?: CardType;
  readonly path?: PathLike;
  readonly repo?: UUID;
  readonly ref?: string;
  readonly content?: string;
}

export type Repository = {
  readonly id: UUID;
  readonly name: string;
  readonly corsProxy: URL;
  readonly url: parsePath.ParsedPath; // allows for local URLs
  readonly refs: string[];
  readonly oauth: 'github' | 'bitbucket' | 'gitlab';
  readonly username: string;
  readonly password: string;
  readonly token: string;
}