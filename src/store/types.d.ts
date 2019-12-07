import { DateTime } from 'luxon';
import { PathLike } from 'fs-extra';

export type UUID = string;

export type Canvas = {
  readonly id: UUID;
  readonly created: DateTime;
  readonly repos: UUID[];
  readonly cards: UUID[];
  readonly stacks: UUID[];
}

export type Repository = {
  readonly id: UUID;
  readonly name: string;
  readonly corsProxy: URL;
  readonly url: URL;
  readonly refs: string[];
  readonly oauth: 'github' | 'bitbucket' | 'gitlab';
  readonly username: string;
  readonly password: string;
  readonly token: string;
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
  readonly created: DateTime;
  readonly modified: DateTime;
  readonly repo: UUID | null;
  readonly ref: string | null;
  readonly left: number;
  readonly top: number;
}