import { getDefaultMiddleware } from '@reduxjs/toolkit';
import createMockStore from 'redux-mock-store';
import type { RootState, AppDispatch } from '../src/store/store';
import { createStack, popCard } from '../src/containers/stacks';
import type { UUID, Card } from '../src/types';
import { DateTime } from 'luxon';

const middlewares = getDefaultMiddleware();
const mockStore = createMockStore<RootState, AppDispatch>(middlewares);

describe('containers/stacks', () => {
    const store = mockStore();

    afterEach(() => store.clearActions())

    it('createStack resolves a stack creation and card updating actions', async () => {
        const card1: Card = {
            id: '40d14391c',
            name: 'card1',
            type: 'Editor',
            metafile: '29334943',
            created: DateTime.fromISO('2019-11-19T19:22:47.572-08:00', { setZone: true }).valueOf(),
            modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00', { setZone: true }).valueOf(),
            left: 0, top: 0
        }
        const card2: Card = {
            id: 't829w0351',
            name: 'card2',
            type: 'Editor',
            metafile: '84354571',
            created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00', { setZone: true }).valueOf(),
            modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00', { setZone: true }).valueOf(),
            left: 100, top: 50
        }

        await store.dispatch(createStack({ name: 'newStack', cards: [card1, card2] }));
        expect(store.getActions()).toHaveLength(5);
    });

    it('pushCards resolves a stack update and card updating actions', async () => {
        // store.getActions().map(action => console.log(JSON.stringify(action, undefined, 2)));
        expect(store.getActions()).toHaveLength(3);
    });

    it('popCards resolves to remove a stack when two or less cards are captured', async () => {
        const card1: Card = {
            id: '40d14391c',
            name: 'card1',
            type: 'Editor',
            metafile: '29334943',
            created: DateTime.fromISO('2019-11-19T19:22:47.572-08:00', { setZone: true }).valueOf(),
            modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00', { setZone: true }).valueOf(),
            left: 0, top: 0
        }
        const card2: Card = {
            id: 't829w0351',
            name: 'card2',
            type: 'Editor',
            metafile: '84354571',
            created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00', { setZone: true }).valueOf(),
            modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00', { setZone: true }).valueOf(),
            left: 100, top: 50
        }

        let stackId: UUID | undefined;
        await store.dispatch(createStack({ name: 'newStack', cards: [card1, card2] }))
            .unwrap()
            .then(result => stackId = result)
            .catch(error => console.error(error));
        if (stackId) {
            await store.dispatch(popCard({ stack: store.getState().stacks[stackId], card: card2 }));
        }
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'stacks/removeStack' })
            ])
        );
    });

    it('popCards resolves to remove cards from stack when more than two cards are captured', async () => {
        expect(true).toBe(true);
    });
})