import { DateTime } from 'luxon';
import { addCard } from '../src/store/slices/cards';
import store from '../src/store/store';
import type { Card } from '../src/types';

describe('addCard', () => {
    const newCard: Card = {
        id: 't829w0351',
        name: 'card2',
        type: 'Editor',
        metafile: '84354571',
        created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00', { setZone: true }).valueOf(),
        modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00', { setZone: true }).valueOf(),
        left: 100, top: 50
    }

    it('addCard kicks off multiple reducers', () => {
        expect(Object.keys(store.getState().cards)).toHaveLength(0);
        store.dispatch(addCard(newCard));
        expect(Object.keys(store.getState().cards)).toHaveLength(1);
        expect(store.getState().canvas.cards).toHaveLength(1);
    });
});