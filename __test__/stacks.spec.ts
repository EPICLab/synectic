import { DateTime } from 'luxon';

import type { Card, Stack } from '../src/types';
import * as stacks from '../src/containers/stacks';
import { ActionKeys } from '../src/store/actions';
import { removeItemInArray } from '../src/store/immutables';

const cards: Card[] = [
  {
    id: 't829w0351',
    name: 'card1',
    type: 'Editor',
    metafile: '84354571',
    created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00'),
    modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00'),
    left: 100, top: 50
  },
  {
    id: '28s3q0ag1',
    name: 'card2',
    type: 'Editor',
    metafile: '59237193',
    created: DateTime.fromISO('2014-04-10T08:14:02.371-08:00'),
    modified: DateTime.fromISO('2014-06-23T21:58:46.118-08:00'),
    left: 120, top: 70
  },
  {
    id: '844et25bk',
    name: 'card3',
    type: 'Editor',
    metafile: '85531762',
    created: DateTime.fromISO('2018-09-15T15:54:11.371-08:00'),
    modified: DateTime.fromISO('2019-01-01T09:29:47.061-08:00'),
    left: 140, top: 90
  },
  {
    id: '6aa5409b3',
    name: 'card4',
    type: 'Browser',
    metafile: '58598471',
    created: DateTime.fromISO('2011-01-01T01:05:40.001-08:00'),
    modified: DateTime.fromISO('2011-01-01T01:05:43.153-08:00'),
    left: 131, top: 19
  }];

const stack: Stack = {
  id: 'h20z915v7',
  name: 'testStack',
  created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00'),
  modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00'),
  note: 'example note text',
  cards: [cards[0].id, cards[1].id],
  left: 100,
  top: 50
};

describe('stacks.addStack', () => {
  it('addStack resolves ADD_STACK and UPDATE_CARD actions for each child Card', () => {
    const actions = stacks.addStack('testStack', [cards[0], cards[1]]);
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
    const action = stacks.updateStack({ ...stack, cards: [...stack.cards, cards[2].id] });
    expect(action.stack.cards).toHaveLength(3);
    expect(action).toEqual(
      expect.objectContaining({
        type: ActionKeys.UPDATE_STACK,
        stack: expect.objectContaining({
          cards: expect.arrayContaining([cards[0].id, cards[1].id, cards[2].id])
        })
      })
    );
  });

  it('updateStack resolves UPDATE_STACK action for removing child Card', () => {
    const updatedCards = removeItemInArray(stack.cards, cards[1].id);
    const action = stacks.updateStack({ ...stack, cards: updatedCards });
    expect(action.stack.cards).toHaveLength(1);
    expect(action).toEqual(
      expect.objectContaining({
        type: ActionKeys.UPDATE_STACK,
        stack: expect.objectContaining({
          cards: expect.arrayContaining([cards[0].id])
        })
      })
    );
  });
});

describe('stacks.appendCard', () => {
  it('appendCard resolves UPDATE_STACK and UPDATE_CARD actions for adding child Cards', () => {
    const actions = stacks.appendCards(stack, [cards[2], cards[3]]);
    expect(actions).toHaveLength(3);
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: ActionKeys.UPDATE_STACK,
          stack: expect.objectContaining({
            cards: expect.arrayContaining([cards[2].id, cards[3].id])
          })
        }),
        expect.objectContaining({
          type: ActionKeys.UPDATE_CARD,
          card: expect.objectContaining({
            id: cards[2].id,
            captured: stack.id,
            top: (10 * (stack.cards.length + 0) + 50),
            left: (10 * (stack.cards.length + 0) + 10)
          })
        }),
        expect.objectContaining({
          type: ActionKeys.UPDATE_CARD,
          card: expect.objectContaining({
            id: cards[3].id,
            captured: stack.id,
            top: (10 * (stack.cards.length + 1) + 50),
            left: (10 * (stack.cards.length + 1) + 10)
          })
        })
      ])
    );
  });
});

describe('stacks.removeCard', () => {
  it('removeCard resolves UPDATE_STACK and UPDATE_CARD actions for removing child Card', () => {
    const actions = stacks.removeCard(stack, cards[1], { x: 10, y: 50 });
    expect(actions).toHaveLength(2);
    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: ActionKeys.UPDATE_STACK,
          stack: expect.objectContaining({
            cards: expect.not.arrayContaining([cards[1].id])
          })
        }),
        expect.objectContaining({
          type: ActionKeys.UPDATE_CARD,
          card: expect.objectContaining({
            captured: undefined,
            top: stack.top + cards[1].top + 50,
            left: stack.left + cards[1].left + 10
          })
        })
      ])
    );
  });
});
