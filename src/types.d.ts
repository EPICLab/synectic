import { DateTime } from 'luxon';
import { PathLike } from 'fs-extra';
import parsePath from 'parse-path';

// Utility types to allow the TypeScript compiler to narrow union types based on discriminated
// typing (e.g. NarrowType<Actions, ActionKeys.ADD_REPO> narrows to type AddRepoAction, and
// RemoveType<Actions, ActionKeys.INITIALIZE_CANVAS> removes the type InitializeCanvasAction and
// returns all other Action types).
export type NarrowType<T, N> = T extends { type: N } ? T : never;
export type RemoveType<T, N> = T extends { type: N } ? never : T;

export type UUID = string;

export type CardType = 'Editor' | 'Diff' | 'Explorer' | 'Browser';

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

export type Browser = {
  readonly id: UUID;
  // readonly url: URL;
  // readonly history: URL[];
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
  readonly ref?: string; // Git branch name
  readonly content?: string; // for non-Directory filetype, contents of the file
  readonly contains?: UUID[]; // for Directory filetype, UUID to Metafile objects (sub-files/sub-directories)
}

export type Repository = {
  readonly id: UUID;
  readonly name: string; // either remote qualified repo name (e.g. EPICLab/synectic) or root directory (e.g. synectic)
  readonly corsProxy: URL;
  readonly url: parsePath.ParsedPath; // allows for local URLs
  readonly refs: string[];
  readonly oauth: 'github' | 'bitbucket' | 'gitlab';
  readonly username: string;
  readonly password: string;
  readonly token: string;
}