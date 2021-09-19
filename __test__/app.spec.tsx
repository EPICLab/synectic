import { DateTime } from 'luxon';
import type { Card } from '../src/types';
import { cardAdded } from '../src/store/slices/cards';
import { mockStore } from './__mocks__/reduxStoreMock';
import { emptyStore, testStore } from './__fixtures__/ReduxStore';
import { importFiletypes } from '../src/containers/handlers';

describe('App', () => {

  const card: Card = {
    id: 't829w0351',
    name: 'card2',
    type: 'Editor',
    metafile: '65914371',
    created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00').valueOf(),
    modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00').valueOf(),
    left: 100,
    top: 50
  };

  it('Redux store dispatches to resolvers', () => {
    const store = mockStore(testStore);
    store.dispatch(cardAdded(card));
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'cards/cardAdded',
          payload: expect.objectContaining({
            id: 't829w0351',
            name: 'card2'
          })
        })
      ])
    );
  });

  it('Redux store initialized with supported filetypes', async () => {
    const store = mockStore(emptyStore);
    await store.dispatch(importFiletypes());
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'filetypes/filetypeAdded'
        })
      ])
    );
  });
})