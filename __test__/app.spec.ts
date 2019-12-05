import Welcome from '../src/old-components/welcome';
import { rootReducer } from '../src/store/root';
import { createStore } from 'redux';
import { ActionKeys } from '../src/store/actions';
import { Card } from '../src/store/types';
import { DateTime } from 'luxon';

describe('Welcome', () => {
  const instance: Welcome = new Welcome({});

  const card: Card = {
    id: 't829w0351',
    name: 'card2',
    created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00'),
    modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00'),
    repo: '123456789', ref: '09876543', left: 100, top: 50
  }

  it('creates an instance of App', async () => {
    expect(instance).toBeInstanceOf(Welcome);
  });

  it('Redux store dispatches to resolvers', () => {
    const store = createStore(rootReducer);
    store.dispatch({ type: ActionKeys.ADD_CARD, id: card.id, card: card });
    expect(Object.keys(store.getState().cards)).toHaveLength(1);
    expect(store.getState().cards[card.id]).toMatchObject(card);
  });
})