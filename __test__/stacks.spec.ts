import { createStack, popCard, pushCards } from '../src/containers/stacks';
import type { Card } from '../src/types';
import { DateTime } from 'luxon';
import { mockStore } from './__mocks__/reduxStoreMock';
import { testStore } from './__fixtures__/ReduxStore';
import { basicStack, biggerStack } from './__fixtures__/Stack';

describe('containers/stacks', () => {
    const store = mockStore(testStore);

    afterEach(() => store.clearActions());

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
        const card1: Card = {
            id: '40d14391c',
            name: 'card1',
            type: 'Editor',
            metafile: '29334943',
            created: DateTime.fromISO('2019-11-19T19:22:47.572-08:00', { setZone: true }).valueOf(),
            modified: DateTime.fromISO('2019-11-19T19:22:47.572-08:00', { setZone: true }).valueOf(),
            left: 0, top: 0
        }
        await store.dispatch(pushCards({ stack: basicStack, cards: [card1] }))
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'stacks/stackUpdated' }),
                expect.objectContaining({ type: 'cards/cardUpdated' })
            ])
        );
    });

    it('popCard resolves to remove a stack when two or less cards are captured', async () => {
        const card = store.getState().cards.entities['17734ae2-f8da-40cf-be86-993dc21b4079'];
        if (card) {
            await store.dispatch(popCard({ stack: basicStack, card: card }));
        }
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'stacks/stackRemoved' }),
                expect.objectContaining({ type: 'cards/cardRemoved' }),
                expect.objectContaining({ type: 'cards/cardUpdated' })
            ])
        );
    });

    it('popCards resolves to remove cards from stack when more than two cards are captured', async () => {
        const card = store.getState().cards.entities['4efdbe23-c938-4eb1-b29b-50bf76bdb44e'];
        if (card) {
            await store.dispatch(popCard({ stack: biggerStack, card: card }));
        }
        expect(store.getActions()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'stacks/stackUpdated' }),
                expect.objectContaining({ type: 'cards/cardRemoved' })
            ])
        );
    });
})
