import mock from 'mock-fs';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import type { Card, Stack } from '../src/types';
import * as stacks from '../src/containers/stacks';
import { mockStore } from './__mocks__/reduxStoreMock';
import { ActionKeys } from '../src/store/actions';
import { removeItemInArray } from '../src/store/immutables';

const sampleCards: Card[] = [
  {
    id: 'u83vx940k',
    name: 'card0',
    type: 'Editor',
    metafile: '48500141',
    captured: undefined,
    created: DateTime.fromISO('2016-01-01T01:05:40.001-08:00'),
    modified: DateTime.fromISO('2016-01-01T01:05:43.153-08:00'),
    left: 395, top: 403
  },
  {
    id: '0tz6nuq30',
    name: 'card1',
    type: 'Editor',
    metafile: '62882471',
    captured: undefined,
    created: DateTime.fromISO('2013-01-01T01:05:40.001-08:00'),
    modified: DateTime.fromISO('2014-01-01T01:05:43.153-08:00'),
    left: 114, top: 27
  },
  {
    id: 't829w0351',
    name: 'card2',
    type: 'Editor',
    metafile: '84354571',
    captured: 'h20z915v7',
    created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00'),
    modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00'),
    left: 10, top: 50
  },
  {
    id: '28s3q0ag1',
    name: 'card3',
    type: 'Editor',
    metafile: '59237193',
    captured: 'h20z915v7',
    created: DateTime.fromISO('2014-04-10T08:14:02.371-08:00'),
    modified: DateTime.fromISO('2014-06-23T21:58:46.118-08:00'),
    left: 20, top: 60
  },
  {
    id: '844et25bk',
    name: 'card4',
    type: 'Editor',
    metafile: '85531762',
    captured: 'h20z915v7',
    created: DateTime.fromISO('2018-09-15T15:54:11.371-08:00'),
    modified: DateTime.fromISO('2019-01-01T09:29:47.061-08:00'),
    left: 30, top: 70
  },
  {
    id: '6aa5409b3',
    name: 'card5',
    type: 'Browser',
    metafile: '58598471',
    captured: 'h20z915v7',
    created: DateTime.fromISO('2011-01-01T01:05:40.001-08:00'),
    modified: DateTime.fromISO('2011-01-01T01:05:43.153-08:00'),
    left: 10, top: 50
  },
  {
    id: 'b99rt1f05',
    name: 'card6',
    type: 'Editor',
    metafile: '88672031',
    captured: 'h20z915v7',
    created: DateTime.fromISO('2019-01-01T01:05:40.001-08:00'),
    modified: DateTime.fromISO('2010-01-01T01:05:43.153-08:00'),
    left: 20, top: 60
  }];

const sampleStacks: Stack[] = [{
  id: 'h20z915v7',
  name: 'testStack',
  created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00'),
  modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00'),
  note: 'sample stack with >2 cards',
  cards: ['t829w0351', '28s3q0ag1', '844et25bk'],
  left: 100,
  top: 50
},
{
  id: 'h20z915v7',
  name: 'testStack',
  created: DateTime.fromISO('2012-04-09T08:14:02.371-08:00'),
  modified: DateTime.fromISO('2012-06-23T21:58:44.507-08:00'),
  note: 'sample stack with 2 cards',
  cards: ['6aa5409b3', 'b99rt1f05'],
  left: 250,
  top: 120
}];

const cardsMap = sampleCards.reduce((innerMap: { [id: string]: Card; }, card) => {
  innerMap[card.id] = card;
  return innerMap;
}, {});

const stacksMap = sampleStacks.reduce((innerMap: { [id: string]: Stack; }, stack) => {
  innerMap[stack.id] = stack;
  return innerMap;
}, {});

const store = mockStore({
  canvas: {
    id: v4(),
    created: DateTime.fromISO('1991-12-26T08:00:00.000-08:00'),
    repos: [],
    cards: [...sampleCards.map(c => c.id)],
    stacks: [...sampleStacks.map(s => s.id)]
  },
  stacks: {
    ...stacksMap
  },
  cards: {
    ...cardsMap
  },
  filetypes: {},
  metafiles: {},
  repos: {},
  errors: {}
});

afterEach(() => {
  store.clearActions();
  jest.clearAllMocks();
});
afterAll(mock.restore);

describe('stacks.addStack', () => {
  it('addStack resolves ADD_STACK and UPDATE_CARD actions for each child Card', () => {
    const actions = stacks.addStack('testStack', [sampleCards[0], sampleCards[1]]);
    expect(actions).toHaveLength(3);
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: ActionKeys.ADD_STACK }),
        expect.objectContaining({ type: ActionKeys.UPDATE_CARD })
      ])
    );
  });
});

describe('stacks.updateStack', () => {
  it('updateStack resolves UPDATE_STACK action for adding child Card', () => {
    const targetStack = sampleStacks[0];
    const action = stacks.updateStack({ ...targetStack, cards: [...targetStack.cards, sampleCards[0].id] });
    expect(action.stack.cards).toHaveLength(4);
    expect(action).toEqual(
      expect.objectContaining({
        type: ActionKeys.UPDATE_STACK,
        stack: expect.objectContaining({
          cards: expect.arrayContaining([sampleCards[0].id, sampleCards[2].id, sampleCards[3].id, sampleCards[4].id])
        })
      })
    );
  });

  it('updateStack resolves UPDATE_STACK action for removing child Card', () => {
    const updatedCards = removeItemInArray(sampleStacks[0].cards, sampleCards[2].id);
    const action = stacks.updateStack({ ...sampleStacks[0], cards: updatedCards });
    expect(action.stack.cards).toHaveLength(2);
    expect(action).toEqual(
      expect.objectContaining({
        type: ActionKeys.UPDATE_STACK,
        stack: expect.objectContaining({
          cards: expect.arrayContaining([sampleCards[3].id, sampleCards[4].id])
        })
      })
    );
  });
});

describe('stacks.appendCard', () => {
  it('appendCard resolves UPDATE_STACK and UPDATE_CARD actions for adding child Cards', () => {
    const targetStack = sampleStacks[0];
    const actions = stacks.pushCards(targetStack, [sampleCards[0], sampleCards[1]]);
    expect(actions).toHaveLength(3);
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: ActionKeys.UPDATE_STACK,
          stack: expect.objectContaining({
            cards: expect.arrayContaining([sampleCards[0].id, sampleCards[1].id])
          })
        }),
        expect.objectContaining({
          type: ActionKeys.UPDATE_CARD,
          card: expect.objectContaining({
            id: sampleCards[0].id,
            captured: sampleStacks[0].id,
            left: (10 * (targetStack.cards.length + 0) + 10),
            top: (10 * (targetStack.cards.length + 0) + 50)
          })
        }),
        expect.objectContaining({
          type: ActionKeys.UPDATE_CARD,
          card: expect.objectContaining({
            id: sampleCards[1].id,
            captured: targetStack.id,
            left: (10 * (targetStack.cards.length + 1) + 10),
            top: (10 * (targetStack.cards.length + 1) + 50)
          })
        })
      ])
    );
  });
});

describe('stacks.removeCard', () => {
  it('removeCard resolves UPDATE_STACK and UPDATE_CARD actions for removing from Stack with >2 cards', () => {
    const targetStack = sampleStacks[0];
    store.dispatch(stacks.popCard(targetStack, sampleCards[2], { x: 32, y: 14 }));
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: ActionKeys.UPDATE_STACK,
          stack: expect.objectContaining({
            cards: expect.not.arrayContaining([sampleCards[2].id])
          })
        }),
        expect.objectContaining({
          type: ActionKeys.UPDATE_CARD,
          card: expect.objectContaining({
            id: sampleCards[2].id,
            captured: undefined,
            left: targetStack.left + sampleCards[2].left + 32,
            top: targetStack.top + sampleCards[2].top + 14
          })
        })
      ])
    );
  });

  it('removeCard resolves REMOVE_STACK and UPDATE_CARD actions for removing from Stack with 2 cards', () => {
    const targetStack = sampleStacks[1];
    store.dispatch(stacks.popCard(targetStack, sampleCards[5], { x: 32, y: 14 }));
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: ActionKeys.REMOVE_STACK,
          id: targetStack.id
        }),
        expect.objectContaining({
          type: ActionKeys.UPDATE_CARD,
          card: expect.objectContaining({
            id: sampleCards[5].id,
            captured: undefined,
            left: targetStack.left + sampleCards[5].left + 32,
            top: targetStack.top + sampleCards[5].top + 14
          })
        }),
        expect.objectContaining({
          type: ActionKeys.UPDATE_CARD,
          card: expect.objectContaining({
            id: sampleCards[6].id,
            captured: undefined,
            left: targetStack.left + sampleCards[6].left,
            top: targetStack.top + sampleCards[6].top
          })
        })
      ])
    );
  });
});
