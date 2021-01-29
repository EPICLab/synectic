import type { UUID, Card, Stack, Filetype, Metafile, Repository, Error } from '../types';

export enum ActionKeys {
  INITIALIZE_CANVAS,
  ADD_CARD, REMOVE_CARD, UPDATE_CARD,
  ADD_STACK, REMOVE_STACK, UPDATE_STACK,
  ADD_FILETYPE, REMOVE_FILETYPE, UPDATE_FILETYPE,
  ADD_METAFILE, REMOVE_METAFILE, UPDATE_METAFILE,
  ADD_REPO, REMOVE_REPO, UPDATE_REPO,
  ADD_ERROR, REMOVE_ERROR
}

/**
 * Utility type for selecting one or more Action types based on descriminated type narrowing of the Action union
 * type. For example, NarrowActionType<ActionKeys.ADD_REPO> would narrow Actions to type AddRepoAction, and 
 * NarrowActionType<ActionKeys.ADD_METAFILE | ActionKeys.UPDATE_METAFILE> would narrow to types AddMetafileAction 
 * and UpdateMetafileAction.
 */
export type NarrowActionType<T extends ActionKeys> = Extract<Action, { type: T }>;
/**
 * Utility type for removing an Action type based on descriminated type narrowing of the Action union type. For 
 * example, RemoveActionType<ActionKeys.INITIALIZE_CANVAS> removes the type InitializeCanvasAction and returns all 
 * other Action types.
 */
export type RemoveActionType<T extends ActionKeys> = Exclude<Action, { type: T }>;

export type Action =
  | InitializeCanvasAction
  | AddCardAction
  | RemoveCardAction
  | UpdateCardAction
  | AddStackAction
  | RemoveStackAction
  | UpdateStackAction
  | AddFiletypeAction
  | RemoveFiletypeAction
  | UpdateFiletypeAction
  | AddMetafileAction
  | RemoveMetafileAction
  | UpdateMetafileAction
  | AddRepoAction
  | RemoveRepoAction
  | UpdateRepoAction
  | AddErrorAction
  | RemoveErrorAction;

type InitializeCanvasAction = {
  type: ActionKeys.INITIALIZE_CANVAS;
};

type AddCardAction = {
  type: ActionKeys.ADD_CARD;
  id: UUID;
  card: Card;
};

type RemoveCardAction = {
  type: ActionKeys.REMOVE_CARD;
  id: UUID;
};

type UpdateCardAction = {
  type: ActionKeys.UPDATE_CARD;
  id: UUID;
  card: Partial<Card>;
};

type AddStackAction = {
  type: ActionKeys.ADD_STACK;
  id: UUID;
  stack: Stack;
};

type RemoveStackAction = {
  type: ActionKeys.REMOVE_STACK;
  id: UUID;
};

type UpdateStackAction = {
  type: ActionKeys.UPDATE_STACK;
  id: UUID;
  stack: Partial<Stack>;
};

type AddFiletypeAction = {
  type: ActionKeys.ADD_FILETYPE;
  id: UUID;
  filetype: Filetype;
};

type RemoveFiletypeAction = {
  type: ActionKeys.REMOVE_FILETYPE;
  id: UUID;
};

type UpdateFiletypeAction = {
  type: ActionKeys.UPDATE_FILETYPE;
  id: UUID;
  filetype: Partial<Filetype>;
};

type AddMetafileAction = {
  type: ActionKeys.ADD_METAFILE;
  id: UUID;
  metafile: Metafile;
};

type RemoveMetafileAction = {
  type: ActionKeys.REMOVE_METAFILE;
  id: UUID;
};

type UpdateMetafileAction = {
  type: ActionKeys.UPDATE_METAFILE;
  id: UUID;
  metafile: Partial<Metafile>;
};

type AddRepoAction = {
  type: ActionKeys.ADD_REPO;
  id: UUID;
  repo: Repository;
};

type RemoveRepoAction = {
  type: ActionKeys.REMOVE_REPO;
  id: UUID;
};

type UpdateRepoAction = {
  type: ActionKeys.UPDATE_REPO;
  id: UUID;
  repo: Partial<Repository>;
};

type AddErrorAction = {
  type: ActionKeys.ADD_ERROR;
  id: UUID;
  error: Error;
};

type RemoveErrorAction = {
  type: ActionKeys.REMOVE_ERROR;
  id: UUID;
};