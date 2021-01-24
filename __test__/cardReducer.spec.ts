import { DateTime } from 'luxon';

// import { Card, CardType } from '../src/types';
import { ActionKeys } from '../src/store/actions';
import { cardReducer } from '../src/store/reducers/cards';
import { Card } from '../src/types';

describe('cardReducer', () => {
  const cards: { [id: string]: Card } = {
    '40d14391c': {
      id: '40d14391c',
      name: 'card1',
      type: 'Editor',
      metafile: '29334943',
      created: DateTime.fromISO('2019-11-19T19:22:47.572-08:00', { setZone: true }),
      modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00', { setZone: true }),
      left: 0, top: 0
    }
  }

  const newCard: Card = {
    id: 't829w0351',
    name: 'card2',
    type: 'Editor',
    metafile: '84354571',
    created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00', { setZone: true }),
    modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00', { setZone: true }),
    left: 100, top: 50
  }

  it('cardReducer appends a new card to state on action ADD_CARD', () => {
    const addedCards = cardReducer(cards, { type: ActionKeys.ADD_CARD, id: newCard.id, card: newCard });
    expect(Object.keys(cards)).toHaveLength(1);
    expect(addedCards).toMatchSnapshot();
  });

  it('cardReducer removes a card from state on action REMOVE_CARD', () => {
    const matchedCards = cardReducer(cards, { type: ActionKeys.REMOVE_CARD, id: '40d14391c' });
    expect(Object.keys(matchedCards)).toHaveLength(0);
  });

  it('cardReducer resolves non-matching card in state on action REMOVE_CARD', () => {
    const nonMatchedCards = cardReducer(cards, { type: ActionKeys.REMOVE_CARD, id: '010101010' });
    expect(Object.keys(nonMatchedCards)).toHaveLength(Object.keys(cards).length);
  });

  it('cardReducer updates state of matched card on action UPDATE_CARD', () => {
    const updatedCards = cardReducer(cards, {
      type: ActionKeys.UPDATE_CARD, id: '40d14391c', card: {
        modified: DateTime.fromISO('2019-11-22T12:54:11.374-08:00', { setZone: true }),
        left: 178,
        top: 540
      }
    });
    expect(updatedCards).not.toMatchObject(cards);
    expect(updatedCards).toMatchSnapshot();
  });
});