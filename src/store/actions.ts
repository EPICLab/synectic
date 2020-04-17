import { UUID, Repository, Card, Stack, Browser, Metafile, Filetype } from '../types';
// import { Action } from 'redux';

export enum ActionKeys {
  INITIALIZE_CANVAS,
  ADD_CARD, REMOVE_CARD, UPDATE_CARD,
  ADD_STACK, REMOVE_STACK, UPDATE_STACK,
  ADD_BROWSER, REMOVE_BROWSER, UPDATE_BROWSER,
  ADD_FILETYPE, REMOVE_FILETYPE, UPDATE_FILETYPE,
  ADD_METAFILE, REMOVE_METAFILE, UPDATE_METAFILE,
  ADD_REPO, REMOVE_REPO, UPDATE_REPO,
}

export type Actions =
  | InitializeCanvasAction
  | AddCardAction
  | RemoveCardAction
  | UpdateCardAction
  | AddStackAction
  | RemoveStackAction
  | UpdateStackAction
  | AddBrowserAction
  | RemoveBrowserAction
  | UpdateBrowserAction
  | AddFiletypeAction
  | RemoveFiletypeAction
  | UpdateFiletypeAction
  | AddMetafileAction
  | RemoveMetafileAction
  | UpdateMetafileAction
  | AddRepoAction
  | RemoveRepoAction
  | UpdateRepoAction;

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

type AddBrowserAction = {
  type: ActionKeys.ADD_BROWSER;
  id: UUID;
  browser: Browser;
};

type RemoveBrowserAction = {
  type: ActionKeys.REMOVE_BROWSER;
  id: UUID;
};

type UpdateBrowserAction = {
  type: ActionKeys.UPDATE_BROWSER;
  id: UUID;
  browser: Partial<Browser>;
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