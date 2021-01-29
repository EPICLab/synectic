import parsePath from 'parse-path';
import { DateTime } from 'luxon';

import type { Repository, Canvas, Card, Stack } from '../src/types';
import { ActionKeys } from '../src/store/actions';
import { canvasReducer } from '../src/store/reducers/canvas';

describe('canvasReducer', () => {
  const canvas: Canvas = {
    id: '3219',
    created: DateTime.fromISO('2019-11-19T19:22:47.572-08:00'),
    repos: ['13'],
    cards: ['29'],
    stacks: ['33']
  };

  const newRepo: Repository = {
    id: '17',
    name: 'sampleUser/forkedRepo',
    root: '/',
    corsProxy: new URL('http://www.oregonstate.edu'),
    url: parsePath('https://github.com/sampleUser/forkedRepo'),
    local: ['601421', '843449'],
    remote: [],
    oauth: 'github',
    username: 'sampleUser',
    password: '12345',
    token: 'a78bw2591q592s0996q1498c1284'
  }

  const newCard: Card = {
    id: 't829w0351',
    name: 'card2',
    type: 'Editor',
    metafile: '29334943',
    created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00'),
    modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00'),
    captured: false,
    left: 100, top: 50
  }

  const newStack: Stack = {
    id: '2',
    name: 'stack',
    created: DateTime.fromISO('2016-01-25T11:38:11.720-08:00'),
    modified: DateTime.fromISO('2016-01-27T19:05:09.845-08:00'),
    note: 'This stack contains very important cards for Project X',
    cards: [], left: 78, top: 13
  }

  it('canvasReducer appends a new repo ID to state on action ADD_REPO', () => {
    expect(canvasReducer(undefined, { type: ActionKeys.ADD_REPO, id: newRepo.id, repo: newRepo }).repos).toContain('17');
  });

  it('canvasReducer removes an existing repo ID from state on action REMOVE_REPO', () => {
    expect(canvas.repos).toContain('13');
    expect(canvasReducer(canvas, { type: ActionKeys.REMOVE_REPO, id: '13' }).repos).not.toContain('13');
  });

  it('canvasReducer returns original state on non-existing repo ID in state on action REMOVE_REPO', () => {
    expect(canvasReducer(canvas, { type: ActionKeys.REMOVE_REPO, id: '5' })).toMatchObject(canvas);
  });

  it('canvasReducer appends a new card ID to state on action ADD_CARD', () => {
    expect(canvasReducer(canvas, { type: ActionKeys.ADD_CARD, id: newCard.id, card: newCard }).cards).toContain('t829w0351');
  });

  it('canvasReducer removes an existing card ID from state on action REMOVE_CARD', () => {
    expect(canvas.cards).toContain('29');
    expect(canvasReducer(canvas, { type: ActionKeys.REMOVE_CARD, id: '29' }).cards).not.toContain('29');
  });


  it('canvasReducer appends a new stack ID to state on action ADD_STACK', () => {
    expect(canvasReducer(canvas, { type: ActionKeys.ADD_STACK, id: newStack.id, stack: newStack }).stacks).toContain('2');
  });

  it('canvasReducer removes an existing stack ID from state on action REMOVE_STACK', () => {
    expect(canvas.stacks).toContain('33');
    expect(canvasReducer(canvas, { type: ActionKeys.REMOVE_STACK, id: '33' }).stacks).not.toContain('33');
  });
});