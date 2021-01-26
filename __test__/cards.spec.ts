import { DateTime } from 'luxon';

import * as cards from '../src/containers/cards';
import { HandlerRequiredMetafile } from '../src/containers/handlers';
import { ActionKeys } from '../src/store/actions';
import { Card, Metafile } from '../src/types';

const testMetafile: Metafile = {
  id: '3',
  name: 'bar.js',
  path: 'foo/bar.js',
  handler: 'Editor',
  modified: DateTime.fromISO('2010-01-15T11:19:23.810-08:00')
};

const testCard: Card = {
  id: 't829w0351',
  name: 'card1',
  type: 'Editor',
  metafile: '84354571',
  created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00'),
  modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00'),
  left: 100, top: 50
};

describe('cards.addCard', () => {
  it('addCard resolves ADD_CARD action for card with handler property', () => {
    const action = cards.addCard(testMetafile as HandlerRequiredMetafile);
    return expect(action).toEqual(
      expect.objectContaining({
        type: ActionKeys.ADD_CARD,
        card: expect.objectContaining({
          name: testMetafile.name,
          metafile: testMetafile.id
        })
      })
    )
  });
});

describe('cards.updateCard', () => {
  it('updateCard resolves UPDATE_CARD action for card updates with modified timestamp updated', () => {
    const action = cards.updateCard({ ...testCard, metafile: testMetafile.id });
    expect(action.card.modified && action.card.modified > testCard.modified).toBe(true);
    return expect(action).toEqual(
      expect.objectContaining({
        type: ActionKeys.UPDATE_CARD,
        card: expect.objectContaining({
          id: testCard.id,
          metafile: testMetafile.id
        })
      })
    );
  });
});