import { UUID, Repository, Card, Stack } from './types';

export enum ActionKeys {
  INITIALIZE_CANVAS,
  ADD_REPO, REMOVE_REPO, UPDATE_REPO,
  ADD_CARD, REMOVE_CARD, UPDATE_CARD,
  ADD_STACK, REMOVE_STACK, UPDATE_STACK
}

export type Actions =
  | InitializeCanvasAction
  | AddRepoAction
  | RemoveRepoAction
  | UpdateRepoAction
  | AddCardAction
  | RemoveCardAction
  | UpdateCardAction
  | AddStackAction
  | RemoveStackAction
  | UpdateStackAction;

type InitializeCanvasAction = {
  type: ActionKeys.INITIALIZE_CANVAS;
};

type AddRepoAction = {
  type: ActionKeys.ADD_REPO;
  id: UUID;
  repo: Repository;
};

type RemoveRepoAction = {
  type: ActionKeys.REMOVE_REPO;
  id: UUID;
}

type UpdateRepoAction = {
  type: ActionKeys.UPDATE_REPO;
  id: UUID;
  repo: Partial<Repository>;
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
}

type RemoveStackAction = {
  type: ActionKeys.REMOVE_STACK;
  id: UUID;
};

type UpdateStackAction = {
  type: ActionKeys.UPDATE_STACK;
  id: UUID;
  stack: Partial<Stack>;
};