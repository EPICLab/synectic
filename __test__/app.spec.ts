import { rootReducer } from '../src/store/root';
import { createStore } from 'redux';
import { ActionKeys } from '../src/store/actions';
import { Card } from '../src/types';
import { DateTime } from 'luxon';

describe('App', () => {

  const card: Card = {
    id: 't829w0351',
    name: 'card2',
    metafile: '65914371',
    created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00'),
    modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00'),
    left: 100, top: 50
  }

  it('Redux store dispatches to resolvers', () => {
    const store = createStore(rootReducer);
    store.dispatch({ type: ActionKeys.ADD_CARD, id: card.id, card: card });
    expect(Object.keys(store.getState().cards)).toHaveLength(1);
    expect(store.getState().cards[card.id]).toMatchObject(card);
  });
})